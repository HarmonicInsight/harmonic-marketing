#!/usr/bin/env python3
"""
AI Image Generator — ブラウザ自動化による画像生成ツール

ChatGPT (DALL-E / GPT-4o) および Gemini のブラウザUIを
Playwrightで自動操作し、画像生成プロンプトを投げて結果をダウンロードする。

使い方:
  # ChatGPT で画像生成
  python generate.py --provider chatgpt --prompt "富士山の水彩画"

  # Gemini で画像生成
  python generate.py --provider gemini --prompt "サイバーパンクな東京"

  # JSONファイルからバッチ処理
  python generate.py --batch prompts.json

  # ログイン用セッション準備 (初回のみ)
  python generate.py --login chatgpt
  python generate.py --login gemini
"""

import argparse
import json
import os
import sys
import time
import re
import hashlib
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "output"
USER_DATA_DIR = SCRIPT_DIR / ".browser-data"

CHATGPT_URL = "https://chatgpt.com"
GEMINI_URL = "https://gemini.google.com/app"

# タイムアウト設定 (ms)
NAVIGATION_TIMEOUT = 60_000
IMAGE_WAIT_TIMEOUT = 180_000  # 画像生成は時間がかかる
ELEMENT_TIMEOUT = 30_000


# ---------------------------------------------------------------------------
# Browser helpers
# ---------------------------------------------------------------------------

def get_browser_context(headless: bool = False):
    """永続的なブラウザコンテキストを取得 (ログイン状態を保持)"""
    from playwright.sync_api import sync_playwright

    pw = sync_playwright().start()
    USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    context = pw.chromium.launch_persistent_context(
        user_data_dir=str(USER_DATA_DIR),
        headless=headless,
        viewport={"width": 1280, "height": 900},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        # ダウンロード先
        accept_downloads=True,
        locale="ja-JP",
        timezone_id="Asia/Tokyo",
    )
    context.set_default_timeout(ELEMENT_TIMEOUT)
    return pw, context


def save_image_from_url(page, img_url: str, output_path: Path) -> Path:
    """画像URLから直接ダウンロード"""
    import requests

    if img_url.startswith("data:"):
        # data URI の場合
        import base64
        header, data = img_url.split(",", 1)
        ext = "png" if "png" in header else "jpg"
        output_path = output_path.with_suffix(f".{ext}")
        output_path.write_bytes(base64.b64decode(data))
    elif img_url.startswith("blob:"):
        # blob URL の場合 — ページ内JSで取得
        b64_data = page.evaluate("""
            async (url) => {
                const resp = await fetch(url);
                const blob = await resp.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }
        """, img_url)
        header, data = b64_data.split(",", 1)
        import base64
        ext = "png" if "png" in header else "jpg"
        output_path = output_path.with_suffix(f".{ext}")
        output_path.write_bytes(base64.b64decode(data))
    else:
        # 通常のURLの場合 — ブラウザのcookieを使って取得
        cookies = page.context.cookies()
        cookie_header = "; ".join(f"{c['name']}={c['value']}" for c in cookies)
        resp = requests.get(
            img_url,
            headers={
                "Cookie": cookie_header,
                "User-Agent": page.evaluate("navigator.userAgent"),
            },
            timeout=30,
        )
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        ext = "png" if "png" in content_type else "jpg"
        output_path = output_path.with_suffix(f".{ext}")
        output_path.write_bytes(resp.content)

    return output_path


# ---------------------------------------------------------------------------
# ChatGPT automation
# ---------------------------------------------------------------------------

