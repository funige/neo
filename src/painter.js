"use strict";
//@ts-check

Neo.CurrentToolType = 1;

Neo.Painter = class {
  static LINETYPE_NONE = 0;
  static LINETYPE_PEN = 1;
  static LINETYPE_ERASER = 2;
  static LINETYPE_BRUSH = 3;
  static LINETYPE_TONE = 4;
  static LINETYPE_DODGE = 5;
  static LINETYPE_BURN = 6;
  static LINETYPE_BLUR = 7;

  static MASKTYPE_NONE = 0;
  static MASKTYPE_NORMAL = 1;
  static MASKTYPE_REVERSE = 2;
  static MASKTYPE_ADD = 3;
  static MASKTYPE_SUB = 4;

  static DRAWTYPE_FREEHAND = 0;
  static DRAWTYPE_LINE = 1;
  static DRAWTYPE_BEZIER = 2;

  static ALPHATYPE_NONE = 0;
  static ALPHATYPE_PEN = 1;
  static ALPHATYPE_FILL = 2;
  static ALPHATYPE_BRUSH = 3;

  static TOOLTYPE_NONE = 0;
  static TOOLTYPE_PEN = 1;
  static TOOLTYPE_ERASER = 2;
  static TOOLTYPE_HAND = 3;
  static TOOLTYPE_SLIDER = 4;
  static TOOLTYPE_FILL = 5;
  static TOOLTYPE_MASK = 6;
  static TOOLTYPE_ERASEALL = 7;
  static TOOLTYPE_ERASERECT = 8;
  static TOOLTYPE_COPY = 9;
  static TOOLTYPE_PASTE = 10;
  static TOOLTYPE_MERGE = 11;
  static TOOLTYPE_FLIP_H = 12;
  static TOOLTYPE_FLIP_V = 13;

  static TOOLTYPE_BRUSH = 14;
  static TOOLTYPE_TEXT = 15;
  static TOOLTYPE_TONE = 16;
  static TOOLTYPE_BLUR = 17;
  static TOOLTYPE_DODGE = 18;
  static TOOLTYPE_BURN = 19;
  static TOOLTYPE_RECT = 20;
  static TOOLTYPE_RECTFILL = 21;
  static TOOLTYPE_ELLIPSE = 22;
  static TOOLTYPE_ELLIPSEFILL = 23;
  static TOOLTYPE_BLURRECT = 24;
  static TOOLTYPE_TURN = 25;

  constructor() {
    this._undoMgr = new Neo.UndoManager(50);
    /** @type {Neo.ActionManager} */
    this._actionMgr = new Neo.ActionManager();
    this.clipMouseX = 0;
    this.clipMouseY = 0;
    this.scrollBarX = 0;
    this.scrollBarY = 0;
    this.scrollWidth = 0;
    this.scrollHeight = 0;
    this.lineWidth = 1;
    this.alpha = 1;
    this.zoom = 1;
    this.zoomX = 0;
    this.zoomY = 0;
    this.isMouseDown = false;
    this.isMouseDownRight = false;
    this.isSpaceDown = false;
    this.isBezierActive = false;
    this.isCopyActive = false;
    this.tempX = 0;
    this.tempY = 0;

    /** @type {any} */
    this.prevLine = null; // 始点または終点が2度プロットされることがあるので

    /** @type {HTMLElement|null} */
    this.container = null;

    this.tool = /** @type {Neo.ToolBase} */ ({});
    /** @type {HTMLElement|null} */
    this.inputText = null;
    /** @type {number[]|null} */
    this.cursorRect = null;
    //Canvas Info
    /** @type {Array<HTMLCanvasElement>} */
    this.canvas = [];
    /** @type {CanvasRenderingContext2D[]} */
    this.canvasCtx = [];
    /** @type {boolean[]} */
    this.visible = [];
    this.current = 0;

    //Temp Canvas Info
    /** @type {HTMLCanvasElement}*/
    this.tempCanvas;
    /** @type {CanvasRenderingContext2D}*/
    this.tempCanvasCtx;
    /** @type {Uint32Array|null} */
    this.temp = null;

    //Destination Canvas for display
    /** @type {HTMLCanvasElement}*/
    this.destCanvas;
    /** @type {CanvasRenderingContext2D}*/
    this.destCanvasCtx;

    this.backgroundColor = "#ffffff";
    this.foregroundColor = "#000000";

    this.prevMouseX = 0;
    this.prevMouseY = 0;

    this.mouseX = 0;
    this.mouseY = 0;
    this.rawMouseX = 0;
    this.rawMouseY = 0;

    /** @type {number|null} */
    this.stabilizedX = null;
    /** @type {number|null} */
    this.stabilizedY = null;

    this.securityTimer = 0;
    this.securityCount = 0;

    this.destWidth = 0;
    this.destHeight = 0;

    this.canvasWidth = 0;
    this.canvasHeight = 0;

    this._currentWidth = 0;
    this._currentMaskType = 0;

    this.isShiftDown = false;
    this.isCtrlDown = false;
    this.isAltDown = false;

    //this.touchModifier = null;
    this.virtualRight = false;
    this.virtualShift = false;

    //this.onUpdateCanvas;
    /** @type {Array<Uint8Array>}  **/
    this._roundData = [];
    /** @type {number[][]} **/
    this._toneData = [];
    /** @type {any[]} **/
    this.toolStack = [];

    this.maskType = 0;
    this.drawType = 0;
    this.maskColor = "#000000";
    /** @type {number[]} */
    this._currentColor = [];
    /** @type {number[]} */
    this._currentMask = [];

    this.aerr = 0;
    this.dirty = false;
    this.busy = false;
    this.busySkipped = false;

    this.touchlength = 0;
    /**@type {Neo.PenTool} */
    this.penTool;
    /**@type {Neo.EraserTool} */
    this.eraserTool;
    /**@type {Neo.HandTool} */
    this.handTool;
    /**@type {Neo.FillTool} */
    this.fillTool;
    /**@type {Neo.EraseAllTool} */
    this.eraseAllTool;
    /**@type {Neo.EraseRectTool} */
    this.eraseRectTool;

    /**@type {Neo.CopyTool} */
    this.copyTool;
    /**@type {Neo.PasteTool} */
    this.pasteTool;
    /**@type {Neo.MergeTool} */
    this.mergeTool;
    /**@type {Neo.FlipHTool} */
    this.flipHTool;
    /**@type {Neo.FlipVTool} */
    this.flipVTool;

    /**@type {Neo.BrushTool} */
    this.brushTool;
    /**@type {Neo.TextTool} */
    this.textTool;
    /**@type {Neo.ToneTool} */
    this.toneTool;
    /**@type {Neo.BlurTool} */
    this.blurTool;
    /**@type {Neo.DodgeTool} */
    this.dodgeTool;
    /**@type {Neo.BurnTool} */
    this.burnTool;
    /**@type {Neo.SliderTool} */
    this.sliderTool;
    /**@type {Neo.DummyTool} */
    this.dummyTool;

    /**@type {Neo.RectTool} */
    this.rectTool;
    /**@type {Neo.RectFillTool} */
    this.rectFillTool;
    /**@type {Neo.EllipseTool} */
    this.ellipseTool;
    /**@type {Neo.EllipseFillTool} */
    this.ellipseFillTool;
    /**@type {Neo.BlurRectTool} */
    this.blurRectTool;
    /**@type {Neo.TurnTool} */
    this.turnTool;
  }

  /**
   * ペインターの描画コンポーネントを初期化して、描画可能な状態にする。
   * @description
   * 描画エリア（Canvas）の生成、ツールセットの展開、描画データの初期化を順次行い、
   * 指定されたHTML要素内に PaintBBS NEO を構築する。
   * @param {HTMLElement} div - PaintBBSを描画する親コンテナ要素
   * @param {number|string} width - キャンバスの横幅（ピクセル）
   * @param {number|string} height - キャンバスの高さ（ピクセル）
   */
  build(div, width, height) {
    this.container = div;
    this._initCanvas(div, width, height);
    this._initRoundData();
    this._initToneData();
    this._initInputText();
    this._initTools();

    this.setTool(this.penTool);
  }

  /**
   * 現在のツールを切り替え、古いツールの終了と新しいツールの初期化を行う。
   * @description
   * 1. 現在のツールがあれば状態を保存する。
   * 2. 特定のツール（テキストやペースト）の終了処理を実行する。
   * 3. ツールを入れ替え、新しいツールの初期化を行う。
   * 4. 新しいツールの状態を読み込む。
   * @param {any} tool - Neo.ToolBase 新しく設定するツールインスタンス
   */
  setTool(tool) {
    if (this.tool && this.tool.saveStates) this.tool.saveStates();

    //テキストツール以外のツールに切り替えるときは、テキストツールを終了する
    if (tool !== this.textTool) {
      this.textTool.kill();
    }
    if (this.tool && this.tool.cancelBezier) {
      this.tool.cancelBezier();
    }
    if (tool !== this.pasteTool) {
      this.pasteTool.kill();
    }
    if (this.tool && this.tool.kill) {
      this.tool.kill();
    }
    this.tool = /**@type {Neo.ToolBase} */ (tool);
    /**@type {Neo.ToolBase} */ (tool).init(this);
    if (this.tool && this.tool.loadStates) this.tool.loadStates();
  }

  /**
   * 現在のツールをスタックに退避し、新しいツールをアクティブにする。
   * @description
   * ツールの一時的な切り替えを行う。現在使用中のツールを toolStack に保存し、
   * 指定されたツールを新しいアクティブツールとして初期化する。
   * 元のツールに戻る際は popTool を使用することを想定している。
   * @param {any} tool - スタックに積んだ後にアクティブにするツールインスタンス
   */
  pushTool(tool) {
    this.toolStack.push(this.tool);
    this.tool = /**@type {Neo.ToolBase} */ (tool);
    /**@type {Neo.ToolBase} */ (tool).init(this);
  }

  /**
   * 現在のツールを終了し、スタックから以前のツールを復元する。
   * @description
   * スタックに退避されていた以前のツールを現在のアクティブツールとして復元する。
   * 現在のツールに対しては終了処理（kill）を行い、安全に切り替える。
   */
  popTool() {
    var tool = this.tool;
    if (tool && tool.kill) {
      tool.kill();
    }
    this.tool = this.toolStack.pop();
  }

  /**
   * 現在アクティブなツールを取得する。
   * @description
   * ツールがスライダー等の設定変更中である場合、スタックの最上位にある
   * 以前のツール（ペイントツール等）を優先的に返すことで、
   * 現在の操作文脈を正しく取得する。
   * @returns {Neo.ToolBase|null} 現在のツールインスタンス、またはnull
   */
  getCurrentTool() {
    if (this.tool) {
      var tool = this.tool;
      // スライダー操作中はスタックから直前のツールを参照する
      if (tool && tool.type == Neo.Painter.TOOLTYPE_SLIDER) {
        var stack = this.toolStack;
        if (stack.length > 0) {
          tool = stack[stack.length - 1];
        }
      }
      return tool;
    }
    return null;
  }

  /**
   * ツールタイプに基づいてアクティブなツールを切り替える。
   * @description
   * ツールタイプ（ID）から対応するインスタンスを特定し、セットする。
   * @param {number|string} toolType - Neo.Painter.TOOLTYPE_xxx で定義されたツールID
   */
  setToolByType(toolType) {
    switch (parseInt(String(toolType))) {
      case Neo.Painter.TOOLTYPE_PEN:
        this.setTool(this.penTool);
        break;
      case Neo.Painter.TOOLTYPE_ERASER:
        this.setTool(this.eraserTool);
        break;
      case Neo.Painter.TOOLTYPE_HAND:
        this.setTool(this.handTool);
        break;
      case Neo.Painter.TOOLTYPE_FILL:
        this.setTool(this.fillTool);
        break;
      case Neo.Painter.TOOLTYPE_ERASEALL:
        this.setTool(this.eraseAllTool);
        break;
      case Neo.Painter.TOOLTYPE_ERASERECT:
        this.setTool(this.eraseRectTool);
        break;

      case Neo.Painter.TOOLTYPE_COPY:
        this.setTool(this.copyTool);
        break;
      case Neo.Painter.TOOLTYPE_PASTE:
        this.setTool(this.pasteTool);
        break;
      case Neo.Painter.TOOLTYPE_MERGE:
        this.setTool(this.mergeTool);
        break;
      case Neo.Painter.TOOLTYPE_FLIP_H:
        this.setTool(this.flipHTool);
        break;
      case Neo.Painter.TOOLTYPE_FLIP_V:
        this.setTool(this.flipVTool);
        break;

      case Neo.Painter.TOOLTYPE_BRUSH:
        this.setTool(this.brushTool);
        break;
      case Neo.Painter.TOOLTYPE_TEXT:
        this.setTool(this.textTool);
        break;
      case Neo.Painter.TOOLTYPE_TONE:
        this.setTool(this.toneTool);
        break;
      case Neo.Painter.TOOLTYPE_BLUR:
        this.setTool(this.blurTool);
        break;
      case Neo.Painter.TOOLTYPE_DODGE:
        this.setTool(this.dodgeTool);
        break;
      case Neo.Painter.TOOLTYPE_BURN:
        this.setTool(this.burnTool);
        break;

      case Neo.Painter.TOOLTYPE_RECT:
        this.setTool(this.rectTool);
        break;
      case Neo.Painter.TOOLTYPE_RECTFILL:
        this.setTool(this.rectFillTool);
        break;
      case Neo.Painter.TOOLTYPE_ELLIPSE:
        this.setTool(this.ellipseTool);
        break;
      case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        this.setTool(this.ellipseFillTool);
        break;
      case Neo.Painter.TOOLTYPE_BLURRECT:
        this.setTool(this.blurRectTool);
        break;
      case Neo.Painter.TOOLTYPE_TURN:
        this.setTool(this.turnTool);
        break;

      default:
        console.log("unknown toolType " + toolType);
        break;
    }
    Neo.CurrentToolType = Number(toolType);
  }

  /**
   * キャンバスの初期化とイベントリスナーの登録を行う。
   * @description
   * 1. 描画用キャンバス(canvas)と表示用キャンバス(destCanvas)の生成と設定。
   * 2. willReadFrequently: true を使用した高速なコンテキスト取得。
   * 3. 現代のブラウザ環境に最適化したポインターイベントの登録。
   * 4. coalesceEvents を利用した、高速描画時のポインター追従性の向上。
   * 5. ページ離脱防止アラートのセットアップ。
   * @param {HTMLElement} div - 親コンテナ要素
   * @param {number|string} width - 内部キャンバスの幅
   * @param {number|string} height - 内部キャンバスの高さ
   */
  _initCanvas(div, width, height) {
    width = parseInt(String(width));
    height = parseInt(String(height));
    var destWidth = parseInt(String(div.clientWidth));
    var destHeight = parseInt(String(div.clientHeight));
    this.destWidth = width;
    this.destHeight = height;

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.zoomX = width * 0.5;
    this.zoomY = height * 0.5;

    this.securityTimer = Date.now();
    this.securityCount = 0;

    for (var i = 0; i < 2; i++) {
      this.canvas[i] = document.createElement("canvas");
      this.canvas[i].width = width;
      this.canvas[i].height = height;

      const ctx = this.canvas[i].getContext("2d", {
        willReadFrequently: true,
      });
      if (!ctx) {
        console.error("_initCanvas: Failed to get 2d context");
        return;
      }
      this.canvasCtx[i] = ctx;

      this.canvas[i].style.imageRendering = "pixelated";
      this.canvasCtx[i].imageSmoothingEnabled = false;
      this.visible[i] = true;
    }

    this.tempCanvas = document.createElement("canvas");
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    const tempCanvasCtx = this.tempCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!tempCanvasCtx) {
      console.error("_initCanvas: Failed to get 2d context");
      return;
    }
    this.tempCanvasCtx = tempCanvasCtx;
    this.tempCanvas.style.position = "absolute";
    // this.tempCanvas.enabled = false;

    var array = this.container?.querySelectorAll("canvas");
    if (array && array.length > 0) {
      this.destCanvas = array[0];
    } else {
      this.destCanvas = document.createElement("canvas");
      this.container?.appendChild(this.destCanvas);
    }

    const destCanvasCtx = this.destCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!destCanvasCtx) {
      console.error("_initCanvas: Failed to get 2d context");
      return;
    }
    this.destCanvasCtx = destCanvasCtx;
    this.destCanvas.width = destWidth;
    this.destCanvas.height = destHeight;

    this.destCanvas.style.imageRendering = "pixelated";
    this.destCanvasCtx.imageSmoothingEnabled = false;

    const ref = this;

    if (!Neo.viewer) {
      const container = document.getElementById("neo-container");
      if (!container) return;
      container.addEventListener("mouseover", function (e) {
        ref._rollOverHandler(e);
      });
      container.addEventListener("mouseout", function (e) {
        ref._rollOutHandler(e);
      });
      // 先にNeo.Buttonのtouchstart()がトリガーされる
      container.addEventListener(
        "mousedown", //pointerdownに変更するとここが先にトリガーされ、線幅を保存できなくなる
        function (e) {
          ref._mouseDownHandler(e);
        },
        { passive: false, capture: false },
      );
      container.addEventListener(
        "mouseup",
        function (e) {
          ref.touchlength = 0;
          ref._mouseUpHandler(e);
        },
        { passive: false, capture: false },
      );
      container.addEventListener(
        "touchstart",
        function (e) {
          ref.touchlength = e.touches?.length;
          ref._mouseDownHandler(e);
        },
        { passive: false, capture: false },
      );
      container.addEventListener(
        "touchend",
        function (e) {
          ref.touchlength = 0;
          ref._mouseUpHandler(e);
        },
        { passive: false, capture: false },
      );
      container.addEventListener(
        "pointermove",
        function (e) {
          //フリーハンドモード?
          const freeHandMode = ref.drawType === 0;
          //ツールは鉛筆･消しゴムまたは水彩?
          const usesHighPrecisionTool = [1, 2, 14].includes(
            Neo.CurrentToolType,
          );
          //ブラシサイズは16px以下?
          const smallbrush = ref.lineWidth <= 16;
          //上記条件が揃う時はポインター追従性を高くする
          if (
            ref.isMouseDown &&
            freeHandMode &&
            usesHighPrecisionTool &&
            smallbrush
          ) {
            const events = e.getCoalescedEvents?.() ?? [e];
            for (const ev of events) {
              ref._mouseMoveHandler(ev);
            }
          } else {
            ref._mouseMoveHandler(e);
          }
        },
        { passive: false, capture: false },
      );
      container.addEventListener(
        "pointercancel",
        function (e) {
          //Eventがキャンセルされた時はUp時と同じ処理を行う
          ref.touchlength = 0;
          ref.isMouseDown = false;
          ref._mouseUpHandler(e);
        },
        { capture: false },
      );
      document.addEventListener("keydown", function (e) {
        ref._keyDownHandler(e);
      });
      document.addEventListener("keyup", function (e) {
        ref._keyUpHandler(e);
      });
      window.addEventListener("blur", () => {
        ref.isSpaceDown = false;
        ref.isShiftDown = false;
        ref.isCtrlDown = false;
        ref.isAltDown = false;
      });
    }

    if (Neo.config.neo_confirm_unload == "true") {
      window.addEventListener("beforeunload", function (e) {
        if (!Neo.uploaded && ref.isDirty()) {
          e.preventDefault();
          return false;
        }
      });
    }
    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
  }

  _initRoundData() {
    for (var r = 1; r <= 30; r++) {
      this._roundData[r] = new Uint8Array(r * r);
      var mask = this._roundData[r];
      var d = Math.floor(r / 2.0);
      var index = 0;
      for (var x = 0; x < r; x++) {
        for (var y = 0; y < r; y++) {
          var xx = x + 0.5 - r / 2.0;
          var yy = y + 0.5 - r / 2.0;
          mask[index++] = xx * xx + yy * yy <= (r * r) / 4 ? 1 : 0;
        }
      }
    }
    this._roundData[3][0] = 0;
    this._roundData[3][2] = 0;
    this._roundData[3][6] = 0;
    this._roundData[3][8] = 0;

    this._roundData[5][1] = 0;
    this._roundData[5][3] = 0;
    this._roundData[5][5] = 0;
    this._roundData[5][9] = 0;
    this._roundData[5][15] = 0;
    this._roundData[5][19] = 0;
    this._roundData[5][21] = 0;
    this._roundData[5][23] = 0;
  }

  _initToneData() {
    var pattern = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    for (var i = 0; i < 16; i++) {
      this._toneData[i] = new Array(16);
      for (var j = 0; j < 16; j++) {
        this._toneData[i][j] = i >= pattern[j] ? 1 : 0;
      }
    }
  }

  /**
   * アルファ値に対応するトーンパターンデータを取得する。
   * @description
   * 定義済みの閾値テーブル(alphaTable)に基づき、指定されたアルファ値に最も近い
   * ハーフトーンのパターンを選択して返す。
   * @param {number} alpha - 0〜255の範囲のアルファ値（透明度）
   * @returns {Array<number>} 対応するハーフトーンパターン
   */
  getToneData(alpha) {
    var alphaTable = [
      23, 47, 69, 92, 114, 114, 114, 138, 161, 184, 184, 207, 230, 230, 253,
    ];

    for (var i = 0; i < alphaTable.length; i++) {
      if (alpha < alphaTable[i]) {
        return this._toneData[i];
      }
    }
    return this._toneData[i];
  }

  /**
   * テキスト入力
   */
  _initInputText() {
    var text = document.getElementById("neo-inputText");
    if (!text) {
      text = document.createElement("div");
    }

    text.id = "neo-inputText";
    text.setAttribute("contentEditable", "true");
    text.spellcheck = false;
    text.className = "inputText";
    text.innerHTML = "";

    text.style.display = "none";
    //  text.style.userSelect = "none";
    this.container?.appendChild(text);
    this.inputText = text;

    this.updateInputText();
  }

  _initTools() {
    this.penTool = new Neo.PenTool();
    this.eraserTool = new Neo.EraserTool();
    this.handTool = new Neo.HandTool();
    this.fillTool = new Neo.FillTool();
    this.eraseAllTool = new Neo.EraseAllTool();
    this.eraseRectTool = new Neo.EraseRectTool();

    this.copyTool = new Neo.CopyTool();
    this.pasteTool = new Neo.PasteTool();
    this.mergeTool = new Neo.MergeTool();
    this.flipHTool = new Neo.FlipHTool();
    this.flipVTool = new Neo.FlipVTool();

    this.brushTool = new Neo.BrushTool();
    this.textTool = new Neo.TextTool();
    this.toneTool = new Neo.ToneTool();
    this.blurTool = new Neo.BlurTool();
    this.dodgeTool = new Neo.DodgeTool();
    this.burnTool = new Neo.BurnTool();

    this.rectTool = new Neo.RectTool();
    this.rectFillTool = new Neo.RectFillTool();
    this.ellipseTool = new Neo.EllipseTool();
    this.ellipseFillTool = new Neo.EllipseFillTool();
    this.blurRectTool = new Neo.BlurRectTool();
    this.turnTool = new Neo.TurnTool();

    this.sliderTool = new Neo.SliderTool();
    this.dummyTool = new Neo.DummyTool();
  }

  hideInputText() {
    const text = this.inputText;
    if (!text) {
      console.error("inputText not found for hideInputText");
      return;
    }
    text.blur();
    text.style.display = "none";
  }

  updateInputText() {
    const text = this.inputText;
    if (!text) {
      console.error("inputText not found for updateInputText");
      return;
    }

    const d = this.lineWidth;
    const fontSize = Math.round((d * 55) / 28 + 7);
    // const height = Math.round((d * 68) / 28 + 12);

    text.style.fontSize = fontSize + "px";
    text.style.lineHeight = fontSize + "px";
    text.style.height = fontSize + "px";
    text.style.marginTop = -fontSize + "px";
  }

  cancelCopy() {
    if (!this.isCopyActive) return;
    if (Neo.CurrentToolType !== Neo.Painter.TOOLTYPE_PASTE) return;
    this.popTool();
    this.setToolByType(Neo.Painter.TOOLTYPE_COPY);
    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, true);
  }

  /*
   -----------------------------------------------------------------------
   Mouse Event Handling
   -----------------------------------------------------------------------
 */

  /**
   * @param {KeyboardEvent} e
   */
  _keyDownHandler(e) {
    /**
     * ctrlキーとの組み合わせのブラウザデフォルトのショートカットキーを無効化
     * @description ctrl+z,ctrl+y,ctrl+v,ctrl+x,ctrl+aは使用可能
     * @param {KeyboardEvent} e
     */
    const preventCtrlKeyDefaults = (e) => {
      const keys = ["+", ";", "=", "-", "s", "h", "r", "u", "o"];
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key &&
        keys.includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    const target = e.target;
    //NEO外部の input textAreaへの入力をNEOで処理しない
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      //NEO外部の input textAreaへの入力中はフラグをリセット
      this.isShiftDown = false;
      this.isCtrlDown = false;
      this.isAltDown = false;
      this.isSpaceDown = false;
      preventCtrlKeyDefaults(e);
      return;
    }

    /**
     * キー押下状態を記録
     */
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;
    var key = e.key ? e.key.toLowerCase() : null;
    if (key === " ") this.isSpaceDown = true;

    /**
     * 現在のツールにキー入力を伝える
     */
    if (this.tool.keyDownHandler) {
      this.tool.keyDownHandler(e);
    }

    //テキスト入力をしている時はキーボードショートカットキーを使用しないため早期return
    if (target === this.inputText) {
      preventCtrlKeyDefaults(e);
      return;
    }

    //スペースキーでスクロールしないようにする
    //テキスト入力をしていない時はデフォルトのキーボードイベントをキャンセルする
    e.preventDefault();

    /**
     * キーボードショートカット
     */

    if (!this.isShiftDown && this.isCtrlDown) {
      if (!this.isAltDown) {
        if (key === "z" || key === "u") {
          this.cancelCopy();
          this.undo(); // Ctrl+Z, Ctrl+U
        }
        if (key === "y") this.redo(); // Ctrl+Y
      } else {
        if (key === "z") this.redo(); // Ctrl+Alt+Z
      }
    }
    if (!this.isShiftDown && !this.isCtrlDown && !this.isAltDown) {
      if (key == "+") new Neo.ZoomPlusCommand(this).execute(); // +
      if (key == "-") new Neo.ZoomMinusCommand(this).execute(); // -
      //鉛筆
      if (key == "b") this.setToolByType(Neo.Painter.TOOLTYPE_PEN);
      //水彩
      if (key == "w") this.setToolByType(Neo.Painter.TOOLTYPE_BRUSH);
      //消しゴム
      if (key == "e") this.setToolByType(Neo.Painter.TOOLTYPE_ERASER);
      //全消し
      if (
        document.activeElement != this.inputText &&
        key &&
        ["delete", "backspace"].includes(key)
      ) {
        this._pushUndo();
        this._actionMgr.eraseAll();
      }
    }
  }
  /**
   * @param {KeyboardEvent} e
   */
  _keyUpHandler(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;
    if (e.key == " ") this.isSpaceDown = false;

    //FirefoxのメニューがAltキーで開閉しないようにする
    if (e.key && e.key.toLowerCase() === "alt") {
      e.preventDefault(); // Altキーのデフォルトの動作をキャンセル
    }
    if (this.tool.keyUpHandler) {
      this.tool.keyUpHandler(e);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  _rollOverHandler(e) {
    if (this.tool.rollOverHandler) {
      this.tool.rollOverHandler(this);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  _rollOutHandler(e) {
    if (this.tool.rollOutHandler) {
      this.tool.rollOutHandler(this);
    }
  }
  /**
   * @param {MouseEvent|TouchEvent} e
   * @returns {void}
   */
  _mouseDownHandler(e) {
    if (this.busy) {
      // loadAnimation実行中は何もしない
      if (e.target == this.destCanvas) {
        this.busySkipped = true;
      }
      return;
    }

    if (e.target == this.destCanvas) {
      //よくわからないがChromeでドラッグの時カレットが出るのを防ぐ
      //http://stackoverflow.com/questions/2745028/chrome-sets-cursor-to-text-while-dragging-why
      e.preventDefault();
    }

    if (this.touchlength > 1) return;

    if ((e instanceof MouseEvent && e.button == 2) || this.virtualRight) {
      this.isMouseDownRight = true;
    } else {
      if (!e.shiftKey && e.ctrlKey && e.altKey) {
        this.isMouseDown = true;
      } else {
        if (e.ctrlKey || e.altKey) {
          this.isMouseDownRight = true;
        } else {
          this.isMouseDown = true;
        }
      }
    }

    this._updateMousePosition(e);
    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;
    this.securityCount++;
    let autosaveCount = this.securityCount;
    if (autosaveCount % 10 === 0 && this.isDirty()) {
      this.saveSession(); //10ストロークごとに自動バックアップ
    }

    if (
      Neo.CurrentToolType === Neo.Painter.TOOLTYPE_PASTE &&
      this.isCopyActive &&
      this.isMouseDownRight
    ) {
      this.cancelCopy();
      this.isMouseDownRight = false;
      return;
    }
    if (
      this.drawType == Neo.Painter.DRAWTYPE_BEZIER &&
      this.isBezierActive &&
      this.isMouseDownRight
    ) {
      this.isMouseDownRight = false;
      if (this.tool.cancelBezier) {
        this.tool.cancelBezier();
      }
      return;
    }
    if (this.drawType != Neo.Painter.DRAWTYPE_BEZIER && this.isBezierActive) {
      if (this.tool.cancelBezier) {
        this.tool.cancelBezier();
      }
      return;
    }

    // 右クリック時のカラーピッカーのガード
    if (this.isMouseDownRight) {
      this.isMouseDownRight = false;
      if (e.target instanceof HTMLElement && !this.isWidget(e.target)) {
        this.pickColor(this.mouseX, this.mouseY);
        return;
      }
    }
    /** @typedef {HTMLElement & { "data-bar": boolean | string | number }} BarElement */

    if (!this.isUIPaused()) {
      if (
        e.target instanceof HTMLElement &&
        /** @type {BarElement} */ (e.target)["data-bar"]
      ) {
        this.pushTool(this.handTool);
        this.handTool.reverse = false;
      } else if (this.isSpaceDown && document.activeElement != this.inputText) {
        this.pushTool(this.handTool);
        this.handTool.reverse = true;
      } else if (
        e.target instanceof HTMLElement &&
        /** @type {any} */ (e.target)["data-slider"] != undefined
      ) {
        this.pushTool(this.sliderTool);
        this.sliderTool.target = e.target;
        this.sliderTool.alt = false;
      } else if (e.ctrlKey && e.altKey && !e.shiftKey) {
        this.pushTool(this.sliderTool);
        this.sliderTool.target = Neo.sliders[Neo.SLIDERTYPE_SIZE].element;
        this.sliderTool.alt = true;
      } else if (e.target instanceof HTMLElement && this.isWidget(e.target)) {
        // UI操作時のツール切り替え（dummyToolへの差し替え）
        this.isMouseDown = false;
        this.pushTool(this.dummyTool);
      }
    }

    // console.log("down -" + e.type + " - " + e.target.id + e.target.className);
    //  console.warn("down -" + e.target.id + e.target.className)
    this.tool.downHandler(this);

    //  var ref = this;
    //  document.onmouseup = function(e) {
    //      ref._mouseUpHandler(e)
    //  };
  }

  /**
   * @param {MouseEvent|TouchEvent} e
   */
  _mouseUpHandler(e) {
    this.isMouseDown = false;
    this.isMouseDownRight = false;
    this.tool.upHandler(this);
    //  document.onmouseup = undefined;

    if (e.target instanceof HTMLElement && e.target.id != "neo-right") {
      this.virtualRight = false;
      Neo.RightButton.clear();
    }

    this._updateMousePosition(e);

    //  if (e.changedTouches) {
    //      for (var i = 0; i < e.changedTouches.length; i++) {
    //          var touch = e.changedTouches[i];
    //          if (touch.identifier == this.touchModifier) {
    //              this.touchModifier = null;
    //          }
    //      }
    //  }
  }
  /**
   * @param {PointerEvent|TouchEvent} e
   * @returns
   */
  _mouseMoveHandler(e) {
    this._updateMousePosition(e);

    if (this.touchlength > 1) return;

    if (this.isMouseDown || this.isMouseDownRight) {
      this.tool.moveHandler(this);
    } else {
      if (this.tool.upMoveHandler) {
        this.tool.upMoveHandler(this);
      }
    }

    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;

    // 画面外をタップした時スクロール可能にするため
    //  console.warn("move -" + e.target.id + e.target.className)
    if (
      e.cancelable &&
      e.target instanceof HTMLElement &&
      e.target.className != "o"
    ) {
      e.preventDefault();
    }
  }

  /**
   * @param {MouseEvent|TouchEvent} e
   */
  getPosition(e) {
    if (e instanceof MouseEvent && e.clientX !== undefined) {
      return { x: e.clientX, y: e.clientY, e: e.type };
    } else if (e instanceof TouchEvent) {
      var touch = e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY, e: e.type };

      //      for (var i = 0; i < e.changedTouches.length; i++) {
      //          var touch = e.changedTouches[i];
      //          if (!this.touchModifier || this.touchModifier != touch.identifier) {
      //              return {x: touch.clientX, y: touch.clientY, e: e.type};
      //          }
      //      }
      //      console.log("getPosition error");
      //      return {x:0, y:0};
    } else {
      console.warn("Unknown event:", e.type);
      return { x: 0, y: 0, e: e.type || "unknown" };
    }
  }

  /**
   * 手ぶれ補正
   */
  _stabilizer() {
    const freeHandMode = this.drawType === 0;

    const toolTypes = [
      Neo.Painter.TOOLTYPE_PEN,
      Neo.Painter.TOOLTYPE_ERASER,
      Neo.Painter.TOOLTYPE_BRUSH,
      Neo.Painter.TOOLTYPE_TONE,
      Neo.Painter.TOOLTYPE_BLUR,
      Neo.Painter.TOOLTYPE_DODGE,
      Neo.Painter.TOOLTYPE_BURN,
    ];

    const isDrawTool = freeHandMode && toolTypes.includes(Neo.CurrentToolType);

    if (!isDrawTool || !Neo.stabilize_level) {
      return;
    }
    if (this.isMouseDown) {
      // 手ぶれ補正の強さ
      // 補正なし 0.0 最強 0.99
      const level = Math.max(0, Math.min(Neo.stabilize_level, 5));
      //手ぶれ補正のレベルを6段階に分けたテーブル
      //0で補正なし、5で最強
      const stabilityTable = [0.0, 0.5, 0.65, 0.8, 0.9, 0.95];
      const stabilityLebel = stabilityTable[level];
      //ブラシサイズが大きい時と拡大時は補正強度を下げる
      const zoomModifier = this.zoom <= 1 ? 1 : 0.8;
      const sizeModifier = this.lineWidth <= 8 ? 1 : 0.8;
      const stability = stabilityLebel * zoomModifier * sizeModifier;
      const factor = 1.0 - stability;

      if (
        typeof this.stabilizedX === "number" &&
        typeof this.stabilizedY === "number"
      ) {
        this.stabilizedX = factor * this.mouseX + stability * this.stabilizedX;
        this.stabilizedY = factor * this.mouseY + stability * this.stabilizedY;
      } else {
        // stabilizedX が未定義なら現在の位置で初期化
        this.stabilizedX = this.mouseX;
        this.stabilizedY = this.mouseY;
      }
      // 手ぶれ補正後の数値に差し替え
      this.mouseX = this.stabilizedX;
      this.mouseY = this.stabilizedY;
    } else {
      // マウスを離している時はリセット
      this.stabilizedX = null;
      this.stabilizedY = null;
    }
  }
  /**
   * ポインターの位置を更新する
   * @param {MouseEvent|TouchEvent} e
   */
  _updateMousePosition(e) {
    var rect = this.destCanvas.getBoundingClientRect();
    //  var x = (e.clientX !== undefined) ? e.clientX : e.touches[0].clientX;
    //  var y = (e.clientY !== undefined) ? e.clientY : e.touches[0].clientY;
    var pos = this.getPosition(e);

    var x = pos.x;
    var y = pos.y;

    if (this.zoom <= 0) this.zoom = 1; //なぜか0になることがあるので

    this.mouseX =
      (x - rect.left) / this.zoom +
      this.zoomX -
      (this.destCanvas.width * 0.5) / this.zoom;
    this.mouseY =
      (y - rect.top) / this.zoom +
      this.zoomY -
      (this.destCanvas.height * 0.5) / this.zoom;

    if (isNaN(this.prevMouseX)) {
      this.prevMouseX = this.mouseX;
    }
    if (isNaN(this.prevMouseY)) {
      this.prevMouseY = this.mouseY;
    }

    //手ぶれ補正
    this._stabilizer();

    this.rawMouseX = x;
    this.rawMouseY = y;
    this.clipMouseX = Math.max(Math.min(this.canvasWidth, this.mouseX), 0);
    this.clipMouseY = Math.max(Math.min(this.canvasHeight, this.mouseY), 0);
  }

  /*
   -------------------------------------------------------------------------
   Undo
   -------------------------------------------------------------------------
 */

  undo() {
    var undoItem = this._undoMgr.popUndo();

    if (undoItem && undoItem.data.length > 0) {
      this._pushRedo();
      this._actionMgr.back();

      this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x, undoItem.y);
      this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x, undoItem.y);
      this.updateDestCanvas(
        undoItem.x,
        undoItem.y,
        undoItem.width,
        undoItem.height,
      );
    }
  }

  redo() {
    var undoItem = this._undoMgr.popRedo();

    if (undoItem && undoItem.data.length > 0) {
      this._actionMgr.forward();

      this._pushUndo(0, 0, this.canvasWidth, this.canvasHeight, true);
      this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x, undoItem.y);
      this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x, undoItem.y);
      this.updateDestCanvas(
        undoItem.x,
        undoItem.y,
        undoItem.width,
        undoItem.height,
      );
    }
  }

  //hasUndo() {
  //    return true;
  //};

  /**
   * 現在のキャンバス状態をUndo履歴に保存する。
   * @description
   * 指定された範囲のキャンバスデータ（レイヤー0と1）を抽出し、
   * UndoItemとして履歴管理マネージャーにプッシュする。
   * @param {number} [x=0] - 取得開始X座標
   * @param {number} [y=0] - 取得開始Y座標
   * @param {number} [w=canvasWidth] - 取得範囲の幅
   * @param {number} [h=canvasHeight] - 取得範囲の高さ
   * @param {boolean} [holdRedo=false] - リドゥ履歴を保持するかどうか
   */
  _pushUndo(x, y, w, h, holdRedo = false) {
    x = x === undefined ? 0 : x;
    y = y === undefined ? 0 : y;
    w = w === undefined ? this.canvasWidth : w;
    h = h === undefined ? this.canvasHeight : h;
    var undoItem = new Neo.UndoItem();
    undoItem.x = 0;
    undoItem.y = 0;
    undoItem.width = w;
    undoItem.height = h;
    undoItem.data = [
      this.canvasCtx[0].getImageData(x, y, w, h),
      this.canvasCtx[1].getImageData(x, y, w, h),
    ];
    this._undoMgr.pushUndo(undoItem, holdRedo);

    if (!holdRedo) {
      this._actionMgr.step();
    }
    this.dirty = true;
  }

  /**
   * 現在のキャンバス状態をRedo（やり直し）履歴に保存する。
   * @description
   * Undo操作が行われた直後の、現在のキャンバス状態をスナップショットとして保存する。
   * これにより、Undoした後に再度やり直すことが可能になる。
   * @param {number} [x=0] - 取得開始X座標
   * @param {number} [y=0] - 取得開始Y座標
   * @param {number} [w=canvasWidth] - 取得範囲の幅
   * @param {number} [h=canvasHeight] - 取得範囲の高さ
   */
  _pushRedo(x, y, w, h) {
    x = x === undefined ? 0 : x;
    y = y === undefined ? 0 : y;
    w = w === undefined ? this.canvasWidth : w;
    h = h === undefined ? this.canvasHeight : h;
    var undoItem = new Neo.UndoItem();
    undoItem.x = 0;
    undoItem.y = 0;
    undoItem.width = w;
    undoItem.height = h;
    undoItem.data = [
      this.canvasCtx[0].getImageData(x, y, w, h),
      this.canvasCtx[1].getImageData(x, y, w, h),
    ];
    this._undoMgr.pushRedo(undoItem);
  }

  /*
   -------------------------------------------------------------------------
   Zoom Controller
   -------------------------------------------------------------------------
 */

  /**
   * 表示倍率を設定し、キャンバスの表示サイズを更新する。
   * @description
   * 指定された倍率（value）に基づき、表示用キャンバス（destCanvas）のサイズを計算・更新する。
   * 表示領域の余白（100px/130px）を考慮し、描画誤差を防ぐためにサイズを偶数に補正する。
   * 最後に表示領域の更新とズーム位置の再計算を行う。
   * @param {number} value - 拡大率（例: 1.0 = 100%）
   */
  setZoom(value) {
    this.zoom = value;

    const container = document.getElementById("neo-container");
    if (!container) return;
    var width = Math.round(this.canvasWidth * this.zoom);
    var height = Math.round(this.canvasHeight * this.zoom);

    if (width > container.clientWidth - 100)
      width = container.clientWidth - 100;
    if (height > container.clientHeight - 130)
      height = container.clientHeight - 130;

    // width, heightは偶数でないと誤差が出るため
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    this.destWidth = width;
    this.destHeight = height;

    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, false);
    this.setZoomPosition(this.zoomX, this.zoomY);
  }

  /**
   * ズーム時の表示中心座標を設定し、スクロールバー等のUIを同期する。
   * @description
   * 表示領域（destCanvas）から、キャンバス全体のどの座標を中心に見るかを計算する。
   * 画面外にはみ出さないよう座標をクランプ（制限）し、表示用キャンバスを更新する。
   * また、スクロールバーの進捗率を計算して更新を行う。
   * @param {number} x - 視点の中心X座標
   * @param {number} y - 視点の中心Y座標
   */
  setZoomPosition(x, y) {
    var minx = (this.destCanvas.width / this.zoom) * 0.5;
    var maxx = this.canvasWidth - minx;
    var miny = (this.destCanvas.height / this.zoom) * 0.5;
    var maxy = this.canvasHeight - miny;

    x = Math.round(Math.max(Math.min(maxx, x), minx));
    y = Math.round(Math.max(Math.min(maxy, y), miny));

    this.zoomX = x;
    this.zoomY = y;
    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, false);

    this.scrollBarX = maxx == minx ? 0 : (x - minx) / (maxx - minx);
    this.scrollBarY = maxy == miny ? 0 : (y - miny) / (maxy - miny);
    this.scrollWidth = maxx - minx;
    this.scrollHeight = maxy - miny;

    if (Neo.scrollH) Neo.scrollH.update(this);
    if (Neo.scrollV) Neo.scrollV.update(this);

    this.hideInputText();
  }

  /*
   -------------------------------------------------------------------------
   Drawing Helper
   -------------------------------------------------------------------------
 */

  /**
   * データ送信
   * @param {string} boardURL 掲示板のURL
   * @returns
   */
  submit(boardURL) {
    if (Neo.isAnimation) {
      // neo_save_layers
      var items = this._actionMgr._items;
      if (items.length > 0 && items[items.length - 1][0] != "restore") {
        this._pushUndo();
        this._actionMgr.restore();
      }
    }

    var thumbnail = null;
    var thumbnail2 = null;

    if (Neo.config.thumbnail_type == "animation" || this.useThumbnail()) {
      thumbnail = this.getThumbnail(Neo.config.thumbnail_type || "png");
    }

    if (Neo.config.thumbnail_type2 && this.useThumbnail()) {
      thumbnail2 = this.getThumbnail(Neo.config.thumbnail_type2);
    }

    /*
     if (this.useThumbnail()) {
     thumbnail = this.getThumbnail(Neo.config.thumbnail_type || "png");
     if (Neo.config.thumbnail_type2) {
     thumbnail2 = this.getThumbnail(Neo.config.thumbnail_type2);
     }
     }*/
    const png = this.getPNG();
    if (!(png instanceof Blob)) {
      console.error("Failed to get PNG data. Submission aborted.");
      return;
    }
    Neo.submit(boardURL, png, thumbnail2, thumbnail);
  }

  useThumbnail() {
    var thumbnailWidth = this.getThumbnailWidth();
    var thumbnailHeight = this.getThumbnailHeight();
    if (thumbnailWidth && thumbnailHeight) {
      if (
        thumbnailWidth < this.canvasWidth ||
        thumbnailHeight < this.canvasHeight
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * DataURL形式の文字列をBlobオブジェクトに変換する。
   * @description
   * Base64形式またはURIエンコードされたDataURLから、
   * Blob（バイナリ）形式へ変換を行う。
   * ファイルアップロードやサーバー保存の直前段階で利用される。
   * @param {string} dataURL - 変換元のDataURL文字列
   * @returns {Blob} 変換後のBlobオブジェクト（type: image/png）
   */
  dataURLtoBlob(dataURL) {
    var byteString;
    if (dataURL.split(",")[0].indexOf("base64") >= 0) {
      byteString = atob(dataURL.split(",")[1]);
    } else {
      byteString = decodeURI(dataURL.split(",")[1]);
    }

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: "image/png" });
  }

  /**
   * 現在のレイヤー状態を統合し、完成画像を返す。
   * @description
   * 内部で保持している複数のレイヤー（this.canvas[0], [1]）を、
   * 指定されたサイズにリサイズまたは調整して一つのキャンバスへ描画する。
   * 背景色（白）を塗りつぶした後に重ね合わせることで、合成画像を作成する。
   * @param {number|null} [imageWidth] - 出力画像の幅（省略時はキャンバス幅）
   * @param {number|null} [imageHeight] - 出力画像の高さ（省略時はキャンバス高さ）
   * @returns {HTMLCanvasElement|null} 合成された画像データを持つCanvas要素
   */
  getImage(imageWidth, imageHeight) {
    const canvasWidth = this.canvasWidth;
    const canvasHeight = this.canvasHeight;
    const width = imageWidth ?? canvasWidth;
    const height = imageHeight ?? canvasHeight;

    var pngCanvas = document.createElement("canvas");
    pngCanvas.width = width;
    pngCanvas.height = height;
    var pngCanvasCtx = pngCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!pngCanvasCtx) {
      return null;
    }
    pngCanvasCtx.fillStyle = "#ffffff";
    pngCanvasCtx.fillRect(0, 0, width, height);

    if (this.visible[0]) {
      pngCanvasCtx.drawImage(
        this.canvas[0],
        0,
        0,
        canvasWidth,
        canvasHeight,
        0,
        0,
        width,
        height,
      );
    }
    if (this.visible[1]) {
      pngCanvasCtx.drawImage(
        this.canvas[1],
        0,
        0,
        canvasWidth,
        canvasHeight,
        0,
        0,
        width,
        height,
      );
    }
    return pngCanvas;
  }

  /**
   * 現在の描画内容をPNG形式のBlobとして取得する。
   * @description
   * 1. getImage() を呼び出し、レイヤーを統合した完成画像（Canvas）を取得する。
   * 2. toDataURL("image/png") を使用して、Canvasの内容をBase64文字列に変換する。
   * 3. dataURLtoBlob() を使用して、Base64文字列をサーバー通信やダウンロードに適したBlobバイナリに変換する。
   * @returns {Blob|null} PNG形式のBlobオブジェクト。失敗時はnullを返す。
   */
  getPNG() {
    // レイヤーを統合した画像を取得
    var image = this.getImage();
    if (!image) {
      console.error("Failed to export image.");
      return null;
    }

    // CanvasをBase64エンコードされたデータURL形式に変換
    var dataURL = image.toDataURL("image/png");

    // 文字列データをバイナリ（Blob）に変換して返す
    return this.dataURLtoBlob(dataURL);
  }
  /**
   * 掲示板投稿や保存用のサムネイル、またはアニメーション用の描画データを取得する。
   * @description
   * - "animation" 以外: getImage() で生成した画像を指定サイズでリサイズし、Blobとして返す。
   * - "animation" 指定時: 描画手順をJSON化し、LZStringで圧縮したバイナリデータ（NEO形式）を返す。
   * @param {string} type - 出力形式（例: "png", "jpeg", "animation"）
   * @returns {Blob|null} 変換後のBlobオブジェクト、または失敗時のnull
   */
  getThumbnail(type) {
    if (type != "animation") {
      /** @type {number|null} */
      let thumbnailWidth = this.getThumbnailWidth();
      /** @type {number|null} */
      let thumbnailHeight = this.getThumbnailHeight();
      if (thumbnailWidth || thumbnailHeight) {
        const width = this.canvasWidth;
        const height = this.canvasHeight;
        if (thumbnailHeight && thumbnailWidth == 0) {
          thumbnailWidth = (thumbnailHeight * width) / height;
        }
        if (thumbnailWidth && thumbnailHeight == 0) {
          thumbnailHeight = (thumbnailWidth * height) / width;
        }
      } else {
        thumbnailWidth = thumbnailHeight = null;
      }

      console.log("get thumbnail", thumbnailWidth, thumbnailHeight);

      var image = this.getImage(thumbnailWidth, thumbnailHeight);
      if (!image) {
        console.error("Failed to export image.");
        return null;
      }
      var dataURL = image.toDataURL("image/" + type);
      return this.dataURLtoBlob(dataURL);
    } else {
      const jsonString = JSON.stringify(this._actionMgr._items);
      const data = LZString.compressToUint8Array(jsonString);

      var magic = "NEO ";
      var w = this.canvasWidth;
      var h = this.canvasHeight;

      return new Blob([
        magic,
        new Uint8Array([w % 0x100, Math.floor(w / 0x100)]),
        new Uint8Array([h % 0x100, Math.floor(h / 0x100)]),
        new Uint8Array(4),
        data,
      ]);
    }
  }

  /**
   * サムネイルの幅を取得
   * @returns {Number}}
   */

  getThumbnailWidth() {
    var width = Neo.config.thumbnail_width;
    if (width) {
      if (width.match(/%$/)) {
        return Math.floor(this.canvasWidth * (parseInt(width) / 100.0));
      } else {
        return parseInt(width);
      }
    }
    return 0;
  }

  /**
   * サムネイルの高さを取得
   * @returns {Number}
   */
  getThumbnailHeight() {
    var height = Neo.config.thumbnail_height;
    if (height) {
      if (height.match(/%$/)) {
        return Math.floor(this.canvasHeight * (parseInt(height) / 100.0));
      } else {
        return parseInt(height);
      }
    }
    return 0;
  }
  /**
   * 全消し
   * @description
   * 1. オプションで消去の確認を行う。
   * 2. 履歴管理のため、消去前の状態をUndoスタックに保存する。
   * 3. アクションマネージャーを通じて描画レイヤーをクリアする。
   * @param {boolean} doConfirm - 消去時に確認ダイアログを表示するかどうか
   */
  clearCanvas(doConfirm) {
    if (!doConfirm || confirm("全消しします")) {
      //Register undo first;
      this._pushUndo();
      this._actionMgr.clearCanvas();
      /*        
       this.canvasCtx[0].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
       this.canvasCtx[1].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
       this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
     */
    }
  }
  /**
   * キャンバス上の矩形領域を、表示用キャンバス（destCanvas）へ転送・描画する。
   * @description
   * 1. 座標とサイズの正規化（境界チェック）。
   * 2. ズーム倍率とスクロール位置を考慮した表示用座標（zx, zy, zw, zh）の計算。
   * 3. 背景のクリア（または一部更新）。
   * 4. レイヤー（0, 1）および一時レイヤーを順番に描画（合成）。
   * @param {number} x - 元キャンバスの取得開始X
   * @param {number} y - 元キャンバスの取得開始Y
   * @param {number} width - 取得範囲の幅
   * @param {number} height - 取得範囲の高さ
   * @param {boolean} [useTemp] - 一時レイヤー（tempCanvas）を含めて描画するかどうか
   */
  updateDestCanvas(x, y, width, height, useTemp = false) {
    // 元座標は整数化（元キャンバス側）
    x = Math.floor(x);
    y = Math.floor(y);

    var canvasWidth = this.canvasWidth;
    var canvasHeight = this.canvasHeight;
    var updateAll =
      x === 0 && y === 0 && width === canvasWidth && height === canvasHeight;
    if (x + width > canvasWidth) width = canvasWidth - x;
    if (y + height > canvasHeight) height = canvasHeight - y;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (width <= 0 || height <= 0) return;
    var ctx = this.destCanvasCtx;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 1.0;

    const zoom = this.zoom;
    // ---- 描画先座標（拡大／縮小後のキャンバス側） ----
    // scrollBarX/Y は 0～1 の比率
    this.scrollBarX = isNaN(this.scrollBarX) ? 0 : this.scrollBarX;
    this.scrollBarY = isNaN(this.scrollBarY) ? 0 : this.scrollBarY;
    const offsetX =
      this.scrollBarX * (this.canvasWidth * zoom - this.destCanvas.width);
    const offsetY =
      this.scrollBarY * (this.canvasHeight * zoom - this.destCanvas.height);

    const zx = Math.round(x * zoom - offsetX);
    const zy = Math.round(y * zoom - offsetY);

    const zx2 = Math.round((x + width) * zoom - offsetX);
    const zy2 = Math.round((y + height) * zoom - offsetY);

    const zw = zx2 - zx;
    const zh = zy2 - zy;

    // ---- 背景クリア ----
    if (updateAll) {
      ctx.fillRect(0, 0, this.destCanvas.width, this.destCanvas.height);
    } else {
      ctx.fillRect(zx, zy, zw, zh);
    }

    // ---- レイヤー描画 ----
    if (this.visible[0])
      ctx.drawImage(this.canvas[0], x, y, width, height, zx, zy, zw, zh);
    if (this.visible[1])
      ctx.drawImage(this.canvas[1], x, y, width, height, zx, zy, zw, zh);

    // ---- テンポラリレイヤー ----
    if (useTemp) {
      const tempX = Math.floor(this.tempX * zoom);
      const tempY = Math.floor(this.tempY * zoom);
      ctx.drawImage(
        this.tempCanvas,
        x,
        y,
        width,
        height,
        zx + tempX,
        zy + tempY,
        zw,
        zh,
      );
    }
    ctx.restore();
  }

  /**
   * ブラシで描画した時に、書き換える必要がある「範囲」を計算する。
   * @description
   * 線を引いた時に、キャンバス全体を再描画すると重くなるため
   * 「線が引かれた場所」の「最小限の矩形」だけ更新する必要がある。
   * その「最小限の矩形」の座標とサイズを返す。
   * @param {number} x0 - 線の始点X
   * @param {number} y0 - 線の始点Y
   * @param {number} x1 - 線の終点X
   * @param {number} y1 - 線の終点Y
   * @param {number} r  - ブラシの太さ（半径）
   * @returns {number[]} [左上のX, 左上のY, 幅, 高さ]
   */
  getBound(x0, y0, x1, y1, r) {
    var left = Math.floor(x0 < x1 ? x0 : x1);
    var top = Math.floor(y0 < y1 ? y0 : y1);
    var width = Math.ceil(Math.abs(x0 - x1));
    var height = Math.ceil(Math.abs(y0 - y1));
    r = Math.ceil(r + 1);

    if (!r) {
      width += 1;
      height += 1;
    } else {
      left -= r;
      top -= r;
      width += r * 2;
      height += r * 2;
    }
    return [left, top, width, height];
  }

  /**
   * 色を取得
   * @param {string} [color]
   */
  getColor(color = "") {
    const c = color ? color : this.foregroundColor;
    /** @type {number} @description 0-255  */
    const r = parseInt(c.slice(1, 3), 16);
    /** @type {number} @description 0-255  */
    const g = parseInt(c.slice(3, 5), 16);
    /** @type {number} @description 0-255  */
    const b = parseInt(c.slice(5, 7), 16);
    /** @type {number} @description 0-255  */
    const a = Math.floor(this.alpha * 255);

    const value = (a << 24) | (b << 16) | (g << 8) | r;

    // 正しい順序 #RRGGBB で文字列を作成
    const hex =
      "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    //<input type="color">で色を取得するElementのID
    /**@type {string} */
    const colorPickerId = Neo.config.neo_color_picker_id;
    const colorPicker = document.getElementById(colorPickerId);
    if (colorPickerId) {
      if (colorPicker instanceof HTMLInputElement) {
        colorPicker.value = hex;
      }
    }
    //色が変更された事を通知するカスタムイベント
    document.dispatchEvent(
      new CustomEvent("neo:colorchange", {
        detail: { hex, r, g, b, a },
      }),
    );

    return value;
  }

  /**
   * 数値形式の色情報を、CSS等で利用可能な文字列（#RRGGBB）へ変換する。
   * 下位24ビットのRGB成分を抽出し、6桁の16進数文字列を生成する。
   * アルファチャンネル（透明度）は破棄される。
   * * @param {number} c - 変換対象の色数値
   * @returns {string} CSS形式のカラー文字列
   */
  getColorString(c) {
    const rgb = ("000000" + (c & 0xffffff).toString(16)).slice(-6);
    return "#" + rgb;
  }
  /**
   * 色をセット
   * @param {string|number} color
   */
  setColor(color) {
    if (typeof color != "string") color = this.getColorString(color);
    this.foregroundColor = color;

    Neo.updateUI();
  }

  /**
   * ツールの種類に応じて、現在の色から描画用のアルファ値を計算する。
   * @description
   * ツール（ペン、塗りつぶし、ブラシ）ごとに異なる数学的な曲線を用いてアルファ値を変換し、
   * 描き味の調整を行う。また、非常に低いアルファ値に対しては、累積誤差を利用して
   * 点を間引くことで見た目の濃度を擬似的に表現する（ディザリングに近い処理）。
   * @param {number} type - アルファ計算のタイプ（ALPHATYPE_PEN, ALPHATYPE_FILL, ALPHATYPE_BRUSH）
   * @returns {number} 0.0〜1.0 の範囲に正規化された描画用アルファ値
   */
  getAlpha(type) {
    var a1 = this._currentColor[3] / 255.0; //this.alpha;

    switch (type) {
      case Neo.Painter.ALPHATYPE_PEN:
        if (a1 > 0.5) {
          a1 = 1.0 / 16 + ((a1 - 0.5) * 30.0) / 16;
        } else {
          a1 = Math.sqrt(2 * a1) / 16.0;
        }
        a1 = Math.min(1, Math.max(0, a1));
        break;

      case Neo.Painter.ALPHATYPE_FILL:
        a1 = -0.00056 * a1 + 0.0042 / (1.0 - a1) - 0.0042;
        a1 = Math.min(1.0, Math.max(0, a1 * 10));
        break;

      case Neo.Painter.ALPHATYPE_BRUSH:
        a1 = -0.00056 * a1 + 0.0042 / (1.0 - a1) - 0.0042;
        a1 = Math.min(1.0, Math.max(0, a1));
        break;
    }

    // アルファが小さい時は適当に点を抜いて見た目の濃度を合わせる
    if (a1 < 1.0 / 255) {
      this.aerr += a1;
      a1 = 0;
      while (this.aerr > 1.0 / 255) {
        a1 = 1.0 / 255;
        this.aerr -= 1.0 / 255;
      }
    }
    return a1;
  }

  /**
   * 描画準備(前景色・マスク色をRGB(A)に変換してキャッシュ)
   *  描画開始前に、現在の前景色・マスク色・線幅・マスクタイプを
   *  内部プロパティ(_currentColor等)に確定させる
   * */
  prepareDrawing() {
    var r = parseInt(this.foregroundColor.slice(1, 3), 16);
    var g = parseInt(this.foregroundColor.slice(3, 5), 16);
    var b = parseInt(this.foregroundColor.slice(5, 7), 16);
    var a = Math.floor(this.alpha * 255);

    var maskR = parseInt(this.maskColor.slice(1, 3), 16);
    var maskG = parseInt(this.maskColor.slice(3, 5), 16);
    var maskB = parseInt(this.maskColor.slice(5, 7), 16);

    this._currentColor = [r, g, b, a];
    this._currentMask = [maskR, maskG, maskB];
    this._currentWidth = this.lineWidth;
    this._currentMaskType = this.maskType;
  }

  /**
   * 指定ピクセルの色が現在のマスク条件に適合するか判定する。
   * @description
   * 現在のマスク設定（特定色のみ、特定色以外、あるいは明度差による条件）に基づき、
   * ターゲットとなるピクセル（buf8, index）を描画対象にするかどうかを判定する。
   * @param {Uint8ClampedArray} buf8 - キャンバスの画素データ（RGBA）
   * @param {number} index - 判定対象ピクセルの開始インデックス
   * @returns {boolean|undefined} 描画を許可するなら true、禁止なら false、マスク無効なら undefined
   */
  isMasked(buf8, index) {
    var r = this._currentMask[0];
    var g = this._currentMask[1];
    var b = this._currentMask[2];

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];

    var r0 = buf8[index + 0];
    var g0 = buf8[index + 1];
    var b0 = buf8[index + 2];
    var a0 = buf8[index + 3];

    if (a0 == 0) {
      r0 = 0xff;
      g0 = 0xff;
      b0 = 0xff;
    }

    var type = this._currentMaskType; //this.maskType;

    //TODO
    //いろいろ試したのですが半透明で描画するときの加算・逆加算を再現する方法がわかりません。
    //とりあえず単純に無視しています。
    if (type == Neo.Painter.MASKTYPE_ADD || type == Neo.Painter.MASKTYPE_SUB) {
      if (this._currentColor[3] < 250) {
        type = Neo.Painter.MASKTYPE_NONE;
      }
    }

    switch (type) {
      case Neo.Painter.MASKTYPE_NONE:
        return;

      case Neo.Painter.MASKTYPE_NORMAL:
        return r0 == r && g0 == g && b0 == b ? true : false;

      case Neo.Painter.MASKTYPE_REVERSE:
        return r0 != r || g0 != g || b0 != b ? true : false;

      case Neo.Painter.MASKTYPE_ADD:
        if (a0 > 0) {
          var sort = this.sortColor(r0, g0, b0);
          for (var i = 0; i < 3; i++) {
            var c = sort[i];
            if (buf8[index + c] < this._currentColor[c]) return true;
          }
          return false;
        } else {
          return false;
        }

      case Neo.Painter.MASKTYPE_SUB:
        if (a0 > 0) {
          var sort = this.sortColor(r0, g0, b0);
          for (var i = 0; i < 3; i++) {
            var c = sort[i];
            if (buf8[index + c] > this._currentColor[c]) return true;
          }
          return false;
        } else {
          return true;
        }
    }
  }

  /**
   * ツールタイプに基づいて、バッファ上の指定ピクセルに対する加工処理を振り分ける。
   * * `left`/`top` を用いてオフセット補正を行った後、選択された `type` に応じて
   * * 適切な描画メソッド（setPenPoint等）を呼び出す。
   * * @param {Uint8ClampedArray} buf8 - 操作対象の画像バッファ（RGBA）。
   * @param {number} bufWidth - バッファの横幅。
   * @param {number} x0 - 描画対象のグローバルX座標。
   * @param {number} y0 - 描画対象のグローバルY座標。
   * @param {number} left - バッファ左上のグローバルXオフセット。
   * @param {number} top - バッファ左上のグローバルYオフセット。
   * @param {number} type - 使用するツールタイプ（Neo.Painter.LINETYPE_...）。
   * @returns {void}
   */
  setPoint(buf8, bufWidth, x0, y0, left, top, type) {
    var x = x0 - left;
    var y = y0 - top;

    switch (type) {
      case Neo.Painter.LINETYPE_PEN:
        this.setPenPoint(buf8, bufWidth, x, y);
        break;

      case Neo.Painter.LINETYPE_BRUSH:
        this.setBrushPoint(buf8, bufWidth, x, y);
        break;

      case Neo.Painter.LINETYPE_TONE:
        this.setTonePoint(buf8, bufWidth, x, y, x0, y0);
        break;

      case Neo.Painter.LINETYPE_ERASER:
        this.setEraserPoint(buf8, bufWidth, x, y);
        break;

      case Neo.Painter.LINETYPE_BLUR:
        this.setBlurPoint(buf8, bufWidth, x, y, x0, y0);
        break;

      case Neo.Painter.LINETYPE_DODGE:
        this.setDodgePoint(buf8, bufWidth, x, y);
        break;

      case Neo.Painter.LINETYPE_BURN:
        this.setBurnPoint(buf8, bufWidth, x, y);
        break;

      default:
        break;
    }
  }

  /**
   * 指定した座標のピクセルに対してペンの描画処理を実行する。
   * @param {Uint8ClampedArray} buf8 - 画素データ
   * @param {number} width - バッファの横幅
   * @param {number} x - 相対X座標
   * @param {number} y - 相対Y座標
   */
  setPenPoint(buf8, width, x, y) {
    var d = this._currentWidth;
    const r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_PEN);
    if (a1 == 0) return;

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          let r0 = buf8[index + 0];
          let g0 = buf8[index + 1];
          let b0 = buf8[index + 2];
          let a0 = buf8[index + 3] / 255.0;

          var a = a0 + a1 - a0 * a1;
          let r = r0,
            g = g0,
            b = b0;
          if (a > 0) {
            var a1x = Math.max(a1, 1.0 / 255);

            r = (r1 * a1x + r0 * a0 * (1 - a1x)) / a;
            g = (g1 * a1x + g0 * a0 * (1 - a1x)) / a;
            b = (b1 * a1x + b0 * a0 * (1 - a1x)) / a;

            r = r1 > r0 ? Math.ceil(r) : Math.floor(r);
            g = g1 > g0 ? Math.ceil(g) : Math.floor(g);
            b = b1 > b0 ? Math.ceil(b) : Math.floor(b);
          }

          var tmp = a * 255;
          a = Math.ceil(tmp);

          buf8[index + 0] = r;
          buf8[index + 1] = g;
          buf8[index + 2] = b;
          buf8[index + 3] = a;
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * ブラシの描画データのバッファへの書き込み。
   * * 現在のブラシ設定に基づいて、指定された座標を中心とした矩形範囲の
   * ピクセルに対してアルファブレンディングを行い、色を更新する。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - ブラシを描画する中心のX座標。
   * @param {number} y - ブラシを描画する中心のY座標。
   * @returns {void}
   */
  setBrushPoint(buf8, width, x, y) {
    const d = this._currentWidth;
    let r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);
    if (a1 == 0) return;

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          let r0 = buf8[index + 0];
          let g0 = buf8[index + 1];
          let b0 = buf8[index + 2];
          let a0 = buf8[index + 3] / 255.0;

          let a = a0 + a1 - a0 * a1;
          let r = r0,
            g = g0,
            b = b0;
          if (a > 0) {
            let a1x = Math.max(a1, 1.0 / 255);

            r = (r1 * a1x + r0 * a0) / (a0 + a1x);
            g = (g1 * a1x + g0 * a0) / (a0 + a1x);
            b = (b1 * a1x + b0 * a0) / (a0 + a1x);

            r = r1 > r0 ? Math.ceil(r) : Math.floor(r);
            g = g1 > g0 ? Math.ceil(g) : Math.floor(g);
            b = b1 > b0 ? Math.ceil(b) : Math.floor(b);
          }

          var tmp = a * 255;
          a = Math.ceil(tmp);

          buf8[index + 0] = r;
          buf8[index + 1] = g;
          buf8[index + 2] = b;
          buf8[index + 3] = a;
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * ハーフトーンのデータのバッファへの書き込み。
   * * 指定された矩形範囲に対し、トーンのパターン（4x4グリッド）に基づいて
   * ピクセルを不透明（255）で上書きする。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - ブラシを描画する中心のX座標。
   * @param {number} y - ブラシを描画する中心のY座標。
   * @param {number} x0 - トーンパターンのオフセットX座標。
   * @param {number} y0 - トーンパターンのオフセットY座標。
   * @returns {void}
   */
  setTonePoint(buf8, width, x, y, x0, y0) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);

    x -= r0;
    y -= r0;
    x0 -= r0;
    y0 -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;

    var r = this._currentColor[0];
    var g = this._currentColor[1];
    var b = this._currentColor[2];
    var a = this._currentColor[3];

    var toneData = this.getToneData(a);

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          if (toneData[((y0 + i) % 4) + ((x0 + j) % 4) * 4]) {
            buf8[index + 0] = r;
            buf8[index + 1] = g;
            buf8[index + 2] = b;
            buf8[index + 3] = 255;
          }
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * 消しゴムツールを使用して、指定範囲のピクセルの不透明度を減少させます。
   * * ブラシ形状に基づいて現在のアルファ値分だけ対象ピクセルの不透明度（A）を削り、
   * 透過度を上げます。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - 消しゴムを適用する中心のX座標。
   * @param {number} y - 消しゴムを適用する中心のY座標。
   * @returns {void}
   */
  setEraserPoint(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;
    var a = Math.floor(this._currentColor[3]); //this.alpha * 255);

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          var k = (buf8[index + 3] / 255.0) * (1.0 - a / 255.0);

          buf8[index + 3] -= a / ((d * (255.0 - a)) / 255.0);
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * ぼかし（Blur）ツールを使用して、指定範囲のピクセルを隣接画素と合成。
   * * 周囲4方向のピクセルから色情報を取得し、重み付け合成を行うことで
   * 緩やかなグラデーション（ぼかし）を作成する。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - 処理の中心X座標。
   * @param {number} y - 処理の中心Y座標。
   * @param {number} x0 - 座標の補正用Xオフセット。
   * @param {number} y0 - 座標の補正用Yオフセット。
   * @returns {void}
   */
  setBlurPoint(buf8, width, x, y, x0, y0) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var height = buf8.length / (width * 4);

    //  var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);
    //  var a1 = this.alpha / 12;
    var a1 = this._currentColor[3] / 255.0 / 12;
    if (a1 == 0) return;
    var blur = a1;

    var tmp = new Uint8ClampedArray(buf8.length);
    for (var i = 0; i < buf8.length; i++) {
      tmp[i] = buf8[i];
    }

    var left = x0 - x - r0;
    var top = y0 - y - r0;

    var xstart = 0,
      xend = d;
    var ystart = 0,
      yend = d;
    if (xstart > left) xstart = -left;
    if (ystart > top) ystart = -top;
    if (xend > this.canvasWidth - left) xend = this.canvasWidth - left;
    if (yend > this.canvasHeight - top) yend = this.canvasHeight - top;

    for (var j = ystart; j < yend; j++) {
      var index = (j * width + xstart) * 4;
      for (var i = xstart; i < xend; i++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          var rgba = [0, 0, 0, 0, 0];

          this.addBlur(tmp, index, 1.0 - blur * 4, rgba);
          if (i > xstart) this.addBlur(tmp, index - 4, blur, rgba);
          if (i < xend - 1) this.addBlur(tmp, index + 4, blur, rgba);
          if (j > ystart) this.addBlur(tmp, index - width * 4, blur, rgba);
          if (j < yend - 1) this.addBlur(tmp, index + width * 4, blur, rgba);

          buf8[index + 0] = Math.round(rgba[0]);
          buf8[index + 1] = Math.round(rgba[1]);
          buf8[index + 2] = Math.round(rgba[2]);
          buf8[index + 3] = Math.round((rgba[3] / rgba[4]) * 255.0);
        }
        index += 4;
      }
    }
  }

  /**
   * 覆い焼き（Dodge）ツールを使用して、指定範囲の画素の明度を上げる。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - 覆い焼きを適用する中心のX座標。
   * @param {number} y - 覆い焼きを適用する中心のY座標。
   * @returns {void}
   */
  setDodgePoint(buf8, width, x, y) {
    var d = this._currentWidth;
    const r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);
    if (a1 == 0) return;

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          let r0 = buf8[index + 0];
          let g0 = buf8[index + 1];
          let b0 = buf8[index + 2];
          let a0 = buf8[index + 3] / 255.0;

          if (a1 != 255.0) {
            var r1 = (r0 * 255) / (255 - a1);
            var g1 = (g0 * 255) / (255 - a1);
            var b1 = (b0 * 255) / (255 - a1);
          } else {
            var r1 = 255.0;
            var g1 = 255.0;
            var b1 = 255.0;
          }

          var r = Math.ceil(r1);
          var g = Math.ceil(g1);
          var b = Math.ceil(b1);
          var a = a0;

          var tmp = a * 255;
          a = Math.ceil(tmp);

          buf8[index + 0] = r;
          buf8[index + 1] = g;
          buf8[index + 2] = b;
          buf8[index + 3] = a;
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * 焼き込み（Burn）ツールを使用して、指定範囲の画素の明度を下げる。
   * * ブラシのアルファ値に基づいて背景色を黒方向へ引き寄せ、
   * 影や深みを強調する。
   * * @param {Uint8ClampedArray} buf8 - キャンバスの画像データを保持するUint8配列 (RGBA)。
   * @param {number} width - バッファの横幅（ピクセル単位）。
   * @param {number} x - 焼き込みを適用する中心のX座標。
   * @param {number} y - 焼き込みを適用する中心のY座標。
   * @returns {void}
   */
  setBurnPoint(buf8, width, x, y) {
    var d = this._currentWidth;
    const r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);
    if (a1 == 0) return;

    for (var i = 0; i < d; i++) {
      for (var j = 0; j < d; j++) {
        if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
          let r0 = buf8[index + 0];
          let g0 = buf8[index + 1];
          let b0 = buf8[index + 2];
          let a0 = buf8[index + 3] / 255.0;

          if (a1 != 255.0) {
            var r1 = 255 - ((255 - r0) * 255) / (255 - a1);
            var g1 = 255 - ((255 - g0) * 255) / (255 - a1);
            var b1 = 255 - ((255 - b0) * 255) / (255 - a1);
          } else {
            var r1 = 0;
            var g1 = 0;
            var b1 = 0;
          }

          var r = Math.floor(r1);
          var g = Math.floor(g1);
          var b = Math.floor(b1);
          var a = a0;

          var tmp = a * 255;
          a = Math.ceil(tmp);

          buf8[index + 0] = r;
          buf8[index + 1] = g;
          buf8[index + 2] = b;
          buf8[index + 3] = a;
        }
        index += 4;
      }
      index += (width - d) * 4;
    }
  }

  /**
   * 指定した座標のピクセル値をXOR演算（排他的論理和）で反転させる。
   * 四角塗り潰しのための選択範囲の表示する時などに使用する。
   * * @param {Uint32Array} buf32 - キャンバスの画像データを保持するUint32配列 (32bit RGBA)。
   * @param {number} bufWidth - バッファの横幅（ピクセル単位）。
   * @param {number} x - 処理対象のX座標。
   * @param {number} y - 処理対象のY座標。
   * @param {number} [c=0xffffff] - XOR演算に使用するビットマスク（デフォルトは白）。
   * @returns {void}
   */
  xorPixel(buf32, bufWidth, x, y, c) {
    var index = y * bufWidth + x;
    if (!c) c = 0xffffff;
    buf32[index] ^= c;
  }

  /**
   * Bz曲線
   * 3次ベジェ曲線上の指定位置（t）における座標を算出。
   * * 始点(x0, y0)から終点(x3, y3)まで、2つの制御点(x1, y1), (x2, y2)の影響を受けて
   * 滑らかに変化する曲線を補間する。
   * * @param {number} t - 曲線上での位置（0.0 から 1.0 の間で指定）。
   * @param {number} x0 - 始点のX座標。
   * @param {number} y0 - 始点のY座標。
   * @param {number} x1 - 1つ目の制御点のX座標。
   * @param {number} y1 - 1つ目の制御点のY座標。
   * @param {number} x2 - 2つ目の制御点のX座標。
   * @param {number} y2 - 2つ目の制御点のY座標。
   * @param {number} x3 - 終点のX座標。
   * @param {number} y3 - 終点のY座標。
   * @returns {Array<number>} 算出された座標 [x, y] を返す。
   */
  getBezierPoint(t, x0, y0, x1, y1, x2, y2, x3, y3) {
    var a0 = (1 - t) * (1 - t) * (1 - t);
    var a1 = (1 - t) * (1 - t) * t * 3;
    var a2 = (1 - t) * t * t * 3;
    var a3 = t * t * t;

    var x = x0 * a0 + x1 * a1 + x2 * a2 + x3 * a3;
    var y = y0 * a0 + y1 * a1 + y2 * a2 + y3 * a3;
    return [x, y];
  }

  /**
   * Bz曲線
   * 4つの制御点から3次ベジェ曲線を計算し、描画バッファにストロークを描画する。
   * * 計算された曲線上の各点において `plot` を経由し、最終的に `setPoint` で
   * 実際のピクセル操作を行う。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {number} x0 - 始点のX座標。
   * @param {number} y0 - 始点のY座標。
   * @param {number} x1 - 1つ目の制御点のX座標。
   * @param {number} y1 - 1つ目の制御点のY座標。
   * @param {number} x2 - 2つ目の制御点のX座標。
   * @param {number} y2 - 2つ目の制御点のY座標。
   * @param {number} x3 - 終点のX座標。
   * @param {number} y3 - 終点のY座標。
   * @param {number} type - 使用するブラシやツールのタイプ。
   * @param {boolean} isReplay - リプレイ再生中かどうか。
   * @param {boolean} [isPreview=false] - プレビュー描画中かどうか（不透明度やマスクを一時解除）。
   * @returns {void}
   */
  drawBezier(
    ctx,
    x0,
    y0,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    type,
    isReplay,
    isPreview = false,
  ) {
    var points = [
      [x0, y0],
      [x1, y1],
      [x2, y2],
      [x3, y3],
    ];
    var ref = this;
    /**
     * @callback DrawCallback
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     * @param {Uint8ClampedArray} buf8
     * @param {ImageData} imageData
     */
    this.draw(
      ctx,
      points,
      /** @type {DrawCallback} */ function (
        left,
        top,
        width,
        height,
        buf8,
        imageData,
      ) {
        var n = Math.ceil((width + height) * 2.5);
        var oType = ref._currentMaskType;
        var oAlpha = ref._currentColor[3];

        if (isPreview) {
          ref._currentMaskType = Neo.Painter.MASKTYPE_NONE;
          ref._currentColor[3] = 255;
        }

        for (var i = 0; i < n; i++) {
          var t = (i * 1.0) / n;
          var p = ref.getBezierPoint(t, x0, y0, x1, y1, x2, y2, x3, y3);

          p[0] = Math.round(p[0]);
          p[1] = Math.round(p[1]);

          ref.plot(
            p,
            /** @param {number} x @param {number} y **/
            function (x, y) {
              ref.setPoint(buf8, imageData.width, x, y, left, top, type);
            },
          );
        }
        ref._currentMaskType = oType;
        ref._currentColor[3] = oAlpha;
        ref.prevLine = null;
      },
    );
  }
  /**
   * ブレゼンハムのアルゴリズムを使用して、始点から終点まで直線を描画。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {number} x0 - 始点のX座標。
   * @param {number} y0 - 始点のY座標。
   * @param {number} x1 - 終点のX座標。
   * @param {number} y1 - 終点のY座標。
   * @param {number} type - 使用するブラシやツールのタイプ。
   * @returns {void}
   */
  drawLine(ctx, x0, y0, x1, y1, type) {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);

    var points = [
      [x0, y0],
      [x1, y1],
    ];
    var ref = this;
    this.aerr = 0;
    /**
     * @callback DrawCallback
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     * @param {Uint8ClampedArray} buf8
     * @param {ImageData} imageData
     */
    this.draw(
      ctx,
      points,
      /** @type {DrawCallback} */ function (
        left,
        top,
        width,
        height,
        buf8,
        imageData,
      ) {
        ref.bresenham(
          points,
          /** @param {number} x @param {number} y **/ function (x, y) {
            ref.setPoint(buf8, imageData.width, x, y, left, top, type);
          },
        );
      },
    );
    this.prevLine = points;
  }

  /**
   * 描画範囲を最適化し、バッファを取得・加工・反映させるラッパー。
   * * 指定された点群を囲む最小矩形を算出し、ブラシ幅(r)の余白を含めて
   * ImageDataを取得・書き戻すことで描画負荷を最小限に抑える。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {Array<Array<number>>} points - 描画対象となる点の配列 [[x,y], ...]。
   * @param {Function} callback - バッファ操作を行う描画ロジック本体。
   * @returns {void}
   */
  draw(ctx, points, callback) {
    var xs = [],
      ys = [];
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      xs.push(Math.round(point[0]));
      ys.push(Math.round(point[1]));
    }
    var xmin = Math.min.apply(null, xs);
    var xmax = Math.max.apply(null, xs);
    var ymin = Math.min.apply(null, ys);
    var ymax = Math.max.apply(null, ys);

    var r = Math.ceil(this._currentWidth / 2);
    var left = xmin - r;
    var top = ymin - r;
    var width = xmax - xmin;
    var height = ymax - ymin;

    var imageData = ctx.getImageData(left, top, width + r * 2, height + r * 2);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    callback(left, top, width, height, buf8, imageData);

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
  }

  /**
   * ブレゼンハムのアルゴリズムを用いて、指定された始点と終点の間のピクセル座標を算出。
   * * [重要] 前回の線分(this.prevLine)と始点が一致する場合、重複描画を防ぐために
   * * コールバックをスキップする最適化ロジックを含む。
   * * @param {Array<Array<number>>} points - [[x0, y0], [x1, y1]] の形式の座標配列。
   * @param {Function} callback - 算出された座標(x, y)に対して実行する描画処理。
   * @returns {void}
   */
  bresenham(points, callback) {
    var x0 = points[0][0];
    var y0 = points[0][1];
    var x1 = points[1][0];
    var y1 = points[1][1];

    var dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;
    var err = (dx > dy ? dx : -dy) / 2;

    while (true) {
      if (
        this.prevLine == null ||
        !(
          (this.prevLine[0][0] == x0 && this.prevLine[0][1] == y0) ||
          (this.prevLine[1][0] == x0 && this.prevLine[1][1] == y0)
        )
      ) {
        callback(x0, y0);
      }

      if (x0 === x1 && y0 === y1) break;
      var e2 = err;
      if (e2 > -dx) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dy) {
        err += dx;
        y0 += sy;
      }
    }
    this.prevLine = points;
  }

  /**
   * 指定した座標に対して描画処理（callback）を実行する。
   * * 直前の描画座標(prevLine)と比較し、同一地点であれば再描画をスキップして
   * * 重複による色の重なりを防ぎます。
   * * @param {Array<number>} point - [x, y] 形式の描画対象座標。
   * @param {Function} callback - 実際に setPoint を呼び出す描画関数。
   * @returns {void}
   */
  plot(point, callback) {
    var x0 = point[0];
    var y0 = point[1];

    if (
      this.prevLine == null ||
      !(this.prevLine[0][0] == x0 && this.prevLine[0][1] == y0)
    ) {
      callback(x0, y0);
    }
    this.prevLine = [point, point];
  }

  /**
   * 直線
   * @description
   * キャンバス上の指定された単一点に対して描画処理を適用する。
   * * 内部的には始点と終点が同一の線分として `drawLine` を呼び出すことで、
   * * 線描画ロジックの重複排除やバッファ最適化の恩恵を統合的に受ける。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {number} x - 描画対象のX座標。
   * @param {number} y - 描画対象のY座標。
   * @param {number} type - 使用するブラシやツールのタイプ。
   * @returns {void}
   */
  drawPoint(ctx, x, y, type) {
    this.drawLine(ctx, x, y, x, y, type);
  }

  /**
   * 指定された矩形範囲内のピクセル値をXOR演算によってビット反転（ネガ処理）する。
   * * 32bit整数のバッファを直接操作することで、高速な描画プレビューや選択範囲の反転を実現する。
   * * [注意] 処理対象が32bit配列であることを前提としているため、バッファの整合性に注意すること。
   * * @param {Uint32Array} buf32 - 操作対象となるキャンバスの画像データバッファ（32bit）。
   * * @param {number} bufWidth - バッファの横幅（ピクセル単位）。
   * * @param {number} x - 矩形の開始X座標。
   * * @param {number} y - 矩形の開始Y座標。
   * * @param {number} width - 矩形の横幅。
   * * @param {number} height - 矩形の高さ。
   * * @param {number} c - XOR演算に使用する32bitのマスク値（例: 0xffffff）。
   * @returns {void}
   */
  xorRect(buf32, bufWidth, x, y, width, height, c) {
    var index = y * bufWidth + x;
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        buf32[index] ^= c;
        index++;
      }
      index += width - bufWidth;
    }
  }

  /**
   * 指定された矩形範囲に対して、塗りつぶしまたは枠線のXOR反転描画を行う。
   * * [塗りつぶし] `xorRect` を呼び出し、範囲内全ピクセルを反転する。
   * * [枠線] 矩形の外周ラインのみを反転させ、視覚的な選択枠を表示する。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {number} x - 矩形の開始X座標。
   * @param {number} y - 矩形の開始Y座標。
   * @param {number} width - 矩形の横幅。
   * @param {number} height - 矩形の高さ。
   * @param {boolean} [isFill=false] - trueなら矩形内部を塗りつぶし、falseなら外周のみを描画する。
   * @param {number} [c=0xffffff] - XORに使用する32bitマスク値。
   * @returns {void}
   */
  drawXORRect(ctx, x, y, width, height, isFill = false, c = 0xffffff) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    if (width == 0 || height == 0) return;

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var index = 0;
    if (!c) c = 0xffffff;

    if (isFill) {
      this.xorRect(buf32, width, 0, 0, width, height, c);
    } else {
      for (var i = 0; i < width; i++) {
        //top
        buf32[index] = buf32[index] ^= c;
        index++;
      }
      if (height > 1) {
        index = width;
        for (var i = 1; i < height; i++) {
          //left
          buf32[index] = buf32[index] ^= c;
          index += width;
        }
        if (width > 1) {
          index = width * 2 - 1;
          for (var i = 1; i < height - 1; i++) {
            //right
            buf32[index] = buf32[index] ^= c;
            index += width;
          }
          index = width * (height - 1) + 1;
          for (var i = 1; i < width; i++) {
            // bottom
            buf32[index] = buf32[index] ^= c;
            index++;
          }
        }
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * 中点楕円アルゴリズムによるXORプレビュー描画。
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - バウンディングボックスの左上X。
   * @param {number} y - バウンディングボックスの左上Y。
   * @param {number} width - 幅。
   * @param {number} height - 高さ。
   * @param {boolean} [isFill] - trueで塗りつぶし、falseで輪郭のみ。
   * @param {number} [c=0xFFFFFF] - XOR用マスク値。
   */
  drawXOREllipse(ctx, x, y, width, height, isFill, c) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    if (width == 0 || height == 0) return;
    if (!c) c = 0xffffff;

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var a = width - 1,
      b = height - 1,
      b1 = b & 1; /* values of diameter */
    var dx = 4 * (1 - a) * b * b,
      dy = 4 * (b1 + 1) * a * a; /* error increment */
    var err = dx + dy + b1 * a * a,
      e2; /* error of 1.step */

    var x0 = x;
    var y0 = y;
    var x1 = x0 + a;
    var y1 = y0 + b;

    if (x0 > x1) {
      x0 = x1;
      x1 += a;
    }
    if (y0 > y1) y0 = y1;
    y0 += Math.floor((b + 1) / 2);
    y1 = y0 - b1; /* starting pixel */
    a *= 8 * a;
    b1 = 8 * b * b;
    var ymin = y0 - 1;

    do {
      if (isFill) {
        if (ymin < y0) {
          this.xorRect(buf32, width, x0 - x, y0 - y, x1 - x0, 1, c);
          if (y0 != y1) {
            this.xorRect(buf32, width, x0 - x, y1 - y, x1 - x0, 1, c);
          }
          ymin = y0;
        }
      } else {
        this.xorPixel(buf32, width, x1 - x, y0 - y, c);
        if (x0 != x1) {
          this.xorPixel(buf32, width, x0 - x, y0 - y, c);
        }
        if (y0 != y1) {
          this.xorPixel(buf32, width, x0 - x, y1 - y, c);
          if (x0 != x1) {
            this.xorPixel(buf32, width, x1 - x, y1 - y, c);
          }
        }
      }
      e2 = 2 * err;
      if (e2 <= dy) {
        y0++;
        y1--;
        err += dy += a;
      } /* y step */
      if (e2 >= dx || 2 * err > dy) {
        x0++;
        x1--;
        err += dx += b1;
      } /* x step */
    } while (x0 <= x1);

    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * 指定された2点間をXOR演算によって反転させ、プレビュー用の直線を描画する。
   * * ブレゼンハムのアルゴリズムを利用し、キャンバスの部分的なバッファのみを
   * * XOR操作することで、描画負荷を最小限に抑えつつ高速な視覚フィードバックを実現する。
   * * @param {CanvasRenderingContext2D} ctx - 描画対象のCanvasコンテキスト。
   * @param {number} x0 - 始点のX座標。
   * @param {number} y0 - 始点のY座標。
   * @param {number} x1 - 終点のX座標。
   * @param {number} y1 - 終点のY座標。
   * @param {number} [c=0xffffff] - XOR演算に使用する32bitマスク値。
   * @returns {void}
   */
  drawXORLine(ctx, x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);

    var left = x0 < x1 ? x0 : x1;
    var top = y0 < y1 ? y0 : y1;
    //  console.log("left:"+left+" top:"+top+" width:"+width+" height:"+height);

    var imageData = ctx.getImageData(left, top, width + 1, height + 1);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width,
      sx = x0 < x1 ? 1 : -1;
    var dy = height,
      sy = y0 < y1 ? 1 : -1;
    var err = (dx > dy ? dx : -dy) / 2;

    while (true) {
      if (
        this.prevLine == null ||
        !(
          (this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
          (this.prevLine[2] == x0 && this.prevLine[3] == y0)
        )
      ) {
        this.xorPixel(buf32, imageData.width, x0 - left, y0 - top, c);
      }

      if (x0 === x1 && y0 === y1) break;
      var e2 = err;
      if (e2 > -dx) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dy) {
        err += dx;
        y0 += sy;
      }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
  }

  /**
   * 消し四角
   * @param {number} layer - 対象レイヤーインデックス。
   * @param {number} x - 開始X。
   * @param {number} y - 開始Y。
   * @param {number} width - 幅。
   * @param {number} height - 高さ。
   */
  eraseRect(layer, x, y, width, height) {
    var ctx = this.canvasCtx[layer];
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var a = 1.0 - this._currentColor[3] / 255.0; //this.alpha;
    if (a != 0) {
      a = Math.ceil(2.0 / a);
    } else {
      a = 255;
    }

    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        if (!this.isMasked(buf8, index)) {
          buf8[index + 3] -= a;
        }
        index += 4;
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * 左右反転
   * * @param {number} layer - 操作対象のレイヤーインデックス。
   * @param {number} x - 反転対象範囲の開始X座標。
   * @param {number} y - 反転対象範囲の開始Y座標。
   * @param {number} width - 反転対象範囲の横幅。
   * @param {number} height - 反転対象範囲の高さ。
   * @returns {void}
   */
  flipH(layer, x, y, width, height) {
    var ctx = this.canvasCtx[layer];
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var half = Math.floor(width / 2);
    for (var j = 0; j < height; j++) {
      var index = j * width;
      var index2 = index + (width - 1);
      for (var i = 0; i < half; i++) {
        var value = buf32[index + i];
        buf32[index + i] = buf32[index2 - i];
        buf32[index2 - i] = value;
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * 上下反転
   * * @param {number} layer - 操作対象のレイヤーインデックス。
   * @param {number} x - 反転対象範囲の開始X座標。
   * @param {number} y - 反転対象範囲の開始Y座標。
   * @param {number} width - 反転対象範囲の横幅。
   * @param {number} height - 反転対象範囲の高さ。
   * @returns {void}
   */
  flipV(layer, x, y, width, height) {
    var ctx = this.canvasCtx[layer];
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var half = Math.floor(height / 2);
    for (var j = 0; j < half; j++) {
      var index = j * width;
      var index2 = (height - 1 - j) * width;
      for (var i = 0; i < width; i++) {
        var value = buf32[index + i];
        buf32[index + i] = buf32[index2 + i];
        buf32[index2 + i] = value;
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * レイヤー結合
   * * @param {number} layer - 統合先となるレイヤーインデックス(0 or 1)。
   * @param {number} x - 合成範囲の開始X座標。
   * @param {number} y - 合成範囲の開始Y座標。
   * @param {number} width - 合成範囲の横幅。
   * @param {number} height - 合成範囲の高さ。
   * @returns {void}
   */
  merge(layer, x, y, width, height) {
    // var ctx = this.canvasCtx[layer];
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    var r = 0x00;
    var g = 0x00;
    var b = 0x00;

    var imageData = [];
    var buf32 = [];
    var buf8 = [];
    for (var i = 0; i < 2; i++) {
      imageData[i] = this.canvasCtx[i].getImageData(x, y, width, height);
      buf32[i] = new Uint32Array(imageData[i].data.buffer);
      buf8[i] = new Uint8ClampedArray(imageData[i].data.buffer);
    }

    var dst = layer;
    var src = dst == 1 ? 0 : 1;
    var size = width * height;
    var index = 0;
    for (var i = 0; i < size; i++) {
      var r0 = buf8[0][index + 0];
      var g0 = buf8[0][index + 1];
      var b0 = buf8[0][index + 2];
      var a0 = buf8[0][index + 3] / 255.0;
      var r1 = buf8[1][index + 0];
      var g1 = buf8[1][index + 1];
      var b1 = buf8[1][index + 2];
      var a1 = buf8[1][index + 3] / 255.0;

      var a = a0 + a1 - a0 * a1;
      if (a > 0) {
        r = Math.floor((r1 * a1 + r0 * a0 * (1 - a1)) / a + 0.5);
        g = Math.floor((g1 * a1 + g0 * a0 * (1 - a1)) / a + 0.5);
        b = Math.floor((b1 * a1 + b0 * a0 * (1 - a1)) / a + 0.5);
      }
      buf8[src][index + 0] = 0;
      buf8[src][index + 1] = 0;
      buf8[src][index + 2] = 0;
      buf8[src][index + 3] = 0;
      buf8[dst][index + 0] = r;
      buf8[dst][index + 1] = g;
      buf8[dst][index + 2] = b;
      buf8[dst][index + 3] = Math.floor(a * 255 + 0.5);
      index += 4;
    }

    for (var i = 0; i < 2; i++) {
      imageData[i].data.set(buf8[i]);
      this.canvasCtx[i].putImageData(imageData[i], x, y);
    }
  }

  /**
   * 指定された矩形範囲内のピクセルに対して近傍平均化を行い、ぼかし効果を適用する。
   * * @param {number} layer - 操作対象のレイヤーインデックス。
   * @param {number} x - ぼかし対象範囲の開始X座標。
   * @param {number} y - ぼかし対象範囲の開始Y座標。
   * @param {number} width - ぼかし対象範囲の横幅。
   * @param {number} height - ぼかし対象範囲の高さ。
   * @returns {void}
   */
  blurRect(layer, x, y, width, height) {
    var ctx = this.canvasCtx[layer];
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var tmp = new Uint8ClampedArray(buf8.length);
    for (var i = 0; i < buf8.length; i++) tmp[i] = buf8[i];

    var index = 0;
    var a1 = this._currentColor[3] / 255.0 / 12; //this.alpha / 12;
    var blur = a1;

    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        var rgba = [0, 0, 0, 0, 0];

        this.addBlur(tmp, index, 1.0 - blur * 4, rgba);

        if (i > 0) this.addBlur(tmp, index - 4, blur, rgba);
        if (i < width - 1) this.addBlur(tmp, index + 4, blur, rgba);
        if (j > 0) this.addBlur(tmp, index - width * 4, blur, rgba);
        if (j < height - 1) this.addBlur(tmp, index + width * 4, blur, rgba);

        var w = rgba[4];
        buf8[index + 0] = Math.round(rgba[0]);
        buf8[index + 1] = Math.round(rgba[1]);
        buf8[index + 2] = Math.round(rgba[2]);
        buf8[index + 3] = Math.ceil((rgba[3] / w) * 255.0);

        index += 4;
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * ぼかし処理における画素加算とアルファブレンドを統合的に実行する。
   * * @param {Uint8ClampedArray} buffer - 操作対象の画像データバッファ。
   * @param {number} index - 加算対象のピクセルインデックス。
   * @param {number} a - 現在のサンプリングウェイト。
   * @param {Array<number>} rgba - 累積色値およびアルファ値、ウェイトを保持する配列 [r, g, b, a, weight]。
   * @returns {void}
   */
  addBlur(buffer, index, a, rgba) {
    var r0 = rgba[0];
    var g0 = rgba[1];
    var b0 = rgba[2];
    var a0 = rgba[3];
    var r1 = buffer[index + 0];
    var g1 = buffer[index + 1];
    var b1 = buffer[index + 2];
    var a1 = (buffer[index + 3] / 255.0) * a;
    rgba[4] += a;

    var a = a0 + a1;
    if (a > 0) {
      rgba[0] = (r1 * a1 + r0 * a0) / (a0 + a1);
      rgba[1] = (g1 * a1 + g0 * a0) / (a0 + a1);
      rgba[2] = (b1 * a1 + b0 * a0) / (a0 + a1);
      rgba[3] = a;
    }
  }

  /**
   * スポイト
   * @description 指定された座標における、全可視レイヤーの合成色を算出する。
   * * 各レイヤーのRGBA値を順次アルファブレンドし、背景色（白）をベースにした
   * * 最終的な表示色を計算する。算出された色は現在のカラーとして設定され、
   * * 透明度に応じて自動的にツールをペンか消しゴムへ切り替える機能を持つ。
   * * 下のレイヤーの色を右クリックでスポイトできる2.22_8と
   * * 下のレイヤーに色があっても上のレイヤーが透明なら右クリックで消しゴムに切り換わるv2.04の動作をエミュレート。
   * @param {number} x - 取得対象のX座標。
   * @param {number} y - 取得対象のY座標。
   * @returns {void}
   */
  pickColor(x, y) {
    let r = 0xff,
      g = 0xff,
      b = 0xff,
      a = 0,
      result = 0xffffff;
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && x < this.canvasWidth && y >= 0 && y < this.canvasHeight) {
      for (var i = 0; i < 2; i++) {
        if (this.visible[i]) {
          const ctx = this.canvasCtx[i];
          const imageData = ctx.getImageData(x, y, 1, 1);
          const buf32 = new Uint32Array(imageData.data.buffer);
          const buf8 = new Uint8ClampedArray(imageData.data.buffer);

          a = buf8[3] / 255.0;
          r = r * (1.0 - a) + buf8[2] * a;
          g = g * (1.0 - a) + buf8[1] * a;
          b = b * (1.0 - a) + buf8[0] * a;
        }
      }
      r = Math.max(Math.min(Math.round(r), 255), 0);
      g = Math.max(Math.min(Math.round(g), 255), 0);
      b = Math.max(Math.min(Math.round(b), 255), 0);
      result = r | (g << 8) | (b << 16);
    }
    this.setColor(result);

    //レイヤー1が選択されている時に
    if (this.current > 0) {
      //透明色を右クリックでスポイトした時に消しゴム化する。
      //v2.16より古いバージョンではレイヤー1でスポイトした色が透明の時は消しゴムに切り換わる。
      if (a == 0 && (result == 0xffffff || this.getEmulationMode() < 2.16)) {
        this.setToolByType(Neo.Painter.TOOLTYPE_ERASER);
      } else {
        // v2.16以後の新しいバージョンでは
        // レイヤー0に色がある時は消しゴム化しない。
        if (Neo.eraserTip?.selected) {
          this.setToolByType(Neo.Painter.TOOLTYPE_PEN);
        }
      }
    }
  }

  /**
   * 指定されたキャンバス内の水平ラインを、指定色で一括塗りつぶしする。
   * * `Uint32Array` を用いて、色情報を32bit整数としてインデックスへ直接書き込むことで、
   * * ブラウザの描画APIを通さずにメモリ上で高速にライン描画を行う。
   * * [パフォーマンス] ループ内で `this.canvasWidth` を用いてインデックスを算出する。
   * * @param {Uint32Array} buf32 - 操作対象となるキャンバスの画像データバッファ（32bit）。
   * @param {number} x0 - 塗りつぶし開始X座標。
   * @param {number} x1 - 塗りつぶし終了X座標。
   * @param {number} y - 塗りつぶし対象のY座標。
   * @param {number} color - 書き込む色値（32bit）。
   * @returns {void}
   */
  fillHorizontalLine(buf32, x0, x1, y, color) {
    var index = y * this.canvasWidth + x0;
    for (var x = x0; x <= x1; x++) {
      buf32[index++] = color;
    }
  }

  /**
   * スキャンライン・塗りつぶしアルゴリズムにおいて、対象線分上の座標をスタックへ追加する。
   * @param {number} x0 - 走査開始X。
   * @param {number} x1 - 走査終了X。
   * @param {number} y - 対象Y。
   * @param {number} baseColor - 置換対象の色（※現在未使用）。
   * @param {Uint32Array} buf32 - 画像データバッファ（※現在未使用）。
   * @param {Array<{x: number, y: number}>} stack - 塗りつぶし候補座標を保持するスタック。
   */
  scanLine(x0, x1, y, baseColor, buf32, stack) {
    // var width = this.canvasWidth;
    for (var x = x0; x <= x1; x++) {
      stack.push({ x: x, y: y });
    }
  }

  /**
   * 塗り潰し
   * @param {number} layer - 対象レイヤーインデックス。
   * @param {number} x - クリック開始X。
   * @param {number} y - クリック開始Y。
   * @param {number} fillColor - 置換後の色（32bit整数）。
   */
  doFloodFill(layer, x, y, fillColor) {
    x = Math.round(x);
    y = Math.round(y);
    var ctx = this.canvasCtx[layer];

    if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) {
      return;
    }

    const imageData = ctx.getImageData(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight,
    );
    const buf32 = new Uint32Array(imageData.data.buffer);
    const buf8 = new Uint8ClampedArray(imageData.data.buffer);
    const width = imageData.width;
    const stack = [{ x: x, y: y }];

    var baseColor = buf32[y * width + x];

    if ((baseColor & 0xff000000) == 0 || baseColor != fillColor) {
      while (stack.length > 0) {
        if (stack.length > 1000000) {
          break;
        }
        var point = stack.pop();
        if (!point) {
          break;
        }
        const x = point.x;
        const y = point.y;
        let x0 = x;
        let x1 = x;
        if (buf32[y * width + x] == fillColor) continue;
        if (buf32[y * width + x] != baseColor) continue;

        for (; 0 < x0; x0--) {
          if (buf32[y * width + (x0 - 1)] != baseColor) break;
        }
        for (; x1 < this.canvasWidth - 1; x1++) {
          if (buf32[y * width + (x1 + 1)] != baseColor) break;
        }
        this.fillHorizontalLine(buf32, x0, x1, y, fillColor);

        if (y + 1 < this.canvasHeight) {
          this.scanLine(x0, x1, y + 1, baseColor, buf32, stack);
        }
        if (y - 1 >= 0) {
          this.scanLine(x0, x1, y - 1, baseColor, buf32, stack);
        }
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
    //  this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * コピー
   * @description 指定範囲の画像を一時バッファとプレビュー用キャンバスにコピーする。
   * @param {number} layer - 対象レイヤーインデックス。
   * @param {number} x - 開始X。
   * @param {number} y - 開始Y。
   * @param {number} width - 幅。
   * @param {number} height - 高さ。
   */
  copy(layer, x, y, width, height) {
    this.tempX = 0;
    this.tempY = 0;
    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const imageData = this.canvasCtx[layer].getImageData(x, y, width, height);
    const buf32 = new Uint32Array(imageData.data.buffer);
    // let buf8 = new Uint8ClampedArray(imageData.data.buffer);
    this.temp = new Uint32Array(buf32.length);
    for (var i = 0; i < buf32.length; i++) {
      this.temp[i] = buf32[i];
    }

    //tempCanvasに乗せる画像を作る
    const tempImageData = this.tempCanvasCtx.getImageData(x, y, width, height);
    const tempBuf32 = new Uint32Array(tempImageData.data.buffer);
    let tempBuf8 = new Uint8ClampedArray(tempImageData.data.buffer);
    for (var i = 0; i < tempBuf32.length; i++) {
      if (this.temp[i] >> 24) {
        tempBuf32[i] = this.temp[i] | 0xff000000;
      } else {
        tempBuf32[i] = 0xffffffff;
      }
    }
    tempImageData.data.set(tempBuf8);
    this.tempCanvasCtx.putImageData(tempImageData, x, y);
  }

  /**
   * ペースト
   * @description 指定されたレイヤーの矩形領域に、一時バッファの内容を貼り付ける。
   * * @param {number} layer - 操作対象のレイヤーインデックス。
   * @param {number} x - 貼り付け開始の基準X座標。
   * @param {number} y - 貼り付け開始の基準Y座標。
   * @param {number} width - 貼り付け対象の横幅。
   * @param {number} height - 貼り付け対象の縦幅。
   * @param {number} dx - 貼り付け位置のオフセットX。
   * @param {number} dy - 貼り付け位置のオフセットY。
   * @returns {void}
   */
  paste(layer, x, y, width, height, dx, dy) {
    var ctx = this.canvasCtx[layer];
    //  console.log(this.tempX, this.tempY);

    var imageData = ctx.getImageData(x + dx, y + dy, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    if (this.temp) {
      for (var i = 0; i < buf32.length; i++) {
        buf32[i] = this.temp[i];
      }
      imageData.data.set(buf8);
      ctx.putImageData(imageData, x + dx, y + dy);
    }

    this.temp = null;
    this.tempX = 0;
    this.tempY = 0;
    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * 傾け
   * @description 領域を90度回転させる。
   * @param {number} layer - 対象レイヤー。
   * @param {number} x - 開始座標。
   * @param {number} y - 開始座標。
   * @param {number} width, height - サイズ。
   * @param {number} height - サイズ。
   * @note
   * 「バグストライプ」の再現処理を含む。
   * オリジナルのPaintBBS等の仕様に準じ、回転処理時の境界データ参照に由来するグリッジを
   * 意図的に発生させる。この挙動は Neo.config.neo_disable_turn_original_glitch
   * により無効化できる。
   */
  turn(layer, x, y, width, height) {
    var ctx = this.canvasCtx[layer];

    // 傾けツールのバグを再現するため一番上のラインで対象領域を埋める
    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var temp = new Uint32Array(buf32.length);

    // 設定によって「塗りつぶし関数」を切り替える
    let fillPixel;
    if (Neo.config.neo_disable_turn_original_glitch) {
      // 常に透明(0)を返す
      // オリジナルのPaintBBSのグリッジ
      // 傾けのバグストライプを再現しない
      /** @param {number} index */
      fillPixel = function (index) {
        return 0;
      };
    } else {
      // オリジナルのPaintBBSのグリッジ
      // 傾けのバグストライプを再現
      /** @param {number} index */
      fillPixel = function (index) {
        return buf32[index % width];
      };
    }

    var index = 0;
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        temp[index] = buf32[index];
        if (index >= width) {
          buf32[index] = fillPixel(index);
        }
        index++;
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);

    // 90度回転させて貼り付け
    imageData = ctx.getImageData(x, y, height, width);
    buf32 = new Uint32Array(imageData.data.buffer);
    buf8 = new Uint8ClampedArray(imageData.data.buffer);

    index = 0;
    for (var j = height - 1; j >= 0; j--) {
      for (var i = 0; i < width; i++) {
        buf32[i * height + j] = temp[index++];
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * マスク形状タイプに応じたピクセル判定関数を返却する。
   * @param {string|number} type - 描画ツールまたは塗りつぶしの形状タイプ。
   * @returns {((i: number, j: number, w: number, h: number) => boolean) | null}
   * 指定座標が描画範囲内であれば true を返す関数。該当タイプがない場合は null。
   */
  getMaskFunc(type) {
    switch (type) {
      case Neo.Painter.TOOLTYPE_RECT:
        return this.rectMask;
      case Neo.Painter.TOOLTYPE_RECTFILL:
        return this.rectFillMask;
      case Neo.Painter.TOOLTYPE_ELLIPSE:
        return this.ellipseMask;
      case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        return this.ellipseFillMask;
    }
    return null;
  }

  /**
   * 塗り潰し
   * @description 塗り潰しおよび汎用描画エンジン。
   * @description 指定矩形領域に対し、typeで指定されたマスク形状に基づいて現在の色を合成・描画する。
   * @param {number} layer - 対象レイヤーインデックス。
   * @param {number} x - 描画開始X座標。
   * @param {number} y - 描画開始Y座標。
   * @param {number} width - 描画対象領域のサイズ。
   * @param {number} height - 描画対象領域のサイズ。
   * @param {string|number} type - マスク形状タイプ(例: TOOLTYPE_RECT, TOOLTYPE_RECTFILLなど)。
   */
  doFill(layer, x, y, width, height, type) {
    const ctx = this.canvasCtx[layer];
    const maskFunc = this.getMaskFunc(type);

    const imageData = ctx.getImageData(x, y, width, height);
    // const buf32 = new Uint32Array(imageData.data.buffer);
    const buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_FILL);

    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        if (maskFunc && maskFunc.call(this, i, j, width, height)) {
          //なぜか加算逆加算は適用されない
          if (
            this._currentMaskType >= Neo.Painter.MASKTYPE_ADD ||
            !this.isMasked(buf8, index)
          ) {
            const r0 = buf8[index + 0];
            const g0 = buf8[index + 1];
            const b0 = buf8[index + 2];
            const a0 = buf8[index + 3] / 255.0;

            var a = a0 + a1 - a0 * a1;

            if (a > 0) {
              //不透明なピクセルの場合
              var a1x = a1;
              var ax = 1 + a0 * (1 - a1x);

              let r = (r1 + r0 * a0 * (1 - a1x)) / ax;
              let g = (g1 + g0 * a0 * (1 - a1x)) / ax;
              let b = (b1 + b0 * a0 * (1 - a1x)) / ax;

              r = r1 > r0 ? Math.ceil(r) : Math.floor(r);
              g = g1 > g0 ? Math.ceil(g) : Math.floor(g);
              b = b1 > b0 ? Math.ceil(b) : Math.floor(b);

              var tmp = a * 255;
              a = Math.ceil(tmp);

              buf8[index + 0] = r;
              buf8[index + 1] = g;
              buf8[index + 2] = b;
              buf8[index + 3] = a;
            }
          }
        }
        index += 4;
      }
    }
    //透明なピクセルの場合はもとのbuf8が入る
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   * @returns
   */
  rectFillMask(x, y, width, height) {
    return true;
  }
  /**
   * 矩形枠線マスク関数。矩形の外周部のみ描画対象とする。
   * @param {number} x - 相対X座標
   * @param {number} y - 相対Y座標
   * @param {number} width - 矩形幅
   * @param {number} height - 矩形高さ
   * @returns {boolean} 外周の線幅内であれば true
   */
  rectMask(x, y, width, height) {
    var d = this._currentWidth;
    //  var d = this.lineWidth;
    return x < d || x > width - 1 - d || y < d || y > height - 1 - d
      ? true
      : false;
  }

  /**
   * 楕円
   * @description 楕円塗り潰しマスク関数。楕円内部を全て描画対象とする。
   * @param {number} x - 相対X座標
   * @param {number} y - 相対Y座標
   * @param {number} width - 矩形幅
   * @param {number} height - 矩形高さ
   * @returns {boolean} 楕円内部の時に true
   */
  ellipseFillMask(x, y, width, height) {
    var cx = (width - 1) / 2.0;
    var cy = (height - 1) / 2.0;
    x = (x - cx) / (cx + 1);
    y = (y - cy) / (cy + 1);

    return x * x + y * y < 1 ? true : false;
  }

  /**
   * 線楕円
   * @description 楕円枠線マスク関数。楕円の輪郭部分のみ描画対象とする。
   * @param {number} x - 相対X座標
   * @param {number} y - 相対Y座標
   * @param {number} width - 矩形幅
   * @param {number} height - 矩形高さ
   * @returns {boolean} 輪郭内であれば true
   */
  ellipseMask(x, y, width, height) {
    var d = this._currentWidth;
    //  var d = this.lineWidth;
    var cx = (width - 1) / 2.0;
    var cy = (height - 1) / 2.0;

    if (cx <= d || cy <= d) return this.ellipseFillMask(x, y, width, height);

    var x2 = (x - cx) / (cx - d + 1);
    var y2 = (y - cy) / (cy - d + 1);

    x = (x - cx) / (cx + 1);
    y = (y - cy) / (cy + 1);

    if (x * x + y * y < 1) {
      if (x2 * x2 + y2 * y2 >= 1) {
        return true;
      }
    }
    return false;
  }

  /*
   -----------------------------------------------------------------------
 */

  /**
   * キャンバス上のマウス座標を、ズーム・スクロール状態を反映した描画先座標に変換。
   * @param {number} mouseX - マウスのX座標
   * @param {number} mouseY - マウスのY座標
   * @param {boolean} isClip - キャンバス範囲外をカットするかどうか
   * @param {boolean} [isCenter=false] - 座標をピクセル中心（0.5）に合わせるかどうか
   * @returns {{x: number, y: number}} 変換後の座標オブジェクト
   */
  getDestCanvasPosition(mouseX, mouseY, isClip, isCenter = false) {
    let mx = Math.floor(mouseX); //Math.round(mouseX);
    let my = Math.floor(mouseY); //Math.round(mouseY);
    if (isCenter) {
      mx += 0.499;
      my += 0.499;
    }

    // マウス座標（描画先キャンバス座標）を計算
    var x =
      (mx - this.zoomX + (this.destCanvas.width * 0.5) / this.zoom) * this.zoom;
    var y =
      (my - this.zoomY + (this.destCanvas.height * 0.5) / this.zoom) *
      this.zoom;

    if (isClip) {
      x = Math.max(Math.min(x, this.destCanvas.width), 0);
      y = Math.max(Math.min(y, this.destCanvas.height), 0);
    }
    return { x: x, y: y };
  }

  /**
   * イベント発生源が描画キャンバス周辺か、またはUI操作領域かを判定する。
   * @param {Element} element - イベントターゲットとなるDOM要素。
   * @returns {boolean} 操作対象のUI（ツール、ボタン、入力欄）の時は true。描画領域（キャンバス）または周囲の余白の時は false。
   * @note
   * イベント伝播時に、UI操作とキャンバス操作を仕分けるための境界判定。
   * #NEO配下のツールバーやボタンを「ウィジェット」としてマークし、描画イベントの伝播を遮断する。
   */
  isWidget(element) {
    if (!element || !(element instanceof Element)) return false;

    // #NEO の外側を除外
    const root = element.closest("#NEO");
    if (!root) return false;

    //  ツール領域・ボタン類
    if (
      element.closest(
        "#neo-tools, .NEO .buttonOn, .NEO .buttonOff, .NEO .inputText",
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * 要素がメインの描画・操作エリア（#neo-container）内にあるかを判定する。
   * @param {Element} element - 判定対象のDOM要素
   * @returns {boolean} #neo-container配下なら true
   */
  isContainer(element) {
    if (!element || !(element instanceof Element)) return false;
    // #NEO の外側を除外
    const root = element.closest("#NEO");
    if (!root) return false;
    if (element.closest("#neo-container")) {
      return true;
    }
    return false;
  }

  /**
   * 実行中のツールを強制終了し、マウスの状態をリセットする。
   * @returns {void}
   */
  cancelTool() {
    if (this.tool) {
      this.isMouseDown = false;
      this.tool.upHandler(this);

      //      switch (this.tool.type) {
      //      case Neo.Painter.TOOLTYPE_HAND:
      //      case Neo.Painter.TOOLTYPE_SLIDER:
      //          this.isMouseDown = false;
      //          this.tool.upHandler(this);
      //      }
    }
  }

  /**
   * 画像ファイルを読み込み、メインレイヤー（canvasCtx[0]）に描画する。
   * @param {string} filename - 画像のパスまたはDataURL
   * @returns {void}
   */
  loadImage(filename) {
    console.log("loadImage " + filename);
    var img = new Image();
    const ref = this;
    img.onload = function () {
      ref.canvasCtx[0].drawImage(img, 0, 0);
      ref.updateDestCanvas(0, 0, ref.canvasWidth, ref.canvasHeight);
    };
    img.src = filename;
  }

  /**
   * アニメーションデータ(PCH)を読み込み、再生を開始する。
   * @param {string} filename - アニメーションデータのURL
   * @returns {void}
   */
  loadAnimation(filename) {
    console.log("loadAnimation " + filename);

    this.busy = true;
    //続きを描く画面で動画をスキップする時はbusySkippedをtrueにする
    this.busySkipped = Neo.config.neo_animation_skip == "true";

    const ref = this;
    Neo.getPCH(filename, function (pch) {
      //console.log(pch);
      ref._actionMgr._items = pch.data;
      ref._actionMgr._mark = pch.data.length;
      ref._actionMgr.play();
    });
  }

  /**
   * ブラウザのストレージからレイヤーデータを読み込み、キャンバスを復元する。
   * @param {Function} [callback] - 読み込み完了後に実行するコールバック関数
   * @returns {void}
   */
  loadSession(callback) {
    const ref = this;
    if (Neo.storage) {
      const layerData0 = Neo.storage.getItem("layer0");
      const layerData1 = Neo.storage.getItem("layer1");
      if (!layerData0 || !layerData1) return;

      var img0 = new Image();
      img0.onload = function () {
        var img1 = new Image();
        img1.onload = function () {
          ref.canvasCtx[0].clearRect(0, 0, ref.canvasWidth, ref.canvasHeight);
          ref.canvasCtx[1].clearRect(0, 0, ref.canvasWidth, ref.canvasHeight);
          ref.canvasCtx[0].drawImage(img0, 0, 0);
          ref.canvasCtx[1].drawImage(img1, 0, 0);
          ref.updateDestCanvas(0, 0, ref.canvasWidth, ref.canvasHeight);

          if (callback) callback();
        };
        img1.src = layerData1;
      };
      img0.src = layerData0;
    }
  }

  /**
   * 現在のキャンバス状態（レイヤー0, 1）をブラウザのストレージに保存する。
   * @returns {void}
   */
  saveSession() {
    if (Neo.storage) {
      Neo.storage.setItem("timestamp", String(Date.now()));
      Neo.storage.setItem("layer0", this.canvas[0].toDataURL("image/png"));
      Neo.storage.setItem("layer1", this.canvas[1].toDataURL("image/png"));
    }
  }

  /**
   * ブラウザのストレージから保存済みのセッションデータを削除する。
   * @returns {void}
   */
  clearSession() {
    if (Neo.storage) {
      Neo.storage.removeItem("timestamp");
      Neo.storage.removeItem("layer0");
      Neo.storage.removeItem("layer1");
    }
  }
  /**
   * RGBの各色成分の値を比較し、小さい順にインデックス（0:R, 1:G, 2:B）を並べ替えて返す。
   * @param {number} r0 - 赤成分
   * @param {number} g0 - 緑成分
   * @param {number} b0 - 青成分
   * @returns {number[]} [最小値のインデックス, 中間値のインデックス, 最大値のインデックス]
   */
  sortColor(r0, g0, b0) {
    var min = r0 < g0 ? (r0 < b0 ? 0 : 2) : g0 < b0 ? 1 : 2;
    var max = r0 > g0 ? (r0 > b0 ? 0 : 2) : g0 > b0 ? 1 : 2;
    var mid = min + max == 1 ? 2 : min + max == 2 ? 1 : 0;
    return [min, mid, max];
  }

  /**
   * 指定レイヤーにテキストを描画する。
   * 一時キャンバスでテキストを描画後、ピクセル単位で色変換・アルファ合成を行いメインへ転写する。
   * @param {number} layer - 描画対象レイヤー番号
   * @param {number} x - 描画X座標
   * @param {number} y - 描画Y座標
   * @param {number} color - RGB色コード
   * @param {number} alpha - 不透明度 (0.0~1.0)
   * @param {string} string - 描画するテキスト
   * @param {string} fontSize - フォントサイズ
   * @param {string} fontFamily - フォントファミリー
   */
  doText(layer, x, y, color, alpha, string, fontSize, fontFamily) {
    //テキスト描画
    if (string.length <= 0) return;

    //描画位置がずれるので適当に調整
    var offset = parseInt(fontSize, 10);
    var ctx = this.tempCanvasCtx;
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.save();
    ctx.translate(x, y);
    ctx.font = fontSize + " " + fontFamily;

    ctx.fillStyle = "#000000";
    ctx.fillText(string, 0, 0);
    ctx.restore();

    // 適当に二値化
    const r = color & 0xff;
    const g = (color & 0xff00) >> 8;
    const b = (color & 0xff0000) >> 16;
    const a = Math.round(alpha * 255.0);

    const imageData = ctx.getImageData(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight,
    );
    const buf32 = new Uint32Array(imageData.data.buffer);
    const buf8 = new Uint8ClampedArray(imageData.data.buffer);
    const length = this.canvasWidth * this.canvasHeight;
    let index = 0;
    for (var i = 0; i < length; i++) {
      if (buf8[index + 3] >= 0x60) {
        buf8[index + 0] = r;
        buf8[index + 1] = g;
        buf8[index + 2] = b;
        buf8[index + 3] = a;
      } else {
        buf8[index + 0] = 0;
        buf8[index + 1] = 0;
        buf8[index + 2] = 0;
        buf8[index + 3] = 0;
      }
      index += 4;
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);

    //キャンバスに貼り付け
    ctx = this.canvasCtx[layer];
    ctx.globalAlpha = 1.0;
    ctx.drawImage(
      this.tempCanvas,
      0,
      0,
      this.canvasWidth,
      this.canvasHeight,
      0,
      0,
      this.canvasWidth,
      this.canvasHeight,
    );

    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Bzで操作中かどうか
   * @returns {boolean} - Bzで操作中ならtrueが返る
   */
  isUIPaused() {
    if (this.drawType == Neo.Painter.DRAWTYPE_BEZIER) {
      if (this.tool.step && this.tool.step > 0) {
        return true;
      }
    }
    return false;
  }

  getEmulationMode() {
    return parseFloat(Neo.config.neo_emulation_mode || 2.22);
  }

  /*
   -------------------------------------------------------------------------
   Recorder Test
   -------------------------------------------------------------------------
 */

  play() {
    if (this._actionMgr) {
      this._actionMgr.clearCanvas();
      this.prevLine = null;

      //console.log('[play]');

      this._actionMgr._head = 0;
      this._actionMgr._index = 0;
      this._actionMgr._mark = this._actionMgr._items.length;
      this._actionMgr._pause = false;
      this._actionMgr.play();
    }
  }

  onrewind() {
    if (this._actionMgr) {
      this._actionMgr.clearCanvas();
      this._actionMgr._head = 0;
      this._actionMgr._index = 0;
      this.prevLine = null;
    }
    if (Neo.viewerBar) Neo.viewerBar.update();
    if (!this._actionMgr._pause) {
      this._actionMgr.play();
    }
  }

  onmark() {
    if (Neo.viewerBar) Neo.viewerBar.update();
    if (!this._actionMgr._pause) {
      if (this._actionMgr._head > this._actionMgr._mark) {
        this.onrewind();
      } else {
        this.onplay();
      }
    }
  }

  onplay() {
    Neo.viewerPlay?.setSelected(true);
    Neo.viewerStop?.setSelected(false);

    this._actionMgr._pause = false;
    this._actionMgr.play();
  }

  onstop() {
    Neo.viewerPlay?.setSelected(false);
    Neo.viewerStop?.setSelected(true);
    this._actionMgr._pause = true;
  }

  onspeed() {
    var mgr = this._actionMgr;
    var mode = mgr.speedMode();
    Neo.speed = mgr._speedTable[(mode + 1) % 4];
  }
  /**
   * @param {number[]} item
   */
  setCurrent(item) {
    var color = this._currentColor;
    var mask = this._currentMask;
    var width = this._currentWidth;
    var type = this._currentMaskType;

    item.push(color[0], color[1], color[2], color[3]);
    item.push(mask[0], mask[1], mask[2]);
    item.push(width);
    item.push(type);
  }

  /**
   * @param {number[]} item
   */
  getCurrent(item) {
    this._currentColor = [item[2], item[3], item[4], item[5]];
    this._currentMask = [item[6], item[7], item[8]];
    this._currentWidth = item[9];
    this._currentMaskType = item[10];
  }

  isDirty() {
    return this.dirty;
  }
};

/**
 * キャンバスの状態を保持するUndo/Redo用のクラス
 */
Neo.UndoItem = class {
  /**
   * @param {ImageData[]} [data]
   * @param {number} [x]
   * @param {number} [y]
   * @param {number} [width]
   * @param {number} [height]
   */
  constructor(data = [], x = 0, y = 0, width = 0, height = 0) {
    this.data = data;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
};

/*
   -------------------------------------------------------------------------
   Data Cache for Undo / Redo
   -------------------------------------------------------------------------
 */

/**
 * Undo/Redo履歴を管理するマネージャー。
 * @description
 * 描画操作のスナップショット（Neo.UndoItem）をスタックとして保持する。
 * 最大ステップ数（_maxStep）を設定することで、メモリの肥大化を抑制しつつ
 * ユーザーの操作履歴を安全に管理する。
 */
Neo.UndoManager = class {
  /**
   * @param {number} _maxStep - 最大ステップ数。これを超えると古い履歴が削除される。
   */
  constructor(_maxStep) {
    this._maxStep = _maxStep;
    /** @type {Neo.UndoItem[]} */
    this._undoItems = [];
    /** @type {Neo.UndoItem[]} */
    this._redoItems = [];
  }

  /**
   * 新しい操作履歴（UndoItem）を登録し、履歴を管理する。
   * @description
   * 1. 新しい状態をスタックに積む。
   * 2. 最大ステップ数を超えた場合、最も古い履歴を削除してメモリを解放する。
   * 3. 新しい操作が行われた場合、それ以降の「やり直し（Redo）」履歴をクリアし、
   * 操作の分岐点を明確にする。
   * @param {Neo.UndoItem} undoItem - 保存するキャンバスの状態データ
   * @param {boolean} holdRedo - Redo履歴を保持するかどうか
   */
  pushUndo(undoItem, holdRedo) {
    this._undoItems.push(undoItem);

    if (this._undoItems.length > this._maxStep) {
      this._undoItems.shift();
    }

    if (!holdRedo == true) {
      this._redoItems = [];
    }
  }

  popUndo() {
    return this._undoItems.pop();
  }

  /**
   * やり直し（Redo）の履歴をスタックに追加する。
   * @description
   * Undo操作によってスタックから取り出された状態を Redo 履歴に保存して
   * Undoした状態からRedoできるようにする。
   * @param {Neo.UndoItem} undoItem - 保存するキャンバスの状態データ
   */
  pushRedo(undoItem) {
    this._redoItems.push(undoItem);
  }

  popRedo() {
    return this._redoItems.pop();
  }
};
/**
 * カラーピッカーで色をセット
 * @param {string} color - <input type="color">で取得した色
 */
Neo.setColor = function (color) {
  Neo.painter.setColor(color); //色をセット
  var colorTip = Neo.ColorTip.getCurrent();
  if (colorTip) {
    //カラーチップに色をセット
    colorTip.setColor(color);
  }
};
// デバッグ用: コンソールから状態を確認できるようにする
/** @ts-ignore */
window["__neodebug"] = () => {
  console.log({
    tool: Neo.painter.tool,
    isMouseDown: Neo.painter.isMouseDown,
    isMouseDownRight: Neo.painter.isMouseDownRight,
    isSpaceDown: Neo.painter.isSpaceDown,
    isCtrlDown: Neo.painter.isCtrlDown,
    isShiftDown: Neo.painter.isShiftDown,
    isAltDown: Neo.painter.isAltDown,
    isBezierActive: Neo.painter.isBezierActive,
    isCopyActive: Neo.painter.isCopyActive,
    busy: Neo.painter.busy,
    touchlength: Neo.painter.touchlength,
    hasFocus: document.hasFocus(),
    activeElement: document.activeElement?.tagName,
  });
};
