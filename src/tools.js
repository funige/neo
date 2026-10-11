"use strict";
//@ts-check
import { Neo } from "./neo.js";
import { Painter } from "./painter.js";
import { ToolTip, FillButton } from "./widgets.js";

export class ToolBase {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.isDrag = false;
    this.isUpMove = false;
    this.ticking = false;

    this.type = 0;
    this.step = 0;
    this.reverse = false;
    this.lineType = Painter.LINETYPE_NONE;
  }

  /** @param {Painter} oe * */
  init(oe) {}
  kill() {}

  /** @param {Painter} oe * */
  downHandler(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
  }

  /** @param {Painter} oe * */
  upHandler(oe) {}

  /** @param {Painter} oe * */
  moveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {KeyboardEvent} e */
  keyDownHandler(e) {}
  /** @param {KeyboardEvent} e */
  keyUpHandler(e) {}
  cancelBezier() {}
  /** @param {Painter} oe * */
  transformForZoom(oe) {
    var ctx = oe.destCanvasCtx;
    ctx.translate(oe.canvasWidth * 0.5, oe.canvasHeight * 0.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
  }

  getType() {
    return this.type;
  }
  /**
   * @returns {ToolTip|FillButton|null}
   */
  getToolButton() {
    /** @type {Painter} */
    switch (this.type) {
      case Painter.TOOLTYPE_PEN:
      case Painter.TOOLTYPE_BRUSH:
      case Painter.TOOLTYPE_TEXT:
        return Neo.penTip;

      case Painter.TOOLTYPE_TONE:
      case Painter.TOOLTYPE_BLUR:
      case Painter.TOOLTYPE_DODGE:
      case Painter.TOOLTYPE_BURN:
        return Neo.pen2Tip;

      case Painter.TOOLTYPE_RECT:
      case Painter.TOOLTYPE_RECTFILL:
      case Painter.TOOLTYPE_ELLIPSE:
      case Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.effectTip;

      case Painter.TOOLTYPE_COPY:
      case Painter.TOOLTYPE_MERGE:
      case Painter.TOOLTYPE_BLURRECT:
      case Painter.TOOLTYPE_FLIP_H:
      case Painter.TOOLTYPE_FLIP_V:
      case Painter.TOOLTYPE_TURN:
        return Neo.effect2Tip;

      case Painter.TOOLTYPE_ERASER:
      case Painter.TOOLTYPE_ERASEALL:
      case Painter.TOOLTYPE_ERASERECT:
        return Neo.eraserTip;

      case Painter.TOOLTYPE_FILL:
        return Neo.fillButton;
    }
    return null;
  }

  /**
   * Java版PaintBBSの「消しゴムは独立した線の幅を持っています」
   * を再現する。
   *
   * 鉛筆/水彩/トーン/矩形/楕円/コピー/反転など「描画系」に分類される
   * ツールは全て Neo.reservePen を共有し、消しゴムだけは Neo.reserveEraser を
   * 独立して使う。
   *
   * this.type に応じて、上記2つのうちどちらに対応するかを判定し、
   * 共有オブジェクトへの参照そのものを返す(値のコピーではない)。
   * 呼び出し側でプロパティを書き換えると、その変更はグローバルな
   * 保管状態に直接反映される。
   * - loadStates() はこれを「読み取り専用」として使用する
   * - saveStates() はこれに「書き込み」を行うことで、現在の設定を記憶させる
   *
   * @returns {{size:number,color:string,alpha:number,tool:number,drawType:number}|null}
   */
  getReserve() {
    switch (this.type) {
      case Painter.TOOLTYPE_ERASER:
        return Neo.reserveEraser;

      case Painter.TOOLTYPE_PEN:
      case Painter.TOOLTYPE_BRUSH:
      case Painter.TOOLTYPE_TONE:
      case Painter.TOOLTYPE_ERASERECT:
      case Painter.TOOLTYPE_ERASEALL:
      case Painter.TOOLTYPE_COPY:
      case Painter.TOOLTYPE_MERGE:
      case Painter.TOOLTYPE_FLIP_H:
      case Painter.TOOLTYPE_FLIP_V:

      case Painter.TOOLTYPE_DODGE:
      case Painter.TOOLTYPE_BURN:
      case Painter.TOOLTYPE_BLUR:
      case Painter.TOOLTYPE_BLURRECT:

      case Painter.TOOLTYPE_TEXT:
      case Painter.TOOLTYPE_TURN:
      case Painter.TOOLTYPE_RECT:
      case Painter.TOOLTYPE_RECTFILL:
      case Painter.TOOLTYPE_ELLIPSE:
      case Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.reservePen;
    }
    return null;
  }

  //描画系ブラシまたは消しゴムのブラシサイズを取得し更新する
  loadStates() {
    const reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.updateUI();
    }
  }

  //描画系ブラシまたは消しゴムのブラシサイズを保存し上書きする
  saveStates() {
    const reserve = this.getReserve();
    if (reserve) {
      reserve.size = Neo.painter.lineWidth;
    }
  }
}

