#!/bin/bash
# AI Image Generator — クイックランナー
#
# 使い方:
#   ./run.sh login chatgpt       # 初回ログイン
#   ./run.sh login gemini        # 初回ログイン
#   ./run.sh chatgpt "プロンプト" # ChatGPTで画像生成
#   ./run.sh gemini "プロンプト"  # Geminiで画像生成
#   ./run.sh batch prompts.json  # バッチ処理

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "${1:-help}" in
  login)
    python3 "$SCRIPT_DIR/generate.py" --login "${2:?プロバイダーを指定: chatgpt / gemini}"
    ;;
  chatgpt)
    python3 "$SCRIPT_DIR/generate.py" --provider chatgpt --prompt "${2:?プロンプトを指定してください}"
    ;;
  gemini)
    python3 "$SCRIPT_DIR/generate.py" --provider gemini --prompt "${2:?プロンプトを指定してください}"
    ;;
  batch)
    python3 "$SCRIPT_DIR/generate.py" --batch "${2:?JSONファイルを指定してください}"
    ;;
  help|*)
    echo "AI Image Generator"
    echo ""
    echo "使い方:"
    echo "  ./run.sh login chatgpt          初回ログイン (ChatGPT)"
    echo "  ./run.sh login gemini           初回ログイン (Gemini)"
    echo "  ./run.sh chatgpt \"プロンプト\"    ChatGPTで画像生成"
    echo "  ./run.sh gemini \"プロンプト\"     Geminiで画像生成"
    echo "  ./run.sh batch prompts.json     バッチ処理"
    ;;
esac
