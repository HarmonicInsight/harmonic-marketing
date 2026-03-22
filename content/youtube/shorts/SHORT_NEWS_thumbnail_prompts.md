# ニュース速報分析シリーズ - サムネイル画像プロンプト

各PPTXの1枚目（サムネイル/カバースライド）に挿入するキャッチー画像の生成プロンプト。
DALL-E / Midjourney / Ideogram 等で生成し、PPTXの背景に配置する想定。

---

## SHORT_NEWS_01: 81,000人 × 生産性じゃなく自由

### 画像プロンプト (DALL-E)
```
A dramatic minimalist illustration showing 81,000 small human silhouettes arranged in a globe pattern, with golden light rays breaking through from behind. Dark navy background. The silhouettes gradually transform from gray office workers at the bottom to colorful free-spirited figures at the top. Modern, clean, editorial style. No text. 9:16 aspect ratio.
```

### 画像プロンプト (Midjourney)
```
editorial illustration, massive crowd of 81000 tiny human figures forming a sphere shape, dark navy background, golden light rays breaking through, bottom figures are gray monotone office workers, top figures transform into colorful vibrant people with raised arms, minimalist modern style, cinematic lighting --ar 9:16 --v 6
```

### 代替案（よりシンプル）
```
A single person standing at a crossroads, one path labeled with clocks and charts (productivity), the other path opening to a bright golden horizon with family silhouettes. Dark moody background, warm golden light on the horizon side. Minimalist editorial illustration. No text. 9:16 aspect ratio.
```

---

## SHORT_NEWS_02: 47% vs 14% 自律性ギャップ

### 画像プロンプト (DALL-E)
```
Split composition editorial illustration. Left side: a freelancer working freely with AI holographic interface, vibrant warm colors, golden light, energetic pose. Right side: an office worker at a desk behind chain-link barriers and approval stamps, cool blue desaturated tones, constrained. Dark background. Modern minimalist style. No text. 9:16 aspect ratio.
```

### 画像プロンプト (Midjourney)
```
editorial split composition, left side freelancer with glowing AI interface warm golden colors energetic, right side corporate worker behind barriers and red tape cool blue desaturated, dark background, dramatic lighting contrast, minimalist modern illustration --ar 9:16 --v 6
```

### 代替案
```
Two vertical bars side by side on dark background, left bar is tall and glowing green (47%), right bar is short and dim red (14%). Behind the bars, abstract silhouettes of a free-spirited person and a constrained office worker. Minimal, editorial, data visualization style. No text. 9:16 aspect ratio.
```

---

## SHORT_NEWS_03: 光と影（AIを使う人ほど恐れている）

### 画像プロンプト (DALL-E)
```
A dramatic portrait of a person looking at a glowing AI interface. Half of their face is illuminated in warm golden light (hope, benefit), the other half cast in deep blue shadow (fear, concern). The light side shows productivity icons floating, the shadow side shows fading skills dissolving. Dark cinematic background. Editorial illustration style. No text. 9:16 aspect ratio.
```

### 画像プロンプト (Midjourney)
```
dramatic portrait, person facing glowing AI screen, half face illuminated warm golden light representing hope, half face in deep blue shadow representing fear, light side has floating productivity icons, shadow side shows dissolving fading elements, dark cinematic background, editorial illustration style, emotional contrast --ar 9:16 --v 6
```

### 代替案
```
A mirror reflection concept. A person looking into a mirror, their reflection shows both a golden glowing version (AI benefits) and a dark shadowy version (AI fears) overlapping. Moody dark background with dramatic split lighting. Minimalist editorial style. No text. 9:16 aspect ratio.
```

---

## 画像配置ガイド

1. 生成した画像を 4.5 x 8.0 インチ（1080 x 1920 px推奨）で保存
2. PPTXの1枚目スライドの背景として全面配置
3. 画像の上に半透明の黒オーバーレイ（50〜70%）を被せる
4. その上にテキスト要素（日付ラベル、キャッチコピー等）を配置
5. 画像のメイン要素が中央〜下部に来るよう調整（上部に日付ラベルが入るため）

### PowerPointでの操作
- 画像を挿入 → 最背面に配置
- 長方形を画像と同サイズで追加 → 黒で塗りつぶし → 透明度60%に設定
- テキスト要素はその上に配置
