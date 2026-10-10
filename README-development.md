# 開発環境メモ

## packageの初期化

リポジトリをクローンしたら、
```bash
npm i
```
で初期化してください。

```bash
git clone https://github.com/funige/neo.git
cd neo
npm i
```

## ファイル構成

srcの下がソースコード本体です。  
distの下のビルドツールで自動生成されるので、直接変更しない方がいいです。

```text
    /    package.json
         build.sh

         /src
               container.js
               painter.js
               action.js
               commands.js
               dictionary.js
               lz-string.js
               tools.js
               widget.js

         /dist
               neo.js
               neo.css

               // neo.(css|js)は以下の最新版と同じです。
               // 古いものから適当に削除してください。
               PaintBBS-*.*.*.js
               PaintBBS-*.*.*.css
               ...
```
## ビルドについて

ビルドは `build.sh` で行います。  

```bash
npm run dev
```

このコマンドで `package.json` や `src` 内のファイルを監視して、変更があるたびに `build.sh` を実行し `dist` を更新します。止めるときは `Ctrl + C` を押します。  

## バージョンの追加について

次のバージョンを作るときは、package.jsonのなかにある「version」を変更したあとで、コードを修正します。  

## 動作確認

ブラウザで`samples/index.html`または`samples2/index.html`を開いて動作を確認します。  
よくわかんなくなったら「git stash」とか「git clone」で最初からやり直すのが確実です。

軽微な変更後の流れはこんな感じです（コマンドラインの場合）。

```bash
git rm ...  # 削除したファイル
git add ... # 変更・追加したファイル
git commit -a -m "..."
git push
```

大きな変更をするときは、新しいbranchを作って、十分テストした後 merge したほうがいいです。
