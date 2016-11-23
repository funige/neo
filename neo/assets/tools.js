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
    case Neo.Painter.TOOLTYPE_ERASERALL:
    case Neo.Painter.TOOLTYPE_ERASERRECT:
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
    case Neo.Painter.TOOLTYPE_ERASERRECT:
    case Neo.Painter.TOOLTYPE_ERASERALL:
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

	if (oe.alpha >= 1) {
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, this.lineType);
    }

//	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    var r = Math.ceil(this.lineWidth / 2);
    var left = Math.round(oe.mouseX) - r;
    var top = Math.round(oe.mouseY) - r;
	oe.updateDestCanvas(left, top, r*2, r*2, true);
};

Neo.DrawToolBase.prototype.freeHandUpHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);

    oe.prevLine = null;
};

Neo.DrawToolBase.prototype.freeHandMoveHandler = function(oe) {
	var ctx = oe.canvasCtx[oe.current];
	oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY, this.lineType);
//  oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
    var r = Math.ceil(Neo.painter.lineWidth / 2);
    var left = Math.round((oe.mouseX < oe.prevMouseX) ? oe.mouseX : oe.prevMouseX)-r;
    var top = Math.round((oe.mouseY < oe.prevMouseY) ? oe.mouseY: oe.prevMouseY)-r;
    var width = Math.abs(oe.mouseX - oe.prevMouseX);
    var height = Math.abs(oe.mouseY - oe.prevMouseY);
	oe.updateDestCanvas(left, top, width + r*2, height + r*2, true);
};

Neo.DrawToolBase.prototype.freeHandUpMoveHandler = function(oe) {
    this.isUpMove = true;
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
};

Neo.DrawToolBase.prototype.drawCursor = function(oe) {
    if (oe.lineWidth <= 8) return;
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var d = oe.lineWidth;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var x = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var r = d * 0.5 * oe.zoom;

    var c = (this.type == Neo.Painter.TOOLTYPE_ERASER) ? 0x0000ff : 0xffff7f;
    oe.drawXOREllipse(ctx, x-r, y-r, r*2, r*2, false, c);

    ctx.restore();
}


/* Line (直線) */

Neo.DrawToolBase.prototype.lineDownHandler = function(oe) {
    this.isUpMove = false;
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
};

