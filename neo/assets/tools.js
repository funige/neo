'use strict';

Neo.ToolBase = function() {};

Neo.ToolBase.prototype.startX;
Neo.ToolBase.prototype.startY;
Neo.ToolBase.prototype.init = function(oe) {}
Neo.ToolBase.prototype.kill = function(oe) {}
Neo.ToolBase.prototype.lineType = Neo.Painter.LINETYPE_NONE;

Neo.ToolBase.prototype.downHandler = function(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
};

Neo.ToolBase.prototype.upHandler = function(oe) {
};

Neo.ToolBase.prototype.moveHandler = function(oe) {
};

Neo.ToolBase.prototype.transformForZoom = function(oe) {
    var ctx = oe.destCanvasCtx;
    ctx.translate(oe.canvasWidth * 0.5, oe.canvasHeight * 0.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
};

Neo.ToolBase.prototype.getType = function() {
    return this.type;
};

Neo.ToolBase.prototype.getToolButton = function() {
    switch (this.type) {
    case Neo.Painter.TOOLTYPE_PEN:
    case Neo.Painter.TOOLTYPE_BRUSH:
    case Neo.Painter.TOOLTYPE_TEXT:
        return Neo.penTip;

    case Neo.Painter.TOOLTYPE_TONE:
    case Neo.Painter.TOOLTYPE_BLUR:
    case Neo.Painter.TOOLTYPE_DODGE:
    case Neo.Painter.TOOLTYPE_BURN:
        return Neo.pen2Tip;

    case Neo.Painter.TOOLTYPE_RECT:
    case Neo.Painter.TOOLTYPE_RECTFILL:
    case Neo.Painter.TOOLTYPE_ELLIPSE:
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.effectTip;

    case Neo.Painter.TOOLTYPE_COPY:
    case Neo.Painter.TOOLTYPE_MERGE:
    case Neo.Painter.TOOLTYPE_BLURRECT:
    case Neo.Painter.TOOLTYPE_FLIP_H:
    case Neo.Painter.TOOLTYPE_FLIP_V:
    case Neo.Painter.TOOLTYPE_TURN:
        return Neo.effect2Tip;

    case Neo.Painter.TOOLTYPE_ERASER:
    case Neo.Painter.TOOLTYPE_ERASEALL:
    case Neo.Painter.TOOLTYPE_ERASERECT:
        return Neo.eraserTip;

    case Neo.Painter.TOOLTYPE_FILL:
        return Neo.fillButton;
    }
    return null;
};

Neo.ToolBase.prototype.getReserve = function() {
    switch (this.type) {
    case Neo.Painter.TOOLTYPE_ERASER:
        return Neo.reserveEraser;

    case Neo.Painter.TOOLTYPE_PEN:
    case Neo.Painter.TOOLTYPE_BRUSH:
    case Neo.Painter.TOOLTYPE_TONE:
    case Neo.Painter.TOOLTYPE_ERASERECT:
    case Neo.Painter.TOOLTYPE_ERASEALL:
    case Neo.Painter.TOOLTYPE_COPY:
    case Neo.Painter.TOOLTYPE_MERGE:
    case Neo.Painter.TOOLTYPE_FIP_H:
    case Neo.Painter.TOOLTYPE_FIP_V:

    case Neo.Painter.TOOLTYPE_DODGE:
    case Neo.Painter.TOOLTYPE_BURN:
    case Neo.Painter.TOOLTYPE_BLUR:
    case Neo.Painter.TOOLTYPE_BLURRECT:

    case Neo.Painter.TOOLTYPE_TEXT:
    case Neo.Painter.TOOLTYPE_TURN:
    case Neo.Painter.TOOLTYPE_RECT:
    case Neo.Painter.TOOLTYPE_RECTFILL:
    case Neo.Painter.TOOLTYPE_ELLIPSE:
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.reservePen;

    }
    return null;
};

Neo.ToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.updateUI();
    }
};

Neo.ToolBase.prototype.saveStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        reserve.size = Neo.painter.lineWidth;
    }
};

/*
  -------------------------------------------------------------------------
    DrawToolBase（描画ツールのベースクラス）
  -------------------------------------------------------------------------
*/

Neo.DrawToolBase = function() {};
Neo.DrawToolBase.prototype = new Neo.ToolBase();
Neo.DrawToolBase.prototype.isUpMove = false;
Neo.DrawToolBase.prototype.step = 0;

Neo.DrawToolBase.prototype.init = function() {
    this.step = 0;
    this.isUpMove = true;
};

