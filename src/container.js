"use strict";
//@ts-check
import { Neo } from "./neo.js";
import { Commands } from "./commands.js";
import { Painter } from "./painter.js";
import { getFilename } from "./actions.js";
import { getPCH } from "./actions.js";
import { Button } from "./widgets.js";
import { translate } from "./dictionary.js";
import {
  FillButton,
  RightButton,
  PenTip,
  Pen2Tip,
  EffectTip,
  Effect2Tip,
  EraserTip,
  DrawTip,
  MaskTip,
  ColorTip,
  ReserveControl,
  LayerControl,
  ScrollBarButton,
  SizeSlider,
  ColorSlider,
} from "./widgets.js";
document.addEventListener("DOMContentLoaded", () => {
  if (Neo.init()) {
    if (!navigator.userAgent.match("Electron")) {
      Neo.start();
    }
  }
  document.addEventListener(
    "dblclick",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    {
      passive: false,
    },
  );
});

/**
 * 起動設定（paramの中身）を抽出する
 * @param {string} targetName - "paintbbs" | "pch"
 */
const extractBootConfig = function (targetName) {
  // 1. 外部で設定されたObjectの場合
  Neo.params = Neo.params || Neo.param; //エイリアス。`Neo.params`でも、単数形の`Neo.param`でも設定できる。
  if (
    Neo.params &&
    typeof Neo.params === "object" &&
    Object.keys(Neo.params).length > 0
  ) {
    /** @type {Record<string, any>} */
    const params = Neo.params;
    return params[targetName] ? { ...params[targetName] } : {};
  }

  // 2. DOMの探索（指定された名前を持つ要素を最初に1つ見つける）
  // targetName が "paintbbs" なら .neo-applet-paintbbs を探す
  const applet = `applet[name="${targetName}"], applet-dummy[name="${targetName}"], .neo-applet-${targetName}`;
  /**@type {HTMLElement|null} */
  const node = document.querySelector(applet);

  if (!node) return {};

  // 3. paramタグの中身だけを抽出

  /** @type {Record<string, string>} */
  const config = {};
  const params = node.querySelectorAll("param");
  for (const param of params) {
    const key = param.getAttribute("name");
    const val = param.getAttribute("value");
    if (key) {
      config[key] = fixConfig(String(val));
    }
  }

  return config;
};

/**
 * @returns {boolean}
 */
Neo.init = function () {
  //appletタグまたはそれに代わるdivタグのID
  let applets = document.querySelectorAll(
    "applet,applet-dummy,.neo-applet-paintbbs,.neo-applet-pch",
  );

  for (const applet of applets) {
    if (applet instanceof HTMLElement) {
      let name = applet.getAttribute("name");
      // name属性がない場合、クラス名から探す
      if (!name) {
        for (const className of applet.classList) {
          if (className.startsWith("neo-applet-")) {
            name = className.replace("neo-applet-", "");
            break; // 見つかったら終了
          }
        }
      }
      if (name == "paintbbs" || name == "pch") {
        Neo.applet = applet;

        if (name == "paintbbs") {
          initConfig(applet);
          createContainer(applet);
          init2();
        } else {
          Neo.viewer = true;
          initConfig(applet);

          var filename = getFilename();
          getPCH(filename, function (pch) {
            if (pch) {
              Neo.createViewer(applet);
              Neo.config.width = pch.width;
              Neo.config.height = pch.height;
              Neo.initViewer(pch);
              // initViewer()内へ移動
              // ボタンが表示される前に再生される事があるため
              // Neo.startViewer();
            }
          });
        }
        return true;
      }
    }
  }
  return false;
};
/**
 * @returns {void}
 */
const init2 = function () {
  const pageview = document.getElementById("neo-pageView");
  if (!pageview) return;
  pageview.style.width = Neo.config.applet_width + "px";
  pageview.style.height = Neo.config.applet_height + "px";

  Neo.canvas = document.getElementById("neo-canvas");
  if (!Neo.canvas) {
    console.error("initViewer: Canvas element not found");
    return;
  }
  Neo.container = document.getElementById("neo-container");
  if (!Neo.container) {
    console.error("init2: Container element not found");
    return;
  }

  Neo.toolsWrapper = document.getElementById("neo-toolsWrapper");
  Neo.tools = document.getElementById("neo-tools");
  Neo.center = document.getElementById("neo-center");
  if (
    Neo.center &&
    Neo.container &&
    Neo.container.clientWidth &&
    Neo.container.clientWidth >= 400 &&
    Neo.config.neo_disable_neo_center_min_width != "true"
  ) {
    Neo.center.style.minWidth = "397px";
  }

  Neo.painter = new Painter();
  Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);

  Neo.container.oncontextmenu = function () {
    return false;
  };

  // 動画記録
  Neo.isAnimation = Neo.config.thumbnail_type == "animation";

  // 続きから描く
  Neo.storage = localStorage; //PCの時にもlocalStorageを使用

  var filename = getFilename();
  var message =
    !filename || filename.slice(-4).toLowerCase() != ".pch"
      ? "描きかけの画像があります。復元しますか？"
      : "描きかけの画像があります。動画の読み込みを中止して復元しますか？";

  /**@type {string|null} */
  let storageTimestamp = Neo.storage.getItem("timestamp");
  const nowTimestamp = Date.now();

  if (
    Number.isInteger(Number(storageTimestamp)) &&
    nowTimestamp - Number(storageTimestamp) > 3 * 86400 * 1000
  ) {
    //3日経過した復元データは破棄
    Neo.painter.clearSession();
    storageTimestamp = null;
  }
  if (storageTimestamp && confirm(translate(message))) {
    setTimeout(function () {
      Neo.painter.loadSession(function () {
        Neo.painter._pushUndo();
        Neo.painter._actionMgr.restore();
        //復元時にサイズが違うキャンバスで開き直した時に画像が切り取られないようにするため
        //復元処理の直後はデータが変更されていない事にする
        Neo.painter.dirty = false;
      });
    }, 1);
  } else {
    //復元しないを選択した時
    Neo.painter.clearSession();
    if (filename) {
      if (filename.slice(-4).toLowerCase() == ".pch") {
        Neo.painter.loadAnimation(filename);
      } else {
        Neo.painter.loadImage(filename);
      }
    }
  }
  window.addEventListener(
    // "pagehide",
    "beforeunload", //ブラウザを終了した時にも復元データを保存
    function (e) {
      if (!Neo.uploaded && Neo.painter.isDirty()) {
        Neo.painter.saveSession();
      } else if (Neo.uploaded) {
        //投稿完了時にクリア
        Neo.painter.clearSession();
      }
    },
    false,
  );
  /**
   * Chromeのメモリーセーバによるタブ破棄対策
   * 非アクティブになった時にタイトルタグにアスタリスクを追加
   */
  //オリジナルのタイトルタグを保持
  const originalTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    if (Neo.config.neo_visibility_change_title_rewrite === "true") {
      // ページが見えている時は元に戻す
      if (document.visibilityState === "visible") {
        document.title = originalTitle;
      }
      // ページが隠れた時はタイマーをセット
      else if (document.visibilityState === "hidden") {
        setTimeout(() => {
          if (
            document.visibilityState === "hidden" &&
            document.title === originalTitle
          ) {
            document.title = `${originalTitle} *`;
          }
        }, 3000);
      }
    }
  });
};
/**
 * 初期設定
 * @param {HTMLElement|any} applet div,applet,applet-dummy
 */
