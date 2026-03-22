"""
ニュース速報分析シリーズ - Shorts用PPTX v2
デザイン方針: 1スライド1メッセージ、余白多め、ドンと大きく
コンテンツ方針: 権威性（出典・調査規模）を随所に入れる
"""

from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import os

# ── サイズ ──
SLIDE_W = Emu(4114800)   # 4.5 in
SLIDE_H = Emu(7315200)   # 8.0 in

# ── カラー ──
BG        = RGBColor(0x12, 0x10, 0x0E)   # ほぼ黒（前より暗く深みを出す）
SURFACE   = RGBColor(0x1E, 0x1A, 0x17)   # カード面
GOLD      = RGBColor(0xC9, 0xA0, 0x2D)   # ゴールド（少し明るく）
WHITE     = RGBColor(0xF5, 0xF0, 0xEB)   # オフホワイト（純白より目に優しい）
MID       = RGBColor(0x78, 0x71, 0x6C)   # ミッドグレー
DIM       = RGBColor(0x4A, 0x45, 0x40)   # 暗いグレー
RED       = RGBColor(0xE8, 0x4D, 0x3D)   # レッド
CYAN      = RGBColor(0x4D, 0xD0, 0xE1)   # シアン
GREEN     = RGBColor(0x6B, 0xD4, 0x7B)   # グリーン
AMBER     = RGBColor(0xFF, 0xB3, 0x00)   # アンバー
PURPLE    = RGBColor(0xBB, 0x86, 0xFC)   # パープル

FONT = "Hiragino Sans"

# ── レイアウト定数 ──
MX    = Emu(320040)          # 左右マージン（広めに）
CW    = SLIDE_W - MX * 2    # コンテンツ幅
ACCENT_W = Emu(36576)        # 左アクセントバー幅

OUTPUT_DIR = "content/youtube/shorts"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ヘルパー
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _slide(prs, bg_color=None):
    """ブランクスライドを生成（余計な装飾なし）"""
    layout = prs.slide_layouts[6]
    s = prs.slides.add_slide(layout)
    fill = s.background.fill
    fill.solid()
    fill.fore_color.rgb = bg_color or BG
    return s


def _accent_bar(slide, y, h, color=GOLD, full_width=False):
    """左サイドのアクセントバー or フルウィドスの帯"""
    if full_width:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Emu(y), SLIDE_W, Emu(h))
    else:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Emu(y), ACCENT_W, Emu(h))
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    return bar


def _text(slide, lines, y, size, color=WHITE, bold=True,
          align=PP_ALIGN.LEFT, line_spacing=1.3, x=None, w=None):
    """テキストブロック。高さは自動。"""
    tx = x or MX
    tw = w or CW
    # 高さを行数×フォントサイズ×行間で概算
    estimated_h = int(len(lines) * size * 914.4 * line_spacing * 1.4)
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, tx, Emu(y), tw, Emu(estimated_h))
    box.fill.background()
    box.line.fill.background()
    tf = box.text_frame
    tf.word_wrap = True

    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align

        # 行間
        pPr = p._pPr
        if pPr is None:
            pPr = p._p.get_or_add_pPr()
        lnSpc = pPr.makeelement(qn('a:lnSpc'), {})
        spcPct = lnSpc.makeelement(qn('a:spcPct'), {'val': str(int(line_spacing * 100000))})
        lnSpc.append(spcPct)
        pPr.append(lnSpc)

        # テキストがタプル(text, color)のケースに対応
        if isinstance(line, tuple):
            txt, c = line
        else:
            txt, c = line, color

        run = p.add_run()
        run.text = txt
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = c

    return box


def _source_tag(slide, text, y):
    """ソースタグ（左下あたりに控えめに）"""
    _text(slide, [text], y, 8, DIM, bold=False)


def _brand(slide, y=6720000):
    """ブランド名"""
    _text(slide, ["HARMONIC insight"], y, 9, GOLD, bold=False)


