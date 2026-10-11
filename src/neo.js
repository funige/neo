var Neo = {};
Neo.version = "PACKAGE_JSON_VERSION";
// @ts-ignore
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
//@ts-ignore
/**@type {Neo.Button|null} */
Neo.submitButton = null;
//@ts-ignore
/**@type {Neo.FillButton|null} */
Neo.fillButton = null;
//@ts-ignore
/**@type {Neo.RightButton|null} */
Neo.rightButton = null;
// toolTip
//@ts-ignore
/**@type {Neo.PenTip|null} */
Neo.penTip = null;
//@ts-ignore
/**@type {Neo.Pen2Tip|null} */
Neo.pen2Tip = null;
//@ts-ignore
/**@type {Neo.EffectTip|null} */
Neo.effectTip = null;
//@ts-ignore
/**@type {Neo.Effect2Tip|null} */
Neo.effect2Tip = null;
//@ts-ignore
/**@type {Neo.EraserTip|null} */
Neo.eraserTip = null;
//@ts-ignore
/**@type {Neo.DrawTip|null} */
Neo.drawTip = null;
//@ts-ignore
/**@type {Neo.MaskTip|null} */
Neo.maskTip = null;

Neo.isApp = false;
// @ts-ignore
/**@type {Neo.ViewerBar|null} */
Neo.viewerBar = null;
// @ts-ignore
/**@type {Neo.ViewerButton|null} */
Neo.viewerPlay = null;
// @ts-ignore
/**@type {Neo.ViewerButton|null} */
Neo.viewerStop = null;
// @ts-ignore
/**@type {Neo.ViewerButton|null} */
Neo.viewerSpeed = null;
Neo.speed = 0;
/**@type {object|null} */
Neo.params = null;
/**@type {object|null} */
Neo.param = null;
// @ts-ignore
/**@type {Neo.SizeSlider|null} */
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
