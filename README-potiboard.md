# POTI-board への NEO の組み込み方法

PaintBBS NEO を使えば、既存のお絵描き掲示板（しぃ PaintBBS）にスクリプトを埋め込んで、java アプレットの代わりにお絵かき機能を提供することができます。

#### 1. 基本的には&lt;head>の先頭に（他のスクリプトや css より前に）２行追加するだけです

    <head>
    <link rel="stylesheet" href="neo.css" type="text/css" />
    <script src="neo.js" charset="UTF-8"></script>
    ...
    </head>

neo.js と neo.css の 2 つのファイルを[/dist](https://github.com/funige/neo/tree/master/neo/dist) からダウンロードしてください。  
最新版の PaintBBS-x.x.x.(css|js)と neo.(css|js)は同じものです。

- 必須ではありませんが、&lt;applet>タグを&lt;applet-dummy>に書き換えると、無駄な java アプレットの読み込みがなくなって NEO の起動が早くなります。

#### 2. セキュリティチェックのコードを修正（ふたばでは不要です）

ふたば以外の多くの掲示板では、送信された画像の User-Agent を見て不正な投稿かどうかチェックしているようです。アプリでは User-Agent を簡単に偽装できるのですが、埋め込みの NEO では偽装は難しいので、このチェックを外す必要があります。

このサンプルでは、picpost.php の以下の部分をコメントアウトしています。

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
