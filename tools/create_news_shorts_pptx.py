"""
ニュース速報分析シリーズ - Shorts用PPTX v3 (Ivory + Gold)

デザイン方針:
- Ivory背景 (#FAF8F5) + Gold (#B8942F) アクセント
- ダークブラウン (#1C1917) テキスト
- 1スライド1メッセージ、余白たっぷり
- 左アクセントバーで視線誘導
- データは大きくドンと表示

コンテンツ方針:
- 「レポートによると」「調査が示した」で権威性を付与
- 「世界159か国」「81,000人」で規模感を強調
- 出典を毎回明示
"""

from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import os

# ━━━ サイズ ━━━
SW = Emu(4114800)   # 4.5 in
SH = Emu(7315200)   # 8.0 in

# ━━━ カラー（Ivory + Gold ブランド） ━━━
IVORY     = RGBColor(0xFA, 0xF8, 0xF5)   # メイン背景
WARM_WH   = RGBColor(0xFF, 0xFF, 0xFF)   # カード白
GOLD      = RGBColor(0xB8, 0x94, 0x2F)   # ブランドゴールド
GOLD_LITE = RGBColor(0xD4, 0xBB, 0x72)   # ゴールド薄
DARK      = RGBColor(0x1C, 0x19, 0x17)   # テキスト（ほぼ黒）
BROWN     = RGBColor(0x5D, 0x4E, 0x3F)   # サブテキスト
MID       = RGBColor(0x7A, 0x66, 0x52)   # 補助テキスト
LIGHT_BRN = RGBColor(0xBF, 0xAD, 0x9C)   # 薄い装飾
PALE      = RGBColor(0xED, 0xE6, 0xDF)   # カード背景
RED       = RGBColor(0xB5, 0x45, 0x3A)   # 警告・強調（落ち着いた赤）
NAVY      = RGBColor(0x1B, 0x3A, 0x5C)   # データ色・知的
TEAL      = RGBColor(0x2A, 0x7A, 0x6E)   # データ色・グリーン系
AMBER     = RGBColor(0xC1, 0x78, 0x17)   # データ色・オレンジ系

FONT = "Hiragino Sans"

# ━━━ レイアウト ━━━
MX = Emu(365760)             # 左右マージン（広め）
CW = SW - MX * 2             # コンテンツ幅
BAR_W = Emu(32000)           # 左アクセントバー幅


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ヘルパー
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _slide(prs, bg=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fill = s.background.fill
    fill.solid()
    fill.fore_color.rgb = bg or IVORY
    return s


def _bar(slide, y, h, color=GOLD):
    """左サイドのアクセントバー"""
    b = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Emu(y), BAR_W, Emu(h))
    b.fill.solid()
    b.fill.fore_color.rgb = color
    b.line.fill.background()


def _full_band(slide, y, h, color=GOLD):
    """フルウィドスの帯"""
    b = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Emu(y), SW, Emu(h))
    b.fill.solid()
    b.fill.fore_color.rgb = color
    b.line.fill.background()


def _text(slide, lines, y, size, color=DARK, bold=True,
          align=PP_ALIGN.LEFT, spacing=1.3, x=None, w=None):
    """テキストブロック"""
    tx = x if x is not None else MX
    tw = w or CW
    est_h = int(len(lines) * size * 914.4 * spacing * 1.5)
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, tx, Emu(y), tw, Emu(est_h))
    box.fill.background()
    box.line.fill.background()
    tf = box.text_frame
    tf.word_wrap = True

    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align

        # 行間設定
        pPr = p._p.get_or_add_pPr()
        lnSpc = pPr.makeelement(qn('a:lnSpc'), {})
        spcPct = lnSpc.makeelement(qn('a:spcPct'), {'val': str(int(spacing * 100000))})
        lnSpc.append(spcPct)
        pPr.append(lnSpc)

        txt, c = (line, color) if isinstance(line, str) else line
        run = p.add_run()
        run.text = txt
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = c

    return box


