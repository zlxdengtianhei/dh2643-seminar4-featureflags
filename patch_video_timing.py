#!/usr/bin/env python3
"""Post-build patch for the video slide (slide 13).

pptxgenjs embeds the mp4 but (a) emits duplicate shape ids and (b) writes no
<p:timing> block, so PowerPoint shows the poster but never plays it. This
script gives the video shape a unique id and injects the standard
"start automatically" timing tree PowerPoint itself writes.

Usage:  python3 patch_video_timing.py <deck.pptx> <duration_ms>
Run it AFTER node build_deck.cjs, every time the deck is rebuilt.
"""
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

def full_timing(spid: int, dur_ms: int) -> str:
    return (
        '<p:timing><p:tnLst><p:par>'
        '<p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek">'
        '<p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
        '<p:par><p:cTn id="3" fill="hold">'
        '<p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst>'
        '<p:childTnLst><p:par><p:cTn id="4" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst>'
        '<p:childTnLst><p:par>'
        '<p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst>'
        '<p:childTnLst>'
        f'<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="6" dur="{dur_ms}" fill="hold"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:cmd>'
        '</p:childTnLst></p:cTn></p:par>'
        '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>'
        '</p:childTnLst></p:cTn>'
        '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
        '</p:seq>'
        f'<p:video><p:cMediaNode vol="80"><p:cTn id="7" fill="hold" display="0">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cMediaNode></p:video>'
        '</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>'
    )

def main() -> None:
    path, dur = sys.argv[1], int(sys.argv[2])
    src = zipfile.ZipFile(path)
    items = {n: src.read(n) for n in src.namelist()}
    src.close()

    xml = items["ppt/slides/slide13.xml"].decode()
    assert "videoFile" in xml, "slide13 has no embedded video — rebuild first"

    # unique id for the video shape (pptxgenjs duplicates ids across shapes)
    ids = [int(i) for i in re.findall(r'<p:cNvPr id="(\d+)"', xml)]
    spid = max(ids) + 10
    xml, n = re.subn(r'(<p:pic>.*?<p:cNvPr id=")\d+(" name="Media 0")',
                     rf"\g<1>{spid}\g<2>", xml, count=1, flags=re.S)
    assert n == 1, "video pic shape not found"

    xml = re.sub(r"<p:timing>.*?</p:timing>", "", xml, flags=re.S)  # drop stale timing
    xml = xml.replace("</p:sld>", full_timing(spid, dur) + "</p:sld>")

    ET.fromstring(xml.encode())  # well-formedness gate
    items["ppt/slides/slide13.xml"] = xml.encode()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as out:
        for name, data in items.items():
            out.writestr(name, data)
    print(f"{path}: video spid={spid}, autoplay timing injected ({dur} ms)")

if __name__ == "__main__":
    main()
