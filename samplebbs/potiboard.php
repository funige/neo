<?php
/*
  *
  * POTI-board改 v1.43 lot.180713
  *   (C)sakots >> https://sakots.red/poti/
  *
  *----------------------------------------------------------------------------------
  * ORIGINAL SCRIPT
  *   POTI-board v1.32
  *     (C)SakaQ >> http://www.punyu.net/php/
  *   futaba.php v0.8 lot.031015 (gazou.php v3.0 CUSTOM)
  *     (C)futaba >> http://www.2chan.net/ ((C)ToR >> http://php.s3.to/)
  *
  * OEKAKI APPLET :
  *   PaintBBS   (test by v2.22_8)
  *   ShiPainter (test by v1.071all)
  *   PCHViewer  (test by v1.12)
  *     (C)shi-chan >> http://hp.vector.co.jp/authors/VA016309/
  *
  * USE FUNCTION :
  *   HTML template         (C)H.Ayukawa >> http://hoover.ktplan.ne.jp/kaihatsu/php/
  *   DynamicPalette        (C)NoraNeko  >> http://wondercatstudio.com/
  *   repng2jpeg            (C)SUGA      >> http://sugachan.dip.jp/
  *----------------------------------------------------------------------------------

このスクリプトは「レッツPHP!」<http://php.s3.to/>のgazou.phpを改造した、
「ふたば★ちゃんねる」<http://www.2chan.net/>のfutaba.phpを
さらにお絵かきもできるようにして、HTMLテンプレートでデザイン変更できるように改造した
「ぷにゅねっと」<http://www.punyu.net/php/>のPOTI-boardを、
さらにphp7で動くように改造したものです。

配布条件はレッツPHP!に準じます。改造、再配布は自由にどうぞ。

このスクリプトの改造部分に関する質問は「レッツPHP!」,
「ふたば★ちゃんねる」「ぷにゅねっと」に問い合わせないでください。
ご質問は、<https://sakots.red/nee/>までどうぞ。
*/
if(phpversion()>="4.1.0"){
	extract($_POST);
	extract($_GET);
	extract($_COOKIE);
	extract($_SERVER);
	if (isset($_FILES["upfile"]["name"])) {
		$upfile_name=$_FILES["upfile"]["name"];
	}
	if (isset($_FILES["upfile"]["tmp_name"])) {
		$upfile=$_FILES["upfile"]["tmp_name"];
	}
}
//設定の読み込み
require("config.php");
//HTMLテンプレートクラス(htmltemplate_oo 0.3.1)
require("htmltemplate.inc");
//Template設定ファイル
require("template_ini.php");

$path = realpath("./").'/'.IMG_DIR;
$temppath = realpath("./").'/'.TEMP_DIR;

//サムネイルfunction
if((THUMB_SELECT==0 && gd_check()) || THUMB_SELECT==1){
	require("thumbnail_gd.php");
}else{
	require("thumbnail_re.php");
}

//MB関数を使うか？ 使う:1 使わない:0
define('USE_MB' , '1');

//バージョン
define('POTI_VER' , '改 v1.43');
define('POTI_VERLOT' , '改 v1.43 lot.180713');

//メール通知クラスのファイル名
define('NOTICEMAIL_FILE' , 'noticemail.inc');
//アプレットヘルプのファイル名
define('SIIHELP_FILE' , 'siihelp.php');

switch(CHARSET_OUT){
	case 1 : $charset="EUC-JP";break;
	case 2 : $charset="Shift_JIS";break;
	case 3 : $charset="ISO-2022-JP";break;
	case 4 : $charset="UTF-8";break;
	default : $charset=CHARSET_OUT;
}
define('CHARSET_HTML', $charset);

