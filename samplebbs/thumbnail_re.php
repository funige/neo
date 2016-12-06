<?php
//サムネイル作成
function thumb($path,$tim,$ext,$max_w,$max_h){
	$realrepng2jpeg = realpath("./")."/repng2jpeg";
	//$realrepng2jpeg = "./repng2jpeg";
	if(!is_executable($realrepng2jpeg))return;
	$fname = $path.$tim.$ext;
	$thumb_name = THUMB_DIR.$tim.'s'; //サムネイルファイル名
	$fsize = filesize($fname); // ファイルサイズを取得
	$size = @GetImageSize($fname); // 画像の幅と高さとタイプを取得
	// リサイズ
	if($size[0] > $max_w || $size[1] > $max_h){
		$key_w = (float)$max_w / $size[0];
		$key_h = (float)$max_h / $size[1];
		($key_w < $key_h) ? $keys = $key_w : $keys = $key_h;
		$w = ceil($size[0] * $keys);
		$h = ceil($size[1] * $keys);
	}elseif(FORCED_THUMB && $fsize > (IMG_SIZE*1024)){ //指定KBより大きければ強制サムネイル
		$w = $size[0];
		$h = $size[1];
	}else{return;}

	// サムネイル画像を保存
	// 2004/11/22: gif2png を破棄。repng2jpeg1.0.4 を使用
	@system($realrepng2jpeg." $fname $thumb_name.jpg $w $h ".THUMB_Q);
	if(@is_file($thumb_name.'.jpg')) chmod($thumb_name.'.jpg',0666);
}
?>