// @ts-check
/** @typedef {import("./painter.js").Painter} Painter */
/** @typedef {import("./widgets.js").Button} Button */
/** @typedef {import("./widgets.js").FillButton} FillButton */
/** @typedef {import("./widgets.js").RightButton} RightButton */
/** @typedef {import("./widgets.js").PenTip} PenTip */
/** @typedef {import("./widgets.js").Pen2Tip} Pen2Tip */
/** @typedef {import("./widgets.js").EffectTip} EffectTip */
/** @typedef {import("./widgets.js").Effect2Tip} Effect2Tip */
/** @typedef {import("./widgets.js").EraserTip} EraserTip */
/** @typedef {import("./widgets.js").DrawTip} DrawTip */
/** @typedef {import("./widgets.js").MaskTip} MaskTip */
/** @typedef {import("./widgets.js").ViewerBar} ViewerBar */
/** @typedef {import("./widgets.js").ViewerButton} ViewerButton */
/** @typedef {import("./widgets.js").SizeSlider} SizeSlider */
/** @typedef {import("./widgets.js").ColorSlider} ColorSlider */
/** @typedef {import("./widgets.js").ScrollBarButton} ScrollBarButton */
/** @typedef {import("./widgets.js").ToolTip} ToolTip */
/** @typedef {import("./widgets.js").ColorTip} ColorTip */
/** @typedef {import("./widgets.js").ReserveControl} ReserveControl */

var Neo = {};
Neo.version = "PACKAGE_JSON_VERSION";
/** @type {Painter} */
Neo.painter;

Neo.fullScreen = false;
Neo.uploaded = false;
Neo.viewer = false;
/**@type  {HTMLElement|null} */
Neo.container = null;
/**@type {HTMLElement|null} */
Neo.center = null;
/**@type {HTMLElement|null} */
Neo.canvas = null;
/**@type {HTMLElement|null} */
Neo.toolsWrapper = null;
/**@type {HTMLElement|null} */
Neo.tools = null;
Neo.toolSide = false;
/**@type {HTMLElement|null} */
Neo.applet = null;
Neo.isAnimation = false;
Neo.viewerWrapperOnTop = false;
Neo.storage = localStorage;
Neo.stabilize_level = 0;
/** @type {CSSStyleSheet|null}*/
Neo.styleSheet = null;
/** @type {Record<string, string>} */
Neo.rules = {};

/**
 * @typedef {Object} NeoConfig
 * @property {number} width
 * @property {number} height
 * @property {string[]} colors
 * @property {boolean} [neo_enable_zoom_out]
 * @property {any} [key]
 */
/** @type {NeoConfig & Record<string, any>} */
Neo.config = {
  width: 300,
  height: 300,

  colors: [
    "#000000",
    "#FFFFFF",
    "#B47575",
    "#888888",
    "#FA9696",
    "#C096C0",
    "#FFB6FF",
    "#8080FF",
    "#25C7C9",
    "#E7E58D",
    "#E7962D",
    "#99CB7B",
    "#FCECE2",
    "#F9DDCF",
  ],
};

Neo.reservePen =
  /** @type {{size:number,color:string,alpha:number,tool:number,drawType:number}} */ ({});
Neo.reserveEraser =
  /** @type {{size:number,color:string,alpha:number,tool:number,drawType:number}} */ ({});
/**@type {Button|null} */
Neo.submitButton = null;
/**@type {FillButton|null} */
Neo.fillButton = null;
/**@type {RightButton|null} */
Neo.rightButton = null;
// toolTip
/**@type {PenTip|null} */
Neo.penTip = null;
/**@type {Pen2Tip|null} */
Neo.pen2Tip = null;
/**@type {EffectTip|null} */
Neo.effectTip = null;
/**@type {Effect2Tip|null} */
Neo.effect2Tip = null;
/**@type {EraserTip|null} */
Neo.eraserTip = null;
/**@type {DrawTip|null} */
Neo.drawTip = null;
/**@type {MaskTip|null} */
Neo.maskTip = null;