/*
  -------------------------------------------------------------------------
    DrawToolBase（描画ツールのベースクラス）
  -------------------------------------------------------------------------
*/

export class DrawToolBase extends ToolBase {
  constructor() {
    super();
    this.x0 = 0;
    this.y0 = 0;
    this.x1 = 0;
    this.y1 = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.x3 = 0;
    this.y3 = 0;
    this.isUpMove = false;
    this.step = 0;
    this.startX = 0;
    this.startY = 0;
  }

  init() {
    this.step = 0;
    this.isUpMove = true;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    switch (oe.drawType) {
      case Painter.DRAWTYPE_FREEHAND:
        this.freeHandDownHandler(oe);
        break;
      case Painter.DRAWTYPE_LINE:
        this.lineDownHandler(oe);
        break;
      case Painter.DRAWTYPE_BEZIER:
        this.bezierDownHandler(oe);
        break;
    }
  }

  /** @param {Painter} oe */
  upHandler(oe) {
    switch (oe.drawType) {
      case Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpHandler(oe);
        break;
      case Painter.DRAWTYPE_LINE:
        this.lineUpHandler(oe);
        break;
      case Painter.DRAWTYPE_BEZIER:
        this.bezierUpHandler(oe);
        break;
    }
  }

  /** @param {Painter} oe */
  moveHandler(oe) {
    switch (oe.drawType) {
      case Painter.DRAWTYPE_FREEHAND:
        this.freeHandMoveHandler(oe);
        break;
      case Painter.DRAWTYPE_LINE:
        this.lineMoveHandler(oe);
        break;
      case Painter.DRAWTYPE_BEZIER:
        this.bezierMoveHandler(oe);
        break;
    }
  }

  /** @param {Painter} oe */
  upMoveHandler(oe) {
    switch (oe.drawType) {
      case Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpMoveHandler(oe);
        break;
      case Painter.DRAWTYPE_LINE:
        this.lineUpMoveHandler(oe);
        break;
      case Painter.DRAWTYPE_BEZIER:
        this.bezierUpMoveHandler(oe);
        break;
    }
  }
  /**
   * @param {KeyboardEvent} e
   */
  keyDownHandler(e) {
    switch (Neo.painter.drawType) {
      case Painter.DRAWTYPE_BEZIER:
        //Bz曲線をエスケープキーでキャンセル
        this.bezierKeyDownHandler(e);
        break;
    }
  }

  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {
    if (!oe.isMouseDown && !oe.isMouseDownRight) {
      oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
      // oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 1.0;
      Neo.updateUI();
    }
  }

  /**
   * FreeHand (手書き)
   *  @param {Painter} oe
   * */
  freeHandDownHandler(oe) {
    //Register undo first;
    oe._pushUndo();

    oe.prepareDrawing();
    this.isUpMove = false;
    var ctx = oe.canvasCtx[oe.current];
    if (oe.alpha >= 1 || this.lineType != Painter.LINETYPE_BRUSH) {
      var x0 = Math.floor(oe.mouseX);
      var y0 = Math.floor(oe.mouseY);
      oe._actionMgr.freeHand(x0, y0, this.lineType);
      //      oe.drawLine(ctx, x0, y0, x0, y0, this.lineType);
    }

    if (oe.cursorRect) {
      const rect = oe.cursorRect;
      oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
      oe.cursorRect = null;
    }

    if (oe.alpha >= 1) {
      var r = Math.ceil(oe.lineWidth / 2);
      const rect = oe.getBound(oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, r);
      oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
    }
    if (!Neo.isMobile()) {
      this.drawCursor(oe);
    }
  }

  /** @param {Painter} oe */
  freeHandUpHandler(oe) {
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

    if (oe.cursorRect) {
      var rect = oe.cursorRect;
      oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
      oe.cursorRect = null;
    }
    // if (oe.zoom < 1) {
    //   //縮小時はポインターアップで全体更新
    //   oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    // }
    oe.prevLine = null;
  }

  /** @param {Painter} oe */
  freeHandMoveHandler(oe) {
    var ctx = oe.canvasCtx[oe.current];
    var x0 = Math.floor(oe.mouseX);
    var y0 = Math.floor(oe.mouseY);
    var x1 = Math.floor(oe.prevMouseX);
    var y1 = Math.floor(oe.prevMouseY);
    //  oe.drawLine(ctx, x0, y0, x1, y1, this.lineType);
    oe._actionMgr.freeHandMove(x0, y0, x1, y1, this.lineType);

    if (oe.cursorRect) {
      const rect = oe.cursorRect;
      oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
      oe.cursorRect = null;
    }

    var r = Math.ceil(oe.lineWidth / 2);
    const rect = oe.getBound(
      oe.mouseX,
      oe.mouseY,
      oe.prevMouseX,
      oe.prevMouseY,
      r,
    );
    oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
    if (!Neo.isMobile()) {
      this.drawCursor(oe);
    }
  }