//----------htmltemplateタグ定義
//{$hoge}
//rvalじゃ長いので$で定義
class tag_rval2 extends DataTag{
var $matchregexp='/\{\$([^\}]+)\}/i';
var $fromstring="{\$%s}";
var $tostring="<?php @print \$val%1\$s; ?>\n";
}
//<!--{def hoge}-->～<!--{/def}-->
//旧タイプに再定義
class tag_def2 extends ArrayTag{
var $matchregexp='/<!--\{def ([^\}]+)\}-->/i';
var $fromstring="<!--{def %s}-->";
var $tostring="<?php
if(@\$val%1\$s &&((gettype(\$val%1\$s)!='array' && \$val%1\$s!=\"\") or (gettype(\$val%1\$s)=='array' && count(\$val%1\$s)>0))){ ?>";
var $closestring="<!--{/def}-->";
}
//<!--{ndef hoge}-->～<!--{/ndef}-->
//再定義(hogeが空(0も含む)の場合に、タグの間の～部分を表示する。defの逆)
class tag_ndef2 extends ArrayTag{
var $matchregexp='/<!--\{ndef ([^\}]+)\}-->/i';
var $fromstring="<!--{ndef %s}-->";
var $tostring="<?php
if(!(@\$val%1\$s &&((gettype(\$val%1\$s)!='array' && \$val%1\$s!=\"\") or (gettype(\$val%1\$s)=='array' && count(\$val%1\$s)>0)))){ ?>";
var $closestring="<!--{/ndef}-->";
}
//<!--{vdef hoge}-->～<!--{/vdef}-->
//新タイプ(0もある物とみなす)で再定義
class tag_vdef2 extends ArrayTag{
var $matchregexp='/<!--\{vdef ([^\}]+)\}-->/i';
var $fromstring="<!--{vdef %s}-->";
var $tostring="<?php
if(@count(\$val%1\$s) && (is_array(\$val%1\$s) || strlen(\$val%1\$s))){ ?>";
var $closestring="<!--{/vdef}-->";
}
//<!--{ifeq hoge:val}-->～<!--{/ifeq}-->
// hoge = val の場合、タグの間の～部分を表示する
class tag_ifeq extends DataTag{
var $matchregexp='/<!--\{ifeq ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{ifeq %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s == '%3\$s'){ ?>";
var $closestring="<!--{/ifeq}-->";
}
//<!--{ifne hoge:val}-->～<!--{/ifne}-->
// hoge != val の場合、タグの間の～部分を表示する
class tag_ifne extends DataTag{
var $matchregexp='/<!--\{ifne ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{ifne %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s != '%3\$s'){ ?>";
var $closestring="<!--{/ifne}-->";
}
//<!--{iflt hoge:val}-->～<!--{/iflt}-->
// hoge < val の場合、タグの間の～部分を表示する
class tag_iflt extends DataTag{
var $matchregexp='/<!--\{iflt ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{iflt %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s < '%3\$s'){ ?>";
var $closestring="<!--{/iflt}-->";
}
//<!--{ifgt hoge:val}-->～<!--{/ifgt}-->
// hoge > val の場合、タグの間の～部分を表示する
class tag_ifgt extends DataTag{
var $matchregexp='/<!--\{ifgt ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{ifgt %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s > '%3\$s'){ ?>";
var $closestring="<!--{/ifgt}-->";
}
//<!--{ifle hoge:val}-->～<!--{/ifle}-->
// hoge <= val の場合、タグの間の～部分を表示する
class tag_ifle extends DataTag{
var $matchregexp='/<!--\{ifle ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{ifle %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s <= '%3\$s'){ ?>";
var $closestring="<!--{/ifle}-->";
}
//<!--{ifge hoge:val}-->～<!--{/ifge}-->
// hoge >= val の場合、タグの間の～部分を表示する
class tag_ifge extends DataTag{
var $matchregexp='/<!--\{ifge ([^\}:]+):([^\}:]+)\}-->/i';
var $fromstring="<!--{ifge %1\$s:%2\$s}-->";
var $tostring="<?php
if(\$val%1\$s >= '%3\$s'){ ?>";
var $closestring="<!--{/ifge}-->";
}
//{?}
//通常はエスケープさせないでスルー
class q_escape extends DataTag{
var $matchregexp='/\{\?\}/i';
var $fromstring="{?}";
var $tostring="?";
}
//メインの書込み時のみエスケープ
class q_escape2 extends DataTag{
var $matchregexp='/\{\?\}/i';
var $fromstring="{?}";
var $tostring="<?php @print '?'; ?>";
}
//<!--(～)-->
//～部分を表示しない
class tag_comment2 extends ArrayTag{
var $matchregexp='/<!--\(/i';
var $fromstring="<!--(";
var $tostring="<?php if(FALSE){?>";
var $closestring=")-->";
}

htmltemplate::removeTag("tag_rval");
htmltemplate::removeTag("tag_def");
htmltemplate::removeTag("tag_ndef");
htmltemplate::removeTag("tag_vdef");
htmltemplate::addTag("tag_rval2");
htmltemplate::addTag("tag_def2");
htmltemplate::addTag("tag_ndef2");
htmltemplate::addTag("tag_vdef2");
htmltemplate::addTag("tag_ifeq");
htmltemplate::addTag("tag_ifne");
htmltemplate::addTag("tag_iflt");
htmltemplate::addTag("tag_ifgt");
htmltemplate::addTag("tag_ifle");
htmltemplate::addTag("tag_ifge");
htmltemplate::addTag("q_escape");
htmltemplate::addTag("tag_comment2");

//GD版が使えるかチェック
function gd_check(){
	$flag = true;
	$check = array("ImageCreate","ImageCopyResized","ImageCreateFromJPEG","ImageJPEG","ImageDestroy");

	//最低限のGD関数が使えるかチェック
	if(get_gd_ver() && (ImageTypes() & IMG_JPG)){
		foreach ( $check as $cmd ) {
			if(!function_exists($cmd)){$flag=false; break;}
		}
	}else{$flag=false;}

	return $flag;
}

//gdのバージョンを調べる
function get_gd_ver(){
	if(function_exists("gd_info")){
		$gdver=gd_info();
		$phpinfo=$gdver["GD Version"];
	}else{ //php4.3.0未満用
		ob_start();
		phpinfo(8);
		$phpinfo=ob_get_contents();
		ob_end_clean();
		$phpinfo=strip_tags($phpinfo);
		$phpinfo=stristr($phpinfo,"gd version");
		$phpinfo=stristr($phpinfo,"version");
	}
	$end=strpos($phpinfo,".");
	$phpinfo=substr($phpinfo,0,$end);
	$length = strlen($phpinfo)-1;
	$phpinfo=substr($phpinfo,$length);
	return $phpinfo;
}

/* ヘッダ */
function head(&$dat){
	$dat['title'] = TITLE;
	$dat['home']  = HOME;
	$dat['self']  = PHP_SELF;
	$dat['self2'] = PHP_SELF2;
	$dat['paint'] = USE_PAINT ? true : false;

	$dat['applet'] = APPLET ? true : false;
	$dat['usepbbs'] = APPLET!=1 ? true : false;

	$dat['ver'] = POTI_VER;
	$dat['verlot'] = POTI_VERLOT;
	$dat['tver'] = TEMPLATE_VER;

	$dat['userdel'] = USER_DEL;
	$dat['charset'] = CHARSET_HTML;
}

/* 投稿フォーム */
function form(&$dat,$resno,$admin="",$tmp=""){
	global $addinfo,$stime;
	global $fontcolors,$undo,$undo_in_mg,$quality,$qualitys;

	$dat['form'] = true;
	if(USE_PAINT){
		$dat['palette'] = '';
		$lines = file(PALETTEFILE);
		foreach ( $lines as $line ) {
			$line=preg_replace("/[\t\r\n]/","",$line);
			list($pid,$pname,) = explode(",", $line);
			$dat['palette'] .= '<option value="'.$pid.'">'.CleanStr($pname)."</option>\n";
		}
		$dat['pdefw'] = PDEF_W;
		$dat['pdefh'] = PDEF_H;
		$dat['anime'] = USE_ANIME ? true : false;
		$dat['animechk'] = DEF_ANIME ? ' checked' : '';
		$dat['pmaxw'] = PMAX_W;
		$dat['pmaxh'] = PMAX_H;
		if(USE_PAINT==2 && !$resno && !$admin){
			$dat['paint2'] = true;
			$dat['form'] = false;
		}
	}

	if($resno){
		$dat['resno'] = $resno;
		if(RES_UPLOAD) $dat['paintform'] = true;
	}else{
		$dat['paintform'] = true;
		$dat['notres'] = true;
	}

	if($admin) $dat['admin'] = ADMIN_PASS;

	if($stime && DSP_PAINTTIME){
		//描画時間
		$ptime = '';
		if($stime){
			$psec = time()-$stime;
			if($psec >= 86400){
				$D = intval($psec/86400);
				$ptime .= $D.PTIME_D;
				$psec -= $D*86400;
			}
			if($psec >= 3600){
				$H = intval($psec/3600);
				$ptime .= $H.PTIME_H;
				$psec -= $H*3600;
			}
			if($psec >= 60){
				$M = intval($psec/60);
				$ptime .= $M.PTIME_M;
				$psec -= $M*60;
			}
			if($psec){
				$ptime .= $psec.PTIME_S;
			}
		}
		$dat['ptime'] = $ptime;
	}

	$dat['maxbyte'] = MAX_KB * 1024;
	$dat['usename'] = USE_NAME ? ' *' : '';
	$dat['usesub']  = USE_SUB ? ' *' : '';
	if(USE_COM||$resno) $dat['usecom'] = ' *';
	if((!$resno && !$tmp) || (RES_UPLOAD && !$tmp)) $dat['upfile'] = true;
	$dat['maxkb']   = MAX_KB;
	$dat['maxw']    = $resno ? MAX_RESW : MAX_W;
	$dat['maxh']    = $resno ? MAX_RESH : MAX_H;
	$dat['addinfo'] = $addinfo;
	$dat['potitag'] = USE_POTITAG ? true : false;

	//文字色
	if(USE_FONTCOLOR){
		foreach ( $fontcolors as $fontcolor ){
			list($color,$name) = explode(",", $fontcolor);
			$dat['fctable'][] = compact('color','name');
		}
	}

	//アプレット設定
	$dat['undo'] = $undo ? $undo : UNDO;
	$dat['undo_in_mg'] = $undo_in_mg ? $undo_in_mg : UNDO_IN_MG;
	$qline='';
	foreach ( $qualitys as $q ){
		$selq = ($q == $quality) ? ' selected' : '';
		$qline .= '<option value='.$q.$selq.'>'.$q."</option>\n";
	}
	$dat['qualitys'] = $qline;
}

/* 記事部分 */
function updatelog($resno=0){
	global $path;

	$tree = file(TREEFILE);
	$find = false;
	if($resno){
		$counttree=count($tree);
		for($i = 0;$i<$counttree;$i++){
			list($artno,)=explode(",",rtrim($tree[$i]));
			if($artno==$resno){$st=$i;$find=true;break;} //レス先検索
		}
		if(!$find) error(MSG001);
	}
	$line = file(LOGFILE);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){
		list($no,) = explode(",", $line[$i]);
		$lineindex[$no]=$i + 1; //逆変換テーブル作成
	}

	$counttree = count($tree);
	for($page=0;$page<$counttree;$page+=PAGE_DEF){
		$oya = 0;	//親記事のメイン添字
		head($dat);
		form($dat,$resno);
		if(!$resno){
			$st = $page;
		}
		for($i = $st; $i < $st+PAGE_DEF; $i++){
			if($tree[$i]=="") continue;
			$treeline = explode(",", rtrim($tree[$i]));
			$disptree = $treeline[0];
			$j=$lineindex[$disptree] - 1; //該当記事を探して$jにセット
			if($line[$j]=="") continue;   //$jが範囲外なら次の行
			list($no,$now,$name,$email,$sub,$com,$url,
				 $host,$pwd,$ext,$w,$h,$time,$chk,$ptime,$fcolor) = explode(",", rtrim(charconvert($line[$j],CHARSET_IN)));
			// URLとメールにリンク
			//if($email) $name = "<a href=\"mailto:$email\">$name</a>";
			if(AUTOLINK) $com = auto_link($com);
			// '>'色設定
			$com = preg_replace("/(^|>)((&gt;|＞)[^<]*)/i", "\\1".RE_START."\\2".RE_END, $com);
			// 画像ファイル名
			$img = $path.$time.$ext;
			// 画像系変数セット
			if($ext && @is_file($img)){
				$src = IMG_DIR.$time.$ext;
				$srcname = $time.$ext;
				$size = filesize($img);
				if($w && $h){	//サイズがある時
					if(@is_file(THUMB_DIR.$time.'s.jpg')){
						$thumb = true;
						$imgsrc = THUMB_DIR.$time.'s.jpg';
					}else{
						$imgsrc = $src;
					}
				}
				//描画時間
				if(DSP_PAINTTIME) $painttime = $ptime;
				//動画リンク
				if(USE_ANIME){
					if(@file_exists(PCH_DIR.$time.'.pch'))
						$pch = $time.$ext;
					if(@file_exists(PCH_DIR.$time.'.spch'))
						$pch = $time.$ext.'&amp;shi=1';
				}
				//コンティニュー
				if(USE_CONTINUE){
					//if(@file_exists(PCH_DIR.$time.'.pch')||@file_exists(PCH_DIR.$time.'.spch')||$ext=='.jpg')
						$continue = $no;
				}
			}
			// そろそろ消える。
			if($lineindex[$no]-1 >= LOG_MAX*LOG_LIMIT/100) $limit = true;
			// ミニフォーム用
			if(USE_RESUB) $resub = 'Re: '.$sub;
			// レス省略
			if(!$resno){
				$s=count($treeline) - DSP_RES;
				if(ADMIN_NEWPOST&&!DSP_RES) {$skipres = $s - 1;}
				elseif($s<1 || !DSP_RES) {$s=1;}
				elseif($s>1) {$skipres = $s - 1;}
				//レス画像数調整
				if(RES_UPLOAD){
					//画像テーブル作成
					$imgline=array();
					for($k = $s; $k < count($treeline); $k++){
						$disptree = $treeline[$k];
						$j=$lineindex[$disptree] - 1;
						if($line[$j]=="") continue;
						list(,,,,,,,,,$rext,,,$rtime,,,) = explode(",", rtrim($line[$j]));
						$resimg = $path.$rtime.$rext;
						if($rext && @is_file($resimg)){ $imgline[]='img'; }else{ $imgline[]='0'; }
					}
					$resimgs = array_count_values($imgline);
					while($resimgs['img'] > DSP_RESIMG){
						while($imgline[0]='0'){ //画像付きレスが出るまでシフト
							array_shift($imgline);
							$s++;
						}
						array_shift($imgline); //画像付きレス1つシフト
						$s++;
						$resimgs = array_count_values($imgline);
					}
					if($s>1) $skipres = $s - 1; //再計算
				}
			}else{
				$s=1;
				$dat['resub'] = $resub; //レス画面用
			}
			//日付とIDを分離
			if(preg_match("/( ID:)(.*)/",$now,$regs)){
				$id=$regs[2];
				$now=preg_replace("/( ID:.*)/","",$now);
			}else{$id='';}
			//日付と編集マークを分離
			$updatemark='';
			if(UPDATE_MARK){
				if(strstr($now,UPDATE_MARK)){
					$updatemark = UPDATE_MARK;
					$now=str_replace(UPDATE_MARK,"",$now);
				}
			}
			//名前とトリップを分離
			$name=strip_tags($name);//タグ除去
			if(preg_match("/(◆.*)/",$name,$regs)){
				$trip=$regs[1];
				$name=preg_replace("/(◆.*)/","",$name);
			}else{$trip='';}
			//TAB
			$tab=$oya+1;
			//文字色
			$fontcolor = $fcolor ? $fcolor : DEF_FONTCOLOR;
			//<br />を<br>へ
			$com = preg_replace("{<br( *)/>}i","<br>",$com);
			//独自タグ変換
			if(USE_POTITAG) $com = potitag($com);

			// 親記事格納
			$dat['oya'][$oya] = compact('src','srcname','size','painttime','pch','continue','thumb','imgsrc','w','h','no','sub','name','now','com','limit','skipres','resub','url','email','id','updatemark','trip','tab','fontcolor');
			// 変数クリア
			unset($src,$srcname,$size,$painttime,$pch,$continue,$thumb,$imgsrc,$w,$h,$no,$sub,$name,$now,$com,$limit,$skipres,$resub,$url,$email);

			//レス作成
			for($k = $s; $k < count($treeline); $k++){
				$disptree = $treeline[$k];
				$j=$lineindex[$disptree] - 1;
				if($line[$j]=="") continue;
				list($no,$now,$name,$email,$sub,$com,$url,
						 $host,$pwd,$ext,$w,$h,$time,$chk,$ptime,$fcolor) = explode(",", rtrim(charconvert($line[$j],CHARSET_IN)));
				// URLとメールにリンク
				//if($email) $name = "<a href=\"mailto:$email\">$name</a>";
				if(AUTOLINK) $com = auto_link($com);
				// '>'色設定
				$com = preg_replace("/(^|>)((&gt;|＞)[^<]*)/i", "\\1".RE_START."\\2".RE_END, $com);

				// ---------- レス画像対応 ----------
				// 画像ファイル名
				$img = $path.$time.$ext;
				// 画像系変数セット
				if($ext && @is_file($img)){
					$src = IMG_DIR.$time.$ext;
					$srcname = $time.$ext;
					$size = filesize($img);
					if($w && $h){	//サイズがある時
						if(@is_file(THUMB_DIR.$time.'s.jpg')){
							$thumb = true;
							$imgsrc = THUMB_DIR.$time.'s.jpg';
						}else{
							$imgsrc = $src;
						}
					}
					//描画時間
					if(DSP_PAINTTIME) $painttime = $ptime;
					//動画リンク
					if(USE_ANIME){
						if(@file_exists(PCH_DIR.$time.'.pch'))
							$pch = $time.$ext;
						if(@file_exists(PCH_DIR.$time.'.spch'))
							$pch = $time.$ext.'&amp;shi=1';
					}
					//コンティニュー
					if(USE_CONTINUE){
						//if(@file_exists(PCH_DIR.$time.'.pch')||@file_exists(PCH_DIR.$time.'.spch')||$ext=='.jpg')
							$continue = $no;
					}
				}

				//日付とIDを分離
				if(preg_match("/( ID:)(.*)/",$now,$regs)){
					$id=$regs[2];
					$now=preg_replace("/( ID:.*)/","",$now);
				}else{$id='';}
				//日付と編集マークを分離
				$updatemark='';
				if(UPDATE_MARK){
					if(strstr($now,UPDATE_MARK)){
						$updatemark = UPDATE_MARK;
						$now=str_replace(UPDATE_MARK,"",$now);
					}
				}
				//名前とトリップを分離
				$name=strip_tags($name);//タグ除去
				if(preg_match("/(◆.*)/",$name,$regs)){
					$trip=$regs[1];
					$name=preg_replace("/(◆.*)/","",$name);
				}else{$trip='';}
				//文字色
				$fontcolor = $fcolor ? $fcolor : DEF_FONTCOLOR;
				//<br />を<br>へ
				$com = preg_replace("{<br( *)/>}i","<br>",$com);
				//独自タグ変換
				if(USE_POTITAG) $com = potitag($com);

				// レス記事一時格納
				$rres[$oya][] = compact('no','sub','name','now','com','url','email','id','updatemark','trip','fontcolor'
								,'src','srcname','size','painttime','pch','continue','thumb','imgsrc','w','h');
				// 変数クリア
				unset($no,$sub,$name,$now,$com,$url,$email
						,$src,$srcname,$size,$painttime,$pch,$continue,$thumb,$imgsrc,$w,$h);
			}
			// レス記事一括格納
			$dat['oya'][$oya]['res'] = $rres[$oya];
			unset($rres); //クリア
			clearstatcache(); //ファイルのstatをクリア
			$oya++;
			if($resno){break;} //res時はtree1行だけ
		}

		if(!$resno){ //res時は表示しない
			$prev = $st - PAGE_DEF;
			$next = $st + PAGE_DEF;
			// 改ページ処理
			if($prev >= 0){
				if($prev==0){
					$dat['prev'] = PHP_SELF2;
				}else{
					$dat['prev'] = $prev/PAGE_DEF.PHP_EXT;
				}
			}
			$paging = "";
			for($i = 0; $i < count($tree) ; $i+=PAGE_DEF){
				if($st==$i){
					$pformat = str_replace("<PAGE>", $i/PAGE_DEF, NOW_PAGE);
				}else{
					if($i==0){
						$pno = str_replace("<PAGE>", "0", OTHER_PAGE);
						$pformat = str_replace("<PURL>", PHP_SELF2, $pno);
					}else{
						$pno = str_replace("<PAGE>", $i/PAGE_DEF, OTHER_PAGE);
						$pformat = str_replace("<PURL>", ($i/PAGE_DEF).PHP_EXT, $pno);
					}
				}
				$paging.=$pformat;
			}
			$dat['paging'] = $paging;
			if($oya >= PAGE_DEF && count($tree) > $next){
				$dat['next'] = $next/PAGE_DEF.PHP_EXT;
			}
		}

		if($resno){htmloutput(RESFILE,$dat);break;}

		$dat['resform'] = RES_FORM ? true : false;

		htmltemplate::removeTag("q_escape");
		htmltemplate::addTag("q_escape2");
		$buf = htmloutput(MAINFILE,$dat,true);
		if($page==0){$logfilename=PHP_SELF2;}
			else{$logfilename=$page/PAGE_DEF.PHP_EXT;}
		$fp = fopen($logfilename, "w");
		set_file_buffer($fp, 0);
		flock($fp, 2); //*
		rewind($fp);
		fputs($fp, $buf);
		fclose($fp);
		//@chmod($logfilename,0666);
		//拡張子を.phpにした場合、↑で500エラーでるなら↓に変更
		if(PHP_EXT!='.php'){@chmod($logfilename,0666);}
		unset($dat); //クリア
	}
	if(!$resno&&@is_file(($page/PAGE_DEF+1).PHP_EXT)){unlink(($page/PAGE_DEF+1).PHP_EXT);}
}

/* オートリンク */
function auto_link($proto){
	$proto = preg_replace("{(https?|ftp|news)(://[[:alnum:]\+\$\;\?\.%,!#~*/:@&=_-]+)}","<a href=\"\\1\\2\" target=\"_blank\" rel=\"nofollow noopener noreferrer\">\\1\\2</a>",$proto);
	return $proto;
}

/* 日付 */
function now_date($time){
	$youbi = array('日','月','火','水','木','金','土');
	$yd = $youbi[gmdate("w", $time+9*60*60)] ;
	$now = gmdate(DATE_FORMAT, $time+9*60*60);
	$now = str_replace("<1>", $yd, $now); //漢字の曜日セット1
	$now = str_replace("<2>", $yd.'曜', $now); //漢字の曜日セット2
	return $now;
}

/* エラー画面 */
function error($mes,$dest=''){
	if(@is_file($dest)) unlink($dest);
	$dat['err_mode'] = true;
	head($dat);
	$dat['mes'] = $mes;
	htmloutput(OTHERFILE,$dat);
	exit;
}

function proxy_connect($port) {
	$fp = fsockopen (getenv("REMOTE_ADDR"), $port,$a,$b,2);
	if(!$fp){return 0;}else{return 1;}
}

/* 文字列の類似性を見積もる */
function similar_str($str1,$str2){
	similar_text($str1, $str2, $p);
	return $p;
}

/* 記事書き込み */
function regist($name,$email,$sub,$com,$url,$pwd,$upfile,$upfile_name,$resto,$pictmp,$picfile){
	global $path,$badstring,$badstring_and_url,$badfile,$badip,$pwdc,$textonly;
	global $REQUEST_METHOD,$temppath,$ptime;
	global $fcolor,$usercode;

	// 時間
	$time = time();
	$tim = $time.substr(microtime(),2,3);

	// お絵かき絵アップロード処理
	if($pictmp==2){
		if(!$picfile) error(MSG002);
		$upfile = $temppath.$picfile;
		$upfile_name = $picfile;
		$picfile = str_replace(strrchr($picfile,"."),"",$picfile); //拡張子除去
		$tim = KASIRA.$tim;
		//選択された絵が投稿者の絵か再チェック
		if(@file_exists($temppath.$picfile.".dat")){
			$fp = fopen($temppath.$picfile.".dat", "r");
			$userdata = fread($fp, 1024);
			fclose($fp);
			list($uip,$uhost,,,$ucode,) = explode("\t", rtrim($userdata));
			$userip = getenv("HTTP_CLIENT_IP");
			if(!$userip) $userip = getenv("HTTP_X_FORWARDED_FOR");
			if(!$userip) $userip = getenv("REMOTE_ADDR");
			if(($ucode != $usercode) && (IP_CHECK && $uip != $userip)){error(MSG007);}
		}else{error(MSG007);}
	}

	if($upfile&&@file_exists($upfile)){
		$dest = $path.$tim.'.tmp';
		if($pictmp==2){
			copy($upfile, $dest);
		}else{
			move_uploaded_file($upfile, $dest);
			//↑でエラーなら↓に変更
			//copy($upfile, $dest);
		}
		$upfile_name = CleanStr($upfile_name);
		if(!@file_exists($dest)) error(MSG003,$dest);
		if(filesize($dest) > MAX_KB * 1024) error(MSG034,$dest);	//追加(v1.32)
		$size = getimagesize($dest);
		if(!is_array($size)) error(MSG004,$dest);
		$chk = md5_of_file($dest);
		foreach($badfile as $value){if(preg_match("/^$value/",$chk)){
			error(MSG005,$dest); //拒絶画像
		}}
		@chmod($dest,0666);
		$W = $size[0];
		$H = $size[1];

		switch ($size[2]) {
//gif画像を拒否		case 1 : $ext=".gif";break;
			case 2 : $ext=".jpg";break;
			case 3 : $ext=".png";break;
			default : error(MSG004,$dest);
		}

		// 画像表示縮小
		$max_w = $resto ? MAX_RESW : MAX_W;
		$max_h = $resto ? MAX_RESH : MAX_H;
		if($W > $max_w || $H > $max_h){
			$W2 = $max_w / $W;
			$H2 = $max_h / $H;
			($W2 < $H2) ? $key = $W2 : $key = $H2;
			$W = ceil($W * $key);
			$H = ceil($H * $key);
		}
		$mes = "画像 $upfile_name のアップロードが成功しました<br><br>";
	}

	$name  = charconvert($name ,CHARSET_IN);
	$sub   = charconvert($sub  ,CHARSET_IN);
	$com   = charconvert($com  ,CHARSET_IN);
	$email = charconvert($email,CHARSET_IN);
	$url   = charconvert($url  ,CHARSET_IN);
	$ptime = charconvert($ptime,CHARSET_IN);

	foreach($badstring as $value){if(preg_match("/$value/i",$com)||preg_match("/$value/i",$sub)||preg_match("/$value/i",$name)||preg_match("/$value/i",$email)){error(MSG032,$dest);};}
	if($REQUEST_METHOD != "POST") error(MSG006,$dest);

//指定文字列+本文へのURL書き込みで拒絶
	foreach($badstring_and_url as $value){if(preg_match("/$value/i",$com) && preg_match('/:\/\//i', $com)||preg_match("/$value/i",$sub) && preg_match('/:\/\//i', $com) > '0'){error(MSG032,$dest);};}

	// フォーム内容をチェック
	if(!$name||preg_match("/^[ |　|]*$/",$name)) $name="";
	if(!$com||preg_match("/^[ |　|\t]*$/",$com)) $com="";
	if(!$sub||preg_match("/^[ |　|]*$/",$sub))   $sub="";
	if(!$url||preg_match("/^[ |　|]*$/",$url))   $url="";

//	if(!$resto&&!$textonly&&!@is_file($dest)) error(MSG007,$dest);
//	if(RES_UPLOAD&&$resto&&!$textonly&&!@is_file($dest)) error(MSG007,$dest);
	if(!$resto&&!@is_file($dest)) error(MSG007,$dest);

	if(!$com&&!@is_file($dest)) error(MSG008,$dest);

	if(USE_NAME&&!$name) error(MSG009,$dest);
	if(USE_COM&&!$com) error(MSG008,$dest);
	if(USE_SUB&&!$sub) error(MSG010,$dest);

	//$name=preg_replace("/管理/","\"管理\"",$name);
	//$name=preg_replace("/削除/","\"削除\"",$name);

	if(strlen($com) > MAX_COM) error(MSG011,$dest);
	if(strlen($name) > MAX_NAME) error(MSG012,$dest);
	if(strlen($email) > MAX_EMAIL) error(MSG013,$dest);
	if(strlen($sub) > MAX_SUB) error(MSG014,$dest);
	if(strlen($resto) > 10) error(MSG015,$dest);

	//本文に日本語がなければ拒絶
        if (USE_JAPANESEFILTER) {
                mb_regex_encoding("UTF-8");
                if (strlen($com) > 0 && !preg_match("/[ぁ-んァ-ヶー一-龠]+/u",$com)) error(MSG035,$dest);
        }

	//本文へのURLの書き込みを禁止
	if(DENY_COMMENTS_URL && preg_match('/:\/\/|\.co|\.ly|\.gl|\.net|\.org|\.cc|\.ru|\.su|\.ua|\.gd/i', $com) > '0' ) error(MSG036,$dest);

	//ホスト取得
	$host = gethostbyaddr(getenv("REMOTE_ADDR"));

	foreach($badip as $value){ //拒絶host
		if(preg_match("/$value$/i",$host)) error(MSG016,$dest);
	}
	if(preg_match("/^mail/i",$host)
	|| preg_match("/^ns/i",$host)
	|| preg_match("/^dns/i",$host)
	|| preg_match("/^ftp/i",$host)
	|| preg_match("/^prox/i",$host)
	|| preg_match("/^pc/i",$host)
	|| preg_match("/^[^\.]\.[^\.]$/i",$host)){
		$pxck = "on";
	}
	if(preg_match("/ne\\.jp$/i",$host)
	|| preg_match("/ad\\.jp$/i",$host)
	|| preg_match("/bbtec\\.net$/i",$host)
	|| preg_match("/aol\\.com$/i",$host)
	|| preg_match("/uu\\.net$/i",$host)
	|| preg_match("/asahi-net\\.or\\.jp$/i",$host)
	|| preg_match("/rim\\.or\\.jp$/i",$host)){
		$pxck = "off";
	}else{
		$pxck = "on";
	}

	if($pxck=="on" && PROXY_CHECK){
		if(proxy_connect('80') == 1){
			error(MSG017,$dest);
		}elseif(proxy_connect('8080') == 1){
			error(MSG018,$dest);
		}
	}

	// No.とパスと時間とURLフォーマット
	srand((double)microtime()*1000000);
	if($pwd==""){
		if($pwdc==""){
			$pwd=rand();$pwd=substr($pwd,0,8);
		}else{
			$pwd=$pwdc;
		}
	}

	$c_pass = $pwd;
	$pass = ($pwd) ? substr(md5($pwd),2,8) : "*";
	$now = now_date($time);//日付取得
	if(DISP_ID){
		if($email&&DISP_ID==1){
			$now .= " ID:???";
		}else{
			$now .= " ID:".substr(crypt(md5(getenv("REMOTE_ADDR").ID_SEED.gmdate("Ymd", $time+9*60*60)),'id'),-8);
		}
	}
	//カンマを変換
	$now = str_replace(",", "&#44;", $now);
	$ptime = str_replace(",", "&#44;", $ptime);
	//テキスト整形
	$email= CleanStr($email); $email=preg_replace("/[\r\n]/","",$email);
	$sub  = CleanStr($sub);   $sub  =preg_replace("/[\r\n]/","",$sub);
	$resto= CleanStr($resto); $resto=preg_replace("/[\r\n]/","",$resto);
	$url  = CleanStr($url);   $url  =preg_replace("/[\r\n]/","",$url);
	$url  = str_replace(" ", "", $url);
	$com  = CleanStr($com);
	// 改行文字の統一。
	$com = str_replace("\r\n", "\n", $com);
	$com = str_replace("\r", "\n", $com);
	// 連続する空行を一行
	$com = preg_replace("/\n((　| )*\n){3,}/","\n",$com);
	if(!BR_CHECK || substr_count($com,"\n")<BR_CHECK){
		$com = nl2br($com);		//改行文字の前に<br>を代入する
	}
	$com = str_replace("\n", "", $com);	//\nを文字列から消す

	$name=preg_replace("/◆/","◇",$name);
	$name=preg_replace("/[\r\n]/","",$name);
	$names=$name;
	if (get_magic_quotes_gpc()) {//￥を削除
		$names = stripslashes($names);
	}
	$name=CleanStr($name);
	if(preg_match("/(#|＃)(.*)/",$names,$regs)){
		$cap = $regs[2];
		$cap=strtr($cap,"&amp;", "&");
		$cap=strtr($cap,"&#44;", ",");
		$name=preg_replace("/(#|＃)(.*)/","",$name);
		$salt=substr($cap."H.",1,2);
		$salt=preg_replace("/[^\.-z]/",".",$salt);
		$salt=strtr($salt,":;<=>?@[\\]^_`","ABCDEFGabcdef");
		$name.="◆".substr(crypt($cap,$salt),-10);
	}

	//ログ読み込み
	$fp=fopen(LOGFILE,"r+");
	flock($fp, 2);
	rewind($fp);
	$buf=fread($fp,1000000);
	if($buf==''){error(MSG019,$dest);}
	$buf = charconvert($buf,CHARSET_IN);
	$line = explode("\n",$buf);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){
		if($line[$i]!=""){
			list($artno,)=explode(",", rtrim($line[$i]));	//逆変換テーブル作成
			$lineindex[$artno]=$i+1;
			$line[$i].="\n";
		}
	}

	// 連続・二重投稿チェック (v1.32:仕様変更)
	for($i=0;$i<20;$i++){
		list($lastno,,$lname,$lemail,$lsub,$lcom,$lurl,$lhost,$lpwd,,,,$ltime,) = explode(",", $line[$i]);
		$pchk=0;
		switch(POST_CHECKLEVEL){
			case 1:	//low
				if($host==$lhost
				|| substr(md5($pwd),2,8)==$lpwd
				|| substr(md5($pwdc),2,8)==$lpwd
				){$pchk=1;}
				break;
			case 2:	//middle
				if($host==$lhost
				|| substr(md5($pwd),2,8)==$lpwd
				|| substr(md5($pwdc),2,8)==$lpwd
				|| (isset($name) && $name==$lname)
				|| (isset($email) && $email==$lemail)
				|| (isset($url) && $url==$lurl)
				|| (isset($sub) && $sub==$lsub)
				){$pchk=1;}
				break;
			case 3:	//high
				if($host==$lhost
				|| substr(md5($pwd),2,8)==$lpwd
				|| substr(md5($pwdc),2,8)==$lpwd
				|| (isset($name) && similar_str($name,$lname) > VALUE_LIMIT)
				|| (isset($email) && similar_str($email,$lemail) > VALUE_LIMIT)
				|| (isset($url) && similar_str($url,$lurl) > VALUE_LIMIT)
				|| (isset($sub) && similar_str($sub,$lsub) > VALUE_LIMIT)
				){$pchk=1;}
				break;
			case 4:	//full
				$pchk=1;
		}
		if($pchk){
//			if(strlen($ltime)>10){$ltime=substr($ltime,0,-3);}
//KASIRAが入らない10桁のUNIX timeを取り出す
			if(strlen($ltime)>10){$ltime=substr($ltime,-13,-3);}
			if(RENZOKU && $time - $ltime < RENZOKU){error(MSG020,$dest);}
			if(RENZOKU2 && $time - $ltime < RENZOKU2 && $upfile_name){error(MSG021,$dest);}
			if(isset($com)){
				switch(D_POST_CHECKLEVEL){
					case 1:	//low
						if($com == $lcom){error(MSG022,$dest);}
						break;
					case 2:	//middle
						if(similar_str($com,$lcom) > COMMENT_LIMIT_MIDDLE){error(MSG022,$dest);}
						break;
					case 3:	//high
						if(similar_str($com,$lcom) > COMMENT_LIMIT_HIGH){error(MSG022,$dest);}
						break;
					default:
						if($com == $lcom && !$upfile_name){error(MSG022,$dest);}
				}
			}
		}
	}

	// 移動(v1.32)
	if(!$name) $name=DEF_NAME;
	if(!$com) $com=DEF_COM;
	if(!$sub) $sub=DEF_SUB;

	// ログ行数オーバー
	if(count($line) >= LOG_MAX){
		for($d = count($line)-1; $d >= LOG_MAX-1; $d--){
			list($dno,,,,,,,,,$dext,,,$dtime,) = explode(",", $line[$d]);
			if(@is_file($path.$dtime.$dext)) unlink($path.$dtime.$dext);
			if(@is_file(THUMB_DIR.$dtime.'s.jpg')) unlink(THUMB_DIR.$dtime.'s.jpg');
			if(@is_file(PCH_DIR.$dtime.'.pch')) unlink(PCH_DIR.$dtime.'.pch');
			if(@is_file(PCH_DIR.$dtime.'.spch')) unlink(PCH_DIR.$dtime.'.spch');
			$line[$d] = "";
			treedel($dno);
		}
	}
	// アップロード処理
	if($dest&&@file_exists($dest)){
		for($i=0;$i<200;$i++){ //画像重複チェック
			list(,,,,,,,,,$extp,,,$timep,$chkp,) = explode(",", $line[$i]);
			if($chkp==$chk&&@file_exists($path.$timep.$extp)){
				error(MSG005,$dest);
			}
		}
	}
	list($lastno,) = explode(",", $line[0]);
	$no = $lastno + 1;

	$newline = "$no,$now,$name,$email,$sub,$com,$url,$host,$pass,$ext,$W,$H,$tim,$chk,$ptime,$fcolor\n";
	$newline.= implode('', $line);
	ftruncate($fp,0);
	set_file_buffer($fp, 0);
	rewind($fp);
	fputs($fp, charconvert($newline,CHARSET_OUT));

	//ツリー更新
	$find = false;
	$newline = '';
	$tp=fopen(TREEFILE,"r+");
	set_file_buffer($tp, 0);
	flock($tp, 2); //*
	rewind($tp);
	$buf=fread($tp,1000000);
	if($buf==''){error(MSG023,$dest);}
	$line = explode("\n",$buf);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){
		if($line[$i]!=""){
			$line[$i].="\n";
			$j=explode(",", rtrim($line[$i]));
			if($lineindex[$j[0]]==0){
				$line[$i]='';
	}	}	}
	if($resto){
		for($i = 0; $i < $countline; $i++){
			$rtno = explode(",", rtrim($line[$i]));
			if($rtno[0]==$resto){
				$find = TRUE;
				$line[$i]=rtrim($line[$i]).','.$no."\n";
				$j=explode(",", rtrim($line[$i]));
				if(!(stristr($email,'sage') || (count($j)>MAX_RES))){
					$newline=$line[$i];
					$line[$i]='';
				}
				break;
	}	}	}
	if(!$find){if(!$resto){$newline="$no\n";}else{error(MSG025,$dest);}}
	$newline.=implode('', $line);
	ftruncate($tp,0);
	set_file_buffer($tp, 0);
	rewind($tp);
	fputs($tp, $newline);
	fclose($tp);
	fclose($fp);

	//-- クッキー保存 --
	//漢字を含まない項目はこちらの形式で追加
	setcookie ("pwdc", $c_pass,time()+SAVE_COOKIE*24*3600);
	setcookie ("fcolorc", $fcolor,time()+SAVE_COOKIE*24*3600);

	//クッキー項目："クッキー名<>クッキー値"　※漢字を含む項目はこちらに追加
	$cooks = array("namec<>$names","emailc<>$email","urlc<>$url");
	foreach ( $cooks as $cook ) {
		list($c_name,$c_cook) = explode('<>',$cook);
		if(function_exists("mb_convert_encoding")&&function_exists("mb_language")&&USE_MB){
			mb_language(LANG);
			$c_cookie = mb_convert_encoding($c_cook, "UTF-8", "auto");	//to UTF-8
		// jcode.php by TOMO
		}elseif(@file_exists("jcode.phps")||@file_exists("jcode.php")){
			if(@file_exists("jcode.phps")){ require_once('jcode.phps'); }
			else{ require_once('jcode.php'); }
			global $table_jis_utf8;
			include_once('code_table.jis2ucs');
			$c_cookie = JcodeConvert($c_cook, 0, 4);	//to UTF-8
		}elseif(function_exists("iconv")){
			$c_cookie = iconv("euc-jp", "UTF-8", $c_cook);	//to UTF-8
		}else{
			$c_cookie = $c_cook;
		}
		setcookie ($c_name, $c_cookie,time()+SAVE_COOKIE*24*3600);
	}

	if($dest&&@file_exists($dest)){
		rename($dest,$path.$tim.$ext);
		if(USE_THUMB){thumb($path,$tim,$ext,$max_w,$max_h);}

		//ワークファイル削除
		if(@file_exists($upfile)) unlink($upfile);
		if(@file_exists($temppath.$picfile.".dat")) unlink($temppath.$picfile.".dat");

		//PCHファイルアップロード
		$pchtemp = $temppath.$picfile.'.pch';
		if(@file_exists($pchtemp)){
			copy($pchtemp, PCH_DIR.$tim.'.pch');
			if(@file_exists(PCH_DIR.$tim.'.pch')){
				@chmod(PCH_DIR.$tim.'.pch',0666);
				unlink($pchtemp);
			}
		}
		//SPCHファイルアップロード
		$pchtemp = $temppath.$picfile.'.spch';
		if(@file_exists($pchtemp)){
			copy($pchtemp, PCH_DIR.$tim.'.spch');
			if(@file_exists(PCH_DIR.$tim.'.spch')){
				@chmod(PCH_DIR.$tim.'.spch',0666);
				unlink($pchtemp);
			}
		}
	}
	updatelog();

	//メール通知
	if(@file_exists(NOTICEMAIL_FILE)	//メール通知クラスがある場合
	&& !(NOTICE_NOADMIN && $pwd == ADMIN_PASS)){//管理者の投稿の場合メール出さない
		require_once(NOTICEMAIL_FILE);

		$data['to'] = TO_MAIL;
		$data['name'] = $name;
		$data['email'] = $email;
		$data['option'][] = 'URL,'.$url;
		$data['option'][] = '記事題名,'.$sub;
		if(@file_exists($path.$tim.$ext)) $data['option'][] = '投稿画像,'.ROOT_URL.IMG_DIR.$tim.$ext;
		if(@file_exists(THUMB_DIR.$tim.'s.jpg')) $data['option'][] = 'サムネイル画像,'.ROOT_URL.THUMB_DIR.$tim.'s.jpg';
		if(@file_exists(PCH_DIR.$tim.'.pch')) $data['option'][] = 'アニメファイル,'.ROOT_URL.PCH_DIR.$tim.'.pch';
		if(@file_exists(PCH_DIR.$tim.'.spch')) $data['option'][] = 'アニメファイル,'.ROOT_URL.PCH_DIR.$tim.'.spch';
		if($resto){
			$data['subject'] = '['.TITLE.'] No.'.$resto.'へのレスがありました';
			$data['option'][] = "\n記事URL,".ROOT_URL.PHP_SELF.'?res='.$resto;
		}else{
			$data['subject'] = '['.TITLE.'] 新規投稿がありました';
			$data['option'][] = "\n記事URL,".ROOT_URL.PHP_SELF.'?res='.$no;
		}
		if(SEND_COM) $data['comment'] = preg_replace("#<br(( *)|( *)/)>#i","\n", $com);

		noticemail::send($data,USE_MB);
	}

	header("Content-type: text/html; charset=".CHARSET_HTML);
	$str = "<!DOCTYPE html>\n<html><head><META HTTP-EQUIV=\"refresh\" content=\"1;URL=".PHP_SELF2."\">\n";
//	$str.= "<META HTTP-EQUIV=\"Content-type\" CONTENT=\"text/html; charset=".CHARSET_HTML."\"></head>\n";
	$str.= "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0\">\n<meta charset=\"".CHARSET_HTML."\"></head>\n";
	$str.= "<body>$mes 画面を切り替えます</body></html>";
	echo charconvert($str,CHARSET_OUT);
}

//ファイルmd5計算 php4.2.0未満用
function md5_of_file($inFile) {
	if (@file_exists($inFile)){
		if(function_exists('md5_file')){
			return md5_file($inFile);
		}else{
			$fd = fopen($inFile, 'r');
			$fileContents = fread($fd, filesize($inFile));
			fclose ($fd);
			return md5($fileContents);
		}
	}else{
		return false;
	}
}

//ツリー削除
function treedel($delno){
	$fp=fopen(TREEFILE,"r+");
	set_file_buffer($fp, 0);
	flock($fp, 2);
	rewind($fp);
	$buf=fread($fp,1000000);
	if($buf==''){error(MSG024);}
	$line = explode("\n",$buf);
	$countline=count($line);
	$find=false;
	for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}
	for($i = 0; $i < $countline; $i++){
		$treeline = explode(",", rtrim($line[$i]));
		$counttreeline=count($treeline);
		for($j = 0; $j < $counttreeline; $j++){
			if($treeline[$j] == $delno){
				if($j==0){//スレ削除
					if($countline<3){//スレが1つしかない場合、エラー防止の為に削除不可
						fclose($fp);
						error(MSG026);
					}else{$line[$i]='';}
				}else{//レス削除
					$treeline[$j]='';
					$line[$i]=implode(',', $treeline);
					$line[$i]=preg_replace("/,,/",",",$line[$i]);
					$line[$i]=preg_replace("/,$/","",$line[$i]);
					$line[$i].="\n";
				}
				$find=true;
				break 2;
			}
		}
	}
	if($find){//ツリー更新
		ftruncate($fp,0);
		set_file_buffer($fp, 0);
		rewind($fp);
		fputs($fp, implode('', $line));
	}
	fclose($fp);
}

/* テキスト整形 */
function CleanStr($str){
	global $admin;
	$str = trim($str);//先頭と末尾の空白除去
	if (get_magic_quotes_gpc()) {//￥を削除
		$str = stripslashes($str);
	}
	if($admin!=ADMIN_PASS){//管理者はタグ可能
		$str = htmlspecialchars($str);//タグっ禁止
		$str = str_replace("&amp;", "&", $str);//特殊文字
	}
	return str_replace(",", "&#44;", $str);//カンマを変換
}

/* ユーザー削除 */
function usrdel($del,$pwd){
	global $path,$pwdc,$onlyimgdel;
	$host = gethostbyaddr(getenv("REMOTE_ADDR"));

	if(is_array($del)){
		sort($del);
		reset($del);
		if($pwd==""&&$pwdc!="") $pwd=$pwdc;
		$fp=fopen(LOGFILE,"r+");
		set_file_buffer($fp, 0);
		flock($fp, 2);
		rewind($fp);
		$buf=fread($fp,1000000);
		if($buf==''){error(MSG027);}
		$buf = charconvert($buf,CHARSET_IN);
		$line = explode("\n",$buf);
		$countline=count($line);
		for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}
		$flag = false;
		$find = false;
		for($i = 0; $i<count($line); $i++){
			list($no,,,,,,,$dhost,$pass,$ext,,,$tim,,) = explode(",",$line[$i]);
			if(in_array($no,$del) && (substr(md5($pwd),2,8) == $pass /*|| $dhost == $host*/ || ADMIN_PASS == $pwd)){
				if(!$onlyimgdel){	//記事削除
					treedel($no);
					if(USER_DEL > 2){$line[$i] = "";$find = true;}
				}
				if(USER_DEL > 1){
					$delfile = $path.$tim.$ext;	//削除ファイル
					if(@is_file($delfile)) unlink($delfile);//削除
					if(@is_file(THUMB_DIR.$tim.'s.jpg')) unlink(THUMB_DIR.$tim.'s.jpg');//削除
					if(@is_file(PCH_DIR.$tim.'.pch')) unlink(PCH_DIR.$tim.'.pch');//削除
					if(@is_file(PCH_DIR.$tim.'.spch')) unlink(PCH_DIR.$tim.'.spch');//削除
				}
				$flag = true;
			}
		}
		if(!$flag)error(MSG028);
		if($find){//ログ更新
			ftruncate($fp,0);
			set_file_buffer($fp, 0);
			rewind($fp);
			$newline = implode('', $line);
			fputs($fp, charconvert($newline,CHARSET_OUT));
		}
		fclose($fp);
	}
}

/* パス認証 */
function valid($pass){
	if($pass && $pass != ADMIN_PASS) error(MSG029);

	if(!$pass){
		$dat['admin_in'] = true;
		head($dat);
		htmloutput(OTHERFILE,$dat);
		exit;
	}
}

/* 管理者削除 */
function admindel($pass){
	global $path,$onlyimgdel,$del;

	if(is_array($del)){
		sort($del);
		reset($del);
		$fp=fopen(LOGFILE,"r+");
		set_file_buffer($fp, 0);
		flock($fp, 2);
		rewind($fp);
		$buf=fread($fp,1000000);
		if($buf==''){error(MSG030);}
		$buf = charconvert($buf,CHARSET_IN);
		$line = explode("\n",$buf);
		$countline=count($line);
		for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}
		$find = false;
		for($i = 0; $i < $countline; $i++){
			list($no,,,,,,,,,$ext,,,$tim,,) = explode(",",$line[$i]);
			if(in_array($no,$del)){
				if(!$onlyimgdel){	//記事削除
					treedel($no);
					$line[$i] = "";
					$find = true;
				}
				$delfile = $path.$tim.$ext;	//削除ファイル
				if(@is_file($delfile)) unlink($delfile);//削除
				if(@is_file(THUMB_DIR.$tim.'s.jpg')) unlink(THUMB_DIR.$tim.'s.jpg');//削除
				if(@is_file(PCH_DIR.$tim.'.pch')) unlink(PCH_DIR.$tim.'.pch');//削除
				if(@is_file(PCH_DIR.$tim.'.spch')) unlink(PCH_DIR.$tim.'.spch');//削除
			}
		}
		if($find){//ログ更新
			ftruncate($fp,0);
			set_file_buffer($fp, 0);
			rewind($fp);
			$newline = implode('', $line);
			fputs($fp, charconvert($newline,CHARSET_OUT));
		}
		fclose($fp);
	}
	// 削除画面を表示
	$dat['admin_del'] = true;
	head($dat);
	$dat['pass'] = $pass;

	$line = file(LOGFILE);
	for($j = 0; $j < count($line); $j++){
		$img_flag = FALSE;
		list($no,$now,$name,$email,$sub,$com,$url,
			 $host,$pw,$ext,$w,$h,$time,$chk,) = explode(",",charconvert($line[$j],CHARSET_IN));
		// フォーマット
		//$now=preg_replace('#.{2}/(.*)$#','\1',$now);
		//$now=preg_replace('/\(.*\)/',' ',$now);
		$now  = preg_replace("/( ID:.*)/","",$now);//ID以降除去
		$name = strip_tags($name);//タグ除去
		if(strlen($name) > 10) $name = substr($name,0,9).".";
		if(strlen($sub) > 10) $sub = substr($sub,0,9).".";
		if($email) $name="<a href=\"mailto:$email\">$name</a>";
		$com = preg_replace("{<br(( *)|( *)/)>}i"," ",$com);
		//$com = str_replace("<br />"," ",$com);
		$com = htmlspecialchars($com);
		if(strlen($com) > 20) $com = substr($com,0,18) . ".";
		// 画像があるときはリンク
		if($ext && @is_file($path.$time.$ext)){
			$img_flag = TRUE;
			$clip = "<a href=\"".IMG_DIR.$time.$ext."\" target=\"_blank\" rel=\"noopener\">".$time.$ext."</a><br>";
			$size = filesize($path.$time.$ext);
			$all += $size;	//合計計算
			$chk= substr($chk,0,10);
		}else{
			$clip = "";
			$size = 0;
			$chk= "";
		}
		$bg = ($j % 2) ? ADMIN_DELGUSU : ADMIN_DELKISU;//背景色

		$dat['del'][$j] = compact('bg','no','now','sub','name','com','host','clip','size','chk');
	}

	$dat['all'] = (int)($all / 1024);
	htmloutput(OTHERFILE,$dat);
	exit;
}

function init(){
	$err=''; //未定義変数エラー対策
	$chkfile=array(LOGFILE,TREEFILE);
	if(!is_writable(realpath("./")))error("カレントディレクトリに書けません<br>");
	foreach($chkfile as $value){
		if(!@file_exists(realpath($value))){
			$fp = fopen($value, "w");
			set_file_buffer($fp, 0);
			$now = now_date(time());//日付取得
			if(DISP_ID) $now .= " ID:???";
			$testmes="1,".$now.",".DEF_NAME.",,".DEF_SUB.",".DEF_COM.",,\n";
			if($value==LOGFILE)fputs($fp,charconvert($testmes,CHARSET_OUT));
			if($value==TREEFILE)fputs($fp,"1\n");
			fclose($fp);
			if(@file_exists(realpath($value)))@chmod($value,0666);
		}
		if(!is_writable(realpath($value)))$err.=$value."を書けません<br>";
		if(!is_readable(realpath($value)))$err.=$value."を読めません<br>";
	}
	@mkdir(IMG_DIR,0777);@chmod(IMG_DIR,0777);
	if(!is_dir(realpath(IMG_DIR)))$err.=IMG_DIR."がありません<br>";
	if(!is_writable(realpath(IMG_DIR)))$err.=IMG_DIR."を書けません<br>";
	if(!is_readable(realpath(IMG_DIR)))$err.=IMG_DIR."を読めません<br>";
	if(USE_THUMB){
		@mkdir(THUMB_DIR,0777);@chmod(THUMB_DIR,0777);
		if(!is_dir(realpath(THUMB_DIR)))$err.=THUMB_DIR."がありません<br>";
		if(!is_writable(realpath(THUMB_DIR)))$err.=THUMB_DIR."を書けません<br>";
		if(!is_readable(realpath(THUMB_DIR)))$err.=THUMB_DIR."を読めません<br>";
	}
	if(USE_PAINT){
		@mkdir(TEMP_DIR,0777);@chmod(TEMP_DIR,0777);
		if(!is_dir(realpath(TEMP_DIR)))$err.=TEMP_DIR."がありません<br>";
		if(!is_writable(realpath(TEMP_DIR)))$err.=TEMP_DIR."を書けません<br>";
		if(!is_readable(realpath(TEMP_DIR)))$err.=TEMP_DIR."を読めません<br>";
	}
	if($err)error($err);
	if(!@file_exists(realpath(PHP_SELF2)))updatelog();
}

/* お絵描き画面 */
function paintform($picw,$pich,$palette,$anime,$pch=""){
	global $admin,$shi,$ctype,$type,$no,$pwd,$ext;
	global $resto,$mode,$savetype,$quality,$qualitys,$usercode;

	global $useneo; //NEOを使う
	if ($useneo) $dat['useneo'] = true; //NEOを使う

	if($picw < 100) $picw = 100;
	if($pich < 100) $pich = 100;
	if($picw > PMAX_W) $picw = PMAX_W;
	if($pich > PMAX_H) $pich = PMAX_H;
	$w = $picw + 150;
	$h = $pich + 170;
	if($w < 400){$w = 400;}
	if($h < 420){$h = 420;}
//	if($w < 500 && $shi){$w = 500;}
//	if($h < 500 && $shi==2){$h = 500;}
//NEOを使う時はPaintBBSの設定
	if($w < 500 && !$useneo && $shi){$w = 500;}
	if($h < 500 && !$useneo && $shi==2){$h = 500;}

	$dat['paint_mode'] = true;
	head($dat);
	form($dat,$resto);
	$dat['mode2'] = $mode;
	if($mode=="contpaint"){
		$dat['no'] = $no;
		$dat['pch'] = $pch;
		$dat['ctype'] = $ctype;
		$dat['type'] = $type;
		$dat['pwd'] = $pwd;
		$dat['ext'] = $ext;
		if(@file_exists(PCH_DIR.$pch.'.pch')){
			$dat['applet'] = false;
		}elseif(@file_exists(PCH_DIR.$pch.'.spch')){
			$dat['applet'] = true;
			$dat['usepbbs'] = false;
		}elseif(@file_exists(IMG_DIR.$pch.$ext)){
			$dat['applet'] = true;
			$dat['usepbbs'] = true;
		}
		if((C_SECURITY_CLICK || C_SECURITY_TIMER) && SECURITY_URL){
			$dat['security'] = true;
			$dat['security_click'] = C_SECURITY_CLICK;
			$dat['security_timer'] = C_SECURITY_TIMER;
		}
	}else{
		if((SECURITY_CLICK || SECURITY_TIMER) && SECURITY_URL){
			$dat['security'] = true;
			$dat['security_click'] = SECURITY_CLICK;
			$dat['security_timer'] = SECURITY_TIMER;
		}
		$dat['newpaint'] = true;
	}
	$dat['security_url'] = SECURITY_URL;
	switch($savetype){
		case 'PNG':
			$dat['image_jpeg'] = 'false';
			$dat['image_size'] = IMAGE_SIZE;
			$savepng = ' selected';
			break;
		case 'JPEG':
			$dat['image_jpeg'] = 'true';
			$dat['image_size'] = 1;
			$savejpeg = ' selected';
			break;
		default:
			$dat['image_jpeg'] = 'true';
			$dat['image_size'] = IMAGE_SIZE;
			$saveauto = ' selected';
	}
	$dat['savetypes'] = "<option value='AUTO'".$saveauto.">AUTO</option>\n";
	$dat['savetypes'].= "<option value='PNG'".$savepng.">PNG</option>\n";
	$dat['savetypes'].= "<option value='JPEG'".$savejpeg.">JPEG</option>\n";
	$dat['compress_level'] = COMPRESS_LEVEL;
	$dat['layer_count'] = LAYER_COUNT;
	if($shi) $dat['quality'] = $quality ? $quality : $qualitys[0];
//	if($shi==1){ $dat['normal'] = true; }
//	elseif($shi==2){ $dat['pro'] = true; }
//	else{ $dat['paintbbs'] = true; }
//NEOを使う時はPaintBBSの設定
	if(!$useneo && $shi==1){ $dat['normal'] = true; }
	elseif(!$useneo && $shi==2){ $dat['pro'] = true; }
	else{ $dat['paintbbs'] = true; }

	$dat['palettes'][0] = 'Palettes[0] = "#000000\n#FFFFFF\n#B47575\n#888888\n#FA9696\n#C096C0\n#FFB6FF\n#8080FF\n#25C7C9\n#E7E58D\n#E7962D\n#99CB7B\n#FCECE2\n#F9DDCF";'."\n";
	$pal=array();
	$DynP=array();
	$p_cnt=1;
	$lines = file(PALETTEFILE);
	foreach ( $lines as $line ) {
		$line=preg_replace("/[\t\r\n]/","",$line);
		list($pid,$pname,$pal[0],$pal[2],$pal[4],$pal[6],$pal[8],$pal[10],$pal[1],$pal[3],$pal[5],$pal[7],$pal[9],$pal[11],$pal[12],$pal[13]) = explode(",", $line);
		$DynP[]=CleanStr($pname);
		$palettes = 'Palettes['.$p_cnt.'] = "#'.$pal[0];
		ksort($pal);
		array_shift($pal);
		foreach ( $pal as $p ) {
			$palettes.='\n#'.$p;
		}
		$palettes.='";'."\n";
		$dat['palettes'][$p_cnt] = $palettes;
		$p_cnt++;
		if($pid==$palette){
			$C_Palette = explode(",", $line);
			array_shift($C_Palette); array_shift($C_Palette);
		}
	}

	$dat['w'] = $w;
	$dat['h'] = $h;
	$dat['picw'] = $picw;
	$dat['pich'] = $pich;
	$stime = time();
	$dat['stime'] = $stime;
	if($pwd) $pwd = substr(md5($pwd),2,8);
	$resto = ($resto) ? '&amp;resto='.$resto : '';
	$dat['mode'] = 'piccom'.$resto;
	$dat['animeform'] = true;
	$dat['anime'] = ($anime) ? true : false;
	if($ctype=='pch'){
		if(@file_exists(PCH_DIR.$pch.'.pch')) $dat['pchfile'] = './'.PCH_DIR.$pch.'.pch';
		if(@file_exists(PCH_DIR.$pch.'.spch')) $dat['pchfile'] = './'.PCH_DIR.$pch.'.spch';
	}
	if($ctype=='img'){
		$dat['animeform'] = false;
		$dat['anime'] = false;
		$dat['imgfile'] = './'.PCH_DIR.$pch.$ext;
	}
	if(ADMIN_NEWPOST&&$admin==ADMIN_PASS) $dat['admin'] = 'picpost';

	if(isset($C_Palette)){
		for ($n = 1;$n < 7;++$n)
			$cpal[$n*2-1] = $C_Palette[$n-1];
		for ($n = 7;$n < 13;++$n)
			$cpal[$n-(13-$n)+1] = $C_Palette[$n-1];
		for ($n = 13;$n < 15;++$n)
			$cpal[$n] = $C_Palette[$n-1];
		ksort($cpal);
		$no = 1;
		foreach ($cpal as $pal){
			$dat['cpal'][] = compact('no','pal');
			$no++;
		}
	}

	$dat['palsize'] = count($DynP) + 1;
	foreach ($DynP as $p){
		$dat['dynp'][] = $p;
	}
	$dat['usercode'] = $usercode;

	//差し換え時の認識コード追加
	if($type=='rep'){
		$repcode = substr(crypt(md5($no.getenv("REMOTE_ADDR").$pwd.date("Ymd", time()))),-8);
		//念の為にエスケープ文字があればアルファベットに変換
		$repcode = strtr($repcode,"!\"#$%&'()+,/:;<=>?@[\\]^`/{|}~","ABCDEFGHIJKLMNOabcdefghijklmn");
		$dat['mode'] = 'picrep&amp;no='.$no.'&amp;pwd='.$pwd.'&amp;repcode='.$repcode;
		$dat['usercode'] = $usercode.'&amp;repcode='.$repcode;
	}

	$buf = htmloutput(PAINTFILE,$dat,true);

	list($buf1,$buf2) = explode('<SIIHELP>', $buf);
	echo $buf1;
	if(@file_exists(SIIHELP_FILE)){
		$help = implode('', file(SIIHELP_FILE));
		echo charconvert($help,CHARSET_OUT);
	}
	echo $buf2;
}

/* お絵かきコメント */
function paintcom($resto=''){
	global $admin,$usercode;

	if(USE_RESUB && $resto) {
		$lines = file(LOGFILE);
		$flag = FALSE;
		foreach($lines as $line){
			list($cno,,,,$sub,,,,,,,,,,) = explode(",", charconvert($line,CHARSET_IN));
			if($cno == $resto){
				$dat['sub'] = 'Re: '.$sub;
				$flag = TRUE;
				break;
			}
		}
		if(!$flag) $resto=''; //スレが削除されていた場合、新規投稿
	}

	//テンポラリ画像リスト作成
	$tmplist = array();
	$handle = @opendir(TEMP_DIR);
	while ($file = readdir($handle)) {
		if(!is_dir($file) && preg_match("/\.(dat)$/i",$file)) {
			$fp = fopen(TEMP_DIR.$file, "r");
			$userdata = fread($fp, 1024);
			fclose($fp);
			list($uip,$uhost,$uagent,$imgext,$ucode,) = explode("\t", rtrim($userdata));
			$file_name = preg_replace("/\.(dat)$/i","",$file);
			if(@file_exists(TEMP_DIR.$file_name.$imgext)) //画像があればリストに追加
				$tmplist[] = $ucode."\t".$uip."\t".$file_name.$imgext;
		}
	}
	closedir($handle);
	$tmp = array();
	if(count($tmplist)!=0){
		//user-codeでチェック
		foreach($tmplist as $tmpimg){
			list($ucode,$uip,$ufilename) = explode("\t", $tmpimg);
			if($ucode == $usercode)
				$tmp[] = $ufilename;
		}
		//user-codeでhitしなければIPで再チェック
		if(count($tmp)==0){
			$userip = getenv("HTTP_CLIENT_IP");
			if(!$userip) $userip = getenv("HTTP_X_FORWARDED_FOR");
			if(!$userip) $userip = getenv("REMOTE_ADDR");
			foreach($tmplist as $tmpimg){
				list($ucode,$uip,$ufilename) = explode("\t", $tmpimg);
				if(!IP_CHECK || $uip == $userip)
					$tmp[] = $ufilename;
			}
		}
	}

	$dat['post_mode'] = true;
	$dat['regist'] = true;
	head($dat);
	if(IP_CHECK) $dat['ipcheck'] = true;
	if(count($tmp)==0){
		$dat['notmp'] = true;
		$dat['pictmp'] = 1;
	}else{
		$dat['pictmp'] = 2;
		sort($tmp);
		reset($tmp);
		foreach($tmp as $tmpfile){
			$src = TEMP_DIR.$tmpfile;
			$srcname = $tmpfile;
			$date = gmdate("Y/m/d H:i", filemtime($src)+9*60*60);
			$dat['tmp'][] = compact('src','srcname','date');
		}
	}
	if(ADMIN_NEWPOST&&$admin=='picpost') $dat['admin'] = $admin;
	form($dat,$resto,'',$tmp);
	htmloutput(OTHERFILE,$dat);
}

/* 動画表示 */
function openpch($pch,$sp=""){
	global $shi;

	$picfile = IMG_DIR.$pch;
	$pch = str_replace( strrchr($pch,"."), "", $pch); //拡張子除去
	if($shi==1){
		$dat['normal'] = true;
		$pchfile = PCH_DIR.$pch.'.spch';
	}else{
		$dat['paintbbs'] = true;
		$pchfile = PCH_DIR.$pch.'.pch';
	}
	$datasize = filesize($pchfile);
	$size = getimagesize($picfile);
	if(!$sp) $sp = PCH_SPEED;
	$picw = $size[0];
	$pich = $size[1];
	$w = $picw;
	$h = $pich + 26;
	if($w < 200){$w = 200;}
	if($h < 226){$h = 226;}

	$dat['pch_mode'] = true;
	head($dat);
	$dat['w'] = $w;
	$dat['h'] = $h;
	$dat['picw'] = $picw;
	$dat['pich'] = $pich;
	$dat['pchfile'] = './'.$pchfile;
	$dat['speed'] = $sp;
	$dat['datasize'] = $datasize;
	htmloutput(PAINTFILE,$dat);
}

/* テンポラリ内のゴミ除去 */
function deltemp(){
	$handle = @opendir(TEMP_DIR);
	while ($file = readdir($handle)) {
		if(!is_dir($file)) {
			$lapse = time() - filemtime(TEMP_DIR.$file);
			if($lapse > (TEMP_LIMIT*24*3600)){
				unlink(TEMP_DIR.$file);
			}
		}
	}
	closedir($handle);
}

/* コンティニュー前画面 */
function incontinue($no){
	global $addinfo;

	$lines = file(LOGFILE);
//コンティニューの処理に関わっていない
//	$countline=count($line);
	$flag = FALSE;
	foreach($lines as $line){
		list($cno,,,,,,,,,$cext,$picw,$pich,$ctim,,$cptime,) = explode(",", rtrim(charconvert($line,CHARSET_IN)));
		if($cno == $no){
			$flag = TRUE;
			break;
		}
	}
	if(!$flag) error(MSG001);

	$dat['continue_mode'] = true;
	head($dat);
//	if(CONTINUE_PASS) $dat['passflag'] = true;
//コンティニュー時は削除キーを常に表示
	$dat['passflag'] = true;
//新規投稿で削除キー不要の時 true
	if(! CONTINUE_PASS) $dat['newpost_nopassword'] = true;
	$dat['picfile'] = IMG_DIR.$ctim.$cext;
	$size = getimagesize($dat['picfile']);
	$dat['picw'] = $size[0];
	$dat['pich'] = $size[1];
	$dat['no'] = $no;
	$dat['pch'] = $ctim;
	$dat['ext'] = $cext;
	//描画時間
	if(DSP_PAINTTIME) $dat['painttime'] = $cptime;

	if(@file_exists(PCH_DIR.$ctim.'.pch')){
		$dat['applet'] = false;
		$dat['ctype_pch'] = true;
	}elseif(@file_exists(PCH_DIR.$ctim.'.spch')){
		$dat['applet'] = true;
		$dat['usepbbs'] = false;
		$dat['ctype_pch'] = true;
	}elseif(@file_exists(IMG_DIR.$ctim.$cext)){
		$dat['applet'] = true;
		$dat['usepbbs'] = true;
	}
	//if(@file_exists(IMG_DIR.$ctim.'.jpg')) $dat['ctype_jpg'] = true;
	$dat['ctype_img'] = true;

	$lines = file(PALETTEFILE);
	foreach ( $lines as $line ) {
		$line=preg_replace("/[\t\r\n]/","",$line);
		list($pid,$pname,) = explode(",", $line);
		$dat['palette'] .= '<option value="'.$pid.'">'.CleanStr($pname)."</option>\n";
	}

	$dat['addinfo'] = $addinfo;
	htmloutput(PAINTFILE,$dat);
}

/* コンティニュー認証 */
function usrchk($no,$pwd){
	$lines = file(LOGFILE);
//	$countline=count($line);
	$flag = FALSE;
	foreach($lines as $line){
		list($cno,,,,,,,,$cpwd,) = explode(",", charconvert($line,CHARSET_IN));
		if($cno == $no && substr(md5($pwd),2,8) == $cpwd){
			$flag = TRUE;
			break;
		}
	}
	if(!$flag) error(MSG028);
}

/* 編集画面 */
function editform($del,$pwd){
	global $pwdc,$addinfo;
	global $fontcolors;

	$host = gethostbyaddr(getenv("REMOTE_ADDR"));
	if(is_array($del)){
		sort($del);
		reset($del);
		if($pwd==""&&$pwdc!="") $pwd=$pwdc;
		$fp=fopen(LOGFILE,"r");
		flock($fp, 2);
		$buf=fread($fp,1000000);
		fclose($fp);
		if($buf==''){error(MSG019);}
		$buf = charconvert($buf,CHARSET_IN);
		$line = explode("\n",$buf);
		$countline=count($line);
		for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}
		$flag = FALSE;
		for($i = 0; $i<count($line); $i++){
			list($no,,$name,$email,$sub,$com,$url,$ehost,$pass,,,,,,,$fcolor) = explode(",", rtrim($line[$i]));
			if($no == $del[0] && (substr(md5($pwd),2,8) == $pass /*|| $ehost == $host*/ || ADMIN_PASS == $pwd)){
				$flag = TRUE;
				break;
			}
		}
		if(!$flag) error(MSG028);

		head($dat);
		$dat['post_mode'] = true;
		$dat['rewrite'] = $no;
		if(ADMIN_PASS == $pwd) $dat['admin'] = ADMIN_PASS;
		$dat['maxbyte'] = MAX_KB * 1024;
		$dat['maxkb']   = MAX_KB;
		$dat['addinfo'] = $addinfo;
		$dat['name'] = strip_tags($name);
		$dat['email'] = $email;
		$dat['sub'] = $sub;
		$com = preg_replace("{<br(( *)|( *)/)>}i","\n",$com); // <br>または<br />を改行へ戻す
		$dat['com'] = $com;
		$dat['url'] = $url;
		$dat['pwd'] = $pwd;

		//文字色
		if(USE_FONTCOLOR){
			foreach ( $fontcolors as $fontcolor ){
				list($color,$name) = explode(",", $fontcolor);
				$chk = ($color == $fcolor) ? true : false;
				$dat['fctable'][] = compact('color','name','chk');
			}
			if(!$fcolor) $dat['fctable'][0]['chk'] = true; //値が無い場合、先頭にチェック
		}

		htmloutput(OTHERFILE,$dat);
	}else{ error(MSG031); }
}

/* 記事上書き */
function rewrite($no,$name,$email,$sub,$com,$url,$pwd,&$admin =''){
	global $badstring,$badstring_and_url,$badip;
	global $REQUEST_METHOD;
	global $fcolor;

	// 時間
	$time = time();

	$name  = charconvert($name ,CHARSET_IN);
	$sub   = charconvert($sub  ,CHARSET_IN);
	$com   = charconvert($com  ,CHARSET_IN);
	$email = charconvert($email,CHARSET_IN);
	$url   = charconvert($url  ,CHARSET_IN);

	foreach($badstring as $value){if(preg_match("/$value/i",$com)||preg_match("/$value/i",$sub)||preg_match("/$value/i",$name)||preg_match("/$value/i",$email)){error(MSG032,$dest);};}
	if($REQUEST_METHOD != "POST") error(MSG006);

//指定文字列+本文へのURL書き込みで拒絶
	foreach($badstring_and_url as $value){if(preg_match("/$value/i",$com) && preg_match('/:\/\//i', $com)||preg_match("/$value/i",$sub) && preg_match('/:\/\//i', $com) > '0'){error(MSG032,$dest);};}

	// フォーム内容をチェック
	if(!$name||preg_match("/^[ |　|]*$/",$name)) $name="";
	if(!$com||preg_match("/^[ |　|\t]*$/",$com)) $com="";
	if(!$sub||preg_match("/^[ |　|]*$/",$sub))   $sub="";
	if(!$url||preg_match("/^[ |　|]*$/",$url))   $url="";

	//$name=preg_replace("/管理/","\"管理\"",$name);
	//$name=preg_replace("/削除/","\"削除\"",$name);

	if(strlen($com) > MAX_COM) error(MSG011);
	if(strlen($name) > MAX_NAME) error(MSG012);
	if(strlen($email) > MAX_EMAIL) error(MSG013);
	if(strlen($sub) > MAX_SUB) error(MSG014);

	//本文へのURLの書き込みを禁止
	if(DENY_COMMENTS_URL && preg_match('/:\/\/|\.co|\.ly|\.gl|\.net|\.org|\.cc|\.ru|\.su|\.ua|\.gd/i', $com) > '0' ) error(MSG036,$dest);

	//ホスト取得
	$host = gethostbyaddr(getenv("REMOTE_ADDR"));

	foreach($badip as $value){ //拒絶host
		if(preg_match("/$value$/i",$host)) error(MSG016);
	}
	if(preg_match("/^mail/i",$host)
	|| preg_match("/^ns/i",$host)
	|| preg_match("/^dns/i",$host)
	|| preg_match("/^ftp/i",$host)
	|| preg_match("/^prox/i",$host)
	|| preg_match("/^pc/i",$host)
	|| preg_match("/^[^\.]\.[^\.]$/i",$host)){
		$pxck = "on";
	}
	if(preg_match("/ne\\.jp$/i",$host)
	|| preg_match("/bbtec\\.net$/i",$host)
	|| preg_match("/ad\\.jp$/i",$host)
	|| preg_match("/aol\\.com$/i",$host)
	|| preg_match("/uu\\.net$/i",$host)
	|| preg_match("/asahi-net\\.or\\.jp$/i",$host)
	|| preg_match("/rim\\.or\\.jp$/i",$host)){
		$pxck = "off";
	}else{
		$pxck = "on";
	}

	if($pxck=="on" && PROXY_CHECK){
		if(proxy_connect('80') == 1){
			error(MSG017);
		}elseif(proxy_connect('8080') == 1){
			error(MSG018);
		}
	}

	// パスと時間とURLフォーマット
	$pass = ($pwd) ? substr(md5($pwd),2,8) : "*";
	$now = now_date($time);//日付取得
	$now .= UPDATE_MARK;
	if(DISP_ID){
		if($email&&DISP_ID==1){
			$now .= " ID:???";
		}else{
			$now.=" ID:".substr(crypt(md5(getenv("REMOTE_ADDR").ID_SEED.gmdate("Ymd", $time+9*60*60)),'id'),-8);
		}
	}
	$now = str_replace(",", "&#44;", $now);//カンマを変換
	//テキスト整形
	$email= CleanStr($email);  $email=preg_replace("/[\r\n]/","",$email);
	$sub  = CleanStr($sub);    $sub  =preg_replace("/[\r\n]/","",$sub);
	$url  = CleanStr($url);    $url  =preg_replace("/[\r\n]/","",$url);
	$url  = str_replace(" ", "", $url);
	$com  = CleanStr($com);
	// 改行文字の統一。
	$com = str_replace("\r\n", "\n", $com);
	$com = str_replace("\r", "\n", $com);
	// 連続する空行を一行
	$com = preg_replace("#\n((　| )*\n){3,}#","\n",$com);
	if(!BR_CHECK || substr_count($com,"\n")<BR_CHECK){
		$com = nl2br($com);		//改行文字の前に<br>を代入する
	}
	$com = str_replace("\n", "", $com);	//\nを文字列から消す

	$name=preg_replace("/◆/","◇",$name);
	$name=preg_replace("/[\r\n]/","",$name);
	$names=$name;
	$name = CleanStr($name);
	if(preg_match("/(#|＃)(.*)/",$names,$regs)){
		$cap = $regs[2];
		$cap=strtr($cap,"&amp;", "&");
		$cap=strtr($cap,"&#44;", ",");
		$name=preg_replace("/(#|＃)(.*)/","",$name);
		$salt=substr($cap."H.",1,2);
		$salt=preg_replace("/[^\.-z]/",".",$salt);
		$salt=strtr($salt,":;<=>?@[\\]^_`","ABCDEFGabcdef");
		$name.="◆".substr(crypt($cap,$salt),-10);
	}

	//ログ読み込み
	$fp=fopen(LOGFILE,"r+");
	flock($fp, 2);
	rewind($fp);
	$buf=fread($fp,1000000);
	if($buf==''){error(MSG019);}
	$buf = charconvert($buf,CHARSET_IN);
	$line = explode("\n",$buf);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}

	// 記事上書き
	$flag = FALSE;
	for($i = 0; $i<count($line); $i++){
		list($eno,,$ename,,$esub,$ecom,$eurl,$ehost,$epwd,$ext,$W,$H,$tim,$chk,$ptime,$efcolor) = explode(",", rtrim($line[$i]));
		if($eno == $no && ($pass == $epwd /*|| $ehost == $host*/ || ADMIN_PASS == $admin)){
			if(!$name) $name = $ename;
			if(!$sub)  $sub  = $esub;
			if(!$com)  $com  = $ecom;
			if(!$url)  $url  = $eurl;
			if(!$fcolor) $fcolor = $efcolor;
			$line[$i] = "$no,$now,$name,$email,$sub,$com,$url,$host,$epwd,$ext,$W,$H,$tim,$chk,$ptime,$fcolor\n";
			$flag = TRUE;
			break;
		}
	}
	if(!$flag){
		fclose($fp);
		error(MSG028);
	}

	ftruncate($fp,0);
	set_file_buffer($fp, 0);
	rewind($fp);
	$newline = implode('', $line);
	fputs($fp, charconvert($newline,CHARSET_OUT));
	fclose($fp);

	updatelog();

	header("Content-type: text/html; charset=".CHARSET_HTML);
	$str = "<!DOCTYPE html>\n<html><head><META HTTP-EQUIV=\"refresh\" content=\"1;URL=".PHP_SELF2."\">\n";
	//	$str.= "<META HTTP-EQUIV=\"Content-type\" CONTENT=\"text/html; charset=".CHARSET_HTML."\"></head>\n";
	$str.= "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0\">\n<meta charset=\"".CHARSET_HTML."\"></head>\n";
	$str.= "<body>$mes 画面を切り替えます</body></html>";
	echo charconvert($str,CHARSET_OUT);
}

/* 画像差し換え */
function replace($no,$pwd,$stime){
	global $path,$temppath,$badip,$badfile,$repcode;

	//ホスト取得
	$host = gethostbyaddr(getenv("REMOTE_ADDR"));

	foreach($badip as $value){ //拒絶host
		if(preg_match("/$value$/i",$host)) error(MSG016);
	}
	if(preg_match("/^mail/i",$host)
	|| preg_match("/^ns/i",$host)
	|| preg_match("/^dns/i",$host)
	|| preg_match("/^ftp/i",$host)
	|| preg_match("/^prox/i",$host)
	|| preg_match("/^pc/i",$host)
	|| preg_match("/^[^\.]\.[^\.]$/i",$host)){
		$pxck = "on";
	}
	if(preg_match("/ne\\.jp$/i",$host)
	|| preg_match("/ad\\.jp$/i",$host)
	|| preg_match("/bbtec\\.net$/i",$host)
	|| preg_match("/aol\\.com$/i",$host)
	|| preg_match("/uu\\.net$/i",$host)
	|| preg_match("/asahi-net\\.or\\.jp$/i",$host)
	|| preg_match("/rim\\.or\\.jp$/i",$host)){
		$pxck = "off";
	}else{
		$pxck = "on";
	}

	if($pxck=="on" && PROXY_CHECK){
		if(proxy_connect('80') == 1){
			error(MSG017);
		}elseif(proxy_connect('8080') == 1){
			error(MSG018);
		}
	}

	/*--- テンポラリ捜査 ---*/
	$find=false;
	$handle = @opendir(TEMP_DIR);
	while ($file = readdir($handle)) {
		if(!is_dir($file) && preg_match("/\.(dat)$/i",$file)) {
			$fp = fopen(TEMP_DIR.$file, "r");
			$userdata = fread($fp, 1024);
			fclose($fp);
			list($uip,$uhost,$uagent,$imgext,$ucode,$urepcode) = explode("\t", rtrim($userdata));
			$file_name = preg_replace("/\.(dat)$/i","",$file);
			//画像があり、認識コードがhitすれば抜ける
			if(@file_exists(TEMP_DIR.$file_name.$imgext) && $urepcode == $repcode){$find=true;break;}
		}
	}
	closedir($handle);
	if(!$find){
		header("Content-type: text/html; charset=".CHARSET_HTML);
		$str = "<!DOCTYPE html>\n<html><head><title>画像が見当たりません</title>\n";
	//$str.= "<META HTTP-EQUIV=\"Content-type\" CONTENT=\"text/html; charset=".CHARSET_HTML."\"></head>\n";
	$str.= "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0\">\n<meta charset=\"".CHARSET_HTML."\"></head>\n";
	$str.= '<body>画像が見当たりません。数秒待ってリロードしてください。<BR><BR>リロードしてもこの画面がでるなら投稿に失敗している可能性があります。<BR>※諦める前に「<A href="'.PHP_SELF.'?mode=piccom">アップロード途中の画像</A>」を見ましょう。もしかしたら画像が見つかるかもしれません。</body></html>';
		echo charconvert($str,CHARSET_OUT);
		exit;
	}

	// 時間
	$time = time();
	$tim = KASIRA.$time.substr(microtime(),2,3);
	$now = now_date($time);//日付取得
	$now .= UPDATE_MARK;
	//描画時間
	if($stime && DSP_PAINTTIME){
		$ptime = '';
		if($stime){
			$psec = $time-$stime;
			if($psec >= 86400){
				$D = intval($psec/86400);
				$ptime .= $D.PTIME_D;
				$psec -= $D*86400;
			}
			if($psec >= 3600){
				$H = intval($psec/3600);
				$ptime .= $H.PTIME_H;
				$psec -= $H*3600;
			}
			if($psec >= 60){
				$M = intval($psec/60);
				$ptime .= $M.PTIME_M;
				$psec -= $M*60;
			}
			if($psec){
				$ptime .= $psec.PTIME_S;
			}
		}
	}

	//ログ読み込み
	$fp=fopen(LOGFILE,"r+");
	flock($fp, 2);
	rewind($fp);
	$buf=fread($fp,1000000);
	if($buf==''){error(MSG019);}
	$buf = charconvert($buf,CHARSET_IN);
	$line = explode("\n",$buf);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){if($line[$i]!=""){$line[$i].="\n";};}