const initConfig = function (applet) {
  if (applet) {
    var appletWidth = applet.dataset.width || applet.getAttribute("width");
    var appletHeight = applet.dataset.height || applet.getAttribute("height");
    if (appletWidth) Neo.config.applet_width = parseInt(appletWidth);
    if (appletHeight) Neo.config.applet_height = parseInt(appletHeight);
    let targetName;
    if (applet instanceof HTMLElement) {
      targetName = applet.getAttribute("name");
      // name属性がない場合、クラス名から探す
      if (!targetName) {
        for (const className of applet.classList) {
          if (className.startsWith("neo-applet-")) {
            targetName = className.replace("neo-applet-", "");
            break; // 見つかったら終了
          }
        }
      }
    }
    if (!targetName) {
      targetName = "paintbbs";
    }

    // 1. 設定値（paramの代わり）を抽出する
    const params = extractBootConfig(targetName);

    // 2. 抽出した設定値をループして Neo.config に反映させる
    if (params) {
      for (const key in params) {
        const value = String(params[key]);

        // 設定値を適用
        // console.log(value);
        Neo.config[key] = fixConfig(value);

        if (key === "image_width") Neo.config.width = parseInt(value);
        if (key === "image_height") Neo.config.height = parseInt(value);
      }
    }
    var emulationMode = Neo.config.neo_emulation_mode || "2.22_8x";
    Neo.config.neo_alt_translation = emulationMode.slice(-1).match(/x/i);

    if (Neo.viewer && !Neo.config.color_bar) {
      Neo.config.color_bar = "#eeeeff";
    }

    readStyles();
    applyStyle("color_bk", "#ccccff");
    applyStyle("color_bk2", "#bbbbff");
    applyStyle("color_tool_icon", "#e8dfae");
    applyStyle("color_icon", "#ccccff");
    applyStyle("color_iconselect", "#ffaaaa");
    applyStyle("color_text", "#666699");
    applyStyle("color_bar", "#6f6fae");
    applyStyle("tool_color_button", "#e8dfae");
    applyStyle("tool_color_button2", "#f8daaa");
    applyStyle("tool_color_text", "#773333");
    applyStyle("tool_color_bar", "#ddddff");
    applyStyle("tool_color_frame", "#000000");

    // viewer用
    if (Neo.viewer) {
      applyStyle("color_back", "#ccccff");
      applyStyle("color_bar_select", "#407675");
    }

    // const container = document.getElementById("neo-container");
    // Neo.config.inherit_color = Neo.getInheritColor(container);
    if (!Neo.config.color_frame) Neo.config.color_frame = Neo.config.color_text;

    if (
      Neo.config.neo_tool_side == "left" ||
      Neo.config.neo_tool_side == "true"
    ) {
      Neo.toolSide = true;
    }
  }

  Neo.config.reserves = [
    {
      size: 1,
      color: "#000000",
      alpha: 1.0,
      tool: Painter.TOOLTYPE_PEN,
      drawType: Painter.DRAWTYPE_FREEHAND,
    },
    {
      size: 5,
      color: "#FFFFFF",
      alpha: 1.0,
      tool: Painter.TOOLTYPE_ERASER,
      drawType: Painter.DRAWTYPE_FREEHAND,
    },
    {
      size: 10,
      color: "#FFFFFF",
      alpha: 1.0,
      tool: Painter.TOOLTYPE_ERASER,
      drawType: Painter.DRAWTYPE_FREEHAND,
    },
  ];

  Neo.reservePen =
    /** @type {{size:number,color:string,alpha:number,tool:number,drawType:number}} */ (
      clone(Neo.config.reserves[0])
    );
  Neo.reserveEraser =
    /** @type {{size:number,color:string,alpha:number,tool:number,drawType:number}} */ (
      clone(Neo.config.reserves[1])
    );
};

/**
 *
 * @param {string} value
 * @returns {string}
 * @note true|falseのときは小文字が返る
 */