  /** @param {Painter} oe */
  freeHandUpMoveHandler(oe) {
    this.isUpMove = true;

    if (oe.cursorRect) {
      var rect = oe.cursorRect;
      oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
      oe.cursorRect = null;
    }
    //縮小時は円カーソルを非表示 部分更新のグリッチが出るため
    if (oe.zoom < 1) {
      return;
    }
    //円カーソルを表示
    this.drawCursor(oe);
  }

  /** @param {Painter} oe */
  drawCursor(oe) {
    if (oe.zoom < 0.5) {
      //0.2倍時にカーソルのゴミが出るため
      return;
    }
    // if (oe.lineWidth <= 8) return;
    var mx = Math.floor(oe.mouseX);
    var my = Math.floor(oe.mouseY);

    var d = oe.lineWidth;
    d = d == 1 ? 2 : d; //1pxの時は2px相当の円カーソルを表示

    var x = (mx - oe.zoomX + (oe.destCanvas.width * 0.5) / oe.zoom) * oe.zoom;
    var y = (my - oe.zoomY + (oe.destCanvas.height * 0.5) / oe.zoom) * oe.zoom;
    var r = d * 0.5 * oe.zoom;

    if (!(
      x > -r &&
      y > -r &&
      x < oe.destCanvas.width + r &&
      y < oe.destCanvas.height + r
    ))
      return;

    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe);

    /** @type {number} */
    var c = this.type == Painter.TOOLTYPE_ERASER ? 0x0000ff : 0xffff7f;
    oe.drawXOREllipse(ctx, x - r, y - r, r * 2, r * 2, false, c);