	// 記事上書き
	$flag = false;
	for($i = 0; $i<count($line); $i++){
		list($eno,,$name,$email,$sub,$com,$url,$ehost,$epwd,$ext,$W,$H,$etim,,$eptime,$fcolor) = explode(",", rtrim($line[$i]));
		if($eno == $no && ($pwd == $epwd /*|| $ehost == $host*/ || $pwd == substr(md5(ADMIN_PASS),2,8))){
			$upfile = $temppath.$file_name.$imgext;
			$dest = $path.$tim.$imgext;
			copy($upfile, $dest);
			if(!@file_exists($dest)) error(MSG003,$dest);
			$size = getimagesize($dest);
			if(!is_array($size)) error(MSG004,$dest);
			$chk = md5_of_file($dest);
			foreach($badfile as $value){if(preg_match("/^$value/",$chk)){
				error(MSG005,$dest); //拒絶画像
			}}
			@chmod($dest,0666);
			$mes = "画像のアップロードが成功しました<br><br>";
			//差し換え前と同じ大きさのサムネイル作成
			if(USE_THUMB) thumb($path,$tim,$imgext,$W,$H);
			//ワークファイル削除
			if(@file_exists($upfile)) unlink($upfile);
			if(@file_exists($temppath.$file_name.".dat")) unlink($temppath.$file_name.".dat");
			//PCHファイルアップロード
			$pchtemp = $temppath.$file_name.'.pch';
			if(@file_exists($pchtemp)){
				copy($pchtemp, PCH_DIR.$tim.'.pch');
				if(@file_exists(PCH_DIR.$tim.'.pch')){
					@chmod(PCH_DIR.$tim.'.pch',0666);
					unlink($pchtemp);
				}
			}
			//SPCHファイルアップロード
			$pchtemp = $temppath.$file_name.'.spch';
			if(@file_exists($pchtemp)){
				copy($pchtemp, PCH_DIR.$tim.'.spch');
				if(@file_exists(PCH_DIR.$tim.'.spch')){
					@chmod(PCH_DIR.$tim.'.spch',0666);
					unlink($pchtemp);
				}
			}
			//旧ファイル削除
			if(@is_file($path.$etim.$ext)) unlink($path.$etim.$ext);
			if(@is_file(THUMB_DIR.$etim.'s.jpg')) unlink(THUMB_DIR.$etim.'s.jpg');
			if(@is_file(PCH_DIR.$etim.'.pch')) unlink(PCH_DIR.$etim.'.pch');
			if(@is_file(PCH_DIR.$etim.'.spch')) unlink(PCH_DIR.$etim.'.spch');
			//ID付加
			if(DISP_ID){
				if($email&&DISP_ID==1){
					$now .= " ID:???";
				}else{
					$now.=" ID:".substr(crypt(md5(getenv("REMOTE_ADDR").ID_SEED.gmdate("Ymd", $time+9*60*60)),'id'),-8);
				}
			}
			//描画時間追加
			if($eptime) $ptime=$eptime.'+'.$ptime;
			//カンマを変換
			$now = str_replace(",", "&#44;", $now);
			$ptime = str_replace(",", "&#44;", $ptime);

			$line[$i] = "$no,$now,".strip_tags($name).",$email,$sub,$com,$url,$host,$epwd,$imgext,$W,$H,$tim,$chk,$ptime,$fcolor\n";
			$flag = true;
			break;
		}
	}
	if(!$flag){
		fclose($fp);
		error(MSG028);
	}

