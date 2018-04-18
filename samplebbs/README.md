# 掲示板へのNEOの組み込み方法

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

* 「今まで通りjavaを使ってお絵描きしたい」という人もいると思いますので、NEOを使うかどうか、ユーザーが選択できるようにしたほうがいいと思います。

  [このサンプル掲示板](http://neo.websozai.jp/) は、[PHP製のお絵かき掲示板POTI-board + MONO_WHITE](http://www.punyu.net/php/oekaki.php) に「NEOを使う」かどうかの選択機能を追加したものです。  

  詳細はソースコードを参照してください。


#### 2. セキュリティチェックのコードを修正（ふたばでは不要です）
ふたば以外の多くの掲示板では、送信された画像のUser-Agentを見て不正な投稿かどうかチェックしているようです。アプリではUser-Agentを簡単に偽装できるのですが、埋め込みのNEOでは偽装は難しいので、このチェックを外す必要があります。

このサンプルでは、picpost.phpの

    /＊
    if($h=='S'){
        if(!strstr($u_agent,'Shi-Painter/')){
            unlink($full_imgfile);
            error("UA error。画像は保存されません。");
            exit;
        }
        $ext = '.spch';
    }else{
        if(!strstr($u_agent,'PaintBBS/')){
            unlink($full_imgfile);
            error("UA error。画像は保存されません。");
            exit;
        }
        $ext = '.pch';
    }
    ＊/

の部分をコメントアウトしています。

POTI-board以外にも幾つか掲示板スクリプトがありますが、詳細は調べてみないと何とも言えません……。

- さとぴあさんのBBSNote8.0での設置例  
  http://stp.sblo.jp/article/182045577.html  

# NEO独自のパラメータについて

  &lt;applet>の下に、他のパラメータと同じように指定してください。

- __&lt;PARAM NAME="neo_warning" VALUE="...">__  
  キャンバスを開いた時に、VALUEに書かれた警告文を表示します。  
  ブラウザのバージョンアップで不具合が出た時など、ユーザーに  
  緊急に伝えたいことがある場合に利用を検討してください。

- __&lt;PARAM NAME="neo_emulation_mode" VALUE="2.22_8">__  
  PaintBBSアプレットの動作はバージョンによって微妙に違いがありました。  

  NEOがサポートするバージョンは "2.04" と最終版 "2.22_8" です。  
  何も指定がなければ、2.22_8のエミュレーションをします。  
  （今のところ右クリックスポイトの動作しか違わないのですが）

  日本語以外の環境では、PaintBBSは英語で文字列を表示するのですが  
  管理者が翻訳をカスタマイズすることもありました。  
  現在資料が確認できるのは英訳を修正した"2.04x"だけなのですが  
  [oekakicentral.com](http://www.oekakicentral.com/tutorials/paintbbs.html)    
  もし他の派生版の情報を知っている方がいましたら、連絡ください。  

  とりあえずNEOでは、バージョンに"x"で終わる文字列が指定されたときは  
  "2.04x"の翻訳を使用するようにしてあります。

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

