#!/usr/bin/env bash
# YouTube動画カタログ管理ツール
# Usage: ./manage.sh <command> [options]

set -euo pipefail

CATALOG="$(cd "$(dirname "$0")/../../content/youtube" && pwd)/catalog.json"
SCRIPTS_DIR="$(cd "$(dirname "$0")/../../content/youtube/scripts" && pwd)"
SHORTS_DIR="$(cd "$(dirname "$0")/../../content/youtube/shorts" && pwd)"

# --- ヘルプ ---
show_help() {
  cat <<'HELP'
YouTube動画カタログ管理ツール

使い方:
  ./manage.sh <command> [options]

コマンド:
  list [--status STATUS] [--series SERIES] [--type TYPE]
      動画一覧を表示
      --status: idea/script_wip/script_done/slide_wip/slide_done/recording/editing/review/ready/published/unlisted/archived
      --series: product/ai-practical/dx-myths/video-production/consulting/tools
      --type:   main/short

  add --title TITLE [--series SERIES] [--product PRODUCT] [--type main|short] [--parent VID-XXX]
      新しい動画をカタログに追加

  status VID-XXX NEW_STATUS
      動画のステータスを変更

  info VID-XXX
      動画の詳細情報を表示

  shorts VID-XXX
      本編に紐づくショート一覧を表示

  stats
      カタログ全体の統計を表示

  note VID-XXX [--status 未|draft|済] [--url URL]
      note.com連携ステータスを更新

  search KEYWORD
      タイトルやメモからキーワード検索

  next-id [--type main|short]
      次に使えるIDを表示

  export [--format md|csv]
      カタログをMarkdownまたはCSVで出力

HELP
}

# --- ユーティリティ ---
next_main_id() {
  local max_id
  max_id=$(jq -r '[.videos[] | select(.type=="main") | .id | ltrimstr("VID-") | tonumber] | max // 0' "$CATALOG")
  printf "VID-%03d" $((max_id + 1))
}

next_short_id() {
  local max_id
  max_id=$(jq -r '[.videos[] | select(.type=="short") | .id | ltrimstr("VID-") | tonumber] | max // 0' "$CATALOG")
  if [ "$max_id" -lt 1000 ]; then
    max_id=1000
  fi
  printf "VID-%04d" $((max_id + 1))
}