    ctx.restore();
    oe.cursorRect = oe.getBound(mx, my, mx, my, Math.ceil(d / 2));
  }

  /**
   * Line (直線)
   *  @param {Painter} oe
   * */
  lineDownHandler(oe) {
    this.isUpMove = false;
    this.startX = Math.floor(oe.mouseX);
    this.startY = Math.floor(oe.mouseY);
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  }

  /** @param {Painter} oe */
  lineUpHandler(oe) {
    if (this.isUpMove == false) {
      this.isUpMove = true;

      oe._pushUndo();
      oe.prepareDrawing();
      var x0 = Math.floor(oe.mouseX);
      var y0 = Math.floor(oe.mouseY);
      oe._actionMgr.line(x0, y0, this.startX, this.startY, this.lineType);

      /*
        var ctx = oe.canvasCtx[oe.current];
        var x0 = Math.floor(oe.mouseX);
        var y0 = Math.floor(oe.mouseY);
        oe.drawLine(ctx, x0, y0, this.startX, this.startY, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        */
    }
  }

  /** @param {Painter} oe */
  lineMoveHandler(oe) {
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawLineCursor(oe);
  }

  /** @param {Painter} oe */
  lineUpMoveHandler(oe) {}

  /**
   *  @param {Painter} oe
   *  @param {number} [mx]
   *  @param {number} [my]
   * */
  drawLineCursor(oe, mx = 0, my = 0) {
    if (!mx) mx = Math.floor(oe.mouseX);
    if (!my) my = Math.floor(oe.mouseY);
    var nx = this.startX;
    var ny = this.startY;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe);

    var x0 =
      (mx + 0.499 - oe.zoomX + (oe.destCanvas.width * 0.5) / oe.zoom) * oe.zoom;
    var y0 =
      (my + 0.499 - oe.zoomY + (oe.destCanvas.height * 0.5) / oe.zoom) *
      oe.zoom;
    var x1 =
      (nx + 0.499 - oe.zoomX + (oe.destCanvas.width * 0.5) / oe.zoom) * oe.zoom;
    var y1 =
      (ny + 0.499 - oe.zoomY + (oe.destCanvas.height * 0.5) / oe.zoom) *
      oe.zoom;
    oe.drawXORLine(ctx, x0, y0, x1, y1);

    ctx.restore();
  }

  /**
   *  Bezier (BZ曲線)
   *  @param {Painter} oe
   * */
  bezierDownHandler(oe) {
    oe.isBezierActive = true;
    this.isUpMove = false;

    if (this.step == 0) {
      this.startX = this.x0 = Math.floor(oe.mouseX);
      this.startY = this.y0 = Math.floor(oe.mouseY);
    }
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  }
  cancelBezier() {
    var oe = Neo.painter;

    this.step = 0;
    oe.isBezierActive = false;

    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
  }

  /** @param {Painter} oe */
  bezierUpHandler(oe) {
    if (this.isUpMove == false) {
      this.isUpMove = true;
    } else return; // 枠外からベジェを開始したときdownを通らずにupが呼ばれてエラーになる

    this.step++;
    switch (this.step) {
      case 1:
        oe.prepareDrawing();
        this.x3 = Math.floor(oe.mouseX);
        this.y3 = Math.floor(oe.mouseY);
        break;

      case 2:
        this.x1 = Math.floor(oe.mouseX);
        this.y1 = Math.floor(oe.mouseY);
        break;

      case 3:
        this.x2 = Math.floor(oe.mouseX);
        this.y2 = Math.floor(oe.mouseY);

        oe._pushUndo();
        oe._actionMgr.bezier(
          this.x0,
          this.y0,
          this.x1,
          this.y1,
          this.x2,
          this.y2,
          this.x3,
          this.y3,
          this.lineType,
        );
        oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

        /*oe.drawBezier(oe.canvasCtx[oe.current],
                      this.x0, this.y0, this.x1, this.y1,
                      this.x2, this.y2, this.x3, this.y3, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);*/

        this.step = 0;
        oe.isBezierActive = false;
        break;

      default:
        this.step = 0;
        oe.isBezierActive = false;
        break;
    }
  }

  /** @param {Painter} oe */
  bezierMoveHandler(oe) {
    switch (this.step) {
      case 0:
        if (!this.isUpMove) {
          oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, false);
          this.drawLineCursor(oe);
        }
        break;
      case 1:
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, false);
        this.drawBezierCursor1(oe);
        break;

      case 2:
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, false);
        this.drawBezierCursor2(oe);
        break;
    }
  }

  /** @param {Painter} oe */
  bezierUpMoveHandler(oe) {
    if (this.step === 3) {
      //Bz確定時はそのままmove
      this.bezierMoveHandler(oe);
      return;
    }

    if (this.ticking) return;
    this.ticking = true;

    setTimeout(() => {
      this.bezierMoveHandler(oe);
      this.ticking = false;
    }, 10);
  }
  /**
   * Bz曲線をエスケープキーでキャンセル
   * @param {KeyboardEvent} e
   */
  bezierKeyDownHandler(e) {
    if (e.key == "Escape") {
      //Escでキャンセル
      this.cancelBezier();
    }
  }

  /** @param {Painter} oe */
  drawBezierCursor1(oe) {
    var ctx = oe.destCanvasCtx;

    var x = oe.mouseX; //Math.floor(oe.mouseX);
    var y = oe.mouseY; //Math.floor(oe.mouseY);
    /*
    var stab = oe.getStabilized();
    var x = Math.floor(stab[0]);
    var y = Math.floor(stab[1]);
    */
    var p = oe.getDestCanvasPosition(x, y, false, true);
    var p0 = oe.getDestCanvasPosition(this.x0, this.y0, false, true);
    var p3 = oe.getDestCanvasPosition(this.x3, this.y3, false, true);

    // handle
    oe.drawXORLine(ctx, p0.x, p0.y, p.x, p.y);
    oe.drawXOREllipse(ctx, p.x - 4, p.y - 4, 8, 8);
    oe.drawXOREllipse(ctx, p0.x - 4, p0.y - 4, 8, 8);

    // preview
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.drawBezier(
      oe.tempCanvasCtx,
      this.x0,
      this.y0,
      x,
      y,
      x,
      y,
      this.x3,
      this.y3,
      Painter.LINETYPE_PEN, //this.lineType,
      false,
      true,
    );
    ctx.save();
    ctx.translate(oe.destCanvas.width * 0.5, oe.destCanvas.height * 0.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
    ctx.drawImage(
      oe.tempCanvas,
      0,
      0,
      oe.canvasWidth,
      oe.canvasHeight,
      0,
      0,
      oe.canvasWidth,
      oe.canvasHeight,
    );

    ctx.restore();
  }

  /** @param {Painter} oe */
  drawBezierCursor2(oe) {
    var ctx = oe.destCanvasCtx;

    var x = oe.mouseX; //Math.floor(oe.mouseX);
    var y = oe.mouseY; //Math.floor(oe.mouseY);
    /*
    var stab = oe.getStabilized();
    var x = Math.floor(stab[0]);
    var y = Math.floor(stab[1]);
    */
    var p = oe.getDestCanvasPosition(oe.mouseX, oe.mouseY, false, true);
    var p0 = oe.getDestCanvasPosition(this.x0, this.y0, false, true);
    var p1 = oe.getDestCanvasPosition(this.x1, this.y1, false, true);
    var p3 = oe.getDestCanvasPosition(this.x3, this.y3, false, true);

    // handle
    oe.drawXORLine(ctx, p3.x, p3.y, p.x, p.y);
    oe.drawXOREllipse(ctx, p.x - 4, p.y - 4, 8, 8);
    oe.drawXORLine(ctx, p0.x, p0.y, p1.x, p1.y);
    oe.drawXOREllipse(ctx, p1.x - 4, p1.y - 4, 8, 8);
    oe.drawXOREllipse(ctx, p0.x - 4, p0.y - 4, 8, 8);

    // preview
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.drawBezier(
      oe.tempCanvasCtx,
      this.x0,
      this.y0,
      this.x1,
      this.y1,
      x,
      y,
      this.x3,
      this.y3,
      Painter.LINETYPE_PEN, //this.lineType,
      false,
      true,
    );
    ctx.save();
    ctx.translate(oe.destCanvas.width * 0.5, oe.destCanvas.height * 0.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
    ctx.drawImage(
      oe.tempCanvas,
      0,
      0,
      oe.canvasWidth,
      oe.canvasHeight,
      0,
      0,
      oe.canvasWidth,
      oe.canvasHeight,
    );
    ctx.restore();
  }
}

/*
  -------------------------------------------------------------------------
    Pen（鉛筆）
  -------------------------------------------------------------------------
*/

export class PenTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_PEN;
    this.lineType = Painter.LINETYPE_PEN;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 1.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Brush（水彩）
  -------------------------------------------------------------------------
*/

export class BrushTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_BRUSH;
    this.lineType = Painter.LINETYPE_BRUSH;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = this.getAlpha();
      Neo.updateUI();
    }
  }

  getAlpha() {
    var alpha = 241 - Math.floor(Neo.painter.lineWidth / 2) * 6;
    return alpha / 255.0;
  }
}

