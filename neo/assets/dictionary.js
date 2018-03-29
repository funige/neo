'use strict';

Neo.dictionary = {
    "ja": {},
    "en": {
	"やり直し": "Redo",
	"元に戻す": "Undo",
	"塗り潰し": "Paint",
	"窓": "F&nbsp;",
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
        "以前の編集データを復元しますか？": "Restore session?",
	"右": "R&nbsp;",

        "PaintBBS NEOは、お絵描きしぃ掲示板 PaintBBS (©2000-2004 しぃちゃん) をhtml5化するプロジェクトです。\n\nPaintBBS NEOのホームページを表示しますか？": "PaintBBS NEO is an HTML5 port of Oekaki Shi-BBS PaintBBS (©2000-2004 shi-chan). Show the project page?",
        "このブラウザでは<br>投稿に失敗することがあります<br>": "This browser may fail to send your picture.<br>",
    },
    "enx": {
	"やり直し": "Redo",
	"元に戻す": "Undo",
	"塗り潰し": "Fill",
	"窓": "Float",
	"投稿": "Send",
	"(C)しぃちゃん PaintBBS NEO": "&copy;shi-cyan PaintBBS NEO",
	"鉛筆": "Solid",
	"水彩": "WaterCo",
	"ﾃｷｽﾄ": "Text",
        "トーン": "Halftone",
        "ぼかし": "Blur",
        "覆い焼き": "Light",
        "焼き込み": "Dark",
        "消しペン": "White",
        "消し四角": "WhiteRe",
        "全消し": "Clear",
        "四角": "Rect",
        "線四角": "LineRect",
        "楕円": "Oval",
        "線楕円": "LineOval",
        "コピー": "Copy",
        "ﾚｲﾔ結合": "layerUnit",
        "角取り": "antiAlias",
        "左右反転": "flipHorita",
        "上下反転": "flipVertic",
        "傾け": "rotate",
        "通常": "Normal",
        "マスク": "Mask",
        "逆ﾏｽｸ": "ReMask",
        "加算": "And",
        "逆加算": "Divide",
        "手書き": "Freehan",
        "直線": "Line",
        "BZ曲線": "Bezier",
        "Layer0": "LayerBG",
        "Layer1": "LayerFG",
        "ページビュー？": "Page view?",
        "ウィンドウビュー？": "Window view?",
        "以前の編集データを復元しますか？": "Restore session?",
	"右": "Right Click",

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
        if (lang == "en" && Neo.config.neo_alt_english) {
            lang = "enx";
        }
	return Neo.dictionary[lang][string] || string;
    }
}();