const fixConfig = function (value) {
  // javaでは"#12345"を色として解釈するがjavascriptでは"#012345"に変換しないとだめ
  if (value.match(/^#[0-9a-fA-F]{5}$/)) {
    value = "#0" + value.slice(1);
  }
  //true|falseの時は小文字に統一
  if (
    value.toLocaleLowerCase() === "true" ||
    value.toLocaleLowerCase() === "false"
  ) {
    return value.toLocaleLowerCase();
  }
  return value;
};

/**
 * スタイルシートを取得
 * @returns {CSSStyleSheet|null}
 */
export const getStyleSheet = function () {
  var style = document.createElement("style");
  document.head.appendChild(style);
  return style.sheet;
};

const initSkin = function () {
  Neo.styleSheet = getStyleSheet();
  var lightBorder = multColor(Neo.config.color_icon, 1.3);
  var darkBorder = multColor(Neo.config.color_icon, 0.7);
  var lightBar = multColor(Neo.config.color_bar, 1.3);
  var darkBar = multColor(Neo.config.color_bar, 0.7);
  var bgImage = Neo.painter ? createBackgroundImage() : "";

  addRule(".NEO #neo-container", "background-image", "url(" + bgImage + ")");
  addRule(".NEO .colorSlider .label", "color", Neo.config.tool_color_text);
  addRule(".NEO .sizeSlider .label", "color", Neo.config.tool_color_text);
  addRule(".NEO .layerControl .label1", "color", Neo.config.tool_color_text);
  addRule(".NEO .layerControl .label0", "color", Neo.config.tool_color_text);
  addRule(".NEO .toolTipOn .label", "color", Neo.config.tool_color_text);
  addRule(".NEO .toolTipOff .label", "color", Neo.config.tool_color_text);

  addRule(".NEO #neo-toolSet", "background-color", Neo.config.color_bk);
  addRule(".NEO #neo-tools", "color", Neo.config.tool_color_text);
  addRule(
    ".NEO .layerControl .bg",
    "border-bottom",
    "1px solid " + Neo.config.tool_color_text,
  );

  addRule(".NEO .buttonOn", "color", Neo.config.color_text);
  addRule(".NEO .buttonOff", "color", Neo.config.color_text);

  addRule(".NEO .buttonOff", "background-color", Neo.config.color_icon);
  addRule(".NEO .buttonOff", "border-top", "1px solid ", Neo.config.color_icon);
  addRule(
    ".NEO .buttonOff",
    "border-left",
    "1px solid ",
    Neo.config.color_icon,
  );
  addRule(
    ".NEO .buttonOff",
    "box-shadow",
    "0 0 0 1px " +
      Neo.config.color_icon +
      ", 0 0 0 2px " +
      Neo.config.color_frame,
  );

  addRule(".NEO .buttonOff:hover", "background-color", Neo.config.color_icon);
  addRule(".NEO .buttonOff:hover", "border-top", "1px solid " + lightBorder);
  addRule(".NEO .buttonOff:hover", "border-left", "1px solid " + lightBorder);
  addRule(
    ".NEO .buttonOff:hover",
    "box-shadow",
    "0 0 0 1px " +
      Neo.config.color_iconselect +
      ", 0 0 0 2px " +
      Neo.config.color_frame,
  );

  addRule(
    ".NEO .buttonOff:active, .NEO .buttonOn",
    "background-color",
    darkBorder,
  );
  addRule(
    ".NEO .buttonOff:active, .NEO .buttonOn",
    "border-top",
    "1px solid " + darkBorder,
  );
  addRule(
    ".NEO .buttonOff:active, .NEO .buttonOn",
    "border-left",
    "1px solid " + darkBorder,
  );
  addRule(
    ".NEO .buttonOff:active, .NEO .buttonOn",
    "box-shadow",
    "0 0 0 1px " +
      Neo.config.color_iconselect +
      ", 0 0 0 2px " +
      Neo.config.color_frame,
  );

  addRule(".NEO #neo-canvas", "border", "1px solid " + Neo.config.color_frame);
  addRule(
    ".NEO #neo-scrollH, .NEO #neo-scrollV",
    "background-color",
    Neo.config.color_icon,
  );
  addRule(
    ".NEO #neo-scrollH, .NEO #neo-scrollV",
    "box-shadow",
    "0 0 0 1px white" + ", 0 0 0 2px " + Neo.config.color_frame,
  );

  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "background-color",
    Neo.config.color_bar,
  );
  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "box-shadow",
    "0 0 0 1px " + Neo.config.color_icon,
  );
  addRule(
    ".NEO #neo-scrollH div:hover, .NEO #neo-scrollV div:hover",
    "box-shadow",
    "0 0 0 1px " + Neo.config.color_iconselect,
  );

  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "border-top",
    "1px solid " + lightBar,
  );
  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "border-left",
    "1px solid " + lightBar,
  );
  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "border-right",
    "1px solid " + darkBar,
  );
  addRule(
    ".NEO #neo-scrollH div, .NEO #neo-scrollV div",
    "border-bottom",
    "1px solid " + darkBar,
  );

  addRule(
    ".NEO .toolTipOn",
    "background-color",
    multColor(Neo.config.tool_color_button, 0.7),
  );
  addRule(".NEO .toolTipOff", "background-color", Neo.config.tool_color_button);
  addRule(
    ".NEO .toolTipFixed",
    "background-color",
    Neo.config.tool_color_button2,
  );

  addRule(
    ".NEO .colorSlider, .NEO .sizeSlider",
    "background-color",
    Neo.config.tool_color_bar,
  );
  addRule(
    ".NEO .reserveControl",
    "background-color",
    Neo.config.tool_color_bar,
  );
  addRule(
    ".NEO .reserveControl",
    "background-color",
    Neo.config.tool_color_bar,
  );
  addRule(".NEO .layerControl", "background-color", Neo.config.tool_color_bar);

  addRule(
    ".NEO .colorTipOn, .NEO .colorTipOff",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .toolTipOn, .NEO .toolTipOff",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .toolTipFixed",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .colorSlider, .NEO .sizeSlider",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .reserveControl",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .layerControl",
    "box-shadow",
    "0 0 0 1px " + Neo.config.tool_color_frame,
  );
  addRule(
    ".NEO .reserveControl .reserve",
    "border",
    "1px solid " + Neo.config.tool_color_frame,
  );

  if (navigator.language.indexOf("ja") != 0) {
    var labels = ["Fixed", "On", "Off"];
    for (var i = 0; i < labels.length; i++) {
      var selector = ".NEO .toolTip" + labels[i] + " .label";
      addRule(selector, "letter-spacing", "0px !important");
    }
  }
  Neo.setToolSide(Neo.toolSide);
};

/**
 * 動的にスタイルシートにCSSルールを追加する
 * @param {string} selector - CSSセレクタ (例: "body", ".paint-canvas")
 * @param {string} styleName - CSSプロパティ名 (例: "letter-spacing")
 * @param {string|number} value - 設定する値 (例: "0px !important")
 * @param {CSSStyleSheet|null} [sheet] - 対象のスタイルシート（省略時は Neo.styleSheet）
 */
export const addRule = function (selector, styleName, value, sheet = null) {
  // 1. 省略時はデフォルトの stylesheet を適用
  if (!sheet) {
    sheet = Neo.styleSheet;
  }

  if (!sheet) {
    throw new Error("addRule: Stylesheet is undefined.");
  }
  try {
    if (sheet?.insertRule) {
      sheet.insertRule(
        selector + " { " + styleName + ": " + value + "; }",
        sheet.cssRules.length,
      );
    }
  } catch (e) {
    // スタイル定義の内容による例外（無視しても動作に影響がない場合が多い）
    console.error("addRule: Failed to insert rule for '" + selector + "'.", e);
  }
};
/**
 * ドキュメント内の全スタイルシートを走査し、Neo.rules に読み込む。
 * スタイルシートの解析は readStyle() で行う。
 *
 * @function
 * @returns {void}
 */
const readStyles = function () {
  Neo.rules = {};
  for (var i = 0; i < document.styleSheets.length; i++) {
    readStyle(document.styleSheets[i]);
  }
};

/**
 * スタイルシートからカラー設定を読み込んで Neo.rules に格納する
 * @param {CSSStyleSheet} sheet
 */
const readStyle = function (sheet) {
  try {
    var rules = sheet.cssRules;
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];

      if (rule instanceof CSSImportRule && rule.styleSheet) {
        readStyle(rule.styleSheet);
        continue;
      }

      if (rule instanceof CSSStyleRule) {
        var selector = rule.selectorText;
        if (selector) {
          // .NEOと、セレクタ名の前のドットを除去してセレクタ名を取り出す。
          selector = selector.replace(/^(.NEO\s+)?\./, "");

          var css = rule.cssText || rule.style.cssText;
          var result = css.match(/color:\s*(.*)\s*;/);

          if (result) {
            var hex = colorNameToHex(result[1]);
            if (hex) {
              Neo.rules[selector] = hex;
            }
          }
        }
      }
    }
  } catch (e) {}
};
/**
 * 指定された設定名に初期値の色を適用する
 * @param {string} name
 * @param {string} defaultColor
 */
const applyStyle = function (name, defaultColor) {
  if (Neo.config[name] == undefined) {
    Neo.config[name] = Neo.rules[name] || defaultColor;
  }
};

const createBackgroundImage = function () {
  var c1 = Neo.painter.getColor(Neo.config.color_bk) | 0xff000000;
  var c2 = Neo.painter.getColor(Neo.config.color_bk2) | 0xff000000;
  var bgCanvas = document.createElement("canvas");
  bgCanvas.width = 16;
  bgCanvas.height = 16;
  var ctx = bgCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) {
    return "";
  }
  var imageData = ctx.getImageData(0, 0, 16, 16);
  var buf32 = new Uint32Array(imageData.data.buffer);
  var buf8 = new Uint8ClampedArray(imageData.data.buffer);
  var index = 0;
  for (var y = 0; y < 16; y++) {
    for (var x = 0; x < 16; x++) {
      buf32[index++] = x == 14 || y == 14 ? c2 : c1;
    }
  }
  imageData.data.set(buf8);
  ctx.putImageData(imageData, 0, 0);
  return bgCanvas.toDataURL("image/png");
};
/**
 * カラーコードに倍率を掛け合わせて、明度を調整したカラーコードを返す
 * @param {string} c - 16進数のカラーコード
 * @param {number} scale - 明度の倍率
 * @returns {string} 変換後の16進数カラーコード
 */
