<?php
/*
  * Template - MONO WHITE - lot.050602  by SakaQ  >> http://www.punyu.net/php/
  *
  * potiboard.php(v1.30～)のTemplate設定ファイルです。
  *
*/

//テンプレートのバージョン
define('TEMPLATE_VER', "lot.050602");


/* ---------- ADD:2004/06/22 ---------- */

//エラーメッセージ
define('MSG001', "該当記事がみつかりません");
define('MSG002', "絵が選択されていません");
define('MSG003', "アップロードに失敗しました<br>サーバーがサポートしていない可能性があります");
define('MSG004', "アップロードに失敗しました<br>画像ファイル以外は受け付けません");
define('MSG005', "アップロードに失敗しました<br>同じ画像がありました");
define('MSG006', "不正な投稿をしないで下さい<br>POST以外での投稿は受け付けません");
define('MSG007', "画像がありません");
define('MSG008', "何か書いて下さい");
define('MSG009', "名前がありません");
define('MSG010', "題名がありません");
define('MSG011', "本文が長すぎますっ！");
define('MSG012', "名前が長すぎますっ！");
define('MSG013', "メールアドレスが長すぎますっ！");
define('MSG014', "題名が長すぎますっ！");
define('MSG015', "異常です");
define('MSG016', "拒絶されました<br>そのHOSTからの投稿は受け付けません");
define('MSG017', "ＥＲＲＯＲ！　公開ＰＲＯＸＹ規制中！！(80)");
define('MSG018', "ＥＲＲＯＲ！　公開ＰＲＯＸＹ規制中！！(8080)");
define('MSG019', "ログの読み込みに失敗しました");
define('MSG020', "連続投稿はもうしばらく時間を置いてからお願い致します");
define('MSG021', "画像連続投稿はもうしばらく時間を置いてからお願い致します");
define('MSG022', "このコメントで一度投稿しています。別のコメントでお願い致します");
define('MSG023', "ツリーの更新に失敗しました");
define('MSG024', "ツリーの削除に失敗しました");
define('MSG025', "スレッドがありません");
define('MSG026', "スレッドが最後の1つなので削除できません");
define('MSG027', "削除に失敗しました(ユーザー)");
define('MSG028', "該当記事が見つからないかパスワードが間違っています");
define('MSG029', "パスワードが違います");
define('MSG030', "削除に失敗しました(管理者権限)");
define('MSG031', "記事Noが未入力です");
define('MSG032', "拒絶されました<br>不正な文字列があります");
define('MSG033', "削除に失敗しました<br>ユーザーに削除権限がありません");
define('MSG034', "アップロードに失敗しました<br>規定の画像容量をオーバーしています");
define('MSG035', "何か日本語で書いてください Comment should have at least some Japanese characters.");
define('MSG036', "予備");
define('MSG037', "予備");
define('MSG038', "予備");
define('MSG039', "予備");
define('MSG040', "予備");


/* ---------- ADD:2004/03/16 ---------- */

//文字色テーブル '値[,名称]'
$fontcolors = array('#000000,黒'
,'#666666,灰'
,'#003399,青'
,'#990000,赤'
,'#669900,緑'
,'#cc3399,紫'
,'#ff6633,橙'
,'#cccc00,黄'
);

//デフォルト文字色 (旧ログ互換用)
define('DEF_FONTCOLOR', '#000000');


/* ---------- ADD:2004/02/03 ---------- */

//描画時間の書式
//※日本語だと、"1日1時間1分1秒"
//※英語だと、"1day 1hr 1min 1sec"
define('PTIME_D', '日');
define('PTIME_H', '時間');
define('PTIME_M', '分');
define('PTIME_S', '秒');

//＞が付いた時の書式
//※RE_STARTとRE_ENDで囲むのでそれを考慮して
define('RE_START', '<font color=#666666 style="background-color:#EEEEEE">');
define('RE_END', '</font>');

//現在のページの書式
//※<PAGE> にページ数が入ります
define('NOW_PAGE', '[<PAGE>] ');

//他のページの書式
//※<PAGE> にページ数が入ります
//※<PURL> にURLが入ります
define('OTHER_PAGE', '[<a href="<PURL>"><PAGE></a>] ');


/* -------------------- */

//メインのテンプレートファイル
define('MAINFILE', "monow_main.html");

//レスのテンプレートファイル
define('RESFILE', "monow_main.html");

//その他のテンプレートファイル
define('OTHERFILE', "monow_other.html");

//お絵かきのテンプレートファイル
define('PAINTFILE', "monow_paint.html");

//カタログのテンプレートファイル
define('CATALOGFILE', "monow_catalog.html");

//カタログの列数(横)
define('CATALOG_X', '4');

//カタログの行数(縦)
define('CATALOG_Y', '4');

//カタログの画像幅
define('CATALOG_W', '150');

//編集したときの目印
//※記事を編集したら日付の後ろに付きます
define('UPDATE_MARK', '(編集)');

//日付の書式
//※<1> に漢字の曜日(土・日・月など)が入ります
//※<2> に漢字の曜日(土曜・日曜・月曜など)が入ります
//※他は下記のURL参照
//  http://www.php.net/manual/ja/function.date.php
define('DATE_FORMAT', 'Y/m/d(<1>) H:i');

//管理画面(削除モード)の奇数行カラー
define('ADMIN_DELKISU', 'eeeeee');

//管理画面(削除モード)の偶数行カラー
define('ADMIN_DELGUSU', 'cccccc');

?>