	ftruncate($fp,0);
	set_file_buffer($fp, 0);
	rewind($fp);
	$newline = implode('', $line);
	fputs($fp, charconvert($newline,CHARSET_OUT));
	fclose($fp);

	updatelog();

	header("Content-type: text/html; charset=".CHARSET_HTML);
	$str = "<!DOCTYPE html>\n<html><head><META HTTP-EQUIV=\"refresh\" content=\"1;URL=".PHP_SELF2."\">\n";
	//$str.= "<META HTTP-EQUIV=\"Content-type\" CONTENT=\"text/html; charset=".CHARSET_HTML."\"></head>\n";
	$str.= "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0\">\n<meta charset=\"".CHARSET_HTML."\"></head>\n";
	$str.= "<body>$mes 画面を切り替えます</body></html>";
	echo charconvert($str,CHARSET_OUT);
}

/* カタログ */
function catalog(){
	global $path,$page;

	$line = file(LOGFILE);
	$countline=count($line);
	for($i = 0; $i < $countline; $i++){
		list($no,) = explode(",", $line[$i]);
		$lineindex[$no]=$i + 1; //逆変換テーブル作成
	}

	$tree = file(TREEFILE);
	$counttree = count($tree);
	$x = 0;
	$y = 0;
	$pagedef = CATALOG_X * CATALOG_Y;//1ページに表示する件数
	head($dat);
	form($dat,'');
	if(!$page) $page=0;
	for($i = $page; $i < $page+$pagedef; $i++){
		if($tree[$i]==""){
			$dat['y'][$y]['x'][$x]['noimg'] = true;
		}else{
			$treeline = explode(",", rtrim($tree[$i]));
			$disptree = $treeline[0];
			$j=$lineindex[$disptree] - 1; //該当記事を探して$jにセット
			if($line[$j]=="") continue; //$jが範囲外なら次の行
			list($no,$now,$name,,$sub,,,,,$ext,$w,$h,$time,,) = explode(",", rtrim(charconvert($line[$j],CHARSET_IN)));
			// 画像ファイル名
			$img = $path.$time.$ext;
			// 画像系変数セット
			if($ext && @is_file($img)){
				$src = IMG_DIR.$time.$ext;
				if($w){	//サイズがある時
					if($w > CATALOG_W) $w=CATALOG_W; //画像幅を揃える
					if(@is_file(THUMB_DIR.$time.'s.jpg')){
						$imgsrc = THUMB_DIR.$time.'s.jpg';
					}else{
						$imgsrc = $src;
					}
				}else{$w=CATALOG_W;}
				//動画リンク
				if(USE_ANIME){
					if(@file_exists(PCH_DIR.$time.'.pch'))
						$pch = $time.$ext;
					if(@file_exists(PCH_DIR.$time.'.spch'))
						$pch = $time.$ext.'&amp;shi=1';
				}
			}else{$txt=true;}
			//日付とIDを分離
			if(preg_match("/( ID:)(.*)/",$now,$regs)){
				$id=$regs[2];
				$now=preg_replace("/( ID:.*)/","",$now);
			}else{$id='';}
			//日付と編集マークを分離
			$updatemark='';
			if(UPDATE_MARK){
				if(strstr($now,UPDATE_MARK)){
					$updatemark = UPDATE_MARK;
					$now=str_replace(UPDATE_MARK,"",$now);
				}
			}
			//名前とトリップを分離
			$name=strip_tags($name);//タグ除去
			if(preg_match("/(◆.*)/",$name,$regs)){
				$trip=$regs[1];
				$name=preg_replace("/(◆.*)/","",$name);
			}else{$trip='';}

			// 記事格納
			$dat['y'][$y]['x'][$x] = compact('imgsrc','w','no','sub','name','now','pch','txt','id','updatemark','trip');
			// 変数クリア
			unset($img,$src,$imgsrc,$w,$no,$sub,$name,$now,$pch,$txt);
		}

		$x++;
		if($x == CATALOG_X){$y++; $x=0;}
	}

	$prev = $page - $pagedef;
	$next = $page + $pagedef;
	// 改ページ処理
	if($prev >= 0) $dat['prev'] = PHP_SELF.'?mode=catalog&amp;page='.$prev;
	$paging = "";
	for($i = 0; $i < count($tree) ; $i+=$pagedef){
		if($page==$i){
			$pformat = str_replace("<PAGE>", $i/$pagedef, NOW_PAGE);
		}else{
			$pno = str_replace("<PAGE>", $i/$pagedef, OTHER_PAGE);
			$pformat = str_replace("<PURL>", PHP_SELF."?mode=catalog&amp;page=".$i, $pno);
		}
		$paging.=$pformat;
	}
	$dat['paging'] = $paging;
	if(count($tree) > $next){
		$dat['next'] = PHP_SELF.'?mode=catalog&amp;page='.$next;
	}

	htmloutput(CATALOGFILE,$dat);
}