export const multColor = function (c, scale) {
  const rNum = Math.round(parseInt(c.slice(1, 3), 16) * scale);
  const gNum = Math.round(parseInt(c.slice(3, 5), 16) * scale);
  const bNum = Math.round(parseInt(c.slice(5, 7), 16) * scale);
  const r = ("0" + Math.min(Math.max(rNum, 0), 255).toString(16)).slice(-2);
  const g = ("0" + Math.min(Math.max(gNum, 0), 255).toString(16)).slice(-2);
  const b = ("0" + Math.min(Math.max(bNum, 0), 255).toString(16)).slice(-2);
  return "#" + r + g + b;
};

/**
 * 色の名前やrgb表記の文字列を16進数のカラーコードに変換する
 * @param {string} name - 色の名前（"red"等）または "rgb(r,g,b)" 形式の文字列
 * @returns {string|false} 変換後のカラーコード（失敗時は false）
 */
const colorNameToHex = function (name) {
  /** @type {Record<string, string>} */
  const colors = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgrey: "#d3d3d3",
    lightgreen: "#90ee90",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370d8",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#d87093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32",
  };

  const rgb = name.toLowerCase().match(/rgb\((.*),(.*),(.*)\)/);
  if (rgb) {
    const r = ("0" + parseInt(rgb[1]).toString(16)).slice(-2);
    const g = ("0" + parseInt(rgb[2]).toString(16)).slice(-2);
    const b = ("0" + parseInt(rgb[3]).toString(16)).slice(-2);
    return "#" + r + g + b;
  }

  if (typeof colors[name.toLowerCase()] != "undefined") {
    return colors[name.toLowerCase()];
  }
  return false;
};

const initComponents = function () {
  const copyright = document.getElementById("neo-copyright");
  if (copyright) copyright.innerHTML += "v" + Neo.version;

  // ドラッグしたまま画面外に移動した時
  document.addEventListener(
    "mouseup",
    function (e) {
      if (
        Neo.painter &&
        e.target instanceof Element &&
        !Neo.painter.isContainer(e.target)
      ) {
        Neo.painter.cancelTool();
      }
    },
    false,
  );

  // 投稿に失敗する可能性があるときは警告を表示する
  showWarning();

  if (Neo.styleSheet) {
    addRule("*", "user-select", "none");
    addRule("*", "-webkit-user-select", "none");
    addRule("*", "-ms-user-select", "none");
  }
};

const initButtons = function () {
  const commands = new Commands();
  const neo_undo = new Button().init("neo-undo");
  if (neo_undo) {
    neo_undo.onmouseup = function () {
      const UndoCommand = new commands.UndoCommand(Neo.painter);
      UndoCommand.execute();
    };
  }
  const neo_redo = new Button().init("neo-redo");
  if (neo_redo) {
    neo_redo.onmouseup = function () {
      const RedoCommand = new commands.RedoCommand(Neo.painter);
      RedoCommand.execute();
    };
  }
  const neo_window = new Button().init("neo-window");
  if (neo_window) {
    neo_window.onmouseup = function () {
      const WindowCommand = new commands.WindowCommand(Neo.painter);
      WindowCommand.execute();
    };
  }
  const neo_copyright = new Button().init("neo-copyright");
  if (neo_copyright) {
    neo_copyright.onmouseup = function () {
      const CopyrightCommand = new commands.CopyrightCommand(Neo.painter);
      CopyrightCommand.execute();
    };
  }
  const neo_zoomPlus = new Button().init("neo-zoomPlus");
  if (neo_zoomPlus) {
    neo_zoomPlus.onmouseup = function () {
      const ZoomPlusCommand = new commands.ZoomPlusCommand(Neo.painter);
      ZoomPlusCommand.execute();
    };
  }
  const neo_zoomMinus = new Button().init("neo-zoomMinus");
  if (neo_zoomMinus) {
    neo_zoomMinus.onmouseup = function () {
      const ZoomMinusCommand = new commands.ZoomMinusCommand(Neo.painter);
      ZoomMinusCommand.execute();
    };
  }
  Neo.submitButton = new Button().init("neo-submit");
  if (!Neo.submitButton) {
    console.error("initButtons: SubmitButton not found");
    return;
  }
  Neo.submitButton.onmouseup = function () {
    Neo.submitButton?.disable(5000);
    const SubmitCommand = new commands.SubmitCommand(Neo.painter);
    SubmitCommand.execute();
  };

  Neo.fillButton = new FillButton().init("neo-fill");
  Neo.rightButton = new RightButton().init("neo-right");
  if (!Neo.rightButton) {
    console.error("initButtons: RightButton not found");
    return;
  }

  if (isMobile() || Neo.config.neo_show_right_button == "true") {
    if (Neo.rightButton.element) {
      Neo.rightButton.element.style.display = "block";
    }
  }

  // toolTip
  Neo.penTip = new PenTip().init("neo-pen");
  Neo.pen2Tip = new Pen2Tip().init("neo-pen2");
  Neo.effectTip = new EffectTip().init("neo-effect");
  Neo.effect2Tip = new Effect2Tip().init("neo-effect2");
  Neo.eraserTip = new EraserTip().init("neo-eraser");
  Neo.drawTip = new DrawTip().init("neo-draw");
  Neo.maskTip = new MaskTip().init("neo-mask");

  Neo.toolButtons =
    Neo.fillButton &&
    Neo.penTip &&
    Neo.pen2Tip &&
    Neo.effectTip &&
    Neo.effect2Tip &&
    Neo.drawTip &&
    Neo.eraserTip
      ? [
          Neo.fillButton,
          Neo.penTip,
          Neo.pen2Tip,
          Neo.effectTip,
          Neo.effect2Tip,
          Neo.drawTip,
          Neo.eraserTip,
        ]
      : [];

  // colorTip
  for (var i = 1; i <= 14; i++) {
    new ColorTip().init("neo-color" + i, { index: i });
  }

  // colorSlider
  Neo.sliders[Neo.SLIDERTYPE_RED] = new ColorSlider().init("neo-sliderRed", {
    type: Neo.SLIDERTYPE_RED,
  });
  Neo.sliders[Neo.SLIDERTYPE_GREEN] = new ColorSlider().init(
    "neo-sliderGreen",
    { type: Neo.SLIDERTYPE_GREEN },
  );
  Neo.sliders[Neo.SLIDERTYPE_BLUE] = new ColorSlider().init("neo-sliderBlue", {
    type: Neo.SLIDERTYPE_BLUE,
  });
  Neo.sliders[Neo.SLIDERTYPE_ALPHA] = new ColorSlider().init(
    "neo-sliderAlpha",
    { type: Neo.SLIDERTYPE_ALPHA },
  );

  // sizeSlider
  Neo.sizeslider = new SizeSlider();
  Neo.sliders[Neo.SLIDERTYPE_SIZE] = Neo.sizeslider.init("neo-sliderSize", {
    type: Neo.SLIDERTYPE_SIZE,
  });

  // reserveControl
  for (var i = 1; i <= 3; i++) {
    new ReserveControl().init("neo-reserve" + i, { index: i });
  }

  new LayerControl().init("neo-layerControl");
  new ScrollBarButton().init("neo-scrollH");
  new ScrollBarButton().init("neo-scrollV");
};

