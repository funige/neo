<?php
if(($_SERVER["REQUEST_METHOD"]) !== "POST"){
	return header( "Location: ./ ") ;
}

//設定
$imgfile = time().substr(microtime(),2,6);	//画像ファイル名
const SAVE_DIR='temp/';

header('Content-type: text/plain');

//通常ポストによる画像投稿を拒絶
if(!isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
	die("error\nThe post has been rejected.");
}

$imgext='.png';
// 拡張ヘッダーを取り出す
$sendheader = (string)filter_input(INPUT_POST,'header');
/* ---------- 投稿者情報記録 ---------- */
if($sendheader){
	$sendheader = str_replace("&amp;", "&", $sendheader);
	parse_str($sendheader, $u);
	$count = isset($u['count']) ? $u['count'] : 0;//作画工程数
	$timer = isset($u['timer']) ? ($u['timer']/1000) : 0;//作画時間
	//そのほかのユーザーが設定した拡張ヘッダーもここに追加できる。
}
$userdata = "$count\t$timer\n";

if(!isset ($_FILES["picture"]) || $_FILES['picture']['error'] != UPLOAD_ERR_OK){
	die("error\nYour picture upload failed! Please try again!");
}

if($_FILES['picture']['size'] > (5120 * 1024)){//5MB以上のファイルサイズの時は拒絶
	die("error\nThe size of the picture is too big.");
}

//pngのmime type?
if(mime_content_type($_FILES['picture']['tmp_name'])!=='image/png'){
	die("error\nYour picture upload failed! Please try again!");
}
move_uploaded_file($_FILES['picture']['tmp_name'], SAVE_DIR.$imgfile.'.png');

chmod(SAVE_DIR.$imgfile.'.png',0606);

if(isset($_FILES['pch']) && ($_FILES['pch']['error'] == UPLOAD_ERR_OK)){
	//NEOのpchのmime type?
	if(mime_content_type($_FILES['pch']['tmp_name'])==="application/octet-stream"){
			move_uploaded_file($_FILES['pch']['tmp_name'], SAVE_DIR.$imgfile.'.pch');
			if(is_file(SAVE_DIR.$imgfile.'.pch')){
				chmod(SAVE_DIR.$imgfile.'.pch',0606);
			}
	}
}
// 情報データをファイルに書き込む
file_put_contents(SAVE_DIR.$imgfile.".dat",$userdata,LOCK_EX);
if(!is_file(SAVE_DIR.$imgfile.'.dat')){
	die("error\nYour picture upload failed! Please try again!");
}
chmod(SAVE_DIR.$imgfile.'.dat',PERMISSION_FOR_LOG);

die("ok");
