# NEO の独自拡張について

&lt;applet>の下に、他のパラメータと同じように指定してください。

- **&lt;PARAM NAME="neo_confirm_unload" VALUE="true">**  
  このフラグを true にすると、「戻る」ボタンを押した時などに「このサイトを離れますか？」という警告を出して、うっかり描画履歴が失われるのを防ぐことができます。  
  **デフォルトは false です**

- **&lt;PARAM NAME="neo_warning" VALUE="...">**  
  キャンバスを開いた時に、VALUE に書かれた警告文を表示します。  
  ブラウザのバージョンアップで不具合が出た時など、ユーザーに  
  緊急に伝えたいことがある場合に利用を検討してください。

- **&lt;PARAM NAME="neo_emulation_mode" VALUE="2.22_8">**  
  PaintBBS アプレットの動作はバージョンによって微妙に違いがありました。

  NEO がサポートするバージョンは "2.04" と最終版 "2.22_8" です。  
  デフォルトのバージョンは、"2.22_8x"です（x の意味については後述）。

# 動画の仕様の違い

v1.5 で動画記録をサポートしました。

お絵描きするページでは描画用の Java アプレット（PaintBBS.jar）が読み込まれ、動画を表示するページでは動画ビューアのアプレット（PCHViewer.jar）が読み込まていると思います。

動画記録に対応するには、どちらのページでも NEO が起動するように、neo.js と neo.css を適切に挿入する必要があります。

残念ながら動画データ（.pch）は解析できなかったので、NEO は互換性のない記録方法を採用しています。

- **PaintBBS の pch**  
  magic (4byte: 1f 8b 08 00)  
  speed (2byte)  
  width (2byte)  
  height (2byte)  
  :

- **NEO の pch**  
  magic (3byte: 4c 45 4f) + version (1byte: 20)  
  width (2byte)  
  height (2byte)  
  拡張用 (4byte: 00 00 00 00)  
  :

POTI-board や Relm ではこれが問題になることはないのですが、BBSNote はヘッダをチェックするので、NEO の動画データを受け付けてくれません。

詳細はミミニャーさんの記事を参照してください。  
お絵かき掲示板 NEO の設置方法(BBSnote 編)
https://oekakiart.net/blog/bbsnoteneo/

# 多国語対応

オリジナルの PaintBBS は日本語以外の環境では英語で文字列を表示するのですが
わかりにくい英語なので、海外の掲示板では訳を修正して使用することがありました。  
 現在資料が確認できるのは英訳を修正した"2.04x"だけなのですが……  
 [oekakicentral.com](http://www.oekakicentral.com/tutorials/paintbbs.html)

NEO では、とりあえず以下のような方針で多国語対応しています

- neo_emulation_mode に"x"で終わる文字列（"2.04x"など）を指定したときはベストな翻訳を。
- "x"がないときはオリジナルに忠実な動作を。

```
  現在（日本語以外では）英語とスペイン語のみ対応しています。
  他の言語の翻訳も募集中です。
```

# スタイルシートによる色の指定

アプレットの背景やアイコンの色は&lt;applet>のパラメータで&lt;PARAM NAME="color_bk" VALUE="#ffffff">みたいな感じで指定していますが、スタイルシートでも指定できるようにしました。

優先順位は、（１）param で指定した色（２）スタイルシートで指定した色（３）デフォルトの色です。

    .NEO .color_bk           { color: #ccccff; }
    .NEO .color_bk2          { color: #bbbbff; }
    .NEO .color_tool_icon    { color: #e8dfae; }
    .NEO .color_icon         { color: #ccccff; }
    .NEO .color_iconselect   { color: #ffaaaa; }
    .NEO .color_text         { color: #666699; }
    .NEO .color_bar          { color: #6f6fae; }

    .NEO .tool_color_button  { color: #e8dfae; }
    .NEO .tool_color_button2 { color: #f8daaa; }
    .NEO .tool_color_text    { color: #773333; }
    .NEO .tool_color_bar     { color: #ddddff; }
    .NEO .tool_color_frame   { color: #000000; }

# ツールをキャンバスの左側に配置する

タブレット使用時に「キャンバスの右側にツールがあると邪魔になって描きにくい」という声があったので、位置を逆にすることができるようになりました。

    Neo.setToolSide(true) // true|false

true のときツールはキャンバスの左側になります。

- **&lt;PARAM NAME="neo_tool_side" VALUE="left">**

  &lt;applet>の&lt;param>で指定することもできます。

# セキュリティ関連のオプション

オリジナルの PaintBBS には、描画時間やキャンバスをクリックした回数が閾値より少なかった時に、投稿を受け付けずに他の URL（警察庁の URL とか）に飛ばす機能がありました。

この機能を再現するには（再現しないほうがいいと思うのですが）

- **&lt;PARAM NAME="neo_emulate_security_error" VALUE="true">**  
  と一緒に

  **&lt;PARAM NAME="security_click" VALUE="クリック回数">**  
  **&lt;PARAM NAME="security_timer" VALUE="秒数">**  
  **&lt;PARAM NAME="security_url" VALUE="ジャンプ先の URL">**

  などのパラメータを設定して下さい。  
  詳しくは[原作者によるドキュメント](https://hp.vector.co.jp/authors/VA016309/paintbbs/document/Readme_Shichan.html)を参照。

これとは別に、クリック回数や秒数「だけ」取得したい開発者のためのオプションもオリジナルの PaintBBS の時代から存在しました(実装するのをサポってました)。

- **&lt;PARAM NAME="send_header_count" VALUE="true">**  
  **&lt;PARAM NAME="send_header_timer" VALUE="true">**

を指定すると、送信されるデータの拡張ヘッダに

    timer=3391&count=1&...

などの文字列が追加されます（timer の単位は ms です）。  
一応実装しておきますね。

# formData を使ったデータ送信

NEO は古い Java アプレットの通信方式をそのまま継承していますが、WAF 対策など現在のセキュリティ対策に合わない問題が報告されています。

v1.6 からはより安全で扱いやすい formData を使ったデータ送信も選べるようになっています（導入には受信する掲示板側のプログラムの修正が必要です）。

- **&lt;PARAM NAME="neo_send_with_formdata" VALUE="true">**

  で、formData を使った送信が行われるようになります。

[エラーチェックとか省略した短いサンプル](sample/posttest.php)を作りましたので、参考にどうぞ。

[実際の掲示板で使われているコード](sample/sample_handler.php)の例はこちら。