/**
 * @param {boolean} [isApp]
 * @returns {void}
 */
Neo.start = function (isApp = false) {
  if (Neo.viewer) return;

  initSkin();
  initComponents();

  initButtons();

  Neo.isApp = isApp;
  if (Neo.applet) {
    var name = Neo.applet.getAttribute("name") || "paintbbs";
    Neo.applet.outerHTML = "";
    /** @type {any} */ (document)[name] = Neo;

    resizeCanvas();

    if (!Neo.container) {
      console.error("start: Container element not found");
      return;
    }

    Neo.container.style.visibility = "visible";

    if (Neo.isApp) {
      // @ts-ignore
      var ipc = require("electron").ipcRenderer;
      ipc.sendToHost("neo-status", "ok");
    } else {
      //@ts-ignore
      if (document["paintBBSCallback"]) {
        //@ts-ignore
        document["paintBBSCallback"]("start");
      }
    }
  }
};

export const isMobile = function () {
  if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) return true;
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) return true;
  return false;
};

const showWarning = function () {
  const futaba = location.hostname.match(/^(?:.+\.)?2chan\.net$/i); //サブドメインありなし両方に対応
  const samplebbs = location.hostname.match(/^(?:.+\.)?neo\.websozai\.jp$/i);

  var edgeMatch = navigator.userAgent.match(/Edge\/(\d+)/i);
  var edgeVersion = 0; // 数値として初期化
  if (edgeMatch && edgeMatch.length > 1) {
    edgeVersion = parseInt(edgeMatch[1], 10);
  }
  var str = "";
  if (futaba || samplebbs) {
    if (edgeVersion && edgeVersion < 15) {
      str = translate("このブラウザでは<br>投稿に失敗することがあります<br>");
    }
  }

  // もし<PARAM NAME="neo_warning" VALUE="...">があれば表示する
  if (Neo.config.neo_warning) {
    str += Neo.config.neo_warning;
  }

  var warning = document.getElementById("neoWarning");
  if (!warning) {
    return;
  }
  warning.innerHTML = str;
  setTimeout(function () {
    if (!warning) {
      return;
    }
    warning.style.opacity = "0";
  }, 15000);
};

/*
   -----------------------------------------------------------------------
   UIの更新
   -----------------------------------------------------------------------
 */

export const updateUI = function () {
  const current = Neo.painter.tool.getToolButton();
  for (let i = 0; i < Neo.toolButtons.length; i++) {
    const toolTip = Neo.toolButtons[i];
    if (current) {
      if (current == toolTip) {
        toolTip.setSelected(true);
        toolTip.update();
      } else {
        toolTip.setSelected(false);
      }
    }
  }
  if (Neo.drawTip) {
    Neo.drawTip.update();
  }

  updateUIColor(true, false);
};

/**
 * @param {boolean} updateSlider
 * @param {boolean} updateColorTip
 */
export const updateUIColor = function (updateSlider, updateColorTip) {
  for (let i = 0; i < Neo.toolButtons.length; i++) {
    const toolTip = Neo.toolButtons[i];
    toolTip.update();
  }

  if (updateSlider) {
    for (let i = 0; i < Neo.sliders.length; i++) {
      const slider = Neo.sliders[i];
      slider.update();
    }
  }

  // パレットを変更するとき
  if (updateColorTip) {
    const colorTip = ColorTip.getCurrent();
    if (colorTip) {
      colorTip.setColor(Neo.painter.foregroundColor);
    }
  }
};

/*
   -----------------------------------------------------------------------
   リサイズ対応
   -----------------------------------------------------------------------
 */
/**
 * 通常表示フルスクリーン表示切り替え
 * @returns {void}
 */
export const updateWindow = function () {
  const windowView = document.getElementById("neo-windowView");
  const pageView = document.getElementById("neo-pageView");
  if (!Neo.container) {
    console.error("updateWindow: Container element not found");
    return;
  }
  if (Neo.fullScreen) {
    if (!windowView) return;
    windowView.style.display = "block";
    windowView.appendChild(Neo.container);
  } else {
    if (windowView) {
      windowView.style.display = "none";
    }
    if (pageView) {
      pageView.appendChild(Neo.container);
    }
  }

  resizeCanvas();

  //ウィンドウビューに切り替わった事を通知するカスタムイベント
  document.dispatchEvent(
    new CustomEvent("neo:fullscreenchange", {
      detail: { fullscreen: Neo.fullScreen },
    }),
  );
};

/**
 * コンテナとズーム倍率に合わせて destCanvas と関連要素のサイズ・スタイルを更新する。
 *
 * @returns {void}
 */
export const resizeCanvas = function () {
  if (!Neo.container) {
    console.error("resizeCanvas: Container element not found");
    return;
  }

  var appletWidth = Neo.container.clientWidth;
  var appletHeight = Neo.container.clientHeight;

  var canvasWidth = Neo.painter.canvasWidth;
  var canvasHeight = Neo.painter.canvasHeight;

  var width0 = canvasWidth * Neo.painter.zoom;
  var height0 = canvasHeight * Neo.painter.zoom;

  var width = width0 < appletWidth - 100 ? width0 : appletWidth - 100;
  var height = height0 < appletHeight - 120 ? height0 : appletHeight - 120;

  if (Neo.viewer) {
    width = canvasWidth;
    height = canvasHeight;
  }
  //width, heightは偶数でないと誤差が出るため
  width = Math.floor(width / 2) * 2;
  height = Math.floor(height / 2) * 2;

  /** @type {number} */
  Neo.painter.destWidth = width;
  /** @type {number} */
  Neo.painter.destHeight = height;

  const destCanvas = Neo.painter.destCanvas;
  destCanvas.width = width;
  destCanvas.height = height;
  const destctx = destCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!destctx) {
    console.error("resizeCanvas: Failed to get 2d context");
    return;
  }
  Neo.painter.destCanvasCtx = destctx;

  const ctx = Neo.painter.destCanvasCtx;

  if (Neo.painter.zoom < 1) {
    // 表示用アンチエイリアスを有効化
    ctx.imageSmoothingEnabled = true;
    destCanvas.style.imageRendering = "smooth";
    // 品質を指定（対応ブラウザのみ有効）
    if (Neo.painter.zoom < 0.5 && "imageSmoothingQuality" in ctx) {
      ctx.imageSmoothingQuality = "high";
    }
  } else {
    ctx.imageSmoothingEnabled = false;
    destCanvas.style.imageRendering = "pixelated";
  }

  destCanvas.style.touchAction = "none";
  destCanvas.style.pointerEvents = "auto";

  if (Neo.canvas) {
    Neo.canvas.style.touchAction = "none";
    Neo.canvas.style.pointerEvents = "auto";
    Neo.canvas.style.width = width + "px";
    Neo.canvas.style.height = height + "px";
  }

  /** @type {HTMLElement |null} */
  const tools = Neo.tools || null;
  if (tools) {
    tools.style.touchAction = "none";
    tools.style.pointerEvents = "auto";
  }

  if (Neo.toolsWrapper) {
    const toolsWrapper = Neo.toolsWrapper;
    var top = (Neo.container.clientHeight - toolsWrapper.clientHeight) / 2;
    Neo.toolsWrapper.style.top = (top > 0 ? top : 0) + "px";

    if (top < 0) {
      var s = Neo.container.clientHeight / toolsWrapper.clientHeight;
      Neo.toolsWrapper.style.transform =
        "translate(0, " + top + "px) scale(1," + s + ")";
    } else {
      Neo.toolsWrapper.style.transform = "";
    }
  }

  Neo.painter.setZoom(Neo.painter.zoom);
  Neo.painter.updateDestCanvas(0, 0, canvasWidth, canvasHeight, false);
};