def generate_chatgpt(page, prompt: str, output_dir: Path) -> list[Path]:
    """ChatGPT で画像を生成してダウンロード"""
    print(f"[ChatGPT] ページを開いています...")
    page.goto(CHATGPT_URL, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT)
    time.sleep(3)

    # ログイン確認
    if "auth" in page.url or "login" in page.url:
        print("[ChatGPT] ❌ ログインが必要です。先に --login chatgpt を実行してください。")
        return []

    print(f"[ChatGPT] プロンプトを入力中...")

    # プロンプト入力欄を見つける
    # ChatGPT は contenteditable な div または textarea を使う
    input_selectors = [
        "#prompt-textarea",
        "div[contenteditable='true']",
        "textarea[data-id='root']",
        "textarea",
    ]

    input_el = None
    for sel in input_selectors:
        try:
            input_el = page.wait_for_selector(sel, timeout=10_000)
            if input_el:
                break
        except Exception:
            continue

    if not input_el:
        print("[ChatGPT] ❌ 入力欄が見つかりません。UIが変更された可能性があります。")
        page.screenshot(path=str(output_dir / "_debug_chatgpt.png"))
        return []

    # 画像生成を明示するプロンプト
    full_prompt = f"以下のプロンプトで画像を1枚生成してください。テキストの返答は不要です。画像だけ生成してください。\n\n{prompt}"

    input_el.click()
    input_el.fill("")
    page.keyboard.type(full_prompt, delay=20)
    time.sleep(0.5)

    # 送信
    send_selectors = [
        'button[data-testid="send-button"]',
        'button[aria-label="Send prompt"]',
        'button[aria-label="プロンプトを送信する"]',
        "form button[type='submit']",
    ]
    sent = False
    for sel in send_selectors:
        try:
            btn = page.query_selector(sel)
            if btn and btn.is_visible():
                btn.click()
                sent = True
                break
        except Exception:
            continue

    if not sent:
        # Enter で送信を試みる
        page.keyboard.press("Enter")

    print(f"[ChatGPT] 画像生成を待機中 (最大 {IMAGE_WAIT_TIMEOUT // 1000}秒)...")

    # 画像が出現するのを待つ
    image_selectors = [
        'img[alt*="Generated"]',
        'img[alt*="generated"]',
        'div[data-testid="image-container"] img',
        'img[src*="oaidalleapiprodscus"]',
        'img[src*="dall-e"]',
        # 新しいUIのセレクタ
        'div.markdown img',
        'div[class*="image"] img',
        'article img[src]:not([src*="avatar"])',
    ]

    downloaded = []
    start_time = time.time()
    found_images = False

    while time.time() - start_time < IMAGE_WAIT_TIMEOUT / 1000:
        for sel in image_selectors:
            try:
                imgs = page.query_selector_all(sel)
                for img in imgs:
                    src = img.get_attribute("src")
                    if src and not any(skip in src for skip in ["avatar", "icon", "logo", "svg", "1x1"]):
                        found_images = True
                        break
                if found_images:
                    break
            except Exception:
                continue

        if found_images:
            break

        # 生成中のインジケーターを確認
        time.sleep(3)

    if not found_images:
        print("[ChatGPT] ⚠️  画像が検出できませんでした。スクリーンショットを保存します。")
        page.screenshot(path=str(output_dir / "_debug_chatgpt_timeout.png"))
        return []

    # 少し待って画像が完全にロードされるのを待つ
    time.sleep(3)

    # すべての画像を収集
    for sel in image_selectors:
        try:
            imgs = page.query_selector_all(sel)
            for idx, img in enumerate(imgs):
                src = img.get_attribute("src")
                if not src or any(skip in src for skip in ["avatar", "icon", "logo", "svg", "1x1"]):
                    continue

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"chatgpt_{timestamp}_{idx}"
                out_path = output_dir / filename

                try:
                    saved = save_image_from_url(page, src, out_path)
                    downloaded.append(saved)
                    print(f"[ChatGPT] ✅ 保存完了: {saved}")
                except Exception as e:
                    print(f"[ChatGPT] ⚠️  画像保存エラー: {e}")

                    # フォールバック: 右クリック → 名前を付けて保存
                    try:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        fallback_path = output_dir / f"chatgpt_{timestamp}_{idx}_screenshot.png"
                        img.screenshot(path=str(fallback_path))
                        downloaded.append(fallback_path)
                        print(f"[ChatGPT] ✅ スクリーンショットで保存: {fallback_path}")
                    except Exception as e2:
                        print(f"[ChatGPT] ❌ フォールバックも失敗: {e2}")
        except Exception:
            continue

    return downloaded


# ---------------------------------------------------------------------------
# Gemini automation
# ---------------------------------------------------------------------------