/* 独自タグ */
function potitag($str){
	global $tags1,$tags2,$ryfont1,$ryfont2;

	$tagrp = 0;
	$tagrps1 = array();
	$tagrps2 = array();

	while(preg_match('/\[([^\]:]+):([^\]]*)\]/',$str,$match)){
		$str = str_replace($match[0],'<com'.$tagrp.'>',$str);
		array_push($tagrps1,'/<com'.$tagrp.'>/');

		$tag_ex = array();
		$tag_ed = array();
		$base_tags = explode("&#44;",$match[1]);
		$com = $match[2];

		foreach($base_tags as $base_tag){
			$base_tag = trim($base_tag);
			if(preg_match('/^F/',$base_tag)){
				if(preg_match('/s\(([^\)]+)\)/',$base_tag,$m)){$size = $m[1];}
				if(preg_match('/c\(([^\)]+)\)/',$base_tag,$m)){$color = $m[1];}
				if(preg_match('/f\(([^\)]+)\)/',$base_tag,$m)){
					$face = $m[1];
					for($i = 0; $i < count($ryfont1); $i++){
						if($face == $ryfont1[$i]){$face = $ryfont2[$i];}
					}
				}
				$font_ex = 1;
			}
			if($base_tag=='RB'){
				array_push($tag_ex,'<ruby>');
				array_push($tag_ed,'</ruby>');
				$rb_chk = 1;
			}else{
				for($i = 0; $i < count($tags1); $i++){
					if($base_tag==$tags1[$i]){
						array_push($tag_ex,'<'.$tags2[$i].'>');
						$endtag = preg_replace("/^([[:alpha:]]+)(.*)/",'\\1',$tags2[$i]);
						array_push($tag_ed,'</'.$endtag.'>');
						break;
					}
				}
			}
		}

		if($rb_chk){
			if(preg_match('/\(([^\):]+):([^\)]+)\)$/',$com,$m)){
				$com = str_replace($m[0],'('.$m[2].')',$com);
				$rb_color = ' style="color:'.$m[1].'"';
			}
			$com = preg_replace('/\(([^\)]+)\)$/','<rp>(</rp><rt'.$rb_color.'>\\1</rt><rp>)</rp>',$com);
		}

		if($font_ex){
			$size  = ($size)  ? ' size="'.$size.'"' : '';
			$color = ($color) ? ' color="'.$color.'"' : '';
			$face  = ($face)  ? ' face="'.$face.'"' : '';
			array_unshift($tag_ex,"<font$size$color$face>");
			array_unshift($tag_ed,"</font>");
		}

		for($i = 0; $i < count($tag_ex); $i++){
			$com = $tag_ex[$i].$com.$tag_ed[$i];
		}
		array_push($tagrps2,$com);
		++$tagrp;
		unset($tag_ex,$tag_ed,$base_tags,$com,$font_ex,$size,$color,$face,$rb_chk,$rb_color);
	}

	return preg_replace($tagrps1, $tagrps2, $str);
}