/*
  -------------------------------------------------------------------------
    Tone（トーン）
  -------------------------------------------------------------------------
*/

export class ToneTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_TONE;
    this.lineType = Painter.LINETYPE_TONE;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 23 / 255.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Eraser（消しペン）
  -------------------------------------------------------------------------
*/

export class EraserTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_ERASER;
    this.lineType = Painter.LINETYPE_ERASER;
  }
}

/*
  -------------------------------------------------------------------------
    Blur（ぼかし）
  -------------------------------------------------------------------------
*/

export class BlurTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_BLUR;
    this.lineType = Painter.LINETYPE_BLUR;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 128 / 255.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Dodge（覆い焼き）
  -------------------------------------------------------------------------
*/

export class DodgeTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_DODGE;
    this.lineType = Painter.LINETYPE_DODGE;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 128 / 255.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Burn（焼き込み）
  -------------------------------------------------------------------------
*/

export class BurnTool extends DrawToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_BURN;
    this.lineType = Painter.LINETYPE_BURN;
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 128 / 255.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Hand（スクロール）
  -------------------------------------------------------------------------
*/

export class HandTool extends ToolBase {
  constructor() {
    super();
    this.latestX = 0;
    this.latestY = 0;
    this.startX = 0;
    this.startY = 0;
    /** @type {number} */
    this.type = Painter.TOOLTYPE_HAND;
    this.isUpMove = false;
    this.reverse = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

    this.isDrag = true;
    this.ticking = false;
    this.startX = oe.rawMouseX;
    this.startY = oe.rawMouseY;
  }

  /** @param {Painter} oe */
  upHandler(oe) {
    this.isDrag = false;
    oe.popTool();
  }

  /** @param {Painter} oe */
  moveHandler(oe) {
    if (!this.isDrag) return;

    this.latestX = oe.rawMouseX;
    this.latestY = oe.rawMouseY;

    if (this.ticking) return;

    this.ticking = true;

    requestAnimationFrame(() => {
      var dx = this.startX - this.latestX;
      var dy = this.startY - this.latestY;

      var ax = oe.destCanvas.width / (oe.canvasWidth * oe.zoom);
      var ay = oe.destCanvas.height / (oe.canvasHeight * oe.zoom);
      var barWidth = oe.destCanvas.width * ax;
      var barHeight = oe.destCanvas.height * ay;
      var scrollWidthInScreen = oe.destCanvas.width - barWidth - 2;
      var scrollHeightInScreen = oe.destCanvas.height - barHeight - 2;

      dx *= oe.scrollWidth / scrollWidthInScreen;
      dy *= oe.scrollHeight / scrollHeightInScreen;

      if (this.reverse) {
        dx *= -1;
        dy *= -1;
      }

      oe.setZoomPosition(oe.zoomX - dx, oe.zoomY - dy);

      this.startX = this.latestX;
      this.startY = this.latestY;

      this.ticking = false;
    });
  }
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
}

/*
  -------------------------------------------------------------------------
    Slider（色やサイズのスライダを操作している時）
  -------------------------------------------------------------------------
*/

export class SliderTool extends ToolBase {
  constructor() {
    super();
    this.target = /**@type {any} **/ (null);
    /** @type {number} */
    this.type = Painter.TOOLTYPE_SLIDER;
    this.isUpMove = false;
    this.isAlt = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    if (!oe.isShiftDown) this.isDrag = true;

    if (!oe.isCopyActive) {
      oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
    if (!this.target) {
      console.error("SliderTool: Target element not found");
      return;
    }
    const rect = this.target.getBoundingClientRect();
    const sliderType = this.isAlt
      ? Neo.SLIDERTYPE_SIZE
      : this.target["data-slider"];
    Neo.sliders[sliderType].downHandler(
      oe.rawMouseX - rect.left,
      oe.rawMouseY - rect.top,
    );
  }

  /** @param {Painter} oe */
  upHandler(oe) {
    this.isDrag = false;
    oe.popTool();

    if (!this.target) {
      console.error("SliderTool: Target element not found");
      return;
    }

    const rect = this.target.getBoundingClientRect();
    const sliderType = this.isAlt
      ? Neo.SLIDERTYPE_SIZE
      : this.target["data-slider"];
    Neo.sliders[sliderType].upHandler(
      oe.rawMouseX - rect.left,
      oe.rawMouseY - rect.top,
    );
  }

  /** @param {Painter} oe */
  moveHandler(oe) {
    if (this.isDrag) {
      if (!this.target) {
        console.error("SliderTool: Target element not found");
        return;
      }

      const rect = this.target.getBoundingClientRect();
      const sliderType = this.isAlt
        ? Neo.SLIDERTYPE_SIZE
        : this.target["data-slider"];
      Neo.sliders[sliderType].moveHandler(
        oe.rawMouseX - rect.left,
        oe.rawMouseY - rect.top,
      );
    }
  }

  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
}

/*
  -------------------------------------------------------------------------
    Fill（塗り潰し）
  -------------------------------------------------------------------------
*/

export class FillTool extends ToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_FILL;
    this.isUpMove = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    var x = Math.floor(oe.mouseX);
    var y = Math.floor(oe.mouseY);
    var layer = oe.current;
    var color = oe.getColor();