Neo.DrawToolBase.prototype.downHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandDownHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineDownHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierDownHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.upHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineUpHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierUpHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.moveHandler = function(oe) { 
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierMoveHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.upMoveHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineUpMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierUpMoveHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.keyDownHandler = function(e) {
    switch (Neo.painter.drawType) {
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierKeyDownHandler(e); break;
    }
};

Neo.DrawToolBase.prototype.rollOverHandler= function(oe) {};
Neo.DrawToolBase.prototype.rollOutHandler= function(oe) {
    if (!oe.isMouseDown && !oe.isMouseDownRight){
        oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
        oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
    }
};

Neo.DrawToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 1.0;
        Neo.updateUI();
    };
};


/* FreeHand (手書き) */

Neo.DrawToolBase.prototype.freeHandDownHandler = function(oe) {
    //Register undo first;
    oe._pushUndo();

    oe.prepareDrawing();
    this.isUpMove = false;
    var ctx = oe.canvasCtx[oe.current];
    if (oe.alpha >= 1 || this.lineType != Neo.Painter.LINETYPE_BRUSH) {
        var x0 = Math.floor(oe.mouseX);
        var y0 = Math.floor(oe.mouseY);
        oe._actionMgr.freeHand(x0, y0, this.lineType);
//      oe.drawLine(ctx, x0, y0, x0, y0, this.lineType);
    }

    if (oe.cursorRect) {
        var rect = oe.cursorRect;
        oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
        oe.cursorRect = null;
    }

    if (oe.alpha >= 1) {
        var r = Math.ceil(oe.lineWidth / 2);
        var rect = oe.getBound(oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, r);
        oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
    }
};

Neo.DrawToolBase.prototype.freeHandUpHandler = function(oe) {
    oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);

    if (oe.cursorRect) {
        var rect = oe.cursorRect;
        oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
        oe.cursorRect = null;
    }

    //  oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
    //  this.drawCursor(oe);
    oe.prevLine = null;
};

Neo.DrawToolBase.prototype.freeHandMoveHandler = function(oe) {
    var ctx = oe.canvasCtx[oe.current];
    var x0 = Math.floor(oe.mouseX);
    var y0 = Math.floor(oe.mouseY);
    var x1 = Math.floor(oe.prevMouseX);
    var y1 = Math.floor(oe.prevMouseY);
//  oe.drawLine(ctx, x0, y0, x1, y1, this.lineType);
    oe._actionMgr.freeHandMove(x0, y0, x1, y1, this.lineType);

    if (oe.cursorRect) {
        var rect = oe.cursorRect;
        oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
        oe.cursorRect = null;
    }

    var r = Math.ceil(oe.lineWidth / 2);
    var rect = oe.getBound(oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY, r);
    oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
};

Neo.DrawToolBase.prototype.freeHandUpMoveHandler = function(oe) {
    this.isUpMove = true;

    if (oe.cursorRect) {
        var rect = oe.cursorRect;
        oe.updateDestCanvas(rect[0], rect[1], rect[2], rect[3], true);
        oe.cursorRect = null;
    }
    this.drawCursor(oe);
};

Neo.DrawToolBase.prototype.drawCursor = function(oe) {
    if (oe.lineWidth <= 8) return;
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var d = oe.lineWidth;

    var x = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var r = d * 0.5 * oe.zoom;

    if (!(x > -r &&
          y > -r &&
          x < oe.destCanvas.width + r &&
          y < oe.destCanvas.height + r)) return;

    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var c = (this.type == Neo.Painter.TOOLTYPE_ERASER) ? 0x0000ff : 0xffff7f;
    oe.drawXOREllipse(ctx, x-r, y-r, r*2, r*2, false, c);

    ctx.restore();
    oe.cursorRect = oe.getBound(mx, my, mx, my, Math.ceil(d / 2));
}


/* Line (直線) */

Neo.DrawToolBase.prototype.lineDownHandler = function(oe) {
    this.isUpMove = false;
    this.startX = Math.floor(oe.mouseX);
    this.startY = Math.floor(oe.mouseY);
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
};

Neo.DrawToolBase.prototype.lineUpHandler = function(oe) {
    if (this.isUpMove == false) {
        this.isUpMove = true;

        oe._pushUndo();
        oe.prepareDrawing();
        var x0 = Math.floor(oe.mouseX);
        var y0 = Math.floor(oe.mouseY);
        oe._actionMgr.line(x0, y0, this.startX, this.startY, this.lineType)
        
        /*
        var ctx = oe.canvasCtx[oe.current];
        var x0 = Math.floor(oe.mouseX);
        var y0 = Math.floor(oe.mouseY);
        oe.drawLine(ctx, x0, y0, this.startX, this.startY, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        */
    }
};

