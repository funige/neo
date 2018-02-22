'use strict';

Neo.dictionary = {
    "ja": {},
    "en": {
	"やり直し": "Redo",
	"元に戻す": "Undo",
	"塗り潰し": "Paint",
	"窓": "F　",
	"投稿": "Send",
	"(C)しぃちゃん PaintBBS NEO": "(C)shi-chan PaintBBS NEO",
	"鉛筆": "Solid",
	"水彩": "WaterC",
	"ﾃｷｽﾄ": "Text",
        "トーン": "Tone",
        "ぼかし": "ShadeOff",
        "覆い焼き": "HLight",
        "焼き込み": "Dark",
        "消しペン": "White",
        "消し四角": "WhiteRect",
        "全消し": "Clear",
        "四角": "Rect",
        "線四角": "LineRect",
        "楕円": "Oval",
        "線楕円": "LineOval",
        "コピー": "Copy",
        "ﾚｲﾔ結合": "lay-unif",
        "角取り": "Antialias",
        "左右反転": "reverseL",
        "上下反転": "reverseU",
        "傾け": "lie",
        "通常": "Normal",
        "マスク": "Mask",
        "逆ﾏｽｸ": "ReMask",
        "加算": "And",
        "逆加算": "Div",
        "手書き": "FreeLine",
        "直線": "Straight",
        "BZ曲線": "Bezie",
        "ページビュー？": "Page view?",
        "ウィンドウビュー？": "Window view?",
        "以前の編集データを復元しますか？": "Is former data restored?",

        "PaintBBS NEOは、お絵描きしぃ掲示板 PaintBBS (©2000-2004 しぃちゃん) をhtml5化するプロジェクトです。\n\nPaintBBS NEOのホームページを表示しますか？": "PaintBBS NEO is an HTML5 port of Oekaki Shi-BBS PaintBBS (©2000-2004 shi-chan). Show the project page?",
        "このブラウザでは<br>投稿に失敗することがあります<br>": "This browser may fail to send your picture.<br>",
    },
};

Neo.translate = function () {
    var lang = "en";
    for (var key in Neo.dictionary) {
	if (navigator.language.indexOf(key) == 0) {
	    lang = key;
	    break;
	}
    }
    return function(string) {
	return Neo.dictionary[lang][string] || string;
    }
}();