/* 独自タグ説明 */
function potitagview(){
	global $tags1,$tags2,$ryfont1,$ryfont2;

	head($dat);
	$dat['potitag_mode'] = true;
	htmloutput(OTHERFILE,$dat);
	exit;
}

/* 文字コード変換 */
function charconvert($str,$charset){
	if(CHARSET_CONVERT) return $str;
	switch($charset){
		case 1 : $charset_mb="EUC-JP";break;
		case 2 : $charset_mb="SJIS";break;
		case 3 : $charset_mb="ISO-2022-JP";break;
		case 4 : $charset_mb="UTF-8";break;
		default : $charset_mb=$charset;
	}
	if(function_exists("mb_convert_encoding")&&function_exists("mb_language")&&USE_MB){
		mb_language(LANG);
		return mb_convert_encoding($str, $charset_mb, "auto");

	// jcode.php by TOMO
	}elseif((@file_exists("jcode.phps")||@file_exists("jcode.php"))&&is_numeric($charset)){
		if(@file_exists("jcode.phps")){ require_once('jcode.phps'); }
		else{ require_once('jcode.php'); }
		$jc_from = AutoDetect($str);
		if($charset == 4){
			global $table_jis_utf8;
			include_once('code_table.jis2ucs');
		}
		if($jc_from == 4){
			global $table_utf8_jis;
			include_once('code_table.ucs2jis');
		}
		return JcodeConvert($str, $jc_from, $charset);

	}else{
		return $str;
	}
}

