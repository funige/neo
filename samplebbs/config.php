<?php
/*
  * POTI-board v1.32 lot.050602  by SakaQ  >> http://www.punyu.net/php/
  *
  * POTI-boardの設定ファイルです。
  *
*/

/* ---------- ADD:2005/06/02 ---------- */
// 連続・二重投稿対象セキュリティレベル
//※連続・二重投稿チェック対象を決める条件
// 0:最低　…　チェックしない
// 1:低　　…　ホストかパスワードが同じログの場合(従来の条件)
// 2:中　　…　低レベルの条件に加え、名前・メールアドレス・URL・題名のいずれかが同じ場合
// 3:高　　…　低レベルの条件に加え、名前・メールアドレス・URL・題名のいずれかが類似率を上回る場合
// 4:最高　…　無条件でチェック。最新ログ20件と連続・二重投稿チェックする事になる
//※中・高レベルのとき、見入力項目は無視
define(POST_CHECKLEVEL, '0');

// 連続・二重投稿対象セキュリティレベルが 高 のときの類似率(単位％)
define(VALUE_LIMIT, '80');

// 二重投稿セキュリティレベル
//※二重投稿とみなす条件
// 0:最低　…　本文が一致し、画像なしの場合(従来の条件)
// 1:低　　…　本文が一致する場合
// 2:中　　…　本文が類似率(中)を上回る場合
// 3:高　　…　本文が類似率(高)を上回る場合
define(D_POST_CHECKLEVEL, '0');

// 二重投稿セキュリティレベルが 中 のときの類似率(単位％)
define(COMMENT_LIMIT_MIDDLE, '90');

// 二重投稿セキュリティレベルが 高 のときの類似率(単位％)
define(COMMENT_LIMIT_HIGH, '80');


/* ---------- ADD:2005/01/14 ---------- */
// 言語設定
define(LANG, 'Japanese');

// 出力文字コード指定 1:EUC-JP, 2:Shift_JIS, 3:ISO-2022-JP(JIS), 4:UTF-8
//※1～4に該当しない場合は、直接文字コード名を入れて下さい
define(CHARSET_OUT, '4');

// 文字コード変換対象指定 0:出力HTMLとログも含むすべて, 1:クッキーとメールのみ
define(CHARSET_CONVERT, '0');

// 内部文字コード指定 1:EUC-JP, 2:Shift_JIS, 3:ISO-2022-JP(JIS), 4:UTF-8
//※1～4に該当しない場合は、直接文字コード名を入れて下さい
//★上のCHARSET_CONVERTで 0 を指定した場合に有効★
define(CHARSET_IN, '4');


/* ---------- ADD:2004/06/22 ---------- */
// 独自タグ使用 (0=no 1=yes)
define(USE_POTITAG, '1');

// -- 独自タグの種類（font以外）--
//独自タグ名。大文字のほうが無難
$tags1 = array("B","I","U","S","H","Q","CN","RT","M","M2","MR","MR2","MA","MA2","DS","MU","MD");
//上記独自タグに対応するタグ（<～>の中に入る部分）
$tags2 = array("b","i","u","s","a style='cursor:hand'","a style='cursor:help'","div align=center","div align=right","marquee","marquee scrollamount=12","marquee direction=right","marquee direction=right scrollamount=12","marquee behavior=alternate","marquee behavior=alternate scrollamount=12","div style='width:100%;filter:dropshadow(offx=1,offy=1,color=silver)'","marquee direction=up height=20 scrollamount=1","marquee direction=down height=20 scrollamount=1");

//短縮フォント名
$ryfont1 = array("PO","ME","W1","W2");
$ryfont2 = array("HGP創英角ﾎﾟｯﾌﾟ体","ＭＳ Ｐ明朝","webdings","wingdings");

//ユーザー削除権限 (0:不可 1:treeのみ許可 2:treeと画像のみ許可 3:tree,log,画像全て許可)
//※treeのみを消して後に残ったlogは管理者のみ削除可能
define(USER_DEL, '1');


/* ---------- ADD:2004/03/16 ---------- */
//文字色選択を使用する する:1 しない:0
define(USE_FONTCOLOR, '1');

//レスで画像貼りを許可する する:1 しない:0
//※お絵かきも連動
define(RES_UPLOAD, '0');

//レス用投稿サイズ（これ以上はサイズを縮小
define(MAX_RESW, '200');	//幅
define(MAX_RESH, '200');	//高さ

//レス画像貼りを許可した場合の画像付きレスを表示させる件数
//1スレで表示させるレスを画像付きレス表示数になるまで省略します
//返信画面で全件表示されます
//(例) ※0が文字レス,iが画像レス
//  0i0ii の場合。画像付きレス表示数2だと → 0ii に省略されます
define(DSP_RESIMG, '2');

