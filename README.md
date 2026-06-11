# turbo_fx

Hotwire / Turbo のコンテンツ更新時に **デジタルグリッチエフェクト**（RGB ずれ＋スライス断裂）を差し込む Rails Engine gem です。

Turbo Frame の差し替えや Turbo Stream の `replace` / `update` / `append` / `prepend` を検知し、対象要素に CSS アニメーションを自動適用します。

---

## インストール

```ruby
# Gemfile
gem "turbo_fx"
```

```bash
bundle install
```

---

## セットアップ

### JavaScript

Engine が importmap に `turbo_fx` を自動登録するため、ホストアプリ側で `config/importmap.rb` へ手動でピンを追加する必要はありません。

Stimulus コントローラとして登録する作業だけが必要です。`app/javascript/controllers/index.js` に追記してください。

```js
import TurboFxController from "turbo_fx";
application.register("turbo-fx", TurboFxController);
```

### CSS

レイアウトファイルにスタイルシートを読み込む 1 行を追加します（Propshaft がアセットパスを自動解決します）。

```erb
<%= stylesheet_link_tag "turbo_fx/turbo_fx" %>
```

---

## 使い方

**親子伝搬パターン** を採用しています。`data-controller="turbo-fx"` を持つ祖先要素がバブリングで配下の Turbo 更新イベントをまとめて捕捉します。

```erb
<%# 親にコントローラを置く %>
<%= tag.div(**turbo_fx(:glitch)) do %>
  <%# この frame は親の設定を引き継いでエフェクトが掛かる %>
  <%= turbo_frame_tag :a do %>
    ...
  <% end %>

  <%# duration を上書き %>
  <%= turbo_frame_tag :b, **turbo_fx(:glitch, duration: 100) do %>
    ...
  <% end %>

  <%# :off でこの frame だけエフェクトを除外 %>
  <%= turbo_frame_tag :c, **turbo_fx(:off) do %>
    ...
  <% end %>
<% end %>
```

`turbo_fx(effect, **options)` は `{ data: { ... } }` を返します。`tag.*` ヘルパーや `turbo_frame_tag` にそのまま渡せます。

---

## 既存の `data:` との併用

`turbo_fx(...)` が返す値は `{ data: { ... } }` なので、他の data 属性と組み合わせる場合はハッシュをマージしてください。

```erb
<%= turbo_frame_tag :b, data: { foo: "bar", **turbo_fx(:glitch)[:data] } do %>
  ...
<% end %>
```

---

## 対応タイミング

| 対象 | 演出 |
|------|------|
| Turbo Frame 更新 | 差し替え後にグリッチ |
| Turbo Stream `replace` / `update` | 置き換わった要素にグリッチ |
| Turbo Stream `append` / `prepend` | 追加された新要素にフェード＋グリッチ |

`remove` など上記以外の Turbo Stream アクションには何も適用しません。

---

## オプション

| オプション | 型 | 既定値 | 説明 |
|------------|----|--------|------|
| `duration:` | Integer (ms) | `500` | エフェクトの再生時間（ミリ秒） |

```erb
<%# 200ms に短縮 %>
<%= turbo_frame_tag :fast, **turbo_fx(:glitch, duration: 200) do %>
  ...
<% end %>
```

---

## アクセシビリティ

CSS に `@media (prefers-reduced-motion: reduce)` が含まれており、ユーザーが動きを減らす設定をしている場合はアニメーションが無効化されます。実装側で特別な対応は不要です。

---

## 開発

```bash
bundle install
bundle exec rspec     # Ruby ヘルパーのテスト

npm install
npm test              # Stimulus コントローラのテスト（Vitest）
```

---

## ライセンス

[MIT License](LICENSE)