    oe._pushUndo();
    oe._actionMgr.floodFill(layer, x, y, color);
    //oe.doFloodFill(layer, x, y, color);
  }

  /** @param {Painter} oe */
  upHandler(oe) {}

  /** @param {Painter} oe */
  moveHandler(oe) {}

  /** @param {Painter} oe */
  rollOutHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
}

/*
  -------------------------------------------------------------------------
    EraseAll（全消し）
  -------------------------------------------------------------------------
*/

export class EraseAllTool extends ToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_ERASEALL;
    this.isUpMove = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    oe._pushUndo();
    oe._actionMgr.eraseAll();

    /*oe.prepareDrawing();
    oe.canvasCtx[oe.current].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);*/
  }

  /** @param {Painter} oe */
  upHandler(oe) {}
  /** @param {Painter} oe */
  moveHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
}

/*
  -------------------------------------------------------------------------
    EffectToolBase（エフェックトツールのベースクラス）
  -------------------------------------------------------------------------
*/

export class EffectToolBase extends ToolBase {
  constructor() {
    super();
    this.startX = 0;
    this.startY = 0;
    this.latestX = 0;
    this.latestY = 0;
    this.isUpMove = false;
    this.isEllipse = false;
    this.isFill = false;
    this.endX = 0;
    this.endY = 0;
    this.ticking = false;
    this.defaultAlpha = 0;
  }
  /**
   * @param {Painter} oe
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  doEffect(oe, x, y, width, height) {}

  /** @param {Painter} oe */
  downHandler(oe) {
    this.isUpMove = false;
    this.ticking = false;

    this.startX = this.endX = oe.clipMouseX;
    this.startY = this.endY = oe.clipMouseY;
  }

  /** @param {Painter} oe */
  upHandler(oe) {
    if (this.isUpMove) return;
    this.isUpMove = true;

    this.startX = Math.floor(this.startX);
    this.startY = Math.floor(this.startY);
    this.endX = Math.floor(this.endX);
    this.endY = Math.floor(this.endY);

    var x = this.startX < this.endX ? this.startX : this.endX;
    var y = this.startY < this.endY ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX) + 1;
    var height = Math.abs(this.startY - this.endY) + 1;
    var ctx = oe.canvasCtx[oe.current];

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > oe.canvasWidth) width = oe.canvasWidth - x;
    if (y + height > oe.canvasHeight) height = oe.canvasHeight - y;

    if (width > 0 && height > 0) {
      oe._pushUndo();
      oe.prepareDrawing();
      this.doEffect(oe, x, y, width, height);
    }

    if (Neo.CurrentToolType != Painter.TOOLTYPE_PASTE) {
      setTimeout(() => {
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
      }, 10);
    }
  }

  /** @param {Painter} oe */
  moveHandler(oe) {
    this.latestX = oe.clipMouseX;
    this.latestY = oe.clipMouseY;

    if (this.ticking) return;
    this.ticking = true;

    requestAnimationFrame(() => {
      this.endX = this.latestX;
      this.endY = this.latestY;

      //ペーストの時はカーソルを描画しない
      if (oe.tool.type != Painter.TOOLTYPE_PASTE) {
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        this.drawCursor(oe);
      }
      this.ticking = false;
    });
  }
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  drawCursor(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasPosition(this.startX, this.startY, true);
    var end = oe.getDestCanvasPosition(this.endX, this.endY, true);

    var x = start.x < end.x ? start.x : end.x;
    var y = start.y < end.y ? start.y : end.y;
    var width = Math.abs(start.x - end.x) + oe.zoom;
    var height = Math.abs(start.y - end.y) + oe.zoom;

    if (this.isEllipse) {
      oe.drawXOREllipse(ctx, x, y, width, height, this.isFill);
    } else {
      oe.drawXORRect(ctx, x, y, width, height, this.isFill);
    }
    ctx.restore();
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = this.defaultAlpha || 1.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    EraseRect（消し四角）
  -------------------------------------------------------------------------
*/

export class EraseRectTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_ERASERECT;
  }

  /**
   * 矩形消去ツールの実行
   * @description
   * @param {Painter} oe - PaintBBS NEOのメインインスタンス (Neo.painter)
   * @param {number} x - 開始X座標
   * @param {number} y - 開始Y座標
   * @param {number} width - 消去する幅
   * @param {number} height - 消去する高さ
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.eraseRect(ctx, x, y, width, height);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.eraseRect2(x, y, width, height);
  }
}

/*
  -------------------------------------------------------------------------
    FlipH（左右反転）
  -------------------------------------------------------------------------
*/