Neo.DrawToolBase.prototype.lineUpHandler = function(oe) {
    if (this.isUpMove == false) {
        this.isUpMove = true;

        oe._pushUndo();
        oe.prepareDrawing();
        var ctx = oe.canvasCtx[oe.current];
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, this.startX, this.startY, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
};

Neo.DrawToolBase.prototype.lineMoveHandler = function(oe) {
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawLineCursor(oe);
};

Neo.DrawToolBase.prototype.lineUpMoveHandler = function(oe) {
};

Neo.DrawToolBase.prototype.drawLineCursor = function(oe) {
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var nx = this.startX;
    var ny = this.startY;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var x0 = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y0 = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var x1 = (nx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y1 = (ny - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    oe.drawXORLine(ctx, x0, y0, x1, y1);

    ctx.restore();
};


/* Bezier (BZ曲線) */

Neo.DrawToolBase.prototype.bezierDownHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierUpHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierMoveHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierUpMoveHandler = function(oe) {};

Neo.DrawToolBase.prototype.drawBezierCursor = function(oe) {};


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

Neo.HandTool.prototype.rollOutHandler= function(oe) {};
Neo.HandTool.prototype.upMoveHandler = function(oe) {}
Neo.HandTool.prototype.rollOverHandler= function(oe) {}

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
	this.isDrag = true;
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var rect = this.target.getBoundingClientRect();
    var sliderType = this.target['data-slider'];
    Neo.sliders[sliderType].downHandler(oe.rawMouseX - rect.left, 
                                        oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();

    var rect = this.target.getBoundingClientRect();
    var sliderType = this.target['data-slider'];
    Neo.sliders[sliderType].upHandler(oe.rawMouseX - rect.left, 
                                      oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.moveHandler = function(oe) {	
    if (this.isDrag) {
        var rect = this.target.getBoundingClientRect();
        var sliderType = this.target['data-slider'];
        Neo.sliders[sliderType].moveHandler(oe.rawMouseX - rect.left, 
                                            oe.rawMouseY - rect.top);
    }
};

Neo.SliderTool.prototype.upMoveHandler = function(oe) {}
Neo.SliderTool.prototype.rollOutHandler= function(oe) {};
Neo.SliderTool.prototype.rollOverHandler= function(oe) {}

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
    oe._pushUndo();
    oe.fill(oe.mouseX, oe.mouseY, oe.canvasCtx[oe.current]);
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

    oe.prepareDrawing();
	oe.canvasCtx[oe.current].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    this.isUpMove = true;

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX);
    var height = Math.abs(this.startY - this.endY);
    var ctx = oe.canvasCtx[oe.current];

    if (width > 0 && height > 0) {
        oe._pushUndo();
        oe.prepareDrawing();

//      console.log(x + "," + y + "," + width + "," + height);
        this.doEffect(oe, x, y, width, height);
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

    var start = oe.getDestCanvasMousePosition(this.startX, this.startY, true);
    var end = oe.getDestCanvasMousePosition(this.endX, this.endY, true);

    var x = (start.x < end.x) ? start.x : end.x;
    var y = (start.y < end.y) ? start.y : end.y;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);

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
}

/*
-------------------------------------------------------------------------
	EraseRect（消し四角）
-------------------------------------------------------------------------
*/

Neo.EraseRectTool = function() {};
Neo.EraseRectTool.prototype = new Neo.EffectToolBase();
Neo.EraseRectTool.prototype.type = Neo.Painter.TOOLTYPE_ERASERECT;

Neo.EraseRectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.eraseRect(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    var ctx = oe.canvasCtx[oe.current];
    oe.flipH(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    var ctx = oe.canvasCtx[oe.current];
    oe.flipV(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	BlurRect（角取り）
-------------------------------------------------------------------------
*/

Neo.BlurRectTool = function() {};
Neo.BlurRectTool.prototype = new Neo.EffectToolBase();
Neo.BlurRectTool.prototype.type = Neo.Painter.TOOLTYPE_BLURRECT;

Neo.BlurRectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.blurRect(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.BlurRectTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 0.5;
        Neo.updateUI();
        console.log("blurrect...");
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

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX);
    var height = Math.abs(this.startY - this.endY);

    if (width > 0 && height > 0) {
        oe._pushUndo();
        oe.turn(x, y, width, height);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    var ctx = oe.canvasCtx[oe.current];
    oe.merge(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    oe.copy(x, y, width, height);
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

    oe.paste(this.x, this.y, this.width, this.height);
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
};

Neo.PasteTool.prototype.moveHandler = function(oe) {
    var dx = oe.mouseX - this.startX;
    var dy = oe.mouseY - this.startY;
    oe.tempX = dx;
    oe.tempY = dy;

	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
};

Neo.PasteTool.prototype.keyDownHandler = function(e) {
    if (e.keyCode == 27) { //Escでキャンセル
        var oe = Neo.painter;
	    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
    }
};

Neo.PasteTool.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

  var start = oe.getDestCanvasMousePosition(this.x, this.y, true);
    var end = oe.getDestCanvasMousePosition(this.x + this.width, this.y + this.height, true);

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
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.rectMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.rectFillMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	Ellipse（線楕円）
-------------------------------------------------------------------------
*/

Neo.EllipseTool = function() {};
Neo.EllipseTool.prototype = new Neo.EffectToolBase();
Neo.EllipseTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSE;
//Neo.EllipseTool.prototype.isUpMove = false;
Neo.EllipseTool.prototype.isEllipse = true;
Neo.EllipseTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.ellipseMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	EllipseFill（楕円）
-------------------------------------------------------------------------
*/

Neo.EllipseFillTool = function() {};
Neo.EllipseFillTool.prototype = new Neo.EffectToolBase();
Neo.EllipseFillTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSEFILL;
//Neo.EllipseFillTool.prototype.isUpMove = false;
Neo.EllipseFillTool.prototype.isEllipse = true;
Neo.EllipseFillTool.prototype.isFill = true;
Neo.EllipseFillTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.ellipseFillMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
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