def _card(slide, y, h, color=SURFACE):
    """カード型の背景パネル"""
    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, MX, Emu(y), CW, Emu(h)
    )
    card.fill.solid()
    card.fill.fore_color.rgb = color
    card.line.fill.background()
    card.adjustments[0] = 0.04
    return card


def _badge(slide, text, y, color=RED, x=None):
    """角丸バッジ"""
    bx = x or MX
    badge = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, bx, Emu(y), Emu(1645920), Emu(274320)
    )
    badge.fill.solid()
    badge.fill.fore_color.rgb = color
    badge.line.fill.background()
    badge.adjustments[0] = 0.35
    tf = badge.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = FONT
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = WHITE
    return badge


def _number_hero(slide, num, unit, y, color=GOLD, num_size=60, unit_size=24):
    """巨大数字ドン"""
    box = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, MX, Emu(y), CW, Emu(int(num_size * 914.4 * 1.5))
    )
    box.fill.background()
    box.line.fill.background()
    tf = box.text_frame
    tf.word_wrap = False
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


def _thin_line(slide, y, color=GOLD):
    """細い区切り線"""
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, MX, Emu(y), Emu(914400), Emu(13716)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = color
    line.line.fill.background()


def _stat_row(slide, value, label, y, val_color=GOLD):
    """データ行: 大きい数字 + ラベル"""
    _text(slide, [value], y, 32, val_color, bold=True)
    _text(slide, [label], y + 420000, 13, MID, bold=False)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 1: 生産性じゃなく自由
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_01():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 457200)
    _text(s, [
        "8万人に聞いた。",
    ], 1143000, 30, WHITE)
    _text(s, [
        "AIに求めるもの、",
        "生産性じゃ",
        "なかった。",
    ], 1828800, 30, GOLD)
    _thin_line(s, 3886200)
    _text(s, [
        "世界159か国・70言語、",
        "AI分野で史上最大の調査",
    ], 4114800, 12, MID, bold=False)
    _brand(s)

    # ── S2: 権威性＋データ ──
    s2 = _slide(prs)
    _accent_bar(s2, 457200, 6400000, GOLD)
    _text(s2, [
        "Anthropicの",
        "研究レポートが",
        "公開した数字",
    ], 640080, 22, MID, bold=False)
    _number_hero(s2, "81,000", "人", 1600200)
    _text(s2, [
        "「魔法の杖があったら",
        "  AIに何をさせたい？」",
    ], 2743200, 20, WHITE)
    _thin_line(s2, 3657600)
    _text(s2, [
        "回答は9つのビジョンに分類された",
    ], 3886200, 13, MID, bold=False)
    _source_tag(s2, "出典: Anthropic \"What 81,000 people want from AI\"", 6400000)
    _brand(s2)

    # ── S3: データ（シンプルに） ──
    s3 = _slide(prs)
    _text(s3, [
        "レポートが示した",
        "回答トップ4",
    ], 548640, 20, MID, bold=False)
    _thin_line(s3, 1143000)

    _stat_row(s3, "19%", "職業的卓越性", 1371600, CYAN)
    _stat_row(s3, "14%", "個人的変容・成長", 2286000, AMBER)
    _stat_row(s3, "14%", "認知的負担の軽減", 3200400, GREEN)
    _stat_row(s3, "11%", "家族と過ごす時間", 4114800, PURPLE)

    _text(s3, [
        "「生産性」と答えたのに、",
        "中身は全部「自由」だった",
    ], 5257800, 14, GOLD, bold=True)
    _brand(s3)

    # ── S4: エピソード（権威性＋共感） ──
    s4 = _slide(prs)
    _accent_bar(s4, 1143000, 2743200, GOLD)
    _text(s4, [
        "レポートに登場する",
        "メキシコのエンジニア",
    ], 1143000, 14, MID, bold=False)
    _text(s4, [
        "「AIのおかげで",
        "  定時に帰れる。",
    ], 1828800, 24, WHITE)
    _text(s4, [
        "  子どもの迎えに",
        "  行けるように",
        "  なった」",
    ], 2743200, 24, GOLD)
    _thin_line(s4, 4343400)
    _text(s4, [
        "世界中で同じ声が上がっている。",
        "AIの価値は「速さ」ではなく",
        "「人生の時間を取り戻すこと」",
    ], 4571040, 13, MID, bold=False)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "生産性は",
        "手段。",
    ], 1828800, 32, WHITE)
    _text(s5, [
        "目的は、",
        "人生を",
        "取り戻すこと。",
    ], 3200400, 32, GOLD)
    _source_tag(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日", 6172200)
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_01_anthropic_freedom.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 2: 自律性ギャップ 47% vs 14%
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_02():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 457200)
    _text(s, [
        "AIの恩恵、",
    ], 1371600, 28, WHITE)
    _text(s, [
        "会社員と",
        "フリーランスで",
        "3倍違う。",
    ], 2057400, 30, RED)
    _thin_line(s, 3886200)
    _text(s, [
        "159か国 81,000人の調査が示した",
        "「自律性」という決定的な差",
    ], 4114800, 12, MID, bold=False)
    _brand(s)

    # ── S2: データ（VS をシンプルに） ──
    s2 = _slide(prs)
    _text(s2, [
        "レポートの衝撃的なデータ",
    ], 548640, 14, MID, bold=False)
    _text(s2, [
        "AIで経済的恩恵を",
        "感じている人の割合",
    ], 914400, 20, WHITE)
    _thin_line(s2, 1600200)

    # フリーランス
    _number_hero(s2, "47", "%", 1828800, GREEN, 56, 28)
    _text(s2, ["独立事業者・フリーランス"], 2743200, 13, MID, bold=False)

    # 会社員
    _number_hero(s2, "14", "%", 3200400, RED, 56, 28)
    _text(s2, ["企業の従業員"], 4114800, 13, MID, bold=False)

    _text(s2, [
        "3.4倍の差",
    ], 4571040, 22, GOLD, bold=True, align=PP_ALIGN.LEFT)

    _source_tag(s2, "出典: Anthropic \"What 81,000 people want from AI\"", 6400000)
    _brand(s2)

    # ── S3: 副業データ ──
    s3 = _slide(prs)
    _accent_bar(s3, 1143000, 3200400, GOLD)
    _text(s3, [
        "レポートはさらに",
        "面白い数字を出した",
    ], 1143000, 16, MID, bold=False)
    _text(s3, [
        "副業を持つ",
        "会社員",
    ], 1828800, 26, WHITE)
    _number_hero(s3, "58", "%", 2743200, AMBER, 60, 28)
    _thin_line(s3, 3886200)
    _text(s3, [
        "同じ会社員でも、",
        "「自分の裁量」があるだけで",
        "恩恵が4倍に跳ね上がる",
    ], 4114800, 14, WHITE, bold=True)
    _brand(s3)

    # ── S4: 日本への示唆 ──
    s4 = _slide(prs)
    _text(s4, [
        "日本企業の",
    ], 1143000, 22, WHITE)
    _text(s4, [
        "DXが",
        "進まない理由、",
    ], 1828800, 28, WHITE)
    _text(s4, [
        "ここにある。",
    ], 2971800, 28, RED)
    _thin_line(s4, 3657600)
    _text(s4, [
        "ツールの問題じゃない。",
        "「承認プロセス」の問題。",
        "「まず上に確認します」の間に、",
        "フリーランスはAIで終わらせている。",
    ], 3886200, 13, MID, bold=False, line_spacing=1.6)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "AIの恩恵は",
        "能力で",
        "決まらない。",
    ], 1600200, 30, WHITE)
    _text(s5, [
        "自律性で",
        "決まる。",
    ], 3429000, 32, GOLD)
    _source_tag(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日", 6172200)
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_02_anthropic_autonomy.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PPTX 3: 光と影
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_short_03():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # ── S1: フック ──
    s = _slide(prs)
    _badge(s, "3月18日 Anthropic発表", 457200)
    _text(s, [
        "AIを",
        "一番使っている",
        "人が、",
    ], 1143000, 28, WHITE)
    _text(s, [
        "一番",
        "AIを恐れている。",
    ], 2743200, 30, RED)
    _thin_line(s, 3886200)
    _text(s, [
        "81,000人のインタビューが",
        "明らかにした「光と影」",
    ], 4114800, 12, MID, bold=False)
    _brand(s)

    # ── S2: データ ──
    s2 = _slide(prs)
    _text(s2, [
        "レポートが示した",
        "矛盾するデータ",
    ], 548640, 16, MID, bold=False)
    _thin_line(s2, 1143000)
    _text(s2, [
        "AIに感情的に",
        "助けられた人ほど",
    ], 1371600, 22, WHITE)
    _text(s2, [
        "AI依存を恐れる率",
    ], 2286000, 16, MID, bold=False)
    _number_hero(s2, "3", "倍", 2743200, RED, 64, 28)
    _thin_line(s2, 3886200)
    _text(s2, [
        "教師が学生の思考力低下を",
        "目撃する頻度",
    ], 4114800, 14, MID, bold=False)
    _number_hero(s2, "2.5", "倍", 4800600, AMBER, 48, 24)
    _source_tag(s2, "出典: Anthropic \"What 81,000 people want from AI\"", 6400000)
    _brand(s2)

    # ── S3: 引用（権威性） ──
    s3 = _slide(prs)
    _accent_bar(s3, 914400, 3657600, GOLD)
    _text(s3, [
        "レポートに登場する",
        "イスラエルの弁護士",
    ], 914400, 14, MID, bold=False)
    _text(s3, [
        "「AIで",
        "  契約書レビューの",
        "  時間を節約",
        "  している。",
    ], 1600200, 22, WHITE, line_spacing=1.4)
    _text(s3, [
        "  でも同時に",
        "  恐れている。",
        "  自分で読む力を",
        "  失っているの",
        "  ではないか」",
    ], 3200400, 22, AMBER, line_spacing=1.4)
    _text(s3, [
        "── 実名で語られた、リアルな声",
    ], 5486400, 11, DIM, bold=False)
    _brand(s3)

    # ── S4: 懸念トップ3 ──
    s4 = _slide(prs)
    _text(s4, [
        "調査が明らかにした",
        "3つの懸念",
    ], 548640, 18, MID, bold=False)
    _thin_line(s4, 1143000)

    _stat_row(s4, "27%", "AIの信頼性（ハルシネーション）", 1371600, RED)
    _stat_row(s4, "22%", "雇用と経済への影響", 2286000, AMBER)
    _stat_row(s4, "22%", "人間の自律性の喪失", 3200400, PURPLE)

    _thin_line(s4, 4343400)
    _text(s4, [
        "レポートの指摘：",
        "恩恵は「実体験」として語られ、",
        "懸念は「まだ来ていない未来」として",
        "語られた。この非対称性が重要。",
    ], 4571040, 12, MID, bold=False, line_spacing=1.5)
    _brand(s4)

    # ── S5: 結論 ──
    s5 = _slide(prs)
    _text(s5, [
        "光と影は、",
        "同じ人の",
        "中にある。",
    ], 1600200, 30, WHITE)
    _text(s5, [
        "だからAIは",
        "設計して使う。",
    ], 3429000, 30, GOLD)
    _source_tag(s5, "Anthropic \"81,000 Interviews\" 2026年3月18日", 6172200)
    _brand(s5)

    path = os.path.join(OUTPUT_DIR, "SHORT_NEWS_03_anthropic_light_shade.pptx")
    prs.save(path)
    print(f"Created: {path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    create_short_01()
    create_short_02()
    create_short_03()
    print("\nAll 3 PPTX created.")