/* ---------- お絵かきアプレット設定 ---------- */
/* ※詳しい内容はアプレットのreadme参照 */
//アンドゥの回数(デフォルト)
define(UNDO, '90');

//アンドゥを幾つにまとめて保存しておくか(デフォルト)
define(UNDO_IN_MG, '45');

//画像のデータがこの値より大きくなるとき、
//・保存タイプが AUTOの場合、JPEGに変換
//・保存タイプが PNG の場合、減色処理
//ただし、保存タイプが JPEGの場合は、この値を無視してJPEGに変換
define(IMAGE_SIZE, '600');

//PNGの減色率とJPEGの圧縮率
define(COMPRESS_LEVEL, '90');

//初期レイヤー数［しぃペインターのみ］
//※お絵かき中にレイヤー増やせるのであまり意味無い
define(LAYER_COUNT, '3');

//キャンバスクオリティの選択肢［しぃペインターのみ］
//※3以上に上げる時は UNDO÷UNDO_IN_MG が2以下になる様にしないと
//派手にメモリを消費する為、メモリ不足に陥る可能性があります
//※最初の値がデフォルトになります
$qualitys = array('1','2','3','4');

//　セキュリティ関連－URLとクリック数かタイマーのどちらかが設定されていれば有効
//※アプレットのreadmeを参照し、十分テストした上で設定して下さい
//セキュリティクリック数。設定しないなら''で
define(SECURITY_CLICK, '');
//セキュリティタイマー(単位:秒)。設定しないなら''で
define(SECURITY_TIMER, '');
//セキュリティにヒットした場合の飛び先
define(SECURITY_URL, 'http://www.npa.go.jp/');

//続きを描くときのセキュリティ。利用しないなら両方''で
//続きを描くときのセキュリティクリック数。設定しないなら''で
define(C_SECURITY_CLICK, '');
//続きを描くときのセキュリティタイマー(単位:秒)。設定しないなら''で
define(C_SECURITY_TIMER, '');


/* ---------- ADD:2004/02/03 ---------- */
//そろそろ消える表示のボーダー。最大ログ数からみたパーセンテージ
define(LOG_LIMIT, '95');


/* ---------- ADD:2004/01/26 ---------- */
/* ---------- メール通知設定 ---------- */
//管理者からの投稿の場合、メール通知しない しない:1 する:0
define(NOTICE_NOADMIN, '1');


/* ---------- ADD:2004/01/19 ---------- */
/* ---------- メール通知設定 ---------- */
//メール通知先
define(TO_MAIL, 'root@xxx.xxx');

//設置場所のURL。'/'まで
define(ROOT_URL, 'http://www.xxx.com/poti/');

//メール通知に本文を付ける 付ける:1 付けない:0
define(SEND_COM, '0');


/* ---------- メイン設定 ---------- */

//ログファイル名
define(LOGFILE, 'img.log');
define(TREEFILE, 'tree.log');

//画像保存ディレクトリ。potiboard.phpから見て
define(IMG_DIR, 'src/');

//サムネイル保存ディレクトリ
define(THUMB_DIR, 'thumb/');

//タイトル（<title>とTOP）
define(TITLE, 'NEOテスト');

//「ホーム」へのリンク
define(HOME, '../');

//管理者パス
define(ADMIN_PASS, 'kanri');

//このスクリプト名
define(PHP_SELF, 'potiboard.php');

//入り口ファイル名
define(PHP_SELF2, 'index.html');

//1ページ以降の拡張子
define(PHP_EXT, '.html');

//[新規投稿は管理者のみ]にする する:1 しない:0
//する(1)にした場合、管理者パス以外での新規投稿はできません
define(ADMIN_NEWPOST, 0);

//投稿容量制限 KB（phpの設定により2Mまで
define(MAX_KB, '100000');

//投稿サイズ（これ以上はサイズを縮小
define(MAX_W, '300');	//幅
define(MAX_H, '300');	//高さ

//名前の制限文字数。半角で
define(MAX_NAME, '100');

//メールアドレスの制限文字数。半角で
define(MAX_EMAIL, '100');

//題名の制限文字数。半角で
define(MAX_SUB, '100');

//本文の制限文字数。半角で
define(MAX_COM, '2000000');

//一ページに表示する記事
define(PAGE_DEF, '10');

//最大ログ数
define(LOG_MAX, '400');

//1スレ内のレス表示件数(0で全件表示)
//レスがこの値より多いと古いレスから省略されます
//返信画面で全件表示されます
//[新規投稿は管理者のみ]にした場合の 0 はレスを表示しません
define(DSP_RES, '5');

//クッキー保存日数
define(SAVE_COOKIE, '7');