export class FlipHTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_FLIP_H;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.flipH(ctx, x, y, width, height);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.flipH(x, y, width, height);
  }
}

/*
  -------------------------------------------------------------------------
    FlipV（上下反転）
  -------------------------------------------------------------------------
*/

export class FlipVTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_FLIP_V;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.flipV(ctx, x, y, width, height);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.flipV(x, y, width, height);
  }
}

/*
  -------------------------------------------------------------------------
    DodgeRect（角取り）
  -------------------------------------------------------------------------
*/

export class BlurRectTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_BLURRECT;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.blurRect(ctx, x, y, width, height);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.blurRect(x, y, width, height);
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 0.5;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Turn（傾け）
  -------------------------------------------------------------------------
*/

export class TurnTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_TURN;
  }

  /** @param {Painter} oe */
  doEffect(oe) {
    this.isUpMove = true;

    this.startX = Math.floor(this.startX);
    this.startY = Math.floor(this.startY);
    this.endX = Math.floor(this.endX);
    this.endY = Math.floor(this.endY);

    if (this.startX >= oe.canvasWidth) this.startX = oe.canvasWidth - 1;
    if (this.endX >= oe.canvasWidth) this.endX = oe.canvasWidth - 1;
    if (this.startY >= oe.canvasHeight) this.startY = oe.canvasHeight - 1;
    if (this.endY >= oe.canvasHeight) this.endY = oe.canvasHeight - 1;

    var x = this.startX < this.endX ? this.startX : this.endX;
    var y = this.startY < this.endY ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX) + 1;
    var height = Math.abs(this.startY - this.endY) + 1;

    if (width > 0 && height > 0) {
      oe._pushUndo();
      //      oe.turn(x, y, width, height);
      //      oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
      oe._actionMgr.turn(x, y, width, height);
    }
    setTimeout(() => {
      oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }, 10);
  }
}

/*
  -------------------------------------------------------------------------
    Merge（レイヤー結合）
  -------------------------------------------------------------------------
*/

export class MergeTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_MERGE;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.merge(ctx, x, y, width, height);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.merge(x, y, width, height);
  }
}

/*
  -------------------------------------------------------------------------
    Copy（コピー）
  -------------------------------------------------------------------------
*/

export class CopyTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_COPY;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    oe.isCopyActive = true;
    //  oe.copy(oe.current, x, y, width, height);
    oe._actionMgr.copy(x, y, width, height);
    oe.setToolByType(Painter.TOOLTYPE_PASTE); // ツールをPasteToolに切り替える
    if (oe.pasteTool) {
      oe.pasteTool.x = x; // 切り替わったインスタンスに座標を設定
      oe.pasteTool.y = y;
      oe.pasteTool.width = width;
      oe.pasteTool.height = height;
    }
  }
}

/*
  -------------------------------------------------------------------------
    Paste（ペースト）
  -------------------------------------------------------------------------
*/

export class PasteTool extends ToolBase {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.startX = 0;
    this.startY = 0;
    this.latestDX = 0;
    this.latestDY = 0;
    /** @type {number} */
    this.type = Painter.TOOLTYPE_PASTE;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    this.ticking = false;
    oe.isCopyActive = false;
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
    this.drawCursor(oe);
  }

  /** @param {Painter} oe */
  upHandler(oe) {
    oe._pushUndo();

    var dx = oe.tempX;
    var dy = oe.tempY;
    //  oe.paste(oe.current, this.x, this.y, this.width, this.height, dx, dy);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.paste(this.x, this.y, this.width, this.height, dx, dy);

    oe.setToolByType(Painter.TOOLTYPE_COPY);
  }

  /** @param {Painter} oe */
  moveHandler(oe) {
    var dx = Math.floor(oe.mouseX - this.startX);
    var dy = Math.floor(oe.mouseY - this.startY);

    this.latestDX = dx;
    this.latestDY = dy;

    if (this.ticking) return;
    this.ticking = true;

    requestAnimationFrame(() => {
      oe.tempX = this.latestDX;
      oe.tempY = this.latestDY;
      oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
      //  this.drawCursor(oe);
      this.ticking = false;
    });
  }
  /**
   * コピーアンドペーストをエスケープキーでキャンセル
   * @param {KeyboardEvent} e
   */
  keyDownHandler(e) {
    var oe = Neo.painter;

    if (e.key == "Escape") {
      //Escでキャンセル
      oe.cancelCopy();
    }
  }

  kill() {
    var oe = Neo.painter;
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  }

  /** @param {Painter} oe */
  drawCursor(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasPosition(this.x, this.y, true);
    var end = oe.getDestCanvasPosition(
      this.x + this.width,
      this.y + this.height,
      true,
    );

    var x = start.x + oe.tempX * oe.zoom;
    var y = start.y + oe.tempY * oe.zoom;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);
    oe.drawXORRect(ctx, x, y, width, height);
    ctx.restore();
  }
}

