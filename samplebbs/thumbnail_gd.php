<?php
//サムネイル作成
function thumb($path,$tim,$ext,$max_w,$max_h){
	if(!function_exists("ImageCreate")||!function_exists("ImageCreateFromJPEG"))return;
	$fname=$path.$tim.$ext;
	$fsize = filesize($fname);    // ファイルサイズを取得
	$size = GetImageSize($fname); // 画像の幅と高さとタイプを取得
	// リサイズ
	if($size[0] > $max_w || $size[1] > $max_h){
		$key_w = $max_w / $size[0];
		$key_h = $max_h / $size[1];
		($key_w < $key_h) ? $keys = $key_w : $keys = $key_h;
		$out_w = ceil($size[0] * $keys) +1;
		$out_h = ceil($size[1] * $keys) +1;
	}elseif(FORCED_THUMB && $fsize > (IMG_SIZE*1024)){ //指定KBより大きければ強制サムネイル
		$out_w = $size[0];
		$out_h = $size[1];
	}else{return;}

	switch ($size[2]) {
		case 1 :
			if(function_exists("ImageCreateFromGIF")){
				$im_in = @ImageCreateFromGIF($fname);
				if($im_in)break;
			}
			// 2004/11/22: gif2png を破棄。repng2jpeg1.0.4 を使用
			if(!is_executable(realpath("./")."/repng2jpeg")||!function_exists("ImageCreateFromPNG"))return;
			@system(realpath("./")."/repng2jpeg $fname ".$path.$tim.'.png Z 1 P');
			if(!file_exists($path.$tim.'.png'))return;
			$im_in = @ImageCreateFromPNG($path.$tim.'.png');
			unlink($path.$tim.'.png');
			if(!$im_in)return;
			break;
		case 2 :
			$im_in = @ImageCreateFromJPEG($fname);
			if(!$im_in)return;
			break;
		case 3 :
			if(!function_exists("ImageCreateFromPNG"))return;
			$im_in = @ImageCreateFromPNG($fname);
			if(!$im_in)return;
			break;
		default : return;
	}
	// 出力画像（サムネイル）のイメージを作成
	$nottrue = 0;
	if(function_exists("ImageCreateTrueColor")&&get_gd_ver()=="2"){
		$im_out = ImageCreateTrueColor($out_w, $out_h);
		// コピー＆再サンプリング＆縮小
		if(function_exists("ImageCopyResampled")&&RE_SAMPLED){
			ImageCopyResampled($im_out, $im_in, 0, 0, 0, 0, $out_w, $out_h, $size[0], $size[1]);
		}else{$nottrue = 1;}
	}else{$im_out = ImageCreate($out_w, $out_h);$nottrue = 1;}
	// コピー＆縮小
	if($nottrue) ImageCopyResized($im_out, $im_in, 0, 0, 0, 0, $out_w, $out_h, $size[0], $size[1]);
	// サムネイル画像を保存
	ImageJPEG($im_out, THUMB_DIR.$tim.'s.jpg',THUMB_Q);
	chmod(THUMB_DIR.$tim.'s.jpg',0666);
	// 作成したイメージを破棄
	ImageDestroy($im_in);
	ImageDestroy($im_out);
}
?>