Neo.DrawToolBase.prototype.lineMoveHandler = function(oe) {
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawLineCursor(oe);
};

Neo.DrawToolBase.prototype.lineUpMoveHandler = function(oe) {
};

Neo.DrawToolBase.prototype.drawLineCursor = function(oe, mx, my) {
    if (!mx) mx = Math.floor(oe.mouseX);
    if (!my) my = Math.floor(oe.mouseY);
    var nx = this.startX;
    var ny = this.startY;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var x0 = (mx +.499 - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y0 = (my +.499 - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var x1 = (nx +.499 - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y1 = (ny +.499 - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    oe.drawXORLine(ctx, x0, y0, x1, y1);

    ctx.restore();
};


/* Bezier (BZ曲線) */

Neo.DrawToolBase.prototype.bezierDownHandler = function(oe) {
    this.isUpMove = false;

    if (this.step == 0) {
        this.startX = this.x0 = Math.floor(oe.mouseX);
        this.startY = this.y0 = Math.floor(oe.mouseY);
    }
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
};

Neo.DrawToolBase.prototype.bezierUpHandler = function(oe) {
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
        oe._actionMgr.bezier(this.x0, this.y0,this.x1, this.y1,
                               this.x2, this.y2, this.x3, this.y3, this.lineType);
        oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
        
        /*oe.drawBezier(oe.canvasCtx[oe.current],
                      this.x0, this.y0, this.x1, this.y1,
                      this.x2, this.y2, this.x3, this.y3, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);*/

        this.step = 0;
        break;

    default:
        this.step = 0;
        break;
    }
};

Neo.DrawToolBase.prototype.bezierMoveHandler = function(oe) {
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
};

Neo.DrawToolBase.prototype.bezierUpMoveHandler = function(oe) {
    this.bezierMoveHandler(oe);
};

Neo.DrawToolBase.prototype.bezierKeyDownHandler = function(e) {
    if (e.keyCode == 27) { //Escでキャンセル
        this.step = 0;

        var oe = Neo.painter;
        oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
};


Neo.DrawToolBase.prototype.drawBezierCursor1 = function(oe) {
    var ctx = oe.destCanvasCtx;
    //  var x = oe.mouseX; //Math.floor(oe.mouseX);
    //  var y = oe.mouseY; //Math.floor(oe.mouseY);
    var stab = oe.getStabilized();
    var x = Math.floor(stab[0]);
    var y = Math.floor(stab[1]);
    var p = oe.getDestCanvasPosition(x, y, false, true);
    var p0 = oe.getDestCanvasPosition(this.x0, this.y0, false, true);
    var p3 = oe.getDestCanvasPosition(this.x3, this.y3, false, true);

    // handle
    oe.drawXORLine(ctx, p0.x, p0.y, p.x, p.y);
    oe.drawXOREllipse(ctx, p.x - 4, p.y - 4, 8, 8);
    oe.drawXOREllipse(ctx, p0.x - 4, p0.y - 4, 8, 8);

    // preview
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.drawBezier(oe.tempCanvasCtx,
                  this.x0, this.y0,
                  x, y,
                  x, y,
                  this.x3, this.y3, this.lineType);

    ctx.save();
    ctx.translate(oe.destCanvas.width*.5, oe.destCanvas.height*.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
    ctx.drawImage(oe.tempCanvas,
                  0, 0, oe.canvasWidth, oe.canvasHeight,
                  0, 0, oe.canvasWidth, oe.canvasHeight);

    ctx.restore();
};

Neo.DrawToolBase.prototype.drawBezierCursor2 = function(oe) {
    var ctx = oe.destCanvasCtx;
    //  var x = oe.mouseX; //Math.floor(oe.mouseX);
    //  var y = oe.mouseY; //Math.floor(oe.mouseY);
    var stab = oe.getStabilized();
    var x = Math.floor(stab[0]);
    var y = Math.floor(stab[1]);
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
    oe.drawBezier(oe.tempCanvasCtx,
                  this.x0, this.y0,
                  this.x1, this.y1,
                  x, y,
                  this.x3, this.y3, this.lineType);

    ctx.save();
    ctx.translate(oe.destCanvas.width*.5, oe.destCanvas.height*.5);
    ctx.scale(oe.zoom, oe.zoom);
    ctx.translate(-oe.zoomX, -oe.zoomY);
    ctx.drawImage(oe.tempCanvas,
                  0, 0, oe.canvasWidth, oe.canvasHeight,
                  0, 0, oe.canvasWidth, oe.canvasHeight);
    ctx.restore();
};

/*
  -------------------------------------------------------------------------
    Pen（鉛筆）
  -------------------------------------------------------------------------
*/

Neo.PenTool = function() {};
Neo.PenTool.prototype = new Neo.DrawToolBase();
Neo.PenTool.prototype.type = Neo.Painter.TOOLTYPE_PEN;
Neo.PenTool.prototype.lineType = Neo.Painter.LINETYPE_PEN;

Neo.PenTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 1.0;
        Neo.updateUI();
    };
}

/*
  -------------------------------------------------------------------------
    Brush（水彩）
  -------------------------------------------------------------------------
*/

Neo.BrushTool = function() {};
Neo.BrushTool.prototype = new Neo.DrawToolBase();
Neo.BrushTool.prototype.type = Neo.Painter.TOOLTYPE_BRUSH;
Neo.BrushTool.prototype.lineType = Neo.Painter.LINETYPE_BRUSH;

Neo.BrushTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = this.getAlpha();
        Neo.updateUI();
    }
};

Neo.BrushTool.prototype.getAlpha = function() {
    var alpha = 241 - Math.floor(Neo.painter.lineWidth / 2) * 6;
    return alpha / 255.0;
};

/*
  -------------------------------------------------------------------------
    Tone（トーン）
  -------------------------------------------------------------------------
*/

Neo.ToneTool = function() {};
Neo.ToneTool.prototype = new Neo.DrawToolBase();
Neo.ToneTool.prototype.type = Neo.Painter.TOOLTYPE_TONE;
Neo.ToneTool.prototype.lineType = Neo.Painter.LINETYPE_TONE;

Neo.ToneTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 23 / 255.0;
        Neo.updateUI();
    }
};