/*
   -----------------------------------------------------------------------
   投稿
   -----------------------------------------------------------------------
 */

/**
 * オブジェクトのシャローコピーを作成する
 * @param {Record<string, any>} src - コピー元のオブジェクト
 * @returns {Record<string, any>} コピーされた新しいオブジェクト
 */
export const clone = function (src) {
  /** @type {Record<string, any>} */
  const dst = {};
  for (const k in src) {
    dst[k] = src[k];
  }
  return dst;
};

/**
 * 渡された値（サイズ等）を、パケット通信ヘッダー用に「8文字固定」のゼロ埋め文字列に変換する
 * * @example
 * Neo.getSizeString(125); // "00000125"（8文字に固定される）
 * * @param {number|string} len - 変換したいデータサイズ（数値または文字列）
 * @returns {string} 8文字にゼロパディングされた文字列
 */
const getSizeString = function (len) {
  var result = String(len);
  while (result.length < 8) {
    result = "0" + result;
  }
  return result;
};

/**
 * @param {string} url
 */
Neo.openURL = function (url) {
  if (Neo.isApp) {
    // @ts-ignore
    require("electron").shell.openExternal(url);
  } else {
    window.open(url, "_blank");
  }
};

/**
 * @param {string} baseURL - 基準ディレクトリパス（URL形式、末尾は "/"）
 * @param {string} url - 完全なURL、または baseURL からの相対パス（クエリ文字列を含む場合がある）
 * @returns {string} - 完全なURL（ディレクトリとは限らない。クエリ文字列を含む場合がある）
 */
const getAbsoluteURL = function (baseURL, url) {
  if (url && (url.indexOf("://") > 0 || url.indexOf("//") === 0)) {
    return url;
  } else {
    return baseURL + url;
  }
};

/**
 * 描画されたイラストデータ（および各種サムネイル、動画データ）をサーバーに投稿する
 * @param {string} baseURL - 基準ディレクトリパス（URL形式、末尾は "/"）
 * @param {Blob} blob - 投稿するメインのイラスト画像データ (PNG等)
 * @param {Blob|null} thumbnail - 通常のサムネイル画像データ（無い場合は null）
 * @param {Blob|null} thumbnail2 - アニメーション動画（PCH）データ（無い場合は null）
 */
