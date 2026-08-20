"""
KEEP ME AT THE ALTAR — Personalised Journal PDF Generator v2
Generates a complete journal with:
- Full devotional teaching text for each fasting day
- Fillable AcroForm text fields for journaling
- Personalised with user's name, fasting level, Altar Day, anchor months
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    HRFlowable, Table, TableStyle, KeepTogether
)
import os

# ── COLOURS (light linen palette) ────────────────────────
BG         = colors.HexColor("#F7F4EF")  # soft linen
SURFACE    = colors.HexColor("#EDE9E1")  # field background
SURFACE2   = colors.HexColor("#E5E0D6")  # deeper surface / acroform bg
GOLD       = colors.HexColor("#A67C2E")  # dark gold (legible on light)
GOLD_LIGHT = colors.HexColor("#C4993A")  # medium gold accents
PARCHMENT  = colors.HexColor("#1E1B16")  # repurposed → main ink
PARCH_DIM  = colors.HexColor("#5A5347")  # repurposed → muted ink
BORDER     = colors.HexColor("#CEC8BC")  # light warm border

W, H = A4  # 595 x 842 pts
MARGIN_L = 20*mm
MARGIN_R = 20*mm
MARGIN_T = 22*mm
MARGIN_B = 18*mm
CONTENT_W = W - MARGIN_L - MARGIN_R

field_counter = [0]

def field_name(prefix):
    field_counter[0] += 1
    return f"{prefix}_{field_counter[0]}"


# ── STYLES ───────────────────────────────────────────────
def S():
    return {
        "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica", fontSize=8,
            leading=12, textColor=GOLD, spaceAfter=5, charSpace=2),
        "eyebrow_c": ParagraphStyle("eyebrow_c", fontName="Helvetica", fontSize=8,
            leading=12, textColor=GOLD, spaceAfter=5, charSpace=2, alignment=TA_CENTER),
        "h1": ParagraphStyle("h1", fontName="Helvetica", fontSize=22,
            leading=28, textColor=colors.HexColor("#1E1B16"), spaceAfter=6),
        "h1_em": ParagraphStyle("h1_em", fontName="Helvetica-Oblique", fontSize=20,
            leading=26, textColor=GOLD_LIGHT, spaceAfter=6),
        "h2": ParagraphStyle("h2", fontName="Helvetica", fontSize=15,
            leading=20, textColor=colors.HexColor("#1E1B16"), spaceAfter=5, spaceBefore=8),
        "h3": ParagraphStyle("h3", fontName="Helvetica", fontSize=11,
            leading=15, textColor=GOLD_LIGHT, spaceAfter=4, spaceBefore=6),
        "day_num": ParagraphStyle("day_num", fontName="Helvetica", fontSize=28,
            leading=34, textColor=BORDER, spaceAfter=0),
        "day_title": ParagraphStyle("day_title", fontName="Helvetica", fontSize=13,
            leading=17, textColor=colors.HexColor("#1E1B16"), spaceAfter=3),
        "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9,
            leading=14, textColor=PARCH_DIM, spaceAfter=5),
        "body_c": ParagraphStyle("body_c", fontName="Helvetica", fontSize=9,
            leading=14, textColor=PARCH_DIM, spaceAfter=5, alignment=TA_CENTER),
        "scripture": ParagraphStyle("scripture", fontName="Helvetica-Oblique",
            fontSize=9, leading=14, textColor=PARCH_DIM, spaceAfter=3, leftIndent=10),
        "scripture_ref": ParagraphStyle("scripture_ref", fontName="Helvetica",
            fontSize=8, leading=12, textColor=GOLD, spaceAfter=6, leftIndent=10),
        "prayer": ParagraphStyle("prayer", fontName="Helvetica-Oblique",
            fontSize=9, leading=14, textColor=colors.HexColor("#1E1B16"), spaceAfter=6,
            leftIndent=10, borderPadding=(4,8,4,10)),
        "field_label": ParagraphStyle("field_label", fontName="Helvetica",
            fontSize=8, leading=11, textColor=GOLD, spaceAfter=2),
        "small": ParagraphStyle("small", fontName="Helvetica", fontSize=7,
            leading=10, textColor=PARCH_DIM, spaceAfter=3),
        "small_c": ParagraphStyle("small_c", fontName="Helvetica", fontSize=7,
            leading=10, textColor=PARCH_DIM, spaceAfter=3, alignment=TA_CENTER),
        "pull": ParagraphStyle("pull", fontName="Helvetica-Oblique", fontSize=11,
            leading=17, textColor=colors.HexColor("#1E1B16"), spaceAfter=8, spaceBefore=8,
            leftIndent=12),
        "month_title": ParagraphStyle("month_title", fontName="Helvetica",
            fontSize=26, leading=32, textColor=colors.HexColor("#1E1B16"), spaceAfter=3),
        "month_theme": ParagraphStyle("month_theme", fontName="Helvetica-Oblique",
            fontSize=13, leading=18, textColor=GOLD_LIGHT, spaceAfter=8),
        "cover_title": ParagraphStyle("cover_title", fontName="Helvetica",
            fontSize=32, leading=40, textColor=colors.HexColor("#1E1B16"), spaceAfter=4,
            alignment=TA_CENTER),
        "cover_em": ParagraphStyle("cover_em", fontName="Helvetica-Oblique",
            fontSize=32, leading=40, textColor=GOLD_LIGHT, spaceAfter=4,
            alignment=TA_CENTER),
        "cover_sub": ParagraphStyle("cover_sub", fontName="Helvetica",
            fontSize=11, leading=16, textColor=PARCH_DIM, spaceAfter=3,
            alignment=TA_CENTER),
        "cover_name": ParagraphStyle("cover_name", fontName="Helvetica",
            fontSize=14, leading=19, textColor=GOLD, spaceAfter=3,
            alignment=TA_CENTER),
    }


# ── PAGE CALLBACKS ───────────────────────────────────────
_user_name = ""
_current_month = [None]

MONTH_ACCENTS = {
    "January":   (0.80, 0.62, 0.22),
    "February":  (0.75, 0.40, 0.45),
    "March":     (0.40, 0.62, 0.55),
    "April":     (0.45, 0.65, 0.72),
    "May":       (0.72, 0.55, 0.28),
    "June":      (0.55, 0.72, 0.40),
    "July":      (0.80, 0.62, 0.22),
    "August":    (0.50, 0.55, 0.72),
    "September": (0.70, 0.50, 0.30),
    "October":   (0.60, 0.35, 0.55),
    "November":  (0.72, 0.58, 0.32),
    "December":  (0.80, 0.62, 0.22),
}

def _corner_ornament(c, x, y, flip_x=False, flip_y=False, size=7, col=None):
    if col is None: col = GOLD
    c.saveState()
    c.setStrokeColor(col)
    c.setLineWidth(0.7)
    sx = -1 if flip_x else 1
    sy = -1 if flip_y else 1
    c.line(x, y, x + sx*size*mm, y)
    c.line(x, y, x, y + sy*size*mm)
    c.setFillColor(col)
    c.circle(x, y, 1.0*mm, fill=1, stroke=0)
    c.restoreState()

def _draw_page(c, doc, is_cover=False):
    c.saveState()
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    month = _current_month[0]
    if month and month in MONTH_ACCENTS and not is_cover:
        r, g, b = MONTH_ACCENTS[month]
        c.setFillColorRGB(r, g, b, alpha=0.20)
        c.rect(0, 0, 2.5*mm, H, fill=1, stroke=0)

    if is_cover:
        cx, cy = W/2, H*0.56
        for radius, alpha in [(90,0.04),(68,0.07),(48,0.10),(30,0.14),(15,0.18)]:
            c.setFillColorRGB(0.65, 0.49, 0.18, alpha=alpha)
            c.circle(cx, cy, radius*mm, fill=1, stroke=0)
        m = 8*mm
        _corner_ornament(c, m, H-m, flip_y=True)
        _corner_ornament(c, W-m, H-m, flip_x=True, flip_y=True)
        _corner_ornament(c, m, m)
        _corner_ornament(c, W-m, m, flip_x=True)
    else:
        _corner_ornament(c, 10*mm, H-16*mm, flip_y=True, size=5, col=BORDER)
        _corner_ornament(c, W-10*mm, H-16*mm, flip_x=True, flip_y=True, size=5, col=BORDER)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.4)
        c.line(MARGIN_L, H-13*mm, W-MARGIN_R, H-13*mm)
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 7)
        c.drawString(MARGIN_L, H-10*mm, "KEEP ME AT THE ALTAR™")
        c.setFillColor(PARCH_DIM)
        if _user_name:
            c.drawRightString(W-MARGIN_R, H-10*mm, _user_name.upper())
        c.line(MARGIN_L, 11*mm, W-MARGIN_R, 11*mm)
        c.setFillColor(PARCH_DIM)
        c.setFont("Helvetica", 7)
        c.drawCentredString(W/2, 7*mm, str(doc.page))

    c.restoreState()

def on_first_page(c, doc):
    _draw_page(c, doc, is_cover=True)

def on_later_pages(c, doc):
    _draw_page(c, doc, is_cover=False)


# ── HELPERS ──────────────────────────────────────────────
def divider():
    return HRFlowable(width="100%", thickness=0.4, color=BORDER, spaceAfter=6)

def gold_divider():
    return HRFlowable(width="60%", thickness=0.5, color=GOLD,
                      spaceAfter=8, hAlign="CENTER")

def pill_label(text, styles):
    """Gold pill badge drawn directly on canvas."""
    return _PillLabel(text)


class _PillLabel(Spacer):
    def __init__(self, text):
        super().__init__(1, 15)
        self.pill_text = text

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFont("Helvetica", 7)
        tw = c.stringWidth(self.pill_text, "Helvetica", 7)
        pw = tw + 14
        ph = 11
        px = 0
        py = self._y + 1 if hasattr(self, '_y') else 2
        c.setFillColor(GOLD)
        c.roundRect(px, py, pw, ph, 3.5, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.drawString(px + 7, py + 3, self.pill_text)
        c.restoreState()


def pull_quote(text, styles):
    return Table(
        [[Paragraph(text, styles["pull"])]],
        colWidths=[CONTENT_W],
        style=TableStyle([
            ("LEFTPADDING", (0,0),(-1,-1), 12),
            ("RIGHTPADDING",(0,0),(-1,-1), 8),
            ("TOPPADDING",  (0,0),(-1,-1), 8),
            ("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LINEBEFORE",  (0,0),(0,-1), 3, GOLD),
            ("BACKGROUND",  (0,0),(-1,-1), colors.HexColor("#EAE6DE")),
        ])
    )

def text_field(label, name_prefix, height=55, story=None, styles=None):
    """Add a labelled fillable text field to the story."""
    fname = field_name(name_prefix)
    items = []
    if label:
        items.append(Paragraph(label, styles["field_label"]))
    # Placeholder spacer the height of the field + label
    items.append(Spacer(1, height + 4))
    return items, fname

def scripture_block(verse, ref, styles):
    return [
        Paragraph(f'"{verse}"', styles["scripture"]),
        Paragraph(f"— {ref}", styles["scripture_ref"]),
    ]

def section_head(eyebrow, title, styles, italic_title=False):
    s = styles["h1_em"] if italic_title else styles["h1"]
    return [
        Paragraph(eyebrow.upper(), styles["eyebrow"]),
        divider(),
        Paragraph(title, s),
        Spacer(1, 3*mm),
    ]

def info_table(fast_desc, prayer_focus, altar_day, styles):
    data = [
        ["Fast Type", "Prayer Focus", "Altar Day"],
        [fast_desc, prayer_focus, f"Every {altar_day}"],
    ]
    t = Table(data, colWidths=[55*mm, 58*mm, 52*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), SURFACE),
        ("BACKGROUND",(0,1),(-1,1), BG),
        ("TEXTCOLOR",(0,0),(-1,0), GOLD),
        ("TEXTCOLOR",(0,1),(-1,1), PARCHMENT),
        ("FONTNAME",(0,0),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,0), 7),
        ("FONTSIZE",(0,1),(-1,1), 8),
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("PADDING",(0,0),(-1,-1), 6),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    return t

def level_fast(month, level):
    FASTS = {
        "January":   {"Standard":"Daniel Fast — 7 days","Intensive":"Daniel Fast — 14 days","Advanced":"Daniel Fast — 21 days"},
        "February":  {"Standard":"Intermittent 3x/week","Intensive":"Intermittent daily","Advanced":"Daily — break at 3pm"},
        "March":     {"Standard":"Partial — 1 day/week","Intensive":"Normal — 2 days/week","Advanced":"Total — 3 days/week"},
        "April":     {"Standard":"Good Friday partial","Intensive":"Holy Week intermittent","Advanced":"Good Friday total + Holy Week"},
        "May":       {"Standard":"Media fast — 10 days","Intensive":"Partial + Media — 10 days","Advanced":"Corporate — 10 days"},
        "June":      {"Standard":"Partial — 1 day/week","Intensive":"Partial — 2 days/week","Advanced":"Partial — 3 days/week"},
        "July":      {"Standard":"Daniel Fast — 3 days","Intensive":"Daniel Fast — 5 days","Advanced":"Daniel Fast — 7 days"},
        "August":    {"Standard":"Social media fast","Intensive":"Media + entertainment fast","Advanced":"Full sensory fast"},
        "September": {"Standard":"Intermittent — 1 day/wk","Intensive":"Intermittent — 2 days/wk","Advanced":"Intermittent — 3 days/wk"},
        "October":   {"Standard":"Normal — 1 day/week","Intensive":"Normal — 2 days/week","Advanced":"Normal — 3 days/week"},
        "November":  {"Standard":"Gratitude fast 1 day/wk","Intensive":"Partial — 2 days/week","Advanced":"Partial — 3 days/week + generosity"},
        "December":  {"Standard":"Advent Sundays partial","Intensive":"Advent Sundays + year-end review","Advanced":"Advent Sundays + Dec 31 total"},
    }
    return FASTS.get(month, {}).get(level, "See journal")


# ── MONTH DATA ────────────────────────────────────────────
MONTHS = [
    {
        "name": "January", "theme": "New Year Consecration",
        "scripture_text": '"See, I am doing a new thing! Now it springs up; do you not perceive it?"',
        "scripture_ref": "Isaiah 43:19",
        "prayer_focus": "Prophetic vision for the year",
        "intro": (
            "January stands at the threshold. It is the gate through which the year must pass, "
            "and what you consecrate in January sets the spiritual atmosphere for the twelve months "
            "ahead. This is a month of radical consecration, prophetic declaration, and holy hunger. "
            "Do not let January pass casually — it is a sacred opportunity to establish covenant "
            "with God over your year. Begin where you are. A 7-day fast done in full surrender "
            "is stronger than a 21-day fast done in your own strength."
        ),
        "days": [
            ("01","Opening the Gate","Isaiah 22:22",
             "Lord, I open this year to You. What You open, no man can shut.",
             "The key of the house of David — what God opens, no one can shut, and what He shuts, "
             "no one can open. As you begin this year, you are not just starting fresh. You are "
             "standing at a spiritual gate. What you bring to God now — your plans, your wounds, "
             "your hopes, your fears — becomes the foundation of everything that follows. Open "
             "your hands. Open your year.",
             ["What do you want God to open for you this year?",
              "What gates have felt closed? Lay them before God now."]),
            ("02","Consecration","Romans 12:1",
             "I present my body, my plans, and my year as a living sacrifice.",
             "Consecration is not about being perfect — it is about being surrendered. Paul uses "
             "the language of the temple: a living sacrifice, holy and pleasing to God. Your body, "
             "your schedule, your ambitions, your relationships — all of it laid on the altar. "
             "Not destroyed, but offered. And what God receives, He transforms.",
             ["What area of your life needs to be fully surrendered this year?",
              "What are you holding back from God — and why?"]),
            ("03","Hearing His Voice","John 10:27",
             "Speak, Lord. Quiet every other voice so I can hear You clearly.",
             "Jesus says His sheep hear His voice. Not that they might hear it one day — that they "
             "hear it. It is your inheritance. But hearing requires quietness. Fasting is one of "
             "the most powerful ways to turn down the volume of everything else — appetite, noise, "
             "distraction — so that the still small voice becomes audible again.",
             ["What has God been trying to say to you that you have not stopped to hear?",
              "What distractions have been drowning Him out? Name them and release them."]),
            ("04","Breaking Old Patterns","Isaiah 43:18-19",
             "God, I release the old. I receive the new thing You are doing.",
             "God says do not dwell on the former things. This is not an instruction to forget — "
             "it is an invitation to release. Old patterns, old mindsets, old wounds, old ways of "
             "operating — they do not belong in this new season. The new thing God is doing requires "
             "new wineskins. What needs to die in you so the new thing can live?",
             ["What old pattern or mindset needs to die in this new year?",
              "What does the 'new thing' look like in your specific life?"]),
            ("05","Praying for Family","Joshua 24:15",
             "As for me and my house, we will serve the Lord.",
             "This declaration from Joshua was not wishful thinking — it was a covenant. He was "
             "not just speaking for himself. He was standing in the gap for everyone under his "
             "roof. Intercession for family is one of the highest and most costly forms of prayer. "
             "Who in your family needs you to fast and stand in the gap for them right now?",
             ["Who in your family needs prayer most urgently right now?",
              "Write a specific prayer for them — not general, but targeted and faith-filled."]),
            ("06","Purpose & Assignment","Jeremiah 29:11",
             "Lord, clarify my assignment. Show me what I am built for in this season.",
             "God has plans for you — plans to prosper you, not to harm you. Plans to give you a "
             "future and a hope. But plans require participation. You must seek, ask, knock. "
             "January is the time to get clarity on your divine assignment for this year — not just "
             "your career goals or personal ambitions, but the specific kingdom work God has "
             "commissioned you to do.",
             ["What has God specifically called you to this year?",
              "What step have you been avoiding? What would it cost you to take it?"]),
            ("07","Sealing the Fast","Psalm 5:3",
             "I lay my petitions before You and wait in expectation.",
             "David prayed in the morning and then watched expectantly. This is the posture of a "
             "fasting believer who has done the inner work — surrender, hearing, consecration, "
             "intercession. Now you seal it. You write your declarations. You do not beg — you "
             "present, and you wait with expectation, not anxiety. God has heard. Now watch.",
             ["What are your top 3 prayer declarations for this year?",
              "Write them not as requests but as faith declarations — what you are believing God for."]),
        ]
    },
    {
        "name": "February", "theme": "Love & Devotion",
        "scripture_text": '"He brought me to the banqueting house, and his banner over me was love."',
        "scripture_ref": "Song of Solomon 2:4",
        "prayer_focus": "Intimacy, relationships, marriage",
        "intro": (
            "February is the month of love, and for the believer it becomes an opportunity to fast "
            "not out of duty but out of focused devotion. Let this fast be a love offering — a "
            "deliberate withdrawal from earthly pleasures in order to feast on the presence of the "
            "One your soul loves. February is about love — not performance. Choose the fasting "
            "level that sustains consistency, not the one that exhausts you by week two."
        ),
        "days": [
            ("01","Loving God First","Matthew 22:37",
             "Lord, recalibrate my love. Let my first love be You above all else.",
             "Jesus called this the greatest commandment — not because loving God is the most "
             "difficult thing, but because it is the most foundational. When love for God is first, "
             "everything else falls into its right place. When it slips, everything drifts. "
             "February asks: where has your love drifted? Not to shame you — to call you back.",
             ["How has your love for God grown or cooled in the past season?",
              "What would loving God with your whole heart look like practically this week?"]),
            ("02","Loving Yourself Well","Psalm 139:14",
             "I receive Your love for me. I am fearfully and wonderfully made.",
             "You cannot love your neighbour as yourself if you do not love yourself. And you "
             "cannot love yourself rightly apart from how God sees you. He did not make a mistake "
             "when He made you. The works of His hands are wonderful. That includes you — your "
             "body, your mind, your story, your personality. Receive it.",
             ["Where do you struggle most to love yourself?",
              "Write 5 things God says about you that you need to believe more deeply."]),
            ("03","Loving Your Spouse / Future Spouse","1 Corinthians 13:4-7",
             "God, make me a vessel of Your love in my closest relationships.",
             "The love described in 1 Corinthians 13 is not romantic feeling — it is a choice, "
             "a discipline, a daily practice. Patient. Kind. Not easily angered. Keeps no record "
             "of wrongs. This is the love that builds marriages, restores relationships, and "
             "outlasts every season. February is the time to examine how you love — and to ask "
             "God to love through you.",
             ["How can you love your spouse (or prepare for one) more intentionally this month?",
              "Which quality from 1 Corinthians 13 do you most need to grow in — and why?"]),
            ("04","Forgiving Deeply","Colossians 3:13",
             "I choose to forgive as You have forgiven me. Release me from every root of bitterness.",
             "Unforgiveness is a prison you build for someone else and then live in yourself. "
             "Colossians does not say forgive when you feel it — it says forgive as the Lord "
             "forgave you. Not because they deserve it. Because you are free and they have no "
             "power over your peace. Full forgiveness looks like wishing them well and meaning it.",
             ["Who do you need to forgive? Write their name and what happened.",
              "What would full forgiveness look like — and what would it free you from?"]),
            ("05","Receiving God's Love","Romans 8:38-39",
             "Nothing can separate me from Your love. I receive it fully today.",
             "Nothing — not height or depth, life or death, angels or demons, present or future. "
             "Paul lists everything that could possibly come between you and God's love, and "
             "declares that none of it works. You are not loved because you are good. You are "
             "loved because He is. This is not a reward you earn — it is a foundation you build on.",
             ["Do you truly believe God loves you unconditionally? What makes it hard to receive?",
              "How would your life look different if you lived fully convinced of His love?"]),
        ]
    },
    {
        "name": "March", "theme": "Lent — The Desert Season",
        "scripture_text": '"Create in me a pure heart, O God, and renew a steadfast spirit within me."',
        "scripture_ref": "Psalm 51:10",
        "prayer_focus": "Repentance, surrender, holiness",
        "intro": (
            "March carries the heart of the Lenten season — forty days of preparation, reflection, "
            "and penitence leading from Ash Wednesday to Holy Saturday. Lent is not a mournful "
            "endurance; it is a deliberate wilderness walk, echoing Jesus' forty days of fasting "
            "and temptation. It is a season of stripping away, silence, and direct encounter with "
            "the raw beauty of God beyond the noise of comfort. Lent is a season of subtraction, "
            "not suffering. Remove what crowds out God's voice."
        ),
        "days": [
            ("01","Entering the Desert","Matthew 4:1",
             "Lord, I follow You into the wilderness. What You strip away, I release willingly.",
             "Jesus was led by the Spirit into the desert — not driven by fear or forced by "
             "circumstance, but led. The wilderness is not punishment; it is preparation. "
             "Every great move of God in Scripture was preceded by a desert season. Moses, "
             "Elijah, John the Baptist, Jesus himself. The desert strips everything unnecessary "
             "and leaves only what is real.",
             ["What comfort or distraction is God asking you to lay down this Lent?",
              "What does your personal desert look like right now?"]),
            ("02","Facing Temptation","1 Corinthians 10:13",
             "You always provide a way out. Open my eyes to see it and my will to take it.",
             "Jesus was tempted in the desert — at His weakest, most hungry, most vulnerable. "
             "And He overcame not by willpower but by the Word. Every temptation was met with "
             "'it is written.' You have the same weapon. The way out is always there, but you "
             "must choose to take it. Fasting sharpens your ability to see it.",
             ["What is your greatest area of temptation right now?",
              "What practical boundary will you set this Lent to protect yourself?"]),
            ("03","Repentance & Return","Joel 2:12-13",
             "I return to You with my whole heart. Rend my heart, not just my garments.",
             "God is not interested in external displays — He wants internal reality. Rend your "
             "heart, not your garments. True repentance is not regret about consequences; it is "
             "a change of direction. A turning. A return. And God runs toward those who return "
             "to Him — that is the promise of Lent and the heart of the gospel.",
             ["What do you need to genuinely repent of this season?",
              "Write a prayer of honest return to God — not performance, but reality."]),
            ("04","Silence & Solitude","Psalm 46:10",
             "Be still. Stop striving. You are God and I am not.",
             "Be still and know. The Hebrew word for 'be still' means to let go, to release, "
             "to stop trying to control. Stillness is not passive — it is an active act of "
             "trust. When was the last time you sat in complete silence before God, with no "
             "agenda, no requests, no rushing — just you and Him? This Lent, practice it.",
             ["When did you last sit in complete silence before God without an agenda?",
              "What does He say to you when the noise finally stops?"]),
            ("05","The Cross","Galatians 2:20",
             "I am crucified with Christ. The life I now live, I live by faith in the Son of God.",
             "The cross is not a metaphor. It is the central event of human history and the "
             "defining moment of your identity. You are crucified with Christ — the old self "
             "has died. And the life you now live is not your own. It is Christ living through "
             "you. Lent asks: what in you still needs to be crucified? What old self keeps "
             "trying to resurrect?",
             ["What in you needs to be crucified this season — what old self keeps rising?",
              "What does dying to self look like in your specific daily life?"]),
        ]
    },
    {
        "name": "April", "theme": "Easter — Resurrection",
        "scripture_text": '"Where, O death, is your victory? Where, O death, is your sting?"',
        "scripture_ref": "1 Corinthians 15:55",
        "prayer_focus": "Resurrection of dead areas",
        "intro": (
            "April is the month of the Resurrection — the decisive moment in human history and "
            "the hinge of our faith. 'If Christ has not been raised, your faith is futile' "
            "(1 Corinthians 15:17). But He has been raised. April is a month of unshakeable joy, "
            "bold intercession, and resurrection power pressing into every area of your life. "
            "Lent yields to Easter, and that shift should be felt with spiritual force. "
            "Good Friday is the one fast where we don't fast to receive — we fast to remember."
        ),
        "days": [
            ("01","Palm Sunday — Surrender Your Expectations","John 12:13",
             "Lord, I lay down my agenda. I welcome You as King — not as I imagined You, but as You truly are.",
             "The crowd that welcomed Jesus with palm branches expected a political deliverer. "
             "They got a suffering servant on a donkey. When God does not come the way we "
             "expected, we have two choices: adjust our expectations or miss Him entirely. "
             "Palm Sunday is the invitation to lay down your version of how God should show up "
             "and welcome the reality of who He actually is.",
             ["Where have your expectations of God disappointed you?",
              "What does it mean to truly crown Him King — not the King you want, but the King He is?"]),
            ("02","Good Friday — The Fast of the Cross","Isaiah 53:5",
             "By Your wounds I am healed. I stand at the cross and receive everything You purchased for me.",
             "By His stripes we are healed. Not will be — are. It is a completed act. The "
             "cross purchased your forgiveness, your healing, your peace, your access to the "
             "Father. Today is the day to stand at the foot of the cross and receive — not to "
             "work for it or deserve it, but to open your hands and receive the gift that cost "
             "Him everything.",
             ["What has the cross purchased for you that you have not yet fully received?",
              "Spend time in silence at the foot of the cross. What do you hear Him say?"]),
            ("03","Holy Saturday — Waiting in the Dark","Psalm 30:5",
             "Weeping may endure for a night, but joy comes in the morning. I trust You in the silence.",
             "Holy Saturday is the in-between day. Jesus is in the tomb. The disciples don't "
             "know what we know — that Sunday is coming. There are seasons in your life that "
             "feel like Holy Saturday: something has died, and the resurrection hasn't come yet. "
             "You are waiting in the dark. This is not abandonment. It is the space before dawn.",
             ["What situation in your life feels like Holy Saturday — uncertain, silent, waiting?",
              "How do you hold faith in the in-between? What does trust look like right now?"]),
            ("04","Resurrection Sunday — New Life","Romans 6:4",
             "I walk in newness of life. What was dead is alive. What was buried is risen.",
             "Resurrection Sunday changes everything. Not just historically — personally. Because "
             "Christ rose, you walk in newness of life. Because He overcame death, death has no "
             "final word over anything in your life. What dead thing are you believing God to "
             "resurrect? A relationship? A dream? A part of yourself that felt gone?",
             ["What resurrection are you believing God for in your life right now?",
              "What area of your life needs to come back to life — and what would that look like?"]),
            ("05","Post-Resurrection — Walking It Out","Luke 24:32",
             "Set my heart on fire as You walk with me and open the scriptures to me.",
             "The disciples on the road to Emmaus didn't recognise Jesus at first. But they "
             "said: did not our hearts burn within us as He talked with us? The resurrection "
             "is not just an event to celebrate — it is a power to walk in every day. The "
             "question after Easter is not 'did it happen?' but 'how does it change how I live?'",
             ["How will you carry the resurrection power of Easter into the rest of the year?",
              "What changes in your daily life because of what Christ has done?"]),
        ]
    },
    {
        "name": "May", "theme": "Pentecost — Fire of the Holy Spirit",
        "scripture_text": '"Suddenly a sound like the blowing of a violent wind came from heaven and filled the whole house."',
        "scripture_ref": "Acts 2:1-4",
        "prayer_focus": "Fire of the Spirit, gifts, revival",
        "intro": (
            "May carries Pentecost's charge. Fifty days after Easter brings us into the season "
            "of the Holy Spirit's outpouring, making May a month to pursue the fullness, gifts, "
            "and fire of the Spirit. Acts 2 records that the disciples were in one accord in "
            "one place — waiting — when the Holy Spirit came suddenly. May calls you into that "
            "same posture of expectant, united waiting. The disciples didn't fast alone — "
            "they waited together. Corporate fasting carries unusual power."
        ),
        "days": [
            ("01","Waiting for the Promise","Acts 1:4",
             "Lord, I wait for what You have promised. I will not move until You move.",
             "Jesus told the disciples to wait in Jerusalem. Don't go yet. Don't start yet. "
             "The promise hasn't come. Waiting is not inaction — it is the most active form "
             "of obedience when God says wait. The disciples waited ten days. What they "
             "received on day ten was worth every moment of the wait.",
             ["What promise of God are you still waiting for?",
              "What does active, obedient waiting look like for you right now?"]),
            ("02","Hunger for the Holy Spirit","Luke 11:13",
             "Father, how much more will You give the Holy Spirit to those who ask. I ask — fill me afresh.",
             "If you who are evil know how to give good gifts to your children, how much more "
             "will the Father give the Holy Spirit to those who ask. The promise is staggering "
             "in its simplicity: ask. The Holy Spirit is not something you earn or deserve — "
             "He is a gift from the Father to those hungry enough to ask.",
             ["When did you last experience a genuine fresh filling of the Holy Spirit?",
              "What does being full of the Spirit look like in your daily ordinary life?"]),
            ("03","Tongues of Fire — Speaking Boldly","Acts 2:4",
             "Set my tongue on fire with Your truth. Give me boldness to speak what You have placed in me.",
             "At Pentecost, tongues of fire rested on each of them and they spoke. The fire "
             "didn't just warm them — it gave them utterance. What has God placed in you that "
             "needs to be spoken? What word, what testimony, what declaration have you been "
             "holding back? The fire of God is also the courage to speak.",
             ["What has God given you to say that you have been holding back?",
              "Who specifically needs to hear what God has placed in you?"]),
            ("04","Corporate Unity","Acts 2:1",
             "Bring us into one accord. Break every wall of division in my relationships and my church.",
             "They were all together in one place. This is not incidental — it is essential. "
             "Pentecost required unity. The fire fell on a unified body. Division quenches the "
             "Spirit; unity invites Him. Where is there division in your relationships, your "
             "church, your community? Your fasting this month is partly intercession for unity.",
             ["Where is there division in your relationships or community right now?",
              "What is your specific role in building unity? What does that cost you?"]),
            ("05","Signs, Wonders & the Harvest","Acts 2:43",
             "Let signs and wonders follow the preaching of Your word. Use me as a vessel of Your power.",
             "After Pentecost, signs and wonders accompanied the proclamation of the gospel. "
             "This was not a one-time phenomenon — it was the normal pattern of Spirit-filled "
             "ministry. You are not asking for something extraordinary; you are asking for what "
             "the New Testament presents as ordinary. Believe for it.",
             ["What specific miracle are you believing God for right now?",
              "Who in your sphere of influence needs a demonstration of God's power?"]),
        ]
    },
    {
        "name": "June", "theme": "Kingdom Harvest",
        "scripture_text": '"The harvest is plentiful but the workers are few. Ask the Lord of the harvest to send out workers."',
        "scripture_ref": "Matthew 9:37-38",
        "prayer_focus": "Souls, evangelism, the lost",
        "intro": (
            "June marks a season of fullness and harvest in the natural world. In the kingdom "
            "of God, June is a month to pray for the great harvest of souls Jesus named. "
            "Your fast this month is an act of intercession for the lost — a priestly offering "
            "laid on the altar for those who do not yet know the Good Shepherd. The harvest "
            "fast is not about what you give up — it is about who you show up for. "
            "Fast with someone's name on your lips."
        ),
        "days": [
            ("01","The Harvest is Plentiful","Matthew 9:37-38",
             "Lord of the harvest, send out labourers. Begin with me — send me.",
             "Jesus looked at the crowds and felt compassion. Then He spoke about the harvest. "
             "The connection is not accidental: evangelism flows from compassion, and compassion "
             "flows from seeing people the way Jesus sees them. Before you can reach the harvest, "
             "you need His eyes. Ask for them.",
             ["Who in your life is ready to hear the gospel right now?",
              "What is genuinely stopping you from sharing it with them?"]),
            ("02","Compassion for the Lost","Luke 15:20",
             "Give me Your heart for the lost — the same compassion that made the Father run.",
             "The father in the parable saw his son while he was still a long way off and ran. "
             "That is the heart of God toward the lost. Not waiting for them to get it together. "
             "Not standing at a distance with arms crossed. Running. When did you last feel that "
             "kind of compassion for someone who doesn't know God?",
             ["When did you last feel genuine compassion for someone far from God?",
              "How can you cultivate the Father's heart for the lost this month?"]),
            ("03","Your Personal Mission Field","Acts 1:8",
             "Use me in Jerusalem first — my home, my street, my workplace. Start close.",
             "Jesus said you will be witnesses in Jerusalem, Judea, Samaria, and to the ends "
             "of the earth. Jerusalem was home. Most people start looking for mission fields "
             "across the ocean when there are people right next door who have never heard the "
             "gospel clearly presented. Your mission field is closer than you think.",
             ["Who are the 5 people closest to you who need Jesus?",
              "Write their names. Commit to pray for them every day this month."]),
            ("04","Sowing in Tears","Psalm 126:5-6",
             "I go out weeping, carrying the seed. I trust You for the harvest.",
             "Those who sow in tears will reap in joy. Some seeds are sown with great sacrifice "
             "— prayers offered year after year for someone who shows no response, conversations "
             "that seem to go nowhere, love offered to those who don't receive it. Keep sowing. "
             "The tears are part of the seed. The harvest is coming.",
             ["What seeds have you been sowing in prayer or service for the lost?",
              "Where do you need to keep sowing even when you see no fruit yet?"]),
            ("05","Generosity as Witness","Matthew 5:16",
             "Let my good works shine so brightly that people ask about the God behind them.",
             "You are the light of the world. Light does not announce itself — it shines. "
             "When your generosity is unexplained by self-interest, when your kindness exceeds "
             "what circumstances require, when your peace doesn't make sense in the storm — "
             "people ask questions. Those questions are open doors.",
             ["How can your generosity this month become a testimony that opens spiritual doors?",
              "What specific act of kindness can create a genuine spiritual conversation?"]),
        ]
    },
    {
        "name": "July", "theme": "Midpoint Consecration",
        "scripture_text": '"For the revelation awaits an appointed time; it speaks of the end and will not prove false."',
        "scripture_ref": "Habakkuk 2:3",
        "prayer_focus": "Review, recommit, second half",
        "intro": (
            "July marks the midpoint of the year, and it demands the same intentionality as "
            "January. At the halfway mark, the wise believer pauses to review, reassess, and "
            "re-consecrate. Have you walked in the vision God gave you in January? What must "
            "be surrendered, adjusted, or accelerated in the second half? July is not for "
            "discouragement — it is for course correction, renewed faith, and holy momentum. "
            "Halftime is not a break — it is a briefing."
        ),
        "days": [
            ("01","Halftime Review","Lamentations 3:40",
             "Lord, let me examine my ways honestly. Show me where I have drifted.",
             "Let us examine our ways and test them, and let us return to the Lord. The word "
             "'examine' here is the same word used for a craftsman carefully inspecting their "
             "work. Not a quick glance — a thorough, honest assessment. Where are you in "
             "relation to what you believed God said in January? What needs to change?",
             ["What were your goals and declarations for this year? Review them honestly.",
              "Where have you drifted from God's plan? What led to the drift?"]),
            ("02","Gratitude for the First Half","Psalm 103:2",
             "I bless You, Lord, and I will not forget all Your benefits in these past 6 months.",
             "Before you assess what went wrong, count what went right. God has been faithful "
             "in the first half even when you were not. There are answered prayers, moments of "
             "grace, breakthroughs you almost missed, provisions you didn't earn. Count them. "
             "Write them. Gratitude is not denial — it is accurate accounting.",
             ["List 10 specific things God has done for you in the first half of this year.",
              "What almost went unnoticed that you need to pause and thank Him for?"]),
            ("03","Releasing What Didn't Work","Philippians 3:13",
             "I forget what is behind and strain toward what is ahead. I release the failures of the first half.",
             "Forgetting what is behind is not pretending it didn't happen — it is choosing "
             "not to let it determine your future. The failures, the missed opportunities, "
             "the wrong turns of the first half do not have to define the second half. "
             "What you release, God redeems. What you hold onto, weighs you down.",
             ["What disappointment or failure from the first half do you need to release?",
              "What would it feel like to truly let it go and move forward free?"]),
            ("04","Recommitting to Purpose","Habakkuk 2:2-3",
             "The vision is for an appointed time. I recommit to what You have called me to.",
             "Write the vision, make it plain. The vision has a timing — it will not prove "
             "false. But you must recommit to it. Half a year of drift does not cancel a "
             "God-given assignment. It just means you need to find your way back. What is "
             "the God-given vision for your life in this season?",
             ["What is your specific God-given assignment for this year?",
              "What concrete step will you take in the second half that you have been avoiding?"]),
            ("05","Sealing the Midpoint","Joshua 1:9",
             "Be strong and courageous. You are with me wherever I go. I enter the second half with confidence.",
             "Be strong and courageous. Not because the second half will be easy, but because "
             "God is with you. The same God who was with Joshua in the wilderness is with you "
             "in whatever territory you are entering. You are not going alone. You never were. "
             "Write your declaration for the second half of this year.",
             ["What fear or hesitation has held you back in the first half?",
              "Write a declaration of faith and courage for August through December."]),
        ]
    },
    {
        "name": "August", "theme": "Sabbath Rest & Renewal",
        "scripture_text": '"Be still, and know that I am God; I will be exalted among the nations."',
        "scripture_ref": "Psalm 46:10",
        "prayer_focus": "Stillness, hearing, sabbath trust",
        "intro": (
            "August calls you to the discipline of sabbath — not as laziness, but as holy trust. "
            "God rested on the seventh day not because He was tired, but to establish covenant "
            "rhythm: work and rest, striving and surrender, doing and being. The Sabbath fast "
            "is a fast from striving — a deliberate act of trusting that God holds what you "
            "cannot control. August is not a passive month — it is active rest. You are not "
            "doing nothing. You are doing the most important thing: being still before God."
        ),
        "days": [
            ("01","The Gift of Silence","Psalm 62:1",
             "My soul finds rest in You alone. I quiet every voice that is not Yours.",
             "My soul finds rest in God alone. Not in productivity. Not in noise. Not in "
             "entertainment or distraction. In God alone. Silence is not empty — it is full "
             "of God. But you cannot experience that until you actually stop and enter it. "
             "If silence feels uncomfortable, that discomfort is information worth examining.",
             ["What does silence feel like for you right now — peaceful or deeply uncomfortable?",
              "What does your discomfort with silence reveal about where you find your worth?"]),
            ("02","Sabbath Rest","Matthew 11:28-29",
             "I come to You, weary and burdened. I take Your yoke — easy and light.",
             "Come to me, all you who are weary and burdened. This is not a performance "
             "invitation — it is a rest invitation. Jesus does not say 'get it together and "
             "then come.' He says come as you are, bring everything you are carrying, and I "
             "will give you rest. What are you carrying that God never asked you to carry?",
             ["What burdens are you carrying that God never assigned to you?",
              "What would true rest look like for you this month — practically and spiritually?"]),
            ("03","Detoxing the Mind","Philippians 4:8",
             "I choose to think on what is true, noble, right, pure, lovely, and admirable. Renew my thought patterns.",
             "Whatever is true, whatever is noble, whatever is right — think on these things. "
             "Your mind becomes what it consistently consumes. A month of reduced media and "
             "digital noise is a month of mental detox. You may be surprised what you hear "
             "when you stop filling every moment with noise.",
             ["What content have you been consuming that has shaped your thinking negatively?",
              "What will you intentionally replace it with this month?"]),
            ("04","Hearing in the Stillness","1 Kings 19:12",
             "Speak in the still small voice. I am listening. I have turned off the noise to hear You.",
             "God was not in the wind, or the earthquake, or the fire. After the fire — a "
             "still small voice. The most important things God says often come in the quietest "
             "moments. Elijah was burned out, hiding in a cave, convinced his ministry was "
             "over. And God spoke — not in the spectacular, but in the whisper.",
             ["What has God been trying to say to you that the noise has been drowning out?",
              "What do you hear when you actually stop and sit in the quiet right now?"]),
            ("05","Renewal of Strength","Isaiah 40:31",
             "I wait on You, Lord. Renew my strength. Let me mount up with wings like eagles.",
             "Those who wait on the Lord will renew their strength. Waiting is not passive — "
             "it is an active leaning into God. Like a servant who stands at attention, "
             "ready to receive direction. The renewal comes in the waiting, not after it. "
             "Where are you most depleted? That is where God wants to meet you first.",
             ["Where are you most spiritually, emotionally, and physically depleted right now?",
              "What does genuine renewal look like for you in this specific season?"]),
        ]
    },
    {
        "name": "September", "theme": "Wisdom & Learning",
        "scripture_text": '"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding."',
        "scripture_ref": "Proverbs 9:10",
        "prayer_focus": "Students, wisdom, mind of Christ",
        "intro": (
            "September marks the global return to school, university, and structured learning. "
            "In the rhythm of the Spirit, September is a month to sit humbly at the feet of "
            "Jesus as a student. September's fast is an act of intellectual humility — fasting "
            "self-reliance and pride of knowledge in exchange for the mind of Christ. "
            "The greatest education is not found in a classroom — it is found on your knees. "
            "Fast for wisdom, and God will make you wiser than your teachers."
        ),
        "days": [
            ("01","The Fear of the Lord","Proverbs 9:10",
             "Teach me to fear You rightly — not in terror, but in reverence. Let that reverence be the foundation of all my decisions.",
             "The fear of the Lord is the beginning of wisdom. Not the end — the beginning. "
             "It is the starting point of all true knowledge. This fear is not cowering terror "
             "but profound reverence — the recognition that God is God and you are not. "
             "When that becomes your posture, every decision flows from a different source.",
             ["What does the fear of the Lord mean to you practically — in specific decisions?",
              "Where have you been making decisions without genuinely consulting God?"]),
            ("02","The Mind of Christ","1 Corinthians 2:16",
             "I have the mind of Christ. I ask You to activate it — to think Your thoughts after You.",
             "We have the mind of Christ. This is not aspiration — it is declaration. You have "
             "been given access to the thinking of God through the Spirit who searches all "
             "things, even the deep things of God. But having access and using it are different. "
             "Ask for the mind of Christ to be activated in your specific situation today.",
             ["In what specific area of your life do you most need the mind of Christ?",
              "What would Christ think about your most pressing current situation?"]),
            ("03","Learning from the Holy Spirit","John 14:26",
             "Holy Spirit, teach me all things. Remind me of everything Jesus has said. Be my Teacher today.",
             "The Holy Spirit is the Counsellor, the Teacher, the one who will remind you of "
             "everything Jesus said. The best education available to you is not in any institution "
             "— it is in the quiet classroom of the Spirit. What is He currently teaching you? "
             "Not what have you studied — what has He specifically been highlighting?",
             ["What is the Holy Spirit currently teaching you in this season?",
              "What lesson keeps coming up that you have not fully learned yet?"]),
            ("04","Wisdom for Relationships","James 1:5",
             "I lack wisdom — I ask You generously and without reproach. Give me wisdom for every relationship.",
             "If any of you lacks wisdom, let him ask God, who gives generously without finding "
             "fault. The invitation is remarkable: ask. God does not hold your lack of wisdom "
             "against you — He offers to give it generously. But you must ask. Which "
             "relationship in your life needs the most wisdom right now?",
             ["Which relationship in your life needs the most wisdom right now?",
              "What would a genuinely wise response look like in that relationship?"]),
            ("05","Applying What You Know","James 1:22",
             "Make me a doer of the word, not just a hearer. Let knowledge become action in my life.",
             "Do not merely listen to the word, deceiving yourselves. Do what it says. The "
             "greatest danger of Bible knowledge is that you can accumulate it without applying "
             "it. Head knowledge without obedience is self-deception. What truth have you known "
             "for a long time that you have not yet acted on?",
             ["What truth do you know but have not applied? Name it specifically.",
              "What is the gap between your knowledge and your obedience right now?"]),
        ]
    },
    {
        "name": "October", "theme": "Spiritual Warfare",
        "scripture_text": '"For our struggle is not against flesh and blood, but against the rulers, against the authorities..."',
        "scripture_ref": "Ephesians 6:12",
        "prayer_focus": "Warfare, authority, darkness displaced",
        "intro": (
            "October often carries an atmosphere of spiritual darkness. For the believer, "
            "October is a strategic month for spiritual warfare: standing in the authority of "
            "Christ and pushing back darkness through fasting, prayer, and bold declaration. "
            "This is not a month to retreat. Advance. The gates of hell shall not prevail. "
            "Spiritual warfare is not about intensity alone — it is about consistency and "
            "authority. Show up in prayer every week of October, and watch the atmosphere shift."
        ),
        "days": [
            ("01","Know Your Enemy","Ephesians 6:12",
             "I wrestle not against flesh and blood. Open my eyes to the real battle behind what I see.",
             "We do not wrestle against flesh and blood. The person who hurt you is not your "
             "real enemy. The circumstance that is crushing you is not the real battle. There "
             "is a spiritual dimension to every conflict, every struggle, every attack. Fasting "
             "sharpens your ability to see past the surface to what is actually happening.",
             ["Where in your life are you fighting the wrong enemy — a person instead of a spirit?",
              "What is the real spiritual battle behind your most pressing current struggle?"]),
            ("02","Put on the Full Armour","Ephesians 6:13-17",
             "I put on the full armour of God today — truth, righteousness, peace, faith, salvation, and the Word.",
             "The armour of God is not automatic — you put it on. Paul lists each piece "
             "deliberately: truth, righteousness, peace, faith, salvation, the Word. Every "
             "piece is a different dimension of your relationship with God. Which piece are "
             "you neglecting? Which piece are you most grateful for today?",
             ["Which piece of the armour do you most neglect — and what does that cost you?",
              "What would it look like to intentionally put on each piece of armour today?"]),
            ("03","The Power of the Name","Philippians 2:10",
             "At the name of Jesus, every knee bows. I speak that name over every situation that has not yet bowed.",
             "At the name of Jesus, every knee shall bow — in heaven, on earth, under the earth. "
             "There is no situation, no stronghold, no circumstance that is outside the authority "
             "of that name. You are not asking a weak God for small favours. You are speaking "
             "the name that commands all things.",
             ["What situation in your life needs to bow to the name of Jesus right now?",
              "Speak it out loud and write your declaration of authority over it."]),
            ("04","Interceding for Your City","Jeremiah 29:7",
             "I seek the peace and prosperity of this city. As it prospers, I prosper. I pray for my city today.",
             "Seek the peace and prosperity of the city to which I have carried you. Your "
             "wellbeing is connected to the wellbeing of your city. You are not a tourist "
             "passing through — you are a planter, a pray-er, a presence. October is the "
             "strategic month to target your city in intercession.",
             ["What are the specific spiritual needs of your city right now?",
              "What targeted, specific prayer will you pray for your community this month?"]),
            ("05","Standing Firm","Ephesians 6:13",
             "Having done all, I stand. I will not retreat. I will not be moved.",
             "Having done all — stand. Sometimes the warfare assignment is not to advance "
             "but to hold ground. Not to charge but to stay. There is a moment when you have "
             "prayed, fasted, declared, and done everything you know to do — and the word "
             "is simply: stand. Don't give up. Don't give in. The breakthrough comes to those "
             "who are still standing when it arrives.",
             ["Where have you been most tempted to give up in prayer or in standing firm?",
              "What would it look like to stand firm until the breakthrough comes?"]),
        ]
    },
    {
        "name": "November", "theme": "Gratitude & Generosity",
        "scripture_text": '"Is it not to share your food with the hungry and to provide the poor wanderer with shelter?"',
        "scripture_ref": "Isaiah 58:7",
        "prayer_focus": "Thanksgiving, giving, contentment",
        "intro": (
            "November carries the spirit of Thanksgiving — one of the most theologically rich "
            "postures of the believer's heart. November's fast is a fast from anxiety, complaint, "
            "and ingratitude — a deliberate, joyful choice of gratitude as spiritual discipline "
            "and warfare. Isaiah 58 makes clear that the fast God chooses involves sharing your "
            "bread with the hungry. Fasting that does not produce generosity has missed something "
            "essential. The Generosity Fast: on every fasting day this month, give something away."
        ),
        "days": [
            ("01","Counting Your Blessings","Psalm 103:1-2",
             "I bless You, Lord, with everything in me. I will not forget a single thing You have done.",
             "Praise the Lord, my soul, and forget not all His benefits. The instruction is "
             "specific: do not forget. Forgetting the goodness of God is not just ingratitude "
             "— it is spiritually dangerous. It leads to anxiety, complaint, and the false "
             "belief that you are on your own. Count the benefits. List them. Speak them out.",
             ["List 20 specific blessings from this year — be specific, not vague.",
              "What almost went unnoticed? What has God done that you nearly forgot?"]),
            ("02","The Fast of Contentment","Philippians 4:11-12",
             "I have learned contentment in all states. Teach me to be content — not complacent, but at peace.",
             "I have learned to be content whatever the circumstances. The word 'learned' is "
             "key — contentment is not a personality trait, it is a discipline. Paul learned it "
             "through seasons of abundance and want. Contentment is not giving up on your "
             "dreams; it is refusing to let their absence steal your peace.",
             ["Where are you most discontent right now? Name it honestly.",
              "What would contentment look like without giving up on your God-given dreams?"]),
            ("03","Generosity as Worship","2 Corinthians 9:7",
             "I give cheerfully — not under compulsion. My giving is an act of worship, not obligation.",
             "God loves a cheerful giver — the Greek word is hilarious, meaning one who gives "
             "with hilarity, with joy, with abandon. Giving should feel like freedom, not "
             "burden. When giving feels like obligation, something has gone wrong in your "
             "theology. Generosity is a response to grace — and grace makes you want to give.",
             ["What can you give away this month — money, time, skill, encouragement?",
              "Who is God specifically putting on your heart to bless this month?"]),
            ("04","Gratitude in Suffering","1 Thessalonians 5:18",
             "In everything I give thanks — not for everything, but in everything. Even here, You are God.",
             "Give thanks in all circumstances — not for all circumstances. There is a critical "
             "distinction. You do not have to thank God for the pain, the loss, the injustice. "
             "But you can thank Him in the midst of it — because He is still God, still present, "
             "still working, still faithful even when nothing feels like it.",
             ["What difficult situation can you find something genuine to be grateful for?",
              "What has suffering taught you in this season that comfort never could?"]),
            ("05","Finishing Well","2 Timothy 4:7",
             "I want to finish well. Help me end this year having fought the good fight, kept the faith, finished the race.",
             "I have fought the good fight, I have finished the race, I have kept the faith. "
             "Paul wrote this from prison, facing execution. His measure of success was not "
             "comfort or achievement but faithfulness. As the year draws toward its close, "
             "the question is not: did I succeed? but: did I stay faithful?",
             ["As the year draws to a close, what do you still want to finish?",
              "What unfinished business — spiritual, relational, practical — needs your attention?"]),
        ]
    },
    {
        "name": "December", "theme": "Advent — Endings & Eternity",
        "scripture_text": '"For to us a child is born, to us a son is given, and the government will be on his shoulders."',
        "scripture_ref": "Isaiah 9:6",
        "prayer_focus": "Hope, peace, joy, love; year-end review",
        "intro": (
            "December is the other bookend of the year — every bit as critical as January, "
            "but for different reasons. January begins with faith; December ends with faithfulness. "
            "It is Advent: the holy season of waiting, longing, and preparation for the coming "
            "of Christ. December does not belong to commerce and festivity alone — it belongs "
            "to watching, praying, and readiness. Whatever form your December fast takes, "
            "make December 31st intentional. Don't drift into a new year. Close this one with worship."
        ),
        "days": [
            ("01","Advent Sunday 1 — The Candle of Hope","Romans 15:13",
             "God of hope, fill me with all joy and peace as I trust in You. Let hope overflow.",
             "May the God of hope fill you with all joy and peace as you trust in Him, so that "
             "you may overflow with hope by the power of the Holy Spirit. Hope is not wishful "
             "thinking — it is confident expectation rooted in the character of God. The God "
             "of hope has not changed. His record of faithfulness in your life has not changed.",
             ["What are you genuinely hoping for as you close this year?",
              "Where has hope grown dim — and what would it take to relight it?"]),
            ("02","Advent Sunday 2 — The Candle of Peace","Isaiah 9:6",
             "Prince of Peace, rule in my heart. Let Your peace govern every area of my life still in turmoil.",
             "One of the names of the coming Christ is Prince of Peace. Not Peace as the "
             "absence of conflict, but Peace as a person — Jesus Himself who calms every storm "
             "He enters. Where is there turmoil in your life right now? He walks into that "
             "space and speaks: Peace, be still.",
             ["Where do you most need peace right now — be specific?",
              "What would surrendering that specific area to the Prince of Peace look like?"]),
            ("03","Advent Sunday 3 — The Candle of Joy","Nehemiah 8:10",
             "The joy of the Lord is my strength. Restore the joy of Your salvation in me.",
             "The joy of the Lord is your strength. Not happiness — joy. Happiness depends on "
             "circumstances; joy depends on God. It is possible to be in the middle of the "
             "hardest season of your life and still have the deep, settled, unshakeable joy of "
             "the Lord. Has something stolen your joy this year? It can be restored.",
             ["When did you last experience deep, unshakeable joy — not happiness, but joy?",
              "What stole your joy this year, and how do you reclaim it?"]),
            ("04","Advent Sunday 4 — The Candle of Love","John 3:16",
             "You so loved the world that You gave. I receive that love again today — as if for the first time.",
             "For God so loved the world that He gave. The measure of God's love is not words "
             "— it is the giving of His Son. This is the love that Advent celebrates. Not "
             "sentimental feeling but sacrificial action. As you close this year, receive "
             "that love again — fresh, unearned, overwhelming, and personal.",
             ["How has God's love shown up for you this year in unexpected ways?",
              "Write a love letter back to God as you close the year."]),
            ("05","December 31 — Closing the Year","Psalm 90:12",
             "Teach me to number my days, that I may gain a heart of wisdom.",
             "Teach us to number our days, that we may gain a heart of wisdom. Time is a gift "
             "and a stewardship. Every day you did not choose to be alive — God chose it for "
             "you. Every day you are alive is an opportunity to gain wisdom, to love well, "
             "to do the work He assigned. As this year ends, count the days. Count the grace.",
             ["Review your journal from this year — what did God say most consistently?",
              "What are you declaring over the year ahead? Write it as a faith declaration."]),
        ]
    },
]


# ── FILLABLE FIELD BUILDER ────────────────────────────────
def add_text_field_flowable(name, height, styles, label=None):
    """Returns story items that reserve space for a text field.
    The actual AcroForm widget is drawn in the on_page pass."""
    items = []
    if label:
        items.append(Paragraph(label, styles["field_label"]))
    items.append(_FieldSpacer(name, height))
    return items


class _FieldSpacer(Spacer):
    """A spacer that also registers itself for AcroForm field placement."""
    _registry = []

    def __init__(self, name, height):
        super().__init__(CONTENT_W, height)
        self.field_name = name
        _FieldSpacer._registry.append(self)

    def draw(self):
        c = self.canv
        y = self._y if hasattr(self, '_y') else 0
        h = self.height
        # Decorative field background with rounded corners (visual only)
        c.saveState()
        c.setFillColor(colors.HexColor("#E5E0D6"))
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.4)
        c.roundRect(0, y + 1, CONTENT_W, h - 3, 3*mm, fill=1, stroke=1)
        c.restoreState()
        # AcroForm text field on top
        c.acroForm.textfield(
            name=self.field_name,
            tooltip="Write your response here",
            x=MARGIN_L + 2,
            y=y + 2,
            width=CONTENT_W - 4,
            height=h - 5,
            fontSize=9,
            textColor=colors.HexColor("#1E1B16"),
            fillColor=colors.HexColor("#E5E0D6"),
            borderColor=colors.HexColor("#E5E0D6"),
            borderWidth=0,
            fieldFlags="multiline",
            forceBorder=False,
        )


# ── MAIN BUILD FUNCTION ───────────────────────────────────
def build_pdf(output_path, user_name, fasting_level, altar_day, anchor_months, active_months=None, altar_days=None, day_intentions=None):
    global _user_name
    _user_name = user_name

    # Normalise altar_days — support single or multiple
    if altar_days is None or len(altar_days) == 0:
        altar_days = [altar_day] if altar_day else ['Saturday']
    day_intentions = day_intentions or {}
    days_label = " & ".join(altar_days)

    styles = S()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title=f"Keep Me At The Altar — {user_name}",
        author="Keep Me At The Altar™",
        subject="A Guided Journey of Fasting, Alignment & Spiritual Discipline",
    )

    story = []

    # ── COVER ──────────────────────────────────────────────
    story.append(Spacer(1, 28*mm))
    story.append(Paragraph("🕯", ParagraphStyle("c_icon", fontName="Helvetica",
        fontSize=34, alignment=TA_CENTER, textColor=GOLD, spaceAfter=14)))
    story.append(Paragraph("KEEP ME AT THE ALTAR™", ParagraphStyle("brand",
        fontName="Helvetica", fontSize=9, alignment=TA_CENTER,
        textColor=GOLD, spaceAfter=4, charSpace=4)))
    story.append(gold_divider())
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("A Guided Journey of", styles["cover_title"]))
    story.append(Paragraph("Fasting, Alignment &", styles["cover_title"]))
    story.append(Paragraph("Spiritual Discipline", styles["cover_em"]))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph("Personalised for", styles["cover_sub"]))
    story.append(Paragraph(user_name.upper() if user_name else "THE SEEKER", styles["cover_name"]))
    story.append(Spacer(1, 8*mm))

    cover_data = [
        ["Fasting Level", fasting_level],
        ["Weekly Altar Day", altar_day],
        ["Anchor Months", " · ".join(anchor_months)],
    ]
    ct = Table(cover_data, colWidths=[55*mm, 95*mm])
    ct.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), SURFACE),
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("FONTNAME",(0,0),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1), 9),
        ("TEXTCOLOR",(0,0),(0,-1), PARCH_DIM),
        ("TEXTCOLOR",(1,0),(1,-1), PARCHMENT),
        ("PADDING",(0,0),(-1,-1), 8),
        ("LEFTPADDING",(0,0),(-1,-1), 10),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story.append(ct)
    story.append(Spacer(1, 10*mm))
    story.append(pull_quote('"Fasting is not the absence of food. It is the presence of God."', styles))
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="50%", thickness=0.4, color=BORDER, spaceAfter=6, hAlign="CENTER"))
    story.append(Paragraph("Part 1 — The Guide  ·  Part 2 — Your 12-Month Journal", styles["small_c"]))
    story.append(Paragraph("keepmeatthealtar.com  ·  Free for all believers", styles["small_c"]))
    story.append(PageBreak())

    # ── HOW TO USE ─────────────────────────────────────────
    story += section_head("Before You Begin", "How to use this journal", styles)
    story.append(Paragraph(
        "This journal was not written for the perfect. It was written for the hungry. "
        "You do not need to follow every month strictly or fast every time. Whenever "
        "you feel led to fast at any point in the year, return to this guide for "
        "structure, scripture, and direction.", styles["body"]))
    story.append(Spacer(1, 3*mm))
    for title, desc in [
        ("Your Altar Day", f"Every {days_label} is your weekly reset — one day set apart to fast, listen, and align."),
        ("Your Fasting Level", f"You have chosen the {fasting_level} level. Adjust month by month as the Spirit leads."),
        ("Your Anchor Months", f"{', '.join(anchor_months)} are your three anchor months — the non-negotiable spiritual gates of the year."),
        ("Guided Fasting Days", "Each month has 5 structured fasting days with teaching, scripture, your Appointment with God, and fillable journal fields."),
        ("Fillable Fields", "Type directly into the shaded boxes on each page to record your reflections digitally — or print and write by hand."),
    ]:
        story.append(KeepTogether([
            Paragraph(title.upper(), styles["eyebrow"]),
            Paragraph(desc, styles["body"]),
            Spacer(1, 3*mm),
        ]))
    story.append(pull_quote('"The Holy Spirit does not lead people to tools they do not need. Begin."', styles))
    story.append(PageBreak())

    # ── ANNUAL OVERVIEW ────────────────────────────────────
    story += section_head("Part 1 — The Guide", "Annual fasting overview", styles)
    ov_data = [["Month","Theme","Fast Type","Scripture","Prayer Focus"]]
    for m in MONTHS:
        row = [m["name"], m["theme"], level_fast(m["name"], fasting_level),
               m["scripture_ref"].split(":")[0] + ":" + m["scripture_ref"].split(":")[1] if ":" in m["scripture_ref"] else m["scripture_ref"],
               m["prayer_focus"]]
        ov_data.append(row)

    anchor_rows = [i+1 for i, m in enumerate(MONTHS) if m["name"] in anchor_months]
    ot = Table(ov_data, colWidths=[24*mm, 30*mm, 38*mm, 22*mm, 51*mm], repeatRows=1)
    ots = TableStyle([
        ("BACKGROUND",(0,0),(-1,0), SURFACE),
        ("TEXTCOLOR",(0,0),(-1,0), GOLD),
        ("FONTNAME",(0,0),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,0), 7),
        ("FONTSIZE",(0,1),(-1,-1), 7),
        ("TEXTCOLOR",(0,1),(-1,-1), PARCH_DIM),
        ("TEXTCOLOR",(0,1),(0,-1), PARCHMENT),
        ("BACKGROUND",(0,1),(-1,-1), BG),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [BG, SURFACE]),
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("PADDING",(0,0),(-1,-1), 5),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ])
    for r in anchor_rows:
        ots.add("BACKGROUND",(0,r),(-1,r), colors.HexColor("#E8E2D6"))
        ots.add("TEXTCOLOR",(0,r),(0,r), GOLD)
    ot.setStyle(ots)
    story.append(ot)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"Anchor months ({', '.join(anchor_months)}) are highlighted. "
        "This is a guide, not a law — let the Holy Spirit adjust your rhythm.", styles["small"]))
    story.append(PageBreak())

    # ── THREE ANCHOR MONTHS ────────────────────────────────
    story += section_head("Your Anchor Months", " · ".join(anchor_months), styles)
    story.append(Paragraph(
        "These three months carry particular weight. They are spiritual gates and "
        "God-ordained pillars that shape the year. They establish foundation, realign "
        "your course, and bring the year to a purposeful close.", styles["body"]))
    story.append(Spacer(1, 3*mm))
    roles = [
        ("The Gate — Open the Year", anchor_months[0] if len(anchor_months) > 0 else "Month 1",
         "What you consecrate, seek, and declare in this month sets the tone for the 12 months that follow."),
        ("The Midpoint — Review & Recommit", anchor_months[1] if len(anchor_months) > 1 else anchor_months[0],
         "A divine halftime to pause, review progress, and recalibrate your heart for the second half."),
        ("The Closing — End with Honour", anchor_months[2] if len(anchor_months) > 2 else anchor_months[-1],
         "The spiritual closing of the year — reflection, worship, surrender, and purposeful conclusion."),
    ]
    for role, month, desc in roles:
        story.append(KeepTogether([
            Paragraph(role.upper(), styles["eyebrow"]),
            Paragraph(month, styles["h3"]),
            Paragraph(desc, styles["body"]),
            Spacer(1, 3*mm),
        ]))
    story.append(pull_quote('"These three months are non-negotiable. If you fast nothing else all year, fast these three."', styles))
    story.append(PageBreak())

    # ── ALTAR DAY ──────────────────────────────────────────
    story += section_head("Weekly Practice", f"Your Altar Day{'s' if len(altar_days) > 1 else ''}", styles)
    story.append(Paragraph(
        f"Every {days_label} is your weekly reset — one day set apart not just to fast, "
        "but to return. Bring your week to God before it takes you somewhere you did not "
        "intend to go.", styles["body"]))
    story.append(Spacer(1, 3*mm))
    for title, timing, desc in [
        ("Morning — Surrender","15–30 min · No phone. Open hands.",
         'Begin with: "Lord, I return to You. I lay down this week — my plans, my worries, my wins, my wounds." Read one Psalm. Write what comes.'),
        ("Midday — Listening","15–20 min · Step away from work.",
         'Sit in silence. Ask: "What are You saying to me right now?" Don\'t fill the silence — receive it. Write one thing you sense God saying.'),
        ("Evening — Alignment","20–30 min · Review your week ahead.",
         'Pray over each day. Declare God\'s word over your key responsibilities. Close with: "I am aligned. I am covered. I go in Your name."'),
    ]:
        story.append(KeepTogether([
            Paragraph(title.upper(), styles["eyebrow"]),
            Paragraph(timing, styles["small"]),
            Paragraph(desc, styles["body"]),
            Spacer(1, 3*mm),
        ]))
    story.append(PageBreak())

    # ── SELECTED MONTHS ONLY ──────────────────────────────
    all_selected = list(anchor_months) + [m for m in (active_months or []) if m not in anchor_months]
    # Keep order consistent with calendar year
    month_names = [m["name"] for m in MONTHS]
    ordered_months = [m for m in month_names if m in all_selected]
    selected_month_data = [m for m in MONTHS if m["name"] in ordered_months]
    for month_data in selected_month_data:
        story += build_month(month_data, fasting_level, altar_days, anchor_months, styles, day_intentions)

    # ── CLOSING ────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Spacer(1, 18*mm))
    story.append(Paragraph("🕯", ParagraphStyle("close_icon", fontName="Helvetica",
        fontSize=26, alignment=TA_CENTER, textColor=GOLD, spaceAfter=8)))
    story.append(Paragraph("Go Deeper. Stay Hungry.", ParagraphStyle("close_h",
        fontName="Helvetica", fontSize=18, leading=24, textColor=colors.HexColor("#1E1B16"),
        alignment=TA_CENTER, spaceAfter=6)))
    story.append(gold_divider())
    story.append(Paragraph(
        "You have been given a year-long invitation into one of the most ancient and forceful "
        "disciplines entrusted to God's people. Fasting has changed nations, broken chains, "
        "and opened shut heavens. The same God who answered Moses, Elijah, Daniel, Esther, "
        "Anna, and the early church still hears, still moves, and still transforms hungry hearts.",
        styles["body_c"]))
    story.append(Spacer(1, 5*mm))
    story.append(pull_quote(
        '"Measure this year not by flawless performance, but by a heart made more tender toward God."',
        styles))
    story.append(Spacer(1, 5*mm))
    story += scripture_block(
        "Is not this the kind of fasting I have chosen: to loose the chains of injustice... "
        "to share your food with the hungry... Then your light will break forth like the dawn.",
        "Isaiah 58:6–8", styles)
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("keepmeatthealtar.com · Free for all believers", styles["small_c"]))

    # Build
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f"✓ PDF generated: {output_path}")


def build_month(data, fasting_level, altar_days, anchor_months, styles, day_intentions=None):
    _current_month[0] = data["name"]
    story = []
    is_anchor = data["name"] in anchor_months

    # ── Month opener ───────────────────────────────────────
    story.append(PageBreak())
    if is_anchor:
        story.append(Paragraph("⬥ ANCHOR MONTH", ParagraphStyle("anchor_badge",
            fontName="Helvetica", fontSize=8, textColor=GOLD, spaceAfter=3, charSpace=1)))
    story.append(Paragraph(data["name"].upper(), styles["eyebrow"]))
    story.append(Paragraph(data["name"], styles["month_title"]))
    story.append(Paragraph(data["theme"], styles["month_theme"]))
    story.append(divider())
    story += scripture_block(data["scripture_text"], data["scripture_ref"], styles)
    story.append(Spacer(1, 3*mm))
    story.append(info_table(level_fast(data["name"], fasting_level),
                            data["prayer_focus"], altar_days, styles))
    story.append(Spacer(1, 4*mm))

    # Intro paragraph
    story.append(Paragraph("ABOUT THIS MONTH", styles["eyebrow"]))
    story.append(Paragraph(data["intro"], styles["body"]))
    story.append(Spacer(1, 3*mm))

    # Days overview
    story.append(Paragraph("GUIDED FASTING DAYS", styles["eyebrow"]))
    for day in data["days"]:
        story.append(Paragraph(
            f"Day {day[0].lstrip('0')}  ·  {day[1]}  ·  {day[2]}", styles["small"]))
    story.append(Spacer(1, 4*mm))

    # Monthly journal space
    story.append(Paragraph("MONTHLY JOURNAL SPACE", styles["eyebrow"]))
    for label in ["My prayer focus this month", "Dreams / Revelations received",
                  "What the Holy Spirit is teaching me", "Scriptures that stood out"]:
        fname = field_name(f"{data['name']}_monthly")
        story.append(Paragraph(label, styles["field_label"]))
        story.append(_FieldSpacer(fname, 36))
        story.append(Spacer(1, 2*mm))

    # ── Fasting day pages ──────────────────────────────────
    days = data["days"]
    for day in days:
        story.append(PageBreak())
        story += build_fasting_day(day, data["name"], styles)

    # ── End of month reflection ────────────────────────────
    story.append(PageBreak())
    story += build_month_reflection(data["name"], styles)

    # ── Altar Day pages ────────────────────────────────────
    # Generate 4 weeks of altar day pages for each selected altar day
    day_intentions = day_intentions or {}
    for ad in altar_days:
        for week in range(1, 5):
            story.append(PageBreak())
            story += build_altar_day_page(data["name"], ad, week, styles,
                                          intention=day_intentions.get(ad, ''))

    return story


def build_fasting_day(day, month_name, styles):
    num, title, ref, prayer, teaching, prompts = day
    story = []

    # Header row: large day number + title
    header = Table(
        [[Paragraph(num, styles["day_num"]),
          [Paragraph(f"{month_name.upper()} · FASTING DAY {num.lstrip('0')}", styles["eyebrow"]),
           Paragraph(title, styles["day_title"]),
           Paragraph(f"Scripture: {ref}", styles["small"])]]],
        colWidths=[18*mm, CONTENT_W - 18*mm],
        style=TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(-1,-1), 0),
            ("RIGHTPADDING",(0,0),(-1,-1), 0),
            ("TOPPADDING",(0,0),(-1,-1), 0),
            ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ])
    )
    story.append(KeepTogether([header, Spacer(1, 2*mm)]))

    # Prayer prompt with pill label
    story.append(pill_label("APPOINTMENT WITH GOD", styles))
    story.append(Paragraph(f'"{prayer}"', styles["prayer"]))
    story.append(Spacer(1, 3*mm))

    # Teaching text
    story.append(pill_label("REFLECTION", styles))
    story.append(Paragraph(teaching, styles["body"]))
    story.append(Spacer(1, 3*mm))

    # Today's reflection field
    story.append(pill_label("TODAY'S REFLECTION", styles))
    fname = field_name(f"{month_name}_{num}_reflection")
    story.append(_FieldSpacer(fname, 70))
    story.append(Spacer(1, 4*mm))

    # Journal prompts with fields
    for idx, prompt in enumerate(prompts):
        story.append(Paragraph(f"{idx+1}.  {prompt}", styles["field_label"]))
        fname2 = field_name(f"{month_name}_{num}_q{idx+1}")
        story.append(_FieldSpacer(fname2, 50))
        story.append(Spacer(1, 3*mm))

    return story


def build_month_reflection(month_name, styles):
    story = []
    story.append(Paragraph(f"{month_name.upper()} · END OF MONTH", styles["eyebrow"]))
    story.append(Paragraph("Monthly Reflection", styles["h2"]))
    story.append(divider())

    for label, h in [
        ("What changed this month?", 60),
        ("The clearest thing God said:", 60),
        ("A prayer He answered:", 50),
        ("Something still in progress — I am trusting Him for:", 50),
        ("What I carry forward into next month:", 60),
    ]:
        story.append(Paragraph(label, styles["field_label"]))
        story.append(_FieldSpacer(field_name(f"{month_name}_refl"), h))
        story.append(Spacer(1, 3*mm))

    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("MY SPIRITUAL TEMPERATURE THIS MONTH", styles["small"]))
    temps = ["Cold","Warming","Steady","Hot","On Fire"]
    td = [[Paragraph(t, styles["small_c"]) for t in temps]]
    tt = Table(td, colWidths=[33*mm]*5)
    tt.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("BACKGROUND",(0,0),(-1,-1), SURFACE),
        ("PADDING",(0,0),(-1,-1), 6),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
    ]))
    story.append(tt)
    story.append(Paragraph("Circle one", styles["small"]))
    return story


def build_altar_day_page(month_name, altar_day, week_num, styles, intention=""):
    story = []
    story.append(Paragraph(f"{month_name.upper()} · WEEK {week_num} · ALTAR DAY", styles["eyebrow"]))
    title = f"{altar_day} — Weekly Journal"
    if intention:
        title += f"  ·  {intention}"
    story.append(Paragraph(title, styles["h2"]))
    story.append(divider())

    for title, prompt in [
        ("MORNING — Surrender", "Today I return to God by laying down:"),
        ("MIDDAY — Listening", "In the silence, I heard God say:"),
        ("EVENING — Alignment", "Declaration I am speaking over this week:"),
    ]:
        story.append(Paragraph(title, styles["eyebrow"]))
        story.append(Paragraph(prompt, styles["field_label"]))
        story.append(_FieldSpacer(field_name(f"{month_name}_altar{week_num}"), 50))
        story.append(Spacer(1, 3*mm))

    story.append(Paragraph("ONE WORD GOD GAVE ME TODAY", styles["small"]))
    story.append(_FieldSpacer(field_name(f"{month_name}_altar{week_num}_word"), 28))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph("HOW I FEEL LEAVING THE ALTAR TODAY", styles["small"]))
    feelings = ["Peaceful","Convicted","Renewed","Expectant","Surrendered","On Fire"]
    fd = [[Paragraph(f, styles["small_c"]) for f in feelings]]
    ft = Table(fd, colWidths=[27.5*mm]*6)
    ft.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("BACKGROUND",(0,0),(-1,-1), SURFACE),
        ("PADDING",(0,0),(-1,-1), 5),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
    ]))
    story.append(ft)
    story.append(Paragraph("Circle one", styles["small"]))
    return story


# ── HELPERS ──────────────────────────────────────────────
def section_head(eyebrow, title, styles, italic_title=False):
    s = styles["h1_em"] if italic_title else styles["h1"]
    return [
        Paragraph(eyebrow.upper(), styles["eyebrow"]),
        divider(),
        Paragraph(title, s),
        Spacer(1, 3*mm),
    ]

def scripture_block(verse, ref, styles):
    return [
        Paragraph(f'"{verse}"', styles["scripture"]),
        Paragraph(f"— {ref}", styles["scripture_ref"]),
    ]

def info_table(fast_desc, prayer_focus, altar_day, styles):
    altar_label = altar_day if isinstance(altar_day, str) else " & ".join(altar_day)
    data = [
        ["Fast Type","Prayer Focus","Altar Day"],
        [fast_desc, prayer_focus, altar_label],
    ]
    t = Table(data, colWidths=[55*mm, 58*mm, 52*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), SURFACE),
        ("BACKGROUND",(0,1),(-1,1), BG),
        ("TEXTCOLOR",(0,0),(-1,0), GOLD),
        ("TEXTCOLOR",(0,1),(-1,1), PARCHMENT),
        ("FONTNAME",(0,0),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,0), 7),
        ("FONTSIZE",(0,1),(-1,1), 8),
        ("BOX",(0,0),(-1,-1), 0.5, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 0.3, BORDER),
        ("PADDING",(0,0),(-1,-1), 6),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    return t



def build_altar_only_pdf(output_path, user_name, altar_days, anchor_months, active_months=None, day_intentions=None):
    """Generate a PDF containing only the altar day pages — for printing."""
    if altar_days is None or len(altar_days) == 0:
        altar_days = ['Saturday']
    day_intentions = day_intentions or {}
    days_label = " & ".join(altar_days)

    styles = S()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title=f"Keep Me At The Altar — {user_name} — Altar Days",
        author="Keep Me At The Altar™",
    )

    story = []

    # Cover
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph("🕯", ParagraphStyle("c_icon", fontName="Helvetica",
        fontSize=28, alignment=TA_CENTER, textColor=GOLD, spaceAfter=10)))
    story.append(Paragraph("KEEP ME AT THE ALTAR™", ParagraphStyle("c_brand",
        fontName="Helvetica", fontSize=10, alignment=TA_CENTER,
        textColor=GOLD, spaceAfter=4, charSpace=2)))
    story.append(Paragraph(user_name, ParagraphStyle("c_name",
        fontName="Helvetica", fontSize=22, alignment=TA_CENTER,
        textColor=colors.HexColor("#1E1B16"), spaceAfter=6)))
    story.append(Paragraph(f"Altar Day Journal — {days_label}", ParagraphStyle("c_sub",
        fontName="Helvetica", fontSize=12, alignment=TA_CENTER,
        textColor=colors.HexColor("#5A5347"), spaceAfter=4)))
    story.append(gold_divider())
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph("Weekly reset pages for fasting, listening, and alignment.",
        ParagraphStyle("c_body", fontName="Helvetica", fontSize=10,
        alignment=TA_CENTER, textColor=colors.HexColor("#5A5347"))))
    story.append(PageBreak())

    # Altar day pages for each selected month × each altar day × 4 weeks
    all_selected = list(anchor_months) + [m for m in (active_months or []) if m not in anchor_months]
    month_names = [m["name"] for m in MONTHS]
    ordered = [m for m in month_names if m in all_selected]

    for month_name in ordered:
        for ad in altar_days:
            for week in range(1, 5):
                story.append(PageBreak())
                story += build_altar_day_page(month_name, ad, week, styles,
                                              intention=day_intentions.get(ad, ''))

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f"✓ Altar-only PDF generated: {output_path}")


if __name__ == "__main__":
    import sys, json

    if len(sys.argv) >= 3:
        # Called from the API: python keep_me_at_the_altar_pdf_v2.py '{"name":...}' '/tmp/out.pdf'
        try:
            config = json.loads(sys.argv[1])
            output = sys.argv[2]
            os.makedirs(os.path.dirname(output), exist_ok=True)
            if config.get("altar_only"):
                build_altar_only_pdf(
                    output_path=output,
                    user_name=config.get("name", "Believer"),
                    altar_days=config.get("altar_days", [config.get("altar_day", "Saturday")]),
                    anchor_months=config.get("anchor_months", ["January", "July", "December"]),
                    active_months=config.get("active_months", []),
                    day_intentions=config.get("day_intentions", {}),
                )
            else:
                build_pdf(
                    output_path=output,
                    user_name=config.get("name", "Believer"),
                    fasting_level=config.get("level", "Standard"),
                    altar_day=config.get("altar_day", "Saturday"),
                    anchor_months=config.get("anchor_months", ["January", "July", "December"]),
                    active_months=config.get("active_months", []),
                    altar_days=config.get("altar_days", []),
                    day_intentions=config.get("day_intentions", {}),
                )
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Local test run
        output = "/mnt/user-data/outputs/TheAltarYear_Journal_v2.pdf"
        os.makedirs(os.path.dirname(output), exist_ok=True)
        build_pdf(
            output_path=output,
            user_name="Nina",
            fasting_level="Intensive",
            altar_day="Saturday",
            anchor_months=["January", "July", "December"],
            active_months=[],
            altar_days=["Saturday", "Tuesday"],
            day_intentions={"Saturday": "Personal fast", "Tuesday": "Family intercession"},
        )