def generate_gemini(page, prompt: str, output_dir: Path) -> list[Path]:
    """Gemini で画像を生成してダウンロード"""
    print(f"[Gemini] ページを開いています...")
    page.goto(GEMINI_URL, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT)
    time.sleep(3)

    # ログイン確認
    if "accounts.google.com" in page.url:
        print("[Gemini] ❌ Googleログインが必要です。先に --login gemini を実行してください。")
        return []

    print(f"[Gemini] プロンプトを入力中...")

    # 入力欄
    input_selectors = [
        'div.ql-editor[contenteditable="true"]',
        'rich-textarea div[contenteditable="true"]',
        'div[contenteditable="true"][aria-label]',
        ".input-area textarea",
        "textarea",
    ]

    input_el = None
    for sel in input_selectors:
        try:
            input_el = page.wait_for_selector(sel, timeout=10_000)
            if input_el:
                break
        except Exception:
            continue

    if not input_el:
        print("[Gemini] ❌ 入力欄が見つかりません。")
        page.screenshot(path=str(output_dir / "_debug_gemini.png"))
        return []

    full_prompt = f"以下のプロンプトで画像を生成してください:\n{prompt}"

    input_el.click()
    time.sleep(0.3)
    page.keyboard.type(full_prompt, delay=20)
    time.sleep(0.5)

    # 送信ボタン
    send_selectors = [
        'button[aria-label="送信"]',
        'button[aria-label="Send message"]',
        'button.send-button',
        'button[mattooltip="送信"]',
        'button[data-test-id="send-button"]',
    ]

    sent = False
    for sel in send_selectors:
        try:
            btn = page.query_selector(sel)
            if btn and btn.is_visible():
                btn.click()
                sent = True
                break
        except Exception:
            continue

    if not sent:
        page.keyboard.press("Enter")

    print(f"[Gemini] 画像生成を待機中 (最大 {IMAGE_WAIT_TIMEOUT // 1000}秒)...")

    # 画像を待つ
    image_selectors = [
        'img.generated-image',
        'img[data-test-id="generated-image"]',
        'div.response-container img',
        'div.model-response img[src]:not([src*="avatar"])',
        'img[src*="googleusercontent"]',
        'div[class*="image-container"] img',
        'message-content img',
    ]

    downloaded = []
    start_time = time.time()
    found_images = False

    while time.time() - start_time < IMAGE_WAIT_TIMEOUT / 1000:
        for sel in image_selectors:
            try:
                imgs = page.query_selector_all(sel)
                for img in imgs:
                    src = img.get_attribute("src")
                    if src and len(src) > 50 and not any(skip in src for skip in ["avatar", "icon", "logo"]):
                        found_images = True
                        break
                if found_images:
                    break
            except Exception:
                continue

        if found_images:
            break
        time.sleep(3)

    if not found_images:
        print("[Gemini] ⚠️  画像が検出できませんでした。スクリーンショットを保存します。")
        page.screenshot(path=str(output_dir / "_debug_gemini_timeout.png"))
        return []

    time.sleep(3)

    for sel in image_selectors:
        try:
            imgs = page.query_selector_all(sel)
            for idx, img in enumerate(imgs):
                src = img.get_attribute("src")
                if not src or any(skip in src for skip in ["avatar", "icon", "logo"]):
                    continue

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"gemini_{timestamp}_{idx}"
                out_path = output_dir / filename

                try:
                    saved = save_image_from_url(page, src, out_path)
                    downloaded.append(saved)
                    print(f"[Gemini] ✅ 保存完了: {saved}")
                except Exception as e:
                    print(f"[Gemini] ⚠️  画像保存エラー: {e}")
                    try:
                        fallback_path = output_dir / f"gemini_{timestamp}_{idx}_screenshot.png"
                        img.screenshot(path=str(fallback_path))
                        downloaded.append(fallback_path)
                        print(f"[Gemini] ✅ スクリーンショットで保存: {fallback_path}")
                    except Exception as e2:
                        print(f"[Gemini] ❌ フォールバックも失敗: {e2}")
        except Exception:
            continue

    return downloaded


# ---------------------------------------------------------------------------
# Login helper
# ---------------------------------------------------------------------------