def _badge(slide, text, y, color=RED):
    """角丸バッジ"""
    badge = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, MX, Emu(y), Emu(1737360), Emu(274320)
    )
    badge.fill.solid()
    badge.fill.fore_color.rgb = color
    badge.line.fill.background()
    badge.adjustments[0] = 0.35
    tf = badge.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = FONT
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = WARM_WH


def _hero_num(slide, num, unit, y, color=GOLD, num_size=58, unit_size=24):
    """巨大数字"""
    h = int(num_size * 914.4 * 1.6)
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, MX, Emu(y), CW, Emu(h))
    box.fill.background()
    box.line.fill.background()
    tf = box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT

    r1 = p.add_run()
    r1.text = str(num)
    r1.font.name = FONT
    r1.font.size = Pt(num_size)
    r1.font.bold = True
    r1.font.color.rgb = color

    r2 = p.add_run()
    r2.text = " " + unit
    r2.font.name = FONT
    r2.font.size = Pt(unit_size)
    r2.font.bold = True
    r2.font.color.rgb = color


def _line(slide, y, w=914400, color=GOLD):
    """区切り線（短め）"""
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, MX, Emu(y), Emu(w), Emu(13716))
    ln.fill.solid()
    ln.fill.fore_color.rgb = color
    ln.line.fill.background()


def _source(slide, text, y=6400000):
    _text(slide, [text], y, 7, LIGHT_BRN, bold=False)


def _brand(slide, y=6720000):
    _text(slide, ["HARMONIC insight"], y, 9, GOLD, bold=False)


def _stat(slide, value, label, y, color=GOLD):
    """データ行：大きい数字＋ラベル"""
    _text(slide, [value], y, 32, color, bold=True)
    _text(slide, [label], y + 430000, 12, MID, bold=False)


