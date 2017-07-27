# 掲示板へのNEOの組み込み方法
PaintBBS NEOを使えば、既存のお絵描き掲示板（しぃPaintBBS）にスクリプトを埋め込んで、javaアプレットの代わりにお絵かき機能を提供することができます。


#### 1. 基本的には&lt;head>に２行追加するだけです

    <head>
    ...
    <link rel="stylesheet" href="PaintBBS-1.1.9.css" type="text/css" />
    <script src="PaintBBS-1.1.9.js" charset="UTF-8"></script>

    </head>


しかし「今まで通りjavaを使ってお絵描きしたい」という人もいると思いますので、NEOを使うかどうか、ユーザーが選択できるようにしたほうがいいと思います。

このサンプルは、[PHP製のお絵かき掲示板POTI-board + MONO_WHITE](http://www.punyu.net/php/oekaki.php) に「NEOを使う」かどうかの選択機能を追加したものです。  


* jsとcssファイルは [/dist](https://github.com/funige/neo/tree/master/neo/dist) の下にある最新のものを使って下さい。

* &lt;head>に2行追加するとき、ついでに&lt;applet>タグを&lt;applet-dummy>に書き換えると、無駄なjavaアプレットの読み込みがなくなってNEOの起動が早くなります。

  詳細はサンプルのソースコードを参照してください。

#### 2. セキュリティチェックのコードを修正（ふたばでは不要です）
ふたば以外の多くの掲示板では、送信された画像のUser-Agentを見て不正な投稿かどうかチェックしているようです。アプリではUser-Agentを簡単に偽装できるのですが、埋め込みのNEOでは偽装は難しいので、このチェックを外す必要があります。

このサンプルでは、picpost.phpの

    /*
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
    */

の部分をコメントアウトしています。
POTI-board以外の掲示板スクリプトについては、調べてみないと何とも言えません……。

(2017/05/11)

- BBSNote8.0でも設置できるそうです。
  https://twitter.com/sapniji/status/861930241559642113