def login_mode(provider: str):
    """ブラウザを開いて手動ログインさせる"""
    print(f"\n{'='*60}")
    print(f"  ログインモード: {provider.upper()}")
    print(f"{'='*60}")
    print(f"ブラウザが開きます。手動でログインしてください。")
    print(f"ログイン完了後、ターミナルで Enter を押してください。")
    print(f"(ログイン状態は .browser-data/ に保存されます)\n")

    pw, context = get_browser_context(headless=False)
    page = context.new_page()

    url = CHATGPT_URL if provider == "chatgpt" else GEMINI_URL
    page.goto(url, timeout=NAVIGATION_TIMEOUT)

    input(">>> ログイン完了後、Enterを押してください... ")

    print(f"[{provider}] セッションを保存しました。")
    context.close()
    pw.stop()


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------

def run_batch(batch_file: str, output_dir: Path, headless: bool):
    """JSONファイルからバッチ処理"""
    with open(batch_file) as f:
        tasks = json.load(f)

    if isinstance(tasks, dict):
        tasks = tasks.get("prompts", [tasks])

    print(f"\n📋 バッチ処理: {len(tasks)} 件のタスク")

    pw, context = get_browser_context(headless=headless)
    page = context.new_page()
    all_results = []

    for i, task in enumerate(tasks, 1):
        if isinstance(task, str):
            task = {"prompt": task, "provider": "chatgpt"}

        provider = task.get("provider", "chatgpt")
        prompt = task["prompt"]
        print(f"\n--- [{i}/{len(tasks)}] {provider}: {prompt[:50]}... ---")

        if provider == "chatgpt":
            results = generate_chatgpt(page, prompt, output_dir)
        elif provider == "gemini":
            results = generate_gemini(page, prompt, output_dir)
        else:
            print(f"⚠️  不明なプロバイダー: {provider}")
            continue

        all_results.extend(results)

        # レート制限対策
        if i < len(tasks):
            wait = task.get("wait", 10)
            print(f"⏳ {wait}秒待機...")
            time.sleep(wait)

    context.close()
    pw.stop()
    return all_results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="AI Image Generator — ブラウザ自動化による画像生成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--provider", "-p", choices=["chatgpt", "gemini"], default="chatgpt",
                        help="使用するAIサービス (default: chatgpt)")
    parser.add_argument("--prompt", "-t", type=str,
                        help="画像生成プロンプト")
    parser.add_argument("--batch", "-b", type=str,
                        help="バッチ処理用JSONファイル")
    parser.add_argument("--output", "-o", type=str, default=str(DEFAULT_OUTPUT_DIR),
                        help="出力ディレクトリ (default: ./output)")
    parser.add_argument("--login", "-l", type=str, choices=["chatgpt", "gemini"],
                        help="ログインモード (初回セットアップ用)")
    parser.add_argument("--headless", action="store_true",
                        help="ヘッドレスモードで実行 (デバッグ時はOFFにする)")
    parser.add_argument("--debug", action="store_true",
                        help="デバッグモード (スクリーンショットを多めに保存)")

    args = parser.parse_args()

    # ログインモード
    if args.login:
        login_mode(args.login)
        return

    # 出力ディレクトリ作成
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # バッチ処理
    if args.batch:
        results = run_batch(args.batch, output_dir, args.headless)
        print(f"\n{'='*60}")
        print(f"✅ バッチ完了: {len(results)} 枚の画像を保存しました")
        for r in results:
            print(f"   {r}")
        return

    # 単発生成
    if not args.prompt:
        parser.error("--prompt または --batch が必要です")

    pw, context = get_browser_context(headless=args.headless)
    page = context.new_page()

    try:
        if args.provider == "chatgpt":
            results = generate_chatgpt(page, args.prompt, output_dir)
        else:
            results = generate_gemini(page, args.prompt, output_dir)

        print(f"\n{'='*60}")
        if results:
            print(f"✅ 完了: {len(results)} 枚の画像を保存しました")
            for r in results:
                print(f"   {r}")
        else:
            print("❌ 画像の取得に失敗しました。")
            print("   ヒント: --login で再ログインするか、--debug でデバッグしてください。")
    finally:
        context.close()
        pw.stop()


if __name__ == "__main__":
    main()