/*
  -------------------------------------------------------------------------
    Rect（線四角）
  -------------------------------------------------------------------------
*/

export class RectTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_RECT;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   * @returns {void}
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.doFill(ctx, x, y, width, height, this.type); //oe.rectMask);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
  }
}

/*
  -------------------------------------------------------------------------
    RectFill（四角）
  -------------------------------------------------------------------------
*/

export class RectFillTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_RECTFILL;
    this.isFill = true;
  }
  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.doFill(ctx, x, y, width, height, this.type); //oe.rectFillMask);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
  }
}

/*
  -------------------------------------------------------------------------
    Ellipse（線楕円）
  -------------------------------------------------------------------------
*/

export class EllipseTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_ELLIPSE;
    this.isEllipse = true;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.doFill(ctx, x, y, width, height, this.type); //oe.ellipseMask);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
  }
}

/*
  -------------------------------------------------------------------------
    EllipseFill（楕円）
  -------------------------------------------------------------------------
*/

export class EllipseFillTool extends EffectToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_ELLIPSEFILL;
    this.isEllipse = true;
    this.isFill = true;
  }

  /**
   * @param {Painter} oe
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   *
   */
  doEffect(oe, x, y, width, height) {
    //  var ctx = oe.canvasCtx[oe.current];
    //  oe.doFill(ctx, x, y, width, height, this.type); //oe.ellipseFillMask);
    //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
  }
}

/*
  -------------------------------------------------------------------------
    Text（テキスト）
  -------------------------------------------------------------------------
*/

export class TextTool extends ToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_TEXT;
    this.isUpMove = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;

    if (Neo.painter.inputText) {
      Neo.painter.updateInputText();

      var rect = oe.container?.getBoundingClientRect();
      if (!rect) {
        console.error("Rect not found for TextTool");
        return;
      }
      var text = Neo.painter.inputText;
      var x = oe.rawMouseX - rect.left - 5;
      var y = oe.rawMouseY - rect.top - 5;

      text.style.left = x + "px";
      text.style.top = y + "px";
      text.style.display = "block";
      text.focus();
    }
  }

  /** @param {Painter} oe */
  upHandler(oe) {}
  /** @param {Painter} oe */
  moveHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}

  /**
   * テキスト入力の確定処理
   * @description
   * ユーザーがテキスト入力中にEnterキーを押した際、
   * 入力された内容をキャンバスに描画し、入力UIを終了する。
   * @param {KeyboardEvent} e - キーボードイベント
   */
  keyDownHandler(e) {
    if (e.key == "Enter") {
      // Returnで確定
      e.preventDefault();

      const oe = Neo.painter;
      /** @type {HTMLElement|null} **/
      const text = oe.inputText;

      if (text) {
        oe._pushUndo();
        //this.drawText(oe);
        //oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        /** @type {string} **/
        const string = text.textContent || text.innerText;
        /** @type {string} **/
        const size = text.style.fontSize;
        /** @type {string} **/
        const family = text.style.fontFamily || "Arial";
        /** @type {number} **/
        const color = oe.getColor();
        /** @type {number} **/
        const alpha = oe.alpha;
        // const layer = oe.current;
        // const x = this.startX;
        // const y = this.startY;
        //oe.doText(layer, this.startX, this.startY, color, string, size, family);
        oe._actionMgr.text(
          this.startX,
          this.startY,
          color,
          alpha,
          string,
          size,
          family,
        );

        text.style.display = "none";
        text.blur();
      }
    }
  }

  kill() {
    Neo.painter.hideInputText();
  }

  loadStates() {
    var reserve = this.getReserve();
    if (reserve) {
      Neo.painter.lineWidth = reserve.size;
      Neo.painter.alpha = 1.0;
      Neo.updateUI();
    }
  }
}

/*
  -------------------------------------------------------------------------
    Dummy（何もしない時）
  -------------------------------------------------------------------------
*/

export class DummyTool extends ToolBase {
  constructor() {
    super();
    /** @type {number} */
    this.type = Painter.TOOLTYPE_NONE;
    this.isUpMove = false;
  }

  /** @param {Painter} oe */
  downHandler(oe) {}
  /** @param {Painter} oe */
  upHandler(oe) {
    oe.popTool();
  }
  /** @param {Painter} oe */
  moveHandler(oe) {}
  /** @param {Painter} oe */
  upMoveHandler(oe) {}
  /** @param {Painter} oe */
  rollOverHandler(oe) {}
  /** @param {Painter} oe */
  rollOutHandler(oe) {}
}