export const submit = function (baseURL, blob, thumbnail, thumbnail2) {
  let url = getAbsoluteURL(baseURL, Neo.config.url_save);
  var headerString = Neo.str_header || "";
  //@ts-ignore
  if (document["paintBBSCallback"]) {
    //@ts-ignore
    var result = document["paintBBSCallback"]("check");
    if (result == 0 || result == "false") {
      return;
    }

    //@ts-ignore
    result = document["paintBBSCallback"]("header");
    if (result && typeof result == "string") {
      headerString = result;
    }
  }
  if (!headerString) headerString = Neo.config.send_header || "";

  var imageType = Neo.config.send_header_image_type;
  if (imageType && imageType == "true") {
    headerString = "image_type=png&" + headerString;
  }

  var count = Neo.painter.securityCount;
  var timer = Date.now() - Neo.painter.securityTimer;
  if (Neo.config.send_header_count == "true") {
    headerString = "count=" + count + "&" + headerString;
  }
  if (Neo.config.send_header_timer == "true") {
    headerString = "timer=" + timer + "&" + headerString;
  }
  //   console.log("header: " + headerString);

  if (Neo.config.neo_emulate_security_error == "true") {
    var securityError = false;
    if (Neo.config.security_click) {
      if (count - parseInt(Neo.config.security_click || 0) < 0) {
        securityError = true;
      }
    }
    if (Neo.config.security_timer) {
      if (timer - parseInt(Neo.config.security_timer || 0) * 1000 < 0) {
        securityError = true;
      }
    }
    if (securityError && Neo.config.security_url) {
      if (Neo.config.security_post == "true") {
        //セキュリティ違反時に指定URLに投稿する
        url = Neo.config.security_url;
      } else {
        //セキュリティ違反時に指定URLに飛ばす
        location.href = Neo.config.security_url;
        return;
      }
    }
  }

  if (thumbnail2) {
    const thumbnailSize = thumbnail2.size;
    // 動画容量を制限するオリジナルのPaintBBSのパラメータ
    // 単位KB
    if (!isNaN(Neo.config.animation_max) && Number(Neo.config.animation_max)) {
      const maxSize = Number(Neo.config.animation_max) * 1024;
      if (maxSize < thumbnailSize) {
        thumbnail2 = null;
      }
    }
  }
  /** @type {FormData | null} */
  let formData = null;
  if (Neo.config.neo_send_with_formdata == "true") {
    formData = new FormData();
    formData.append("header", headerString);
    formData.append("picture", blob, "blob");
    let thumbnail_size = 0;
    if (thumbnail) {
      formData.append("thumbnail", thumbnail, "blob");
      thumbnail_size = thumbnail.size;
    }
    if (thumbnail2) {
      // 動画容量を制限するNEO独自のパラメータ
      // 単位MB
      if (
        isNaN(Neo.config.neo_max_pch) ||
        //0,-1の場合は無制限
        Number(Neo.config.neo_max_pch) <= 0 ||
        Number(Neo.config.neo_max_pch) * 1024 * 1024 >
          headerString.length + blob.size + thumbnail_size + thumbnail2.size
      ) {
        formData.append("pch", thumbnail2, "blob");
      } else {
        thumbnail2 = null;
      }
    }
  }

  //console.log("submit url=" + url + " header=" + headerString);

  var header = new Blob([headerString]);
  var headerLength = getSizeString(header.size);
  var imgLength = getSizeString(blob.size);

  var array = [
    "P", // PaintBBS
    headerLength,
    header,
    imgLength,
    "\r\n",
    blob,
  ];

  if (thumbnail) {
    var thumbnailLength = getSizeString(thumbnail.size);
    array.push(thumbnailLength, thumbnail);
  }
  if (thumbnail2) {
    var thumbnail2Length = getSizeString(thumbnail2.size);
    array.push(thumbnail2Length, thumbnail2);
  }

  const futaba = location.hostname.match(/^(?:.+\.)?2chan\.net$/i); //サブドメインありなし両方に対応
  var subtype = futaba ? "octet-binary" : "octet-stream"; // 念のため
  var body = new Blob(array, { type: "application/" + subtype });

  /**
   * @param {string} path
   * @param {FormData|Blob} data
   */
  const postData = (path, data) => {
    var errorMessage = path + "\n";

    /** @type {RequestInit} */
    const requestOptions = {
      method: "post",
      body: data,
    };

    if (!futaba) {
      //ふたばの時は、'X-Requested-With'を追加しない
      requestOptions.mode = "same-origin";
      requestOptions.headers = {
        "X-Requested-With": "PaintBBS",
      };
    }

    fetch(path, requestOptions)
      .then((response) => {
        if (response.ok) {
          response.text().then((text) => {
            console.log(text);
            if (text.match(/^error\n/m)) {
              Neo.submitButton?.enable();
              return alert(text.replace(/^error\n/m, ""));
            }
            if (Neo.config.neo_validate_exact_ok_text_in_response === "true") {
              if (text !== "ok") {
                Neo.submitButton?.enable();
                return alert(
                  errorMessage +
                    translate(
                      "投稿に失敗。時間を置いて再度投稿してみてください。",
                    ),
                );
              }
            }
            var exitURL = getAbsoluteURL(baseURL, Neo.config.url_exit);
            var responseURL = text.replace(/&amp;/g, "&");

            // ふたばではresponseの文字列をそのままURLとして解釈する
            if (responseURL.match(/painttmp=/)) {
              exitURL = responseURL;
            }
            // responseが "URL:〜" の形だった場合はそのURLへ
            if (responseURL.match(/^URL:/)) {
              exitURL = responseURL.replace(/^URL:/, "");
            }
            Neo.uploaded = true;
            //画面移動の関数が定義されている時はユーザーが定義した関数で画面移動
            //@ts-ignore
            if (typeof Neo.handleExit === "function") {
              //@ts-ignore
              return Neo.handleExit();
            }
            return (location.href = exitURL);
          });
        } else {
          Neo.submitButton?.enable();
          const response_status = response.status;
          let httpErrorMessag = "";
          switch (response_status) {
            case 400:
              httpErrorMessag = "Bad Request";
              break;
            case 401:
              httpErrorMessag = "Unauthorized";
              break;
            case 403:
              httpErrorMessag = "Forbidden";
              break;
            case 404:
              httpErrorMessag = "Not Found";
              break;
            case 500:
              httpErrorMessag = "Internal Server Error";
              break;
            case 502:
              httpErrorMessag = "Bad Gateway";
              break;
            case 503:
              httpErrorMessag = "Service Unavailable";
              break;
            default:
              httpErrorMessag = "Unknown Error";
              break;
          }
          return alert(
            `${translate("HTTPステータスコード")} ${response_status} : ${httpErrorMessag}\n${errorMessage}${translate("投稿に失敗。時間を置いて再度投稿してみてください。")}`,
          );
        }
      })
      .catch((error) => {
        Neo.submitButton?.enable();
        return alert(
          errorMessage +
            translate("投稿に失敗。時間を置いて再度投稿してみてください。"),
        );
      });
  };

  if (Neo.config.neo_confirm_layer_info_notsaved && !thumbnail2) {
    const isConfirmed = window.confirm(
      translate("レイヤー情報は保存されません。\n続行してよろしいですか?"),
    );

    if (!isConfirmed) {
      Neo.submitButton?.enable();
      console.log("中止しました。");
      return; // ユーザーが続行しない場合、処理を中断
    }
  }

  // データ送信処理
  const data = Neo.config.neo_send_with_formdata === "true" ? formData : body;
  if (data) {
    postData(url, data);
  } else {
    console.error("failed to post data");
  }
};

/*
  -----------------------------------------------------------------------
    LiveConnect
  -----------------------------------------------------------------------
*/

Neo.getColors = function () {
  // console.log("getColors");
  // console.log("defaultColors==", Neo.config.colors.join("\n"));
  var array = [];
  for (var i = 0; i < 14; i++) {
    array.push(Neo.colorTips[i].color);
  }
  return array.join("\n");
  //  return Neo.config.colors.join('\n');
};

/**
 * パレット全体のカラーを一括で設定し、UIのカラーチップに反映する
 * @param {string} colors - 改行区切りの16進数カラーコードの文字列（14色分）
 */
Neo.setColors = function (colors) {
  // console.log("setColors");
  var array = colors.split("\n");
  for (var i = 0; i < 14; i++) {
    var color = array[i];
    Neo.config.colors[i] = color;
    Neo.colorTips[i].setColor(color);
  }
};

Neo.pExit = function () {
  const commands = new Commands();
  new commands.SubmitCommand(Neo.painter).execute();
};

Neo.str_header = "";

/*
  -----------------------------------------------------------------------
    DOMツリーの作成
  -----------------------------------------------------------------------
*/

/**
 * @param {HTMLElement} applet
 */