//連続投稿秒数
define(RENZOKU, '1');

//画像連続投稿秒数
define(RENZOKU2, '1');

//強制sageレス数( 0 ですべてsage)
define(MAX_RES, '20');

//proxyの書込みを制限する y:1 n:0
define(PROXY_CHECK, 0);

//IDを表示する 強制:2 する:1 しない:0
define(DISP_ID, 0);

//ID生成の種
define(ID_SEED, 'IDの種');

//改行を抑制する行数 しない:0
define(BR_CHECK, '15');

//URLを自動リンクする する:1 しない:0
define(AUTOLINK, 1);

//名前を必須にする する:1 しない:0
define(USE_NAME, 0);
define(DEF_NAME, '名無し');	//未入力時の名前

//本文を必須にする する:1 しない:0
define(USE_COM, 0);
define(DEF_COM, '本文無し');	//未入力時の本文

//題名を必須にする する:1 しない:0
define(USE_SUB, 0);
define(DEF_SUB, '無題');	//未入力時の題名

//レス時にスレ題名を引用する する:1 しない:0
define(USE_RESUB, 0);

//各スレにレスフォームを表示する する:1 しない:0
define(RES_FORM, 0);

//フォーム下の追加お知らせ
//(例)'<LI>お知らせデース
//     <LI>サーバの規約で<font color=red><big><B>アダルト禁止</B></big></font>'
$addinfo='';

//拒絶する文字列
$badstring = array("irc.s16.xrea.com","著作権の侵害","未承諾広告");

//拒絶するファイルのmd5
$badfile = array("dummy","dummy2");

//拒絶するホスト
$badip = array("addr.dummy.com", "addr2.dummy.com", ".ru", ".nash.net.ua", ".kyivstar.net", ".ml", "tor.t-3.net", "cloudedic.net");


/* ---------- サムネイル設定 ---------- */

//サムネイルを作成する する:1 しない:0
define(USE_THUMB, 1);

//サムネイルルーチンの指定 自動判別:0 GD版:1 repng2jpeg版:2
//自動判別は万能じゃありません
//なるべくチェックスクリプトで調べてから直に指定して下さい
define(THUMB_SELECT, 1);

//サムネイルの品質  0(品質は最低、サイズは小)～100(品質は最高、サイズは大)の範囲内
define(THUMB_Q, '75');

//GD2のImageCopyResampledでサムネイルの画質向上 させる:1 させない:0
//自動判別なので通常は 1 でOK.不具合がある場合のみ 0 にして下さい
define(RE_SAMPLED, 1);

//強制サムネイル機能を使用する する:1 しない:0
define(FORCED_THUMB, 0);

//強制サムネイル判定用 ファイル容量KB
//これを超えると強制的にサムネイル
define(IMG_SIZE, '40');


/* ---------- お絵かき設定 ---------- */

//お絵かき機能を使用する お絵かきのみ:2 する:1 しない:0
define(USE_PAINT, 2);

//利用するアプレット PaintBBS:0 しぃペインター:1 両方:2
define(APPLET, 0);

//お絵かき画像ファイル名の頭文字
//お絵かき投稿した画像のファイル名には、必ずこれが先頭に付きます
define(KASIRA, 'OB');

//テンポラリディレクトリ
define(TEMP_DIR, 'tmp/');

//テンポラリ内のファイル有効期限(日数)
define(TEMP_LIMIT, '14');

//お絵描き最大サイズ（これ以上は強制でこの値
//最小値は幅、高さともに 100 固定です
define(PMAX_W, '500');	//幅
define(PMAX_H, '500');	//高さ

//お絵描きデフォルトサイズ
define(PDEF_W, '300');	//幅
define(PDEF_H, '300');	//高さ

//描画時間の表示 する:1 しない:0
define(DSP_PAINTTIME, 0);

//パレットデータファイル名
define(PALETTEFILE, 'palette.txt');

//動画機能を使用する する:1 しない:0
define(USE_ANIME, 0);

//動画記録デフォルトスイッチ ON:1 OFF:0
define(DEF_ANIME, 0);

//動画(PCH)保存ディレクトリ
define(PCH_DIR, 'src/');

//動画再生スピード 超高速:-1 高速:0 中速:10 低速:100 超低速:1000
define(PCH_SPEED, '10');

//お絵かき投稿時のIPチェックをする する:1 しない:0
define(IP_CHECK, 0);

//コンティニューを使用する する:1 しない:0
define(USE_CONTINUE, 1);

//コンティニュー時、削除キーを必要とする 必要:1 不要:0
define(CONTINUE_PASS, 1);

/* ---------- picpost.php用設定 ---------- */
//システムログファイル名
$syslog = "picpost.systemlog";
//システムログ保存件数
$syslogmax = '100';
?>