/*
  -------------------------------------------------------------------------
    Eraser（消しペン）
  -------------------------------------------------------------------------
*/

Neo.EraserTool = function() {};
Neo.EraserTool.prototype = new Neo.DrawToolBase();
Neo.EraserTool.prototype.type = Neo.Painter.TOOLTYPE_ERASER;
Neo.EraserTool.prototype.lineType = Neo.Painter.LINETYPE_ERASER;


/*
  -------------------------------------------------------------------------
    Blur（ぼかし）
  -------------------------------------------------------------------------
*/

Neo.BlurTool = function() {};
Neo.BlurTool.prototype = new Neo.DrawToolBase();
Neo.BlurTool.prototype.type = Neo.Painter.TOOLTYPE_BLUR;
Neo.BlurTool.prototype.lineType = Neo.Painter.LINETYPE_BLUR;

Neo.BlurTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 128 / 255.0;
        Neo.updateUI();
    }
};

/*
  -------------------------------------------------------------------------
    Dodge（覆い焼き）
  -------------------------------------------------------------------------
*/

Neo.DodgeTool = function() {};
Neo.DodgeTool.prototype = new Neo.DrawToolBase();
Neo.DodgeTool.prototype.type = Neo.Painter.TOOLTYPE_DODGE;
Neo.DodgeTool.prototype.lineType = Neo.Painter.LINETYPE_DODGE;

Neo.DodgeTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 128 / 255.0;
        Neo.updateUI();
    }
};

/*
  -------------------------------------------------------------------------
    Burn（焼き込み）
  -------------------------------------------------------------------------
*/

Neo.BurnTool = function() {};
Neo.BurnTool.prototype = new Neo.DrawToolBase();
Neo.BurnTool.prototype.type = Neo.Painter.TOOLTYPE_BURN;
Neo.BurnTool.prototype.lineType = Neo.Painter.LINETYPE_BURN;

Neo.BurnTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 128 / 255.0;
        Neo.updateUI();
    }
};

/*
  -------------------------------------------------------------------------
    Hand（スクロール）
  -------------------------------------------------------------------------
*/

Neo.HandTool = function() {};
Neo.HandTool.prototype = new Neo.ToolBase();
Neo.HandTool.prototype.type = Neo.Painter.TOOLTYPE_HAND;
Neo.HandTool.prototype.isUpMove = false;
Neo.HandTool.prototype.reverse = false;

Neo.HandTool.prototype.downHandler = function(oe) {
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

    this.isDrag = true;
    this.startX = oe.rawMouseX;
    this.startY = oe.rawMouseY;
};

