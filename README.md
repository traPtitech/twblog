# twblog

Ghostで記事が公開されたとき、記事タイトルとURLをXへ投稿します。
`https://trap.jp/post/`配下の記事のみを投稿対象とします。

## 環境変数

| 名前 | 内容 |
| --- | --- |
| `WEBHOOK_TOKEN` | Webhook URLに含める秘密トークン |
| `TWITTER_API_KEY` | X API Key |
| `TWITTER_API_SECRET` | X API Key Secret |
| `TWITTER_ACCESS_TOKEN` | X Access Token |
| `TWITTER_ACCESS_TOKEN_SECRET` | X Access Token Secret |
| `PORT` | ポート。省略時は`3000` |

設定するX APIの認証情報には、Read and write権限が必要です。
NeoShowcaseの環境変数へ設定することを想定しています。

## セットアップ

`.tool-versions`に記載されたNode.jsと、`package.json`の`packageManager`に記載されたpnpmを用意します。

```console
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

ダミーのX API認証情報を使って、サーバーが起動することを確認できます。この状態でWebhookを送信するとX APIへの投稿に失敗するため、起動確認だけに使用してください。

```console
WEBHOOK_TOKEN=local-test-token \
TWITTER_API_KEY=dummy \
TWITTER_API_SECRET=dummy \
TWITTER_ACCESS_TOKEN=dummy \
TWITTER_ACCESS_TOKEN_SECRET=dummy \
pnpm build && pnpm start
```

## デプロイ

1. Webhook URLを保護するためのランダムな秘密トークンを生成します。

   ```console
   openssl rand -hex 32
   ```

2. 生成された値をNeoShowcaseの`WEBHOOK_TOKEN`に設定します。Runtime Buildpackを選択し、必要な環境変数を設定してデプロイします。
3. Ghostのカスタムインテグレーションに次を設定します。
   - Event: `Post published`
   - Target URL: `https://<NeoShowcaseのドメイン>/webhook/<WEBHOOK_TOKEN>`

Webhook URLはパス自体を認証情報として扱う必要があります。
