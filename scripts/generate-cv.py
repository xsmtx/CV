"""Generate the public, two-page CV. Run through generate-cv.mjs from the repo root."""
import json
import os
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
p = data["profile"]
font_root = Path(os.environ.get("CV_FONT_DIR", "C:/Windows/Fonts" if os.name == "nt" else "/usr/share/fonts/truetype/dejavu"))
regular, bold = ("arial.ttf", "arialbd.ttf") if os.name == "nt" else ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf")
pdfmetrics.registerFont(TTFont("CV", str(font_root / regular)))
pdfmetrics.registerFont(TTFont("CV-Bold", str(font_root / bold)))
pdfmetrics.registerFontFamily("CV", normal="CV", bold="CV-Bold")
ink, muted, accent = colors.HexColor("#182d40"), colors.HexColor("#506273"), colors.HexColor("#8c5528")
styles = {
    "name": ParagraphStyle("name", fontName="CV-Bold", fontSize=29, leading=35, textColor=ink, spaceAfter=5),
    "role": ParagraphStyle("role", fontName="CV", fontSize=12, leading=17, textColor=accent, spaceAfter=9),
    "meta": ParagraphStyle("meta", fontName="CV", fontSize=9.2, leading=12.5, textColor=muted),
    "section": ParagraphStyle("section", fontName="CV-Bold", fontSize=10, leading=15, textColor=accent, spaceBefore=13, spaceAfter=7),
    "title": ParagraphStyle("title", fontName="CV-Bold", fontSize=10.6, leading=15, textColor=ink, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="CV", fontSize=10, leading=14.2, textColor=ink, spaceAfter=3),
    "small": ParagraphStyle("small", fontName="CV", fontSize=9.5, leading=12.8, textColor=ink, spaceAfter=3),
}

def clean(value):
    return escape(value.replace("–", "-").replace("—", "-").replace("‑", "-"))

def para(value, style="body"):
    return Paragraph(clean(value), styles[style])

def link(label, url):
    return f'<link href="{escape(url)}" color="#506273">{clean(label)}</link>'

story = [para(p["fullName"], "name"), para(p["specialization"], "role")]
story.append(Paragraph(" · ".join([clean(p["location"]), link(p["email"], "mailto:" + p["email"]), link("sametkabakci.com", p["website"])]), styles["meta"]))
story.append(Paragraph(" · ".join([link("linkedin.com/in/sametkabakci", p["linkedin"]), link("github.com/xsmtx", p["github"])]), styles["meta"]))
story += [para("PROFILE", "section"), para(p["about"]), para("EXPERIENCE", "section")]
for job in reversed(data["experience"]):
    block = [para(job["role"], "title"), para(f'{job["company"]} | {job["period"]}', "meta"), Spacer(1, 4)]
    if int(job["year"]) >= 2021:
        block.append(para(job["summary"]))
    block += [para("• " + responsibility, "small") for responsibility in job["responsibilities"]]
    block.append(Spacer(1, 8))
    story.append(KeepTogether(block))

story += [PageBreak(), para("Technical profile", "name"), para("Samet Kabakçı / Systems, platforms & automation", "role"), para("TECHNICAL SKILLS", "section")]
for skill in data["systems"]:
    story.append(KeepTogether([
        Paragraph(f'<b>{clean(skill["name"])}</b> <font color="#506273">/ {clean(skill["level"])}</font>', styles["small"]),
        para(", ".join(skill["technologies"]), "small"), Spacer(1, 3),
    ]))
story.append(para("SELECTED PROJECTS", "section"))
for project in data["projects"]:
    story.append(KeepTogether([
        para(project["fullName"], "title"),
        para(project["role"] + " | " + project["organization"], "meta"),
        para(project["result"], "small"),
        Spacer(1, 5),
    ]))
story.append(para("EDUCATION", "section"))
for education in p["education"]:
    story.append(KeepTogether([para(education["school"], "title"), para(education["subject"] + " | " + education["period"], "meta"), Spacer(1, 8)]))

def page_frame(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(2)
    canvas.line(44, A4[1] - 28, 84, A4[1] - 28)
    canvas.setStrokeColor(colors.HexColor("#d9e1e7"))
    canvas.setLineWidth(0.5)
    canvas.line(44, 38, A4[0] - 44, 38)
    canvas.setFont("CV", 8)
    canvas.setFillColor(muted)
    canvas.drawString(44, 25, "SAMET KABAKÇI / sametkabakci.com")
    canvas.drawRightString(A4[0] - 44, 25, f"{doc.page} / 2")
    canvas.restoreState()

doc = SimpleDocTemplate(sys.argv[2], pagesize=A4, leftMargin=44, rightMargin=44, topMargin=44, bottomMargin=51,
                        title="Samet Kabakçı - System Engineer", author=p["fullName"], subject="Public professional CV",
                        creator="Samet Kabakçı Portfolio", pageCompression=1)
doc.build(story, onFirstPage=page_frame, onLaterPages=page_frame)
print(f"Created {sys.argv[2]}")