Neo.HandTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();
};

Neo.HandTool.prototype.moveHandler = function(oe) { 
    if (this.isDrag) {
        var dx = this.startX - oe.rawMouseX;
        var dy = this.startY - oe.rawMouseY;

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

        this.startX = oe.rawMouseX;
        this.startY = oe.rawMouseY;
    }
};

Neo.HandTool.prototype.upMoveHandler = function(oe) {}
Neo.HandTool.prototype.rollOverHandler= function(oe) {}
Neo.HandTool.prototype.rollOutHandler= function(oe) {};

/*
  -------------------------------------------------------------------------
    Slider（色やサイズのスライダを操作している時）
  -------------------------------------------------------------------------
*/

Neo.SliderTool = function() {};
Neo.SliderTool.prototype = new Neo.ToolBase();
Neo.SliderTool.prototype.type = Neo.Painter.TOOLTYPE_SLIDER;
Neo.SliderTool.prototype.isUpMove = false;
Neo.SliderTool.prototype.alt = false;

Neo.SliderTool.prototype.downHandler = function(oe) {
    if (!oe.isShiftDown) this.isDrag = true;
    
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var rect = this.target.getBoundingClientRect();
    var sliderType = (this.alt) ? Neo.SLIDERTYPE_SIZE : this.target['data-slider'];
    Neo.sliders[sliderType].downHandler(oe.rawMouseX - rect.left, 
                                        oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();

    var rect = this.target.getBoundingClientRect();
    var sliderType = (this.alt) ? Neo.SLIDERTYPE_SIZE : this.target['data-slider'];
    Neo.sliders[sliderType].upHandler(oe.rawMouseX - rect.left, 
                                      oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.moveHandler = function(oe) {   
    if (this.isDrag) {
        var rect = this.target.getBoundingClientRect();
        var sliderType = (this.alt) ? Neo.SLIDERTYPE_SIZE : this.target['data-slider'];
        Neo.sliders[sliderType].moveHandler(oe.rawMouseX - rect.left, 
                                            oe.rawMouseY - rect.top);
    }
};

Neo.SliderTool.prototype.upMoveHandler = function(oe) {}
Neo.SliderTool.prototype.rollOverHandler= function(oe) {}
Neo.SliderTool.prototype.rollOutHandler= function(oe) {}

/*
  -------------------------------------------------------------------------
    Fill（塗り潰し）
  -------------------------------------------------------------------------
*/

Neo.FillTool = function() {};
Neo.FillTool.prototype = new Neo.ToolBase();
Neo.FillTool.prototype.type = Neo.Painter.TOOLTYPE_FILL;
Neo.FillTool.prototype.isUpMove = false;

Neo.FillTool.prototype.downHandler = function(oe) {
    var x = Math.floor(oe.mouseX);
    var y = Math.floor(oe.mouseY);
    var layer = oe.current;
    var color = oe.getColor();
    
    oe._pushUndo();
    oe._actionMgr.floodFill(layer, x, y, color);
    //oe.doFloodFill(layer, x, y, color);
};

Neo.FillTool.prototype.upHandler = function(oe) {
};

Neo.FillTool.prototype.moveHandler = function(oe) { 
};

Neo.FillTool.prototype.rollOutHandler= function(oe) {};
Neo.FillTool.prototype.upMoveHandler = function(oe) {}
Neo.FillTool.prototype.rollOverHandler= function(oe) {}


/*
  -------------------------------------------------------------------------
    EraseAll（全消し）
  -------------------------------------------------------------------------
*/

Neo.EraseAllTool = function() {};
Neo.EraseAllTool.prototype = new Neo.ToolBase();
Neo.EraseAllTool.prototype.type = Neo.Painter.TOOLTYPE_ERASEALL;
Neo.EraseAllTool.prototype.isUpMove = false;

Neo.EraseAllTool.prototype.downHandler = function(oe) {
    oe._pushUndo();
    oe._actionMgr.eraseAll();
    
    /*oe.prepareDrawing();
    oe.canvasCtx[oe.current].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);*/
};

Neo.EraseAllTool.prototype.upHandler = function(oe) {
};

Neo.EraseAllTool.prototype.moveHandler = function(oe) { 
};

Neo.EraseAllTool.prototype.rollOutHandler= function(oe) {};
Neo.EraseAllTool.prototype.upMoveHandler = function(oe) {};
Neo.EraseAllTool.prototype.rollOverHandler= function(oe) {};


/*
  -------------------------------------------------------------------------
    EffectToolBase（エフェックトツールのベースクラス）
  -------------------------------------------------------------------------
*/

Neo.EffectToolBase = function() {};
Neo.EffectToolBase.prototype = new Neo.ToolBase();
Neo.EffectToolBase.prototype.isUpMove = false;

Neo.EffectToolBase.prototype.downHandler = function(oe) {
    this.isUpMove = false;

    this.startX = this.endX = oe.clipMouseX;
    this.startY = this.endY = oe.clipMouseY;
};

Neo.EffectToolBase.prototype.upHandler = function(oe) {
    if (this.isUpMove) return;
    this.isUpMove = true;

    this.startX = Math.floor(this.startX);
    this.startY = Math.floor(this.startY);
    this.endX = Math.floor(this.endX);
    this.endY = Math.floor(this.endY);

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
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
    
    if (oe.tool.type != Neo.Painter.TOOLTYPE_PASTE) {
        oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
    }
};

Neo.EffectToolBase.prototype.moveHandler = function(oe) {
    this.endX = oe.clipMouseX;
    this.endY = oe.clipMouseY;

    oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
};

Neo.EffectToolBase.prototype.rollOutHandler= function(oe) {};
Neo.EffectToolBase.prototype.upMoveHandler = function(oe) {};
Neo.EffectToolBase.prototype.rollOverHandler= function(oe) {};

Neo.EffectToolBase.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasPosition(this.startX, this.startY, true);
    var end = oe.getDestCanvasPosition(this.endX, this.endY, true);

    var x = (start.x < end.x) ? start.x : end.x;
    var y = (start.y < end.y) ? start.y : end.y;
    var width = Math.abs(start.x - end.x) + oe.zoom;
    var height = Math.abs(start.y - end.y) + oe.zoom;

    if (this.isEllipse) {
        oe.drawXOREllipse(ctx, x, y, width, height, this.isFill);

    } else {
        oe.drawXORRect(ctx, x, y, width, height, this.isFill);
    }
    ctx.restore();
};

Neo.EffectToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = this.defaultAlpha || 1.0;
        Neo.updateUI();
    };
};

