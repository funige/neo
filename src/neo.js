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
Neo.updateUI = function () {};
Neo.stabilize_level = 0;
/** @type {CSSStyleSheet|null}*/
Neo.styleSheet = null;
/** @type {any} **/
Neo.rules = [];
/** @type {any} **/
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
Neo.SLIDERTYPE_RED = 0;
Neo.SLIDERTYPE_GREEN = 1;
Neo.SLIDERTYPE_BLUE = 2;
Neo.SLIDERTYPE_ALPHA = 3;
Neo.SLIDERTYPE_SIZE = 4;

/**
 *  @type {any} *
 *  @note ライブコネクト
 */
(document).neo = Neo;

export { Neo };