# --- list ---
cmd_list() {
  local filter="true"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --status) filter="$filter and .status==\"$2\""; shift 2 ;;
      --series) filter="$filter and .series==\"$2\""; shift 2 ;;
      --type)   filter="$filter and .type==\"$2\""; shift 2 ;;
      *) shift ;;
    esac
  done

  echo ""
  jq -r --arg filter "$filter" '
    .videos | sort_by(.id) | .[] |
    select('"$filter"') |
    [.id, .type, .status,
     (if .type == "short" then "  \u2514\u2500 " + .title else .title end),
     (.series // "-"),
     (.duration // "-"),
     (.note_status // "-")] |
    @tsv
  ' "$CATALOG" | while IFS=$'\t' read -r id type status title series duration note; do
    printf "%-8s %-6s %-12s %-50s %-15s %-8s %s\n" "$id" "$type" "$status" "$title" "$series" "$duration" "$note"
  done

  local count
  count=$(jq '[.videos[] | select('"$filter"')] | length' "$CATALOG")
  echo ""
  echo "合計: ${count}本"
}

# --- add ---
cmd_add() {
  local title="" series="" product="null" vtype="main" parent="null"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title)   title="$2"; shift 2 ;;
      --series)  series="$2"; shift 2 ;;
      --product) product="\"$2\""; shift 2 ;;
      --type)    vtype="$2"; shift 2 ;;
      --parent)  parent="\"$2\""; shift 2 ;;
      *) shift ;;
    esac
  done

  if [ -z "$title" ]; then
    echo "Error: --title は必須です"
    exit 1
  fi

  local new_id
  if [ "$vtype" = "short" ]; then
    new_id=$(next_short_id)
  else
    new_id=$(next_main_id)
  fi

  local slug
  slug=$(echo "$title" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9\-]//g' | cut -c1-40)
  if [ -z "$slug" ]; then
    slug="$new_id"
  fi

  local script_path
  if [ "$vtype" = "short" ]; then
    script_path="shorts/${new_id}_${slug}.md"
  else
    script_path="scripts/${new_id}_${slug}.md"
  fi

  # カタログに追加
  local tmp
  tmp=$(mktemp)
  jq --arg id "$new_id" \
     --arg title "$title" \
     --arg type "$vtype" \
     --arg series "$series" \
     --arg script "$script_path" \
     --argjson product "$product" \
     --argjson parent "$parent" \
  '
    .videos += [{
      id: $id,
      type: $type,
      parent_id: (if $parent != null then $parent else null end),
      title: $title,
      series: (if $series == "" then null else $series end),
      product: $product,
      status: "idea",
      duration: null,
      script: $script,
      slide: null,
      thumbnail: null,
      youtube_url: null,
      publish_date: null,
      note_status: "未",
      note_url: null,
      tags: [],
      performance: { views: null, ctr: null, avg_watch_time: null, likes: null },
      memo: null,
      shorts: []
    }] |
    ._meta.total_videos = ([.videos[] | select(.type=="main")] | length) |
    ._meta.total_shorts = ([.videos[] | select(.type=="short")] | length) |
    ._meta.last_updated = (now | strftime("%Y-%m-%d"))
  ' "$CATALOG" > "$tmp" && mv "$tmp" "$CATALOG"

  # ショートの場合、親動画のshortsに追加
  if [ "$vtype" = "short" ] && [ "$parent" != "null" ]; then
    local parent_val
    parent_val=$(echo "$parent" | tr -d '"')
    tmp=$(mktemp)
    jq --arg id "$new_id" --arg parent "$parent_val" '
      .videos |= map(if .id == $parent then .shorts += [$id] else . end)
    ' "$CATALOG" > "$tmp" && mv "$tmp" "$CATALOG"
  fi

  echo "追加: $new_id - $title ($vtype)"
  echo "スクリプト: $script_path"
}

# --- status ---
cmd_status() {
  local vid_id="$1"
  local new_status="$2"
  local tmp
  tmp=$(mktemp)
  jq --arg id "$vid_id" --arg status "$new_status" '
    .videos |= map(if .id == $id then .status = $status else . end) |
    ._meta.last_updated = (now | strftime("%Y-%m-%d"))
  ' "$CATALOG" > "$tmp" && mv "$tmp" "$CATALOG"
  echo "更新: $vid_id → $new_status"
}

# --- info ---
cmd_info() {
  local vid_id="$1"
  jq --arg id "$vid_id" '.videos[] | select(.id == $id)' "$CATALOG"
}

# --- shorts ---
cmd_shorts() {
  local vid_id="$1"
  echo "本編: $vid_id"
  jq -r --arg id "$vid_id" '
    .videos[] | select(.id == $id) | .title
  ' "$CATALOG"
  echo ""
  echo "ショート一覧:"
  jq -r --arg id "$vid_id" '
    [.videos[] | select(.parent_id == $id)] |
    if length == 0 then "  (なし)"
    else .[] | "  \(.id) [\(.status)] \(.title)"
    end
  ' "$CATALOG"
}