/*
  -------------------------------------------------------------------------
    EraseRect（消し四角）
  -------------------------------------------------------------------------
*/

Neo.EraseRectTool = function() {};
Neo.EraseRectTool.prototype = new Neo.EffectToolBase();
Neo.EraseRectTool.prototype.type = Neo.Painter.TOOLTYPE_ERASERECT;

Neo.EraseRectTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.eraseRect(ctx, x, y, width, height);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.eraseRect2(x, y, width, height);
};

/*
  -------------------------------------------------------------------------
    FlipH（左右反転）
  -------------------------------------------------------------------------
*/

Neo.FlipHTool = function() {};
Neo.FlipHTool.prototype = new Neo.EffectToolBase();
Neo.FlipHTool.prototype.type = Neo.Painter.TOOLTYPE_FLIP_H;

Neo.FlipHTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.flipH(ctx, x, y, width, height);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.flipH(x, y, width, height);
};

/*
  -------------------------------------------------------------------------
    FlipV（上下反転）
  -------------------------------------------------------------------------
*/

Neo.FlipVTool = function() {};
Neo.FlipVTool.prototype = new Neo.EffectToolBase();
Neo.FlipVTool.prototype.type = Neo.Painter.TOOLTYPE_FLIP_V;

Neo.FlipVTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.flipV(ctx, x, y, width, height);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.flipV(x, y, width, height);
};

/*
  -------------------------------------------------------------------------
    DodgeRect（角取り）
  -------------------------------------------------------------------------
*/

Neo.BlurRectTool = function() {};
Neo.BlurRectTool.prototype = new Neo.EffectToolBase();
Neo.BlurRectTool.prototype.type = Neo.Painter.TOOLTYPE_BLURRECT;

Neo.BlurRectTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.blurRect(ctx, x, y, width, height);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.blurRect(x, y, width, height);
};

Neo.BlurRectTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 0.5;
        Neo.updateUI();
    };
}

/*
  -------------------------------------------------------------------------
    Turn（傾け）
  -------------------------------------------------------------------------
*/

Neo.TurnTool = function() {};
Neo.TurnTool.prototype = new Neo.EffectToolBase();
Neo.TurnTool.prototype.type = Neo.Painter.TOOLTYPE_TURN;