const createContainer = function (applet) {
  var neo = document.createElement("div");
  neo.className = "NEO";
  neo.id = "NEO";

  const html =
    '<div id="neo-pageView" style="margin:auto; width:450px; height:470px;">' +
    '<div id="neo-container" style="visibility:hidden;" class="o">' +
    '<div id="neo-center" class="o">' +
    '<div id="neo-painterContainer" class="o">' +
    '<div id="neo-painterWrapper" class="o">' +
    '<div id="neo-upper" class="o">' +
    '<div id="neo-redo">[やり直し]</div> ' +
    '<div id="neo-undo">[元に戻す]</div> ' +
    '<div id="neo-fill">[塗り潰し]</div> ' +
    '<div id="neo-right" style="display:none;">[右]</div> ' +
    "</div>" +
    '<div id="neo-painter">' +
    '<div id="neo-canvas">' +
    '<div id="neo-scrollH"></div>' +
    '<div id="neo-scrollV"></div>' +
    '<div id="neo-zoomPlusWrapper">' +
    '<div id="neo-zoomPlus">+</div>' +
    "</div>" +
    '<div id="neo-zoomMinusWrapper">' +
    '<div id="neo-zoomMinus">-</div>' +
    "</div>" +
    '<div id="neoWarning"></div>' +
    "</div>" +
    "</div>" +
    '<div id="neo-lower" class="o">' +
    "</div>" +
    "</div>" +
    '<div id="neo-toolsWrapper">' +
    '<div id="neo-tools">' +
    '<div id="neo-toolSet">' +
    '<div id="neo-pen"></div>' +
    '<div id="neo-pen2"></div>' +
    '<div id="neo-effect"></div>' +
    '<div id="neo-effect2"></div>' +
    '<div id="neo-eraser"></div>' +
    '<div id="neo-draw"></div>' +
    '<div id="neo-mask"></div>' +
    '<div class="colorTips">' +
    '<div id="neo-color2"></div><div id="neo-color1"></div><br>' +
    '<div id="neo-color4"></div><div id="neo-color3"></div><br>' +
    '<div id="neo-color6"></div><div id="neo-color5"></div><br>' +
    '<div id="neo-color8"></div><div id="neo-color7"></div><br>' +
    '<div id="neo-color10"></div><div id="neo-color9"></div><br>' +
    '<div id="neo-color12"></div><div id="neo-color11"></div><br>' +
    '<div id="neo-color14"></div><div id="neo-color13"></div>' +
    "</div>" +
    '<div id="neo-sliderRed"></div>' +
    '<div id="neo-sliderGreen"></div>' +
    '<div id="neo-sliderBlue"></div>' +
    '<div id="neo-sliderAlpha"></div>' +
    '<div id="neo-sliderSize"></div>' +
    '<div class="reserveControl" style="margin-top:4px;">' +
    '<div id="neo-reserve1"></div>' +
    '<div id="neo-reserve2"></div>' +
    '<div id="neo-reserve3"></div>' +
    "</div>" +
    '<div id="neo-layerControl" style="margin-top:6px;"></div>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div id="neo-headerButtons">' +
    '<div id="neo-window">[窓]</div>' +
    "</div>" +
    '<div id="neo-footerButtons">' +
    '<div id="neo-submit">[投稿]</div> ' +
    '<div id="neo-copyright">[(C)しぃちゃん PaintBBS NEO]</div> ' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div id="neo-windowView" style="display: none;">' +
    "</div>";

  neo.innerHTML = html.replace(/\[(.*?)\]/g, function (match, str) {
    return translate(str);
  });

  const parent = applet.parentNode;
  if (!parent) {
    console.error("Failed to create container.");
    return;
  }

  parent.appendChild(neo);
  parent.insertBefore(neo, applet);

  //  applet.style.display = "none";

  // NEOを組み込んだURLをアプリ版で開くとDOMツリーが2重にできて格好悪いので消しておく
  setTimeout(function () {
    /** @type {NodeListOf<HTMLElement>} */
    const tmp = document.querySelectorAll(".NEO");

    if (tmp.length > 1) {
      for (var i = 1; i < tmp.length; i++) {
        tmp[i].style.display = "none";
      }
    }
  }, 0);
};

/**
 * 指定されたCanvas上の画像の形（アルファチャンネル）を維持したまま、指定した単色に置き換える
 * @param {CanvasRenderingContext2D} ctx - 対象となるCanvasの2Dコンテキスト
 * @param {string} color - 置き換えたい新しい色（カラーコードまたは数値）
 */
export const tintImage = function (ctx, color) {
  const c = Neo.painter.getColor(color) & 0xffffff;

  var imageData = ctx.getImageData(0, 0, 46, 18);
  var buf32 = new Uint32Array(imageData.data.buffer);
  var buf8 = new Uint8ClampedArray(imageData.data.buffer);

  for (var i = 0; i < buf32.length; i++) {
    var a = buf32[i] & 0xff000000;
    if (a) {
      buf32[i] = (buf32[i] & a) | c;
    }
  }
  imageData.data.set(buf8);
  ctx.putImageData(imageData, 0, 0);
};

/**
 * HTML側からの指定に基づきツールの位置を変更する
 * @param {boolean|string} htmlConfiguredSide - HTMLタグ等で設定された外部からのサイド指定
 */
Neo.setToolSide = function (htmlConfiguredSide) {
  let side;
  if (htmlConfiguredSide === "left") {
    side = true;
  } else if (htmlConfiguredSide === "right") {
    side = false;
  } else {
    side = htmlConfiguredSide;
  }
  Neo.toolSide = !!side;

  if (!Neo.toolSide) {
    addRule(".NEO #neo-toolsWrapper", "right", "-3px");
    addRule(".NEO #neo-toolsWrapper", "left", "auto");
    addRule(".NEO #neo-painterWrapper", "padding", "0 55px 0 0 !important");
    addRule(".NEO #neo-upper", "padding-right", "75px !important");
  } else {
    addRule(".NEO #neo-toolsWrapper", "right", "auto");
    addRule(".NEO #neo-toolsWrapper", "left", "-1px");
    addRule(".NEO #neo-painterWrapper", "padding", "0 0 0 55px !important");
    addRule(".NEO #neo-upper", "padding-right", "20px !important");
  }
};

/**
 * NEOの網目でタッチスクロールしないようにする
 * デバイスの幅が狭い時とピンチズーム使用時にはタッチスクロールできるようにする
 */
document.addEventListener("DOMContentLoaded", () => {
  let elementNeo_touchMoveListenerAdded = false;
  // ピンチズーム検出
  /**@returns {boolean} */
  const isPinchZooming = function () {
    if ("visualViewport" in window && window.visualViewport) {
      return window.visualViewport.scale > 1;
    } else {
      return document.documentElement.clientWidth > window.innerWidth;
    }
  };

  // グリッド部分の touchmove イベントのデフォルトの動作をキャンセル
  /** @param {TouchEvent} e */
  const touch_move_grid_control = function (e) {
    if (Neo.config.neo_disable_grid_touch_move) {
      let screenwidth = Number(screen.width);
      if (
        e.touches.length === 1 &&
        (screenwidth - Neo.config.applet_width > 100 || Neo.fullScreen)
      ) {
        if (typeof e.cancelable !== "boolean" || e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  };

  const elementNeo = document.getElementById("NEO");
  // グリッド部分の touchmove イベントをキャンセルする関数をイベントリスナーに追加
  const add_touch_move_grid_control = function () {
    if (elementNeo && Neo.config.neo_disable_grid_touch_move) {
      // すでにリスナーが追加されていない場合のみ追加
      if (!elementNeo_touchMoveListenerAdded) {
        elementNeo?.addEventListener("touchmove", touch_move_grid_control, {
          passive: false,
        });
        elementNeo_touchMoveListenerAdded = true; // リスナーが追加されたことを記録
      }
    }
  };

  // グリッド部分の touchmove イベントをキャンセルする関数の追加とリムーブ
  elementNeo?.addEventListener("touchmove", function (e) {
    if (elementNeo && Neo.config.neo_disable_grid_touch_move) {
      add_touch_move_grid_control();
      if (isPinchZooming()) {
        elementNeo.removeEventListener("touchmove", touch_move_grid_control);
        elementNeo_touchMoveListenerAdded = false; // リスナーが削除されたことを記録
      }
    }
  });
  // 初期化
  add_touch_move_grid_control();
});

/**
 * 手ぶれ補正の強さ
 * @param {Number|string} htmlConfig
 * @note 0-5の範囲 デフォルト1
 */
Neo.setStabilizeLevel = function (htmlConfig) {
  let level = parseInt(String(htmlConfig));

  if (isNaN(level) || level < 0) {
    level = 0; //最小0
  } else if (level > 5) {
    level = 5; //最大5
  }
  Neo.stabilize_level = level;
};

/**
 * エイリアス
 * v1.6.58以前との互換性を維持するため
 * 外部から呼び出す関数名がNeo.setStabilizLevel()でも、Neo.setStabilizeLevel()でも内部的には同じ関数を実行する
 *
 */
Neo.setStabilizLevel = Neo.setStabilizeLevel;
export { Neo };