Neo.isApp = false;
/**@type {ViewerBar|null} */
Neo.viewerBar = null;
/**@type {ViewerButton|null} */
Neo.viewerPlay = null;
/**@type {ViewerButton|null} */
Neo.viewerStop = null;
/**@type {ViewerButton|null} */
Neo.viewerSpeed = null;
Neo.speed = 0;
/**@type {object|null} */
Neo.params = null;
/**@type {object|null} */
Neo.param = null;
/**@type {SizeSlider|null} */
Neo.sizeslider = null;
/**@type {ColorSlider[]|SizeSlider[]} */
Neo.sliders = [];
/** @type {ScrollBarButton|null} */
Neo.scrollH = null;
/** @type {ScrollBarButton|null} */
Neo.scrollV = null;
/** @type {(FillButton|ToolTip)[]} */
Neo.toolButtons = [];
/** @type {ColorTip[]} */
Neo.colorTips = [];
/** @type {ReserveControl[]} */
Neo.reserveControls = [];

Neo.CurrentToolType = 1;
Neo.SLIDERTYPE_RED = 0;
Neo.SLIDERTYPE_GREEN = 1;
Neo.SLIDERTYPE_BLUE = 2;
Neo.SLIDERTYPE_ALPHA = 3;
Neo.SLIDERTYPE_SIZE = 4;

/*
  -----------------------------------------------------------------------
    LiveConnect
  -----------------------------------------------------------------------
*/
/**
 * コンテナとズーム倍率に合わせて destCanvas と関連要素のサイズ・スタイルを更新する。
 *
 * @returns {void}
 */
Neo.resizeCanvas = function () {};
Neo.playPCH = function () {};

Neo.suspendDraw = function () {};

/** @param {number} value */
Neo.setSpeed = function (value) {};

/**
 * レイヤー可視性
 * @param {number} layer - 対象となるレイヤーのインデックス
 * @param {number|boolean} value - 表示状態（0またはfalseで非表示、それ以外で表示）
 */
Neo.setVisit = function (layer, value) {};

/**
 * @param {number} value
 */
Neo.setMark = function (value) {};
Neo.getSeek = function () {};
Neo.getLineCount = function () {};
/**
 * HTML側からの指定に基づきツールの位置を変更する
 * @param {boolean|string} htmlConfiguredSide - HTMLタグ等で設定された外部からのサイド指定
 */
Neo.setToolSide = function (htmlConfiguredSide) {};

/**
 * 手ぶれ補正の強さ
 * @param {Number|string} htmlConfig
 * @note 0-5の範囲 デフォルト1
 */
Neo.setStabilizeLevel = function (htmlConfig) {};
Neo.setStabilizLevel = Neo.setStabilizeLevel;
Neo.getColors = function () {};
/**
 * パレット全体のカラーを一括で設定し、UIのカラーチップに反映する
 * @param {string} colors - 改行区切りの16進数カラーコードの文字列（14色分）
 */
Neo.setColors = function (colors) {};
/**
 * カラーピッカーで色をセット
 * @param {string} color - <input type="color">で取得した色
 * @returns {void}
 */
Neo.setColor = function (color) {};

Neo.pExit = function () {};

Neo.str_header = "";

/**
 * @param {string} url
 */
Neo.openURL = function (url) {};

/** @param {HTMLElement} applet */
Neo.createViewer = function (applet) {};
/**
 * ビューアの初期化処理
 * @param {Object} [pch] - PCHファイルデータ（あれば再生を開始する）
 * @param {Array<*>} [pch.data] - 再生用アクションデータ
 */
Neo.initViewer = function (pch) {};
Neo.startViewer = function () {};
/**
 * PCHファイルのバイナリデータをデコードし、構造化されたオブジェクトに変換する。
 * * @typedef {Object} PCHData
 * @property {number} width - キャンバスの横幅
 * @property {number} height - キャンバスの高さ
 * @property {Array<any>} data - 描画命令の配列（fixPCH適用済み）
 * * @param {ArrayBuffer} rawdata - fetchで取得した生のバイナリデータ
 * @returns {PCHData|null} デコード成功時はオブジェクト、失敗時はnullを返す
 * * @example
 */
Neo.decodePCH = function (rawdata) {
  return null;
};
/**@return {boolean} **/
Neo.init = function () {
  return false;
};
/**
 * @param {boolean} [isApp]
 */
Neo.start = function (isApp = false) {};

/**
 *  @type {any} *
 *  @note ライブコネクト
 */
(document).neo = Neo;

export { Neo };