def _card(slide, y, h):
    """白カードパネル"""
    c = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, MX, Emu(y), CW, Emu(h)
    )
    c.fill.solid()
    c.fill.fore_color.rgb = WARM_WH
    c.line.fill.background()
    c.adjustments[0] = 0.03
    # ドロップシャドウ（xml直接操作）
    spPr = c._element.spPr
    effectLst = spPr.makeelement(qn('a:effectLst'), {})
    outerShdw = effectLst.makeelement(qn('a:outerShdw'), {
        'blurRad': '76200', 'dist': '25400', 'dir': '5400000',
        'rotWithShape': '0'
    })
    srgbClr = outerShdw.makeelement(qn('a:srgbClr'), {'val': '1C1917'})
    alpha = srgbClr.makeelement(qn('a:alpha'), {'val': '12000'})
    srgbClr.append(alpha)
    outerShdw.append(srgbClr)
    effectLst.append(outerShdw)
    spPr.append(effectLst)
    return c


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 1: 8万人に聞いた。生産性じゃなく自由
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_01():
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 548640)
    _text(s, [
        "8万人に聞いた。",
    ], 1371600, 28, DARK)
    _text(s, [
        "AIに求めるもの、",
        "生産性じゃ",
        "なかった。",
    ], 2057400, 30, GOLD)
    _line(s, 4114800)
    _text(s, [
        "世界159か国・70言語。",
        "AI分野で史上最大の調査レポート",
    ], 4343400, 11, MID, bold=False)
    _brand(s)

    # ── S2: 権威性＋数字 ──
    s2 = _slide(prs)
    _bar(s2, 457200, 5943600)
    _text(s2, [
        "Anthropic社が発表した",
        "研究レポートの数字",
    ], 640080, 14, MID, bold=False)
    _hero_num(s2, "81,000", "人", 1371600)
    _text(s2, [
        "「魔法の杖があったら",
        "  AIに何をさせたい？」",
    ], 2514600, 20, DARK)
    _text(s2, [
        "この問いへの回答が",
        "9つのビジョンに分類された",
    ], 3429000, 13, MID, bold=False)
    _source(s2, "出典: Anthropic \"What 81,000 people want from AI\" 2026.3.18")
    _brand(s2)

    # ── S3: データ ──
    s3 = _slide(prs)
    _text(s3, [
        "レポートが示した",
        "回答トップ4",
    ], 548640, 18, BROWN, bold=False)
    _line(s3, 1143000)

    _stat(s3, "19%", "職業的卓越性", 1371600, NAVY)
    _stat(s3, "14%", "個人的変容・成長", 2286000, AMBER)
    _stat(s3, "14%", "認知的負担の軽減", 3200400, TEAL)
    _stat(s3, "11%", "家族と過ごす時間", 4114800, GOLD)

    _text(s3, [
        "「生産性」と答えたのに、",
        "中身は全部「自由」だった",
    ], 5257800, 14, GOLD, bold=True)
    _brand(s3)

    # ── S4: エピソード ──
    s4 = _slide(prs)
    _bar(s4, 914400, 3657600)
    _text(s4, [
        "レポートに登場する",
        "メキシコのエンジニアの声",
    ], 914400, 13, MID, bold=False)
    _text(s4, [
        "「AIのおかげで",
        "  定時に帰れる。",
    ], 1600200, 22, DARK)
    _text(s4, [
        "  子どもの迎えに",
        "  行けるように",
        "  なった」",
    ], 2514600, 22, GOLD)
    _line(s4, 4343400)
    _text(s4, [
        "世界中で同じ声が上がっている。",
        "AIの価値は「速さ」ではなく",
        "「人生の時間を取り戻すこと」",
    ], 4571040, 12, MID, bold=False, spacing=1.5)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "生産性は",
        "手段。",
    ], 1828800, 32, DARK)
    _text(s5, [
        "目的は、",
        "人生を",
        "取り戻すこと。",
    ], 3200400, 32, GOLD)
    _source(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日")
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_01_anthropic_freedom.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 2: 自律性ギャップ 47% vs 14%
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_02():
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 548640)
    _text(s, [
        "AIの恩恵、",
    ], 1371600, 26, DARK)
    _text(s, [
        "会社員と",
        "フリーランスで",
        "3倍違う。",
    ], 2057400, 30, RED)
    _line(s, 4114800)
    _text(s, [
        "159か国 81,000人の調査が示した",
        "「自律性」という決定的な差",
    ], 4343400, 11, MID, bold=False)
    _brand(s)

    # ── S2: データ ──
    s2 = _slide(prs)
    _text(s2, [
        "レポートの衝撃的なデータ",
    ], 457200, 14, MID, bold=False)
    _text(s2, [
        "AIで経済的恩恵を",
        "感じている人の割合",
    ], 822960, 18, DARK)
    _line(s2, 1371600)

    _card(s2, 1600200, 1143000)
    _hero_num(s2, "47", "%", 1737360, TEAL, 54, 26)
    _text(s2, ["独立事業者・フリーランス"], 2286000, 12, MID, bold=False)

    _card(s2, 2971800, 1143000)
    _hero_num(s2, "14", "%", 3109000, RED, 54, 26)
    _text(s2, ["企業の従業員"], 3657600, 12, MID, bold=False)

    _text(s2, ["3.4倍の差"], 4343400, 22, GOLD, bold=True)
    _source(s2, "出典: Anthropic \"What 81,000 people want from AI\"")
    _brand(s2)

    # ── S3: 副業データ ──
    s3 = _slide(prs)
    _bar(s3, 914400, 3886200)
    _text(s3, [
        "レポートはさらに",
        "面白い数字を出している",
    ], 1143000, 14, MID, bold=False)
    _text(s3, [
        "副業を持つ",
        "会社員",
    ], 1828800, 26, DARK)
    _hero_num(s3, "58", "%", 2743200, AMBER, 58, 28)
    _line(s3, 3886200)
    _text(s3, [
        "同じ会社員でも、",
        "「自分の裁量」があるだけで",
        "恩恵が4倍に跳ね上がる",
    ], 4114800, 14, DARK, bold=True, spacing=1.5)
    _brand(s3)

    # ── S4: 日本企業への示唆 ──
    s4 = _slide(prs)
    _text(s4, [
        "日本企業の",
    ], 1143000, 22, DARK)
    _text(s4, [
        "DXが",
        "進まない理由、",
    ], 1828800, 28, DARK)
    _text(s4, [
        "ここにある。",
    ], 2971800, 28, RED)
    _line(s4, 3657600)
    _text(s4, [
        "ツールの問題じゃない。",
        "「承認プロセス」の問題。",
        "「まず上に確認します」の間に、",
        "フリーランスはAIで終わらせている。",
    ], 3886200, 12, MID, bold=False, spacing=1.6)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "AIの恩恵は",
        "能力で",
        "決まらない。",
    ], 1600200, 30, DARK)
    _text(s5, [
        "自律性で",
        "決まる。",
    ], 3429000, 32, GOLD)
    _source(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日")
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_02_anthropic_autonomy.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 3: 光と影
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_03():
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 548640)
    _text(s, [
        "AIを",
        "一番使っている",
        "人が、",
    ], 1371600, 26, DARK)
    _text(s, [
        "一番",
        "AIを恐れている。",
    ], 2971800, 30, RED)
    _line(s, 4114800)
    _text(s, [
        "81,000人のインタビューが",
        "明らかにした「光と影」",
    ], 4343400, 11, MID, bold=False)
    _brand(s)

    # ── S2: データ ──
    s2 = _slide(prs)
    _text(s2, [
        "レポートが示した",
        "矛盾するデータ",
    ], 457200, 14, MID, bold=False)
    _line(s2, 1005840)
    _text(s2, [
        "AIに感情的に",
        "助けられた人ほど",
    ], 1143000, 20, DARK)
    _text(s2, ["AI依存を恐れる率"], 1828800, 14, MID, bold=False)
    _hero_num(s2, "3", "倍", 2286000, RED, 64, 28)
    _line(s2, 3429000)
    _text(s2, [
        "教師が学生の思考力低下を",
        "目撃する頻度",
    ], 3657600, 13, MID, bold=False)
    _hero_num(s2, "2.5", "倍", 4343400, AMBER, 48, 24)
    _source(s2, "出典: Anthropic \"What 81,000 people want from AI\"")
    _brand(s2)

    # ── S3: 引用 ──
    s3 = _slide(prs)
    _bar(s3, 914400, 3886200)
    _text(s3, [
        "レポートに登場する",
        "イスラエルの弁護士の声",
    ], 914400, 13, MID, bold=False)
    _text(s3, [
        "「AIで",
        "  契約書レビューの",
        "  時間を節約",
        "  している。",
    ], 1600200, 22, DARK, spacing=1.4)
    _text(s3, [
        "  でも同時に",
        "  恐れている。",
        "  自分で読む力を",
        "  失っているの",
        "  ではないか」",
    ], 3200400, 22, AMBER, spacing=1.4)
    _text(s3, [
        "── 実名で語られたリアルな声",
    ], 5486400, 10, LIGHT_BRN, bold=False)
    _brand(s3)

    # ── S4: 懸念トップ3 ──
    s4 = _slide(prs)
    _text(s4, [
        "調査が明らかにした",
        "3つの懸念",
    ], 457200, 18, BROWN, bold=False)
    _line(s4, 1143000)

    _stat(s4, "27%", "AIの信頼性（ハルシネーション）", 1371600, RED)
    _stat(s4, "22%", "雇用と経済への影響", 2286000, AMBER)
    _stat(s4, "22%", "人間の自律性の喪失", 3200400, NAVY)

    _line(s4, 4343400)
    _text(s4, [
        "レポートの指摘：",
        "恩恵は「実体験」として語られ、",
        "懸念は「まだ来ていない未来」として",
        "語られた。この非対称性が重要。",
    ], 4571040, 11, MID, bold=False, spacing=1.5)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "光と影は、",
        "同じ人の",
        "中にある。",
    ], 1600200, 30, DARK)
    _text(s5, [
        "だからAIは",
        "設計して使う。",
    ], 3429000, 30, GOLD)
    _source(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日")
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_03_anthropic_light_shade.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT_DIR = "content/youtube/shorts"

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    create_short_01()
    create_short_02()
    create_short_03()
    print("\nAll 3 PPTX created (Ivory + Gold).")
