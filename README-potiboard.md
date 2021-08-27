# POTI-boardへのNEOの組み込み方法

PaintBBS NEOを使えば、既存のお絵描き掲示板（しぃPaintBBS）にスクリプトを埋め込んで、javaアプレットの代わりにお絵かき機能を提供することができます。


#### 1. 基本的には&lt;head>の先頭に（他のスクリプトやcssより前に）２行追加するだけです

    <head>
    <link rel="stylesheet" href="neo.css" type="text/css" />
    <script src="neo.js" charset="UTF-8"></script>
    ...
    </head>

neo.jsとneo.cssの2つのファイルを[/dist](https://github.com/funige/neo/tree/master/neo/dist) からダウンロードしてください。  
最新版のPaintBBS-x.x.x.(css|js)とneo.(css|js)は同じものです。

* 必須ではありませんが、&lt;applet>タグを&lt;applet-dummy>に書き換えると、無駄なjavaアプレットの読み込みがなくなってNEOの起動が早くなります。

#### 2. セキュリティチェックのコードを修正（ふたばでは不要です）
ふたば以外の多くの掲示板では、送信された画像のUser-Agentを見て不正な投稿かどうかチェックしているようです。アプリではUser-Agentを簡単に偽装できるのですが、埋め込みのNEOでは偽装は難しいので、このチェックを外す必要があります。

このサンプルでは、picpost.phpの以下の部分をコメントアウトしています。

    if($h=='S'){
    //  if(!strstr($u_agent,'Shi-Painter/')){
    //      unlink($full_imgfile);
    //      error("UA error。画像は保存されません。");
    //      exit;
    //  }
        $ext = '.spch';
    }else{
    //  if(!strstr($u_agent,'PaintBBS/')){
    //      unlink($full_imgfile);
    //      error("UA error。画像は保存されません。");
    //      exit;
    //  }
        $ext = '.pch';
    }

# 動画記録について

v1.5で動画記録をサポートしました。

お絵描きするページでは描画用のJavaアプレット（PaintBBS.jar）が読み込まれ、動画を表示するページでは動画ビューアのアプレット（PCHViewer.jar）が読み込まていると思います。

動画記録に対応するには、どちらのページでもNEOが起動するように、neo.jsとneo.cssを適切に挿入する必要があります。

残念ながら動画データ（.pch）は解析できなかったので、NEOは互換性のない記録方法を採用しています。

* **PaintBBSのpch**  
magic (4byte: 1f 8b 08 00)  
speed (2byte)  
width (2byte)  
height (2byte)  
:  

* **NEOのpch**  
magic (3byte: 4c 45 4f) + version (1byte: 20)  
width (2byte)  
height (2byte)  
拡張用 (4byte: 00 00 00 00)  
:  

POTI-boardやRelmではこれが問題になることはないのですが、BBSNoteはヘッダをチェックするので、NEOの動画データを受け付けてくれません。

詳細はミミニャーさんの記事を参照してください。  
お絵かき掲示板NEOの設置方法(BBSnote編)
https://oekakiart.net/blog/bbsnoteneo/

# NEO独自のパラメータについて

  &lt;applet>の下に、他のパラメータと同じように指定してください。

- __&lt;PARAM NAME="neo_confirm_unload" VALUE="true">__  
  このフラグをtrueにすると、「戻る」ボタンを押した時などに「このサイトを離れますか？」という警告を出して、うっかり描画履歴が失われるのを防ぐことができます。  
  **デフォルトはfalseです**

- __&lt;PARAM NAME="neo_warning" VALUE="...">__  
  キャンバスを開いた時に、VALUEに書かれた警告文を表示します。  
  ブラウザのバージョンアップで不具合が出た時など、ユーザーに  
  緊急に伝えたいことがある場合に利用を検討してください。

- __&lt;PARAM NAME="neo_emulation_mode" VALUE="2.22_8">__  
  PaintBBSアプレットの動作はバージョンによって微妙に違いがありました。  

  NEOがサポートするバージョンは "2.04" と最終版 "2.22_8" です。  
  デフォルトのバージョンは、"2.22_8x"です（xの意味については後述）。

# 多国語対応
  オリジナルのPaintBBSは日本語以外の環境では英語で文字列を表示するのですが
  わかりにくい英語なので、海外の掲示板では訳を修正して使用することがありました。  
  現在資料が確認できるのは英訳を修正した"2.04x"だけなのですが……  
  [oekakicentral.com](http://www.oekakicentral.com/tutorials/paintbbs.html)    

  NEOでは、とりあえず以下のような方針で多国語対応しています
- neo_emulation_modeに"x"で終わる文字列（"2.04x"など）を指定したときはベストな翻訳を。
- "x"がないときはオリジナルに忠実な動作を。

  ** 現在（日本語以外では）英語とスペイン語のみ対応しています。  
  他の言語の翻訳も募集中です。 **

# スタイルシートによる色の指定

  アプレットの背景やアイコンの色は&lt;applet>のパラメータで&lt;PARAM NAME="color_bk" VALUE="#ffffff">みたいな感じで指定していますが、スタイルシートでも指定できるようにしました。


  優先順位は、（１）paramで指定した色（２）スタイルシートで指定した色（３）デフォルトの色です。

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
    
  trueのときツールはキャンバスの左側になります。
  
- __&lt;PARAM NAME="neo_tool_side" VALUE="left">__ 
  &lt;applet>の&lt;param>で指定することもできます。

# セキュリティ関連のオプション

  オリジナルのPaintBBSには、描画時間やキャンバスをクリックした回数が閾値より少なかった時に、投稿を受け付けずに他のURL（警察庁のURLとか）に飛ばす機能がありました。

  この機能を再現するには（再現しないほうがいいと思うのですが）

- __&lt;PARAM NAME="neo_emulate_security_error" VALUE="true">__  
  と一緒に

  __&lt;PARAM NAME="security_click" VALUE="クリック回数">__  
  __&lt;PARAM NAME="security_timer" VALUE="秒数">__  
  __&lt;PARAM NAME="security_url" VALUE="ジャンプ先のURL">__  

  などのパラメータを設定して下さい。  
  詳しくは[原作者によるドキュメント](https://hp.vector.co.jp/authors/VA016309/paintbbs/document/Readme_Shichan.html)を参照。

これとは別に、クリック回数や秒数「だけ」取得したい開発者のためのオプションもオリジナルのPaintBBSにはあります。

- __&lt;PARAM NAME="send_header_count" VALUE="true">__  
  __&lt;PARAM NAME="send_header_timer" VALUE="true">__  

を指定すると、送信されるデータの拡張ヘッダに

    timer=3391&count=1&...

などの文字列が追加されます（timerの単位はmsです）。  
一応実装してみました。




