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

## テキスト整形
- フォーマットには Prettier を使います。
- 整形ルールはリポジトリ直下の `.prettierrc` に書かれています。
- **既存の設定に従ってください。** 設定を変更したり、独自の設定でフォーマットしたりしないでください。   
- インデント、クォート、改行位置、末尾カンマなどが既存のコードと食い違い、無関係な行が大量に差分に出ます。  
- プルリクエストには、変更が必要な行だけを含めてください。整形だけの変更や、関係のないファイルの変更は含めないでください。
```bash
npm run format
```
で規定の設定によるフォーマットを実行する事ができます。  

## バージョンの追加について

次のバージョンを作るときは、package.jsonのなかにある「version」を変更したあとで、コードを修正します。  

## 動作確認

ブラウザで`sample/index.html`または`sample2/index.html`を開いて動作を確認します。  
よくわかんなくなったら「git stash」とか「git clone」で最初からやり直すのが確実です。

軽微な変更後の流れはこんな感じです（コマンドラインの場合）。

```bash
git rm ...  # 削除したファイル
git add ... # 変更・追加したファイル
git commit -a -m "..."
git push
```

大きな変更をするときは、新しいbranchを作って、十分テストした後 merge したほうがいいです。