Neo.TurnTool.prototype.upHandler = function(oe) {
    this.isUpMove = true;

    this.startX = Math.floor(this.startX);
    this.startY = Math.floor(this.startY);
    this.endX = Math.floor(this.endX);
    this.endY = Math.floor(this.endY);

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX) + 1;
    var height = Math.abs(this.startY - this.endY) + 1;

    if (width > 0 && height > 0) {
        oe._pushUndo();
//      oe.turn(x, y, width, height);
//      oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        oe._actionMgr.turn(x, y, width, height);
    }
};

/*
  -------------------------------------------------------------------------
    Merge（レイヤー結合）
  -------------------------------------------------------------------------
*/

Neo.MergeTool = function() {};
Neo.MergeTool.prototype = new Neo.EffectToolBase();
Neo.MergeTool.prototype.type = Neo.Painter.TOOLTYPE_MERGE;

Neo.MergeTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.merge(ctx, x, y, width, height);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.merge(x, y, width, height);
};

/*
  -------------------------------------------------------------------------
    Copy（コピー）
  -------------------------------------------------------------------------
*/

Neo.CopyTool = function() {};
Neo.CopyTool.prototype = new Neo.EffectToolBase();
Neo.CopyTool.prototype.type = Neo.Painter.TOOLTYPE_COPY;

Neo.CopyTool.prototype.doEffect = function(oe, x, y, width, height) {
//  oe.copy(oe.current, x, y, width, height);
    oe._actionMgr.copy(x, y, width, height);
    oe.setToolByType(Neo.Painter.TOOLTYPE_PASTE);
    oe.tool.x = x;
    oe.tool.y = y;
    oe.tool.width = width;
    oe.tool.height = height;
};

/*
  -------------------------------------------------------------------------
    Paste（ペースト）
  -------------------------------------------------------------------------
*/

Neo.PasteTool = function() {};
Neo.PasteTool.prototype = new Neo.ToolBase();
Neo.PasteTool.prototype.type = Neo.Painter.TOOLTYPE_PASTE;

Neo.PasteTool.prototype.downHandler = function(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
    this.drawCursor(oe);
};

Neo.PasteTool.prototype.upHandler = function(oe) {
    oe._pushUndo();

    var dx = oe.tempX;
    var dy = oe.tempY;
//  oe.paste(oe.current, this.x, this.y, this.width, this.height, dx, dy);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.paste(this.x, this.y, this.width, this.height, dx, dy);

    oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
};

Neo.PasteTool.prototype.moveHandler = function(oe) {
    var dx = Math.floor(oe.mouseX - this.startX);
    var dy = Math.floor(oe.mouseY - this.startY);
    oe.tempX = dx;
    oe.tempY = dy;

    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    //  this.drawCursor(oe);
};

Neo.PasteTool.prototype.keyDownHandler = function(e) {
    if (e.keyCode == 27) { //Escでキャンセル
        var oe = Neo.painter;
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
    }
};

Neo.PasteTool.prototype.kill = function() {
    var oe = Neo.painter;
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
};
    

Neo.PasteTool.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasPosition(this.x, this.y, true);
    var end = oe.getDestCanvasPosition(this.x + this.width, this.y + this.height, true);

    var x = start.x + oe.tempX * oe.zoom;
    var y = start.y + oe.tempY * oe.zoom;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);
    oe.drawXORRect(ctx, x, y, width, height);
    ctx.restore();
};

/*
  -------------------------------------------------------------------------
    Rect（線四角）
  -------------------------------------------------------------------------
*/

Neo.RectTool = function() {};
Neo.RectTool.prototype = new Neo.EffectToolBase();
Neo.RectTool.prototype.type = Neo.Painter.TOOLTYPE_RECT;

Neo.RectTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.doFill(ctx, x, y, width, height, this.type); //oe.rectMask);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
};

/*
  -------------------------------------------------------------------------
    RectFill（四角）
  -------------------------------------------------------------------------
*/

Neo.RectFillTool = function() {};
Neo.RectFillTool.prototype = new Neo.EffectToolBase();
Neo.RectFillTool.prototype.type = Neo.Painter.TOOLTYPE_RECTFILL;

Neo.RectFillTool.prototype.isFill = true;
Neo.RectFillTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.doFill(ctx, x, y, width, height, this.type); //oe.rectFillMask);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
};

/*
  -------------------------------------------------------------------------
    Ellipse（線楕円）
  -------------------------------------------------------------------------
*/

