// =============================================================================
// Twitter / X API クライアント
// =============================================================================

import { TwitterApi } from 'twitter-api-v2';
import { readFileSync } from 'node:fs';
import { env } from './env.js';
import type { TwitterPost, PostResult } from './types.js';

let client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (!client) {
    client = new TwitterApi({
      appKey: env.twitter.apiKey,
      appSecret: env.twitter.apiSecret,
      accessToken: env.twitter.accessToken,
      accessSecret: env.twitter.accessTokenSecret,
    });
  }
  return client;
}

/**
 * Twitter/X に投稿する
 *
 * スレッド投稿にも対応。画像添付にも対応。
 */
export async function postToTwitter(post: TwitterPost): Promise<PostResult> {
  try {
    const api = getClient();
    const v2 = api.v2;

    // メディアアップロード（画像がある場合）
    let mediaIds: string[] | undefined;
    if (post.mediaFiles?.length) {
      const v1 = api.v1;
      mediaIds = [];
      for (const filePath of post.mediaFiles) {
        const buffer = readFileSync(filePath);
        const mediaId = await v1.uploadMedia(buffer, {
          mimeType: filePath.endsWith('.png') ? 'image/png' : 'image/jpeg',
        });
        mediaIds.push(mediaId);
      }
    }

    // メイン投稿
    const tweetParams: Parameters<typeof v2.tweet>[0] = {
      text: post.text,
    };
    if (mediaIds?.length) {
      tweetParams.media = { media_ids: mediaIds as [string] };
    }

    const mainTweet = await v2.tweet(tweetParams);
    const tweetId = mainTweet.data.id;
    let lastTweetId = tweetId;

    // スレッド投稿
    if (post.thread?.length) {
      for (const threadText of post.thread) {
        const reply = await v2.reply(threadText, lastTweetId);
        lastTweetId = reply.data.id;
      }
    }

    const username = env.twitter.accessToken.split('-')[0];
    return {
      platform: 'twitter',
      success: true,
      url: `https://x.com/i/status/${tweetId}`,
      postedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      platform: 'twitter',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      postedAt: new Date().toISOString(),
    };
  }
}

/**
 * Twitter API の接続テスト
 */
export async function testTwitterConnection(): Promise<boolean> {
  try {
    const api = getClient();
    const me = await api.v2.me();
    console.log(`  Twitter 接続OK: @${me.data.username}`);
    return true;
  } catch (error) {
    console.error(`  Twitter 接続エラー: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}