# --- stats ---
cmd_stats() {
  echo "=== YouTube動画カタログ統計 ==="
  echo ""
  jq -r '
    "本編: \([.videos[] | select(.type=="main")] | length)本",
    "ショート: \([.videos[] | select(.type=="short")] | length)本",
    "合計: \(.videos | length)本",
    "",
    "--- ステータス別 ---",
    (
      [.videos[].status] | group_by(.) | map({status: .[0], count: length}) |
      sort_by(-.count) | .[] | "  \(.status): \(.count)本"
    ),
    "",
    "--- シリーズ別 ---",
    (
      [.videos[] | .series // "未分類"] | group_by(.) | map({series: .[0], count: length}) |
      sort_by(-.count) | .[] | "  \(.series): \(.count)本"
    ),
    "",
    "--- note連携 ---",
    "  済: \([.videos[] | select(.note_status=="済")] | length)本",
    "  未: \([.videos[] | select(.note_status=="未")] | length)本"
  ' "$CATALOG"
}

# --- note ---
cmd_note() {
  local vid_id="$1"; shift
  local note_status="" note_url=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --status) note_status="$2"; shift 2 ;;
      --url)    note_url="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  local tmp
  tmp=$(mktemp)
  jq --arg id "$vid_id" --arg ns "$note_status" --arg nu "$note_url" '
    .videos |= map(
      if .id == $id then
        (if $ns != "" then .note_status = $ns else . end) |
        (if $nu != "" then .note_url = $nu else . end)
      else . end
    ) |
    ._meta.last_updated = (now | strftime("%Y-%m-%d"))
  ' "$CATALOG" > "$tmp" && mv "$tmp" "$CATALOG"
  echo "更新: $vid_id note=$note_status ${note_url:+url=$note_url}"
}

# --- search ---
cmd_search() {
  local keyword="$1"
  jq -r --arg kw "$keyword" '
    .videos[] |
    select(
      (.title | test($kw; "i")) or
      ((.memo // "") | test($kw; "i")) or
      (.tags | map(test($kw; "i")) | any)
    ) |
    "\(.id) [\(.type)] [\(.status)] \(.title)"
  ' "$CATALOG"
}

# --- next-id ---
cmd_next_id() {
  local vtype="main"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --type) vtype="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  if [ "$vtype" = "short" ]; then
    next_short_id
  else
    next_main_id
  fi
  echo ""
}

# --- export ---
cmd_export() {
  local fmt="md"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --format) fmt="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  if [ "$fmt" = "csv" ]; then
    echo "ID,Type,Title,Series,Status,Duration,PublishDate,YouTubeURL,NoteStatus"
    jq -r '.videos[] | [.id, .type, .title, (.series // ""), .status, (.duration // ""), (.publish_date // ""), (.youtube_url // ""), .note_status] | @csv' "$CATALOG"
  else
    echo "# YouTube動画カタログ"
    echo ""
    echo "最終更新: $(jq -r '._meta.last_updated' "$CATALOG")"
    echo ""
    echo "## 本編"
    echo ""
    echo "| ID | タイトル | シリーズ | ステータス | 尺 | 公開日 | note |"
    echo "|-----|---------|---------|-----------|-----|--------|------|"
    jq -r '.videos[] | select(.type=="main") | "| \(.id) | \(.title) | \(.series // "-") | \(.status) | \(.duration // "-") | \(.publish_date // "-") | \(.note_status) |"' "$CATALOG"
    echo ""
    echo "## ショート"
    echo ""
    echo "| ID | タイトル | 親動画 | ステータス | 秒数 | note |"
    echo "|-----|---------|--------|-----------|------|------|"
    jq -r '.videos[] | select(.type=="short") | "| \(.id) | \(.title) | \(.parent_id // "-") | \(.status) | \(.duration // "-") | \(.note_status) |"' "$CATALOG"
  fi
}

# --- メインルーティング ---
case "${1:-help}" in
  list)     shift; cmd_list "$@" ;;
  add)      shift; cmd_add "$@" ;;
  status)   shift; cmd_status "$@" ;;
  info)     shift; cmd_info "$@" ;;
  shorts)   shift; cmd_shorts "$@" ;;
  stats)    shift; cmd_stats "$@" ;;
  note)     shift; cmd_note "$@" ;;
  search)   shift; cmd_search "$@" ;;
  next-id)  shift; cmd_next_id "$@" ;;
  export)   shift; cmd_export "$@" ;;
  help|*)   show_help ;;
esac