/* HTML出力 */
function htmloutput($template,$dat,$buf_flag=''){
	$buf = charconvert(HtmlTemplate::t_buffer($template,$dat), CHARSET_OUT);
	if($buf_flag){
		return $buf;
	}else{
		header("Content-type: text/html; charset=".CHARSET_HTML);
		echo $buf;
	}
}

/*-----------Main-------------*/
init();		//←■■初期設定後は不要なので削除可■■
deltemp();

//user-codeの発行
if(!isset($usercode)){
	$usercode = substr(crypt(md5(getenv("REMOTE_ADDR").ID_SEED.gmdate("Ymd", time()+9*60*60)),'id'),-12);
	//念の為にエスケープ文字があればアルファベットに変換
	$usercode = strtr($usercode,"!\"#$%&'()+,/:;<=>?@[\\]^`/{|}~","ABCDEFGHIJKLMNOabcdefghijklmn");
}
setcookie("usercode", $usercode, time()+86400*365);//1年間

if (isset($mode)){//未定義エラー対策
switch($mode){
	case 'regist':
		if(ADMIN_NEWPOST && !$resto){
			if($pwd != ADMIN_PASS){ error(MSG029);
			}else{ $admin=$pwd; }
		}

		regist($name,$email,$sub,$com,$url,$pwd,$upfile,$upfile_name,$resto,$pictmp,$picfile);
		break;
	case 'admin':
		valid($pass);
		if($admin=="del") admindel($pass);
		if($admin=="post"){
			$dat['post_mode'] = true;
			$dat['regist'] = true;
			head($dat);
			form($dat,$res,1);
			htmloutput(OTHERFILE,$dat);
		}
		if($admin=="update"){
			updatelog();
			echo "<META HTTP-EQUIV=\"refresh\" content=\"0;URL=".PHP_SELF2."\">";
		}
		break;
	case 'usrdel':
		if(USER_DEL){
			usrdel($del,$pwd);
			updatelog();
			echo "<META HTTP-EQUIV=\"refresh\" content=\"0;URL=".PHP_SELF2."\">";
		}else{error(MSG033);}
		break;
	case 'paint':
		paintform($picw,$pich,$palette,$anime);
		break;
	case 'piccom':
		paintcom($resto);
		break;
	case 'openpch':
		openpch($pch,$sp);
		break;
	case 'continue':
		incontinue($no);
		break;
	case 'contpaint':
//		if(CONTINUE_PASS) usrchk($no,$pwd);
//差し換えの時には削除キーが必要
		if(CONTINUE_PASS||$type=='rep') usrchk($no,$pwd);
		if(ADMIN_NEWPOST) $admin=$pwd;
		paintform($picw,$pich,$palette,$anime,$pch);
		break;
	case 'newpost':
		$dat['post_mode'] = true;
		$dat['regist'] = true;
		head($dat);
		form($dat,'');
		htmloutput(OTHERFILE,$dat);
		break;
	case 'edit':
		editform($del,$pwd);
		break;
	case 'rewrite':
		rewrite($no,$name,$email,$sub,$com,$url,$pwd,$admin);
		break;
	case 'picrep':
		replace($no,$pwd,$stime);
		break;
	case 'catalog':
		catalog();
		break;
	case 'tag':
		potitagview();
		break;
	default:
		if($res){
			updatelog($res);
		}else{
			echo "<META HTTP-EQUIV=\"refresh\" content=\"0;URL=".PHP_SELF2."\">";
		}
}
}
//default:で処理していた箇所
else {
	if($res){
			updatelog($res);
		}else{
			echo "<meta http-equiv=\"refresh\" content=\"0;URL=".PHP_SELF2."\">";
		}
	 }

?>