Neo.EllipseTool = function() {};
Neo.EllipseTool.prototype = new Neo.EffectToolBase();
Neo.EllipseTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSE;
Neo.EllipseTool.prototype.isEllipse = true;
Neo.EllipseTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.doFill(ctx, x, y, width, height, this.type); //oe.ellipseMask);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
};

/*
  -------------------------------------------------------------------------
    EllipseFill（楕円）
  -------------------------------------------------------------------------
*/

Neo.EllipseFillTool = function() {};
Neo.EllipseFillTool.prototype = new Neo.EffectToolBase();
Neo.EllipseFillTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSEFILL;
Neo.EllipseFillTool.prototype.isEllipse = true;
Neo.EllipseFillTool.prototype.isFill = true;
Neo.EllipseFillTool.prototype.doEffect = function(oe, x, y, width, height) {
//  var ctx = oe.canvasCtx[oe.current];
//  oe.doFill(ctx, x, y, width, height, this.type); //oe.ellipseFillMask);
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    oe._actionMgr.fill(x, y, width, height, this.type);
};

/*
  -------------------------------------------------------------------------
    Text（テキスト）
  -------------------------------------------------------------------------
*/

Neo.TextTool = function() {};
Neo.TextTool.prototype = new Neo.ToolBase();
Neo.TextTool.prototype.type = Neo.Painter.TOOLTYPE_TEXT;
Neo.TextTool.prototype.isUpMove = false;

Neo.TextTool.prototype.downHandler = function(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;

    if (Neo.painter.inputText) {
        Neo.painter.updateInputText();

        var rect = oe.container.getBoundingClientRect();
        var text = Neo.painter.inputText;
        var x = oe.rawMouseX - rect.left - 5;
        var y = oe.rawMouseY - rect.top - 5;

        text.style.left = x + "px";
        text.style.top = y + "px";
        text.style.display = "block";
        text.focus();
    }
};

Neo.TextTool.prototype.upHandler = function(oe) {
};

Neo.TextTool.prototype.moveHandler = function(oe) {};
Neo.TextTool.prototype.upMoveHandler = function(oe) {};
Neo.TextTool.prototype.rollOverHandler= function(oe) {};
Neo.TextTool.prototype.rollOutHandler= function(oe) {};

Neo.TextTool.prototype.keyDownHandler = function(e) {
    if (e.keyCode == 13) { // Returnで確定
        e.preventDefault();

        var oe = Neo.painter;
        var text = oe.inputText;

        if (text) {
            oe._pushUndo();
            //this.drawText(oe);
            //oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

            var string = text.textContent || text.innerText;
            var size = text.style.fontSize;
            var family = text.style.fontFamily || "Arial";
            var layer = oe.current;
            var color = oe.getColor();
            var alpha = oe.alpha;
            var x = this.startX;
            var y = this.startY;
            //oe.doText(layer, this.startX, this.startY, color, string, size, family);
            oe._actionMgr.text(this.startX, this.startY,
                               color, alpha, string, size, family);

            text.style.display = "none";
            text.blur();
        }
    }
};

Neo.TextTool.prototype.kill = function(oe) {
    Neo.painter.hideInputText();
};

/*
Neo.TextTool.prototype.drawText = function(oe) {
    var text = oe.inputText;

    var string = text.textContent || text.innerText;
    var size = text.style.fontSize;
    var family = text.style.fontFamily || "Arial";
    var layer = oe.current;
    var color = oe.getColor();
    var alpha = oe.alpha;
    var x = this.startX;
    var y = this.startY;
    //oe.doText(layer, this.startX, this.startY, color, string, size, family);
    oe._actionMgr.doText(layer, this.startX, this.startY,
                         color, alpha, string, size, family);
};
*/

Neo.TextTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 1.0;
        Neo.updateUI();
    };
};


/*
  -------------------------------------------------------------------------
    Dummy（何もしない時）
  -------------------------------------------------------------------------
*/

Neo.DummyTool = function() {};
Neo.DummyTool.prototype = new Neo.ToolBase();
Neo.DummyTool.prototype.type = Neo.Painter.TOOLTYPE_NONE;
Neo.DummyTool.prototype.isUpMove = false;

Neo.DummyTool.prototype.downHandler = function(oe) {
};

Neo.DummyTool.prototype.upHandler = function(oe) {
    oe.popTool();
};

Neo.DummyTool.prototype.moveHandler = function(oe) {};
Neo.DummyTool.prototype.upMoveHandler = function(oe) {}
Neo.DummyTool.prototype.rollOverHandler= function(oe) {}
Neo.DummyTool.prototype.rollOutHandler= function(oe) {}
