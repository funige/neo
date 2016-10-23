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

/*
-------------------------------------------------------------------------
	Pen（鉛筆）
-------------------------------------------------------------------------
*/

Neo.PenTool = function() {};
Neo.PenTool.prototype = new Neo.ToolBase();
Neo.PenTool.prototype.isUpMove = false;
Neo.PenTool.prototype.lineType = Neo.Painter.LINETYPE_PEN;

Neo.PenTool.prototype.downHandler = function(oe) {
	//Register undo first;
	oe._pushUndo();

    oe.prepareDrawing();
//	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
	this.isUpMove = false;
	var ctx = oe.canvasCtx[oe.current];

	if (oe.alpha >= 1) {
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, this.lineType);
    }
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.PenTool.prototype.upHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);

    oe.prevLine = null;
};

Neo.PenTool.prototype.moveHandler = function(oe) {	
	var ctx = oe.canvasCtx[oe.current];
	oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY, this.lineType);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
};

Neo.PenTool.prototype.drawCursor = function(oe) {
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
    oe.drawCircle(ctx, x, y, r, Neo.Painter.LINETYPE_XOR_PEN);

    ctx.restore();
}

Neo.PenTool.prototype.upMoveHandler = function(oe) {
    this.isUpMove = true;
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
}
Neo.PenTool.prototype.rollOverHandler= function(oe) {}

Neo.PenTool.prototype.rollOutHandler= function(oe) {
	if (!oe.isMouseDown && !oe.isMouseDownRight){
		oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
		oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	}
}


/*
-------------------------------------------------------------------------
	Eraser（消しペン）
-------------------------------------------------------------------------
*/

Neo.EraserTool = function() {};
Neo.EraserTool.prototype = new Neo.ToolBase();
Neo.EraserTool.prototype.isUpMove = false;
Neo.EraserTool.prototype.lineType = Neo.Painter.LINETYPE_ERASER;

Neo.EraserTool.prototype.downHandler = function(oe) {
	//Register undo first;
	oe._pushUndo();

    oe.prepareDrawing();
//	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
	this.isUpMove = false;
	var ctx = oe.canvasCtx[oe.current];

	if (oe.alpha >= 1) {
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, this.lineType);
    }
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.EraserTool.prototype.upHandler = function(oe) {
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);

    oe.prevLine = null;
};

Neo.EraserTool.prototype.moveHandler = function(oe) {	
	var ctx = oe.canvasCtx[oe.current];
	oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY, this.lineType);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
};

Neo.EraserTool.prototype.drawCursor = function(oe) {
    if (oe.lineWidth <= 8) return;
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var d = oe.lineWidth;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe);

    var x = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var r = d * 0.5 * oe.zoom;
    oe.drawCircle(ctx, x, y, r, Neo.Painter.LINETYPE_XOR_ERASER);

    ctx.restore();
}

Neo.EraserTool.prototype.upMoveHandler = function(oe) {
    this.isUpMove = true;
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
}
Neo.EraserTool.prototype.rollOverHandler= function(oe) {}

Neo.EraserTool.prototype.rollOutHandler= function(oe) {
	if (!oe.isMouseDown && !oe.isMouseDownRight){
		oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
		oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	}
}


/*
-------------------------------------------------------------------------
	Hand（スクロール）
-------------------------------------------------------------------------
*/

Neo.HandTool = function() {};
Neo.HandTool.prototype = new Neo.ToolBase();
Neo.HandTool.prototype.isUpMove = false;

Neo.HandTool.prototype.downHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

	this.isDrag = true;
	this.startX = oe.mouseX;
	this.startY = oe.mouseY;
};

Neo.HandTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();
};

Neo.HandTool.prototype.moveHandler = function(oe) {	
    if (this.isDrag) {
        var zoomX = oe.zoomX;
        var zoomY = oe.zoomY;
        var dx = this.startX - oe.mouseX;
        var dy = this.startY - oe.mouseY;
        oe.setZoomPosition(zoomX + dx, zoomY + dy);
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
Neo.SliderTool.prototype.isUpMove = false;

Neo.SliderTool.prototype.downHandler = function(oe) {
	this.isDrag = true;

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
Neo.FillTool.prototype.isUpMove = false;

Neo.FillTool.prototype.downHandler = function(oe) {
    oe._pushUndo();
//	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
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
	RectEffect（矩型エフェックト）
-------------------------------------------------------------------------
*/

Neo.RectEffectTool = function() {};
Neo.RectEffectTool.prototype = new Neo.ToolBase();
Neo.RectEffectTool.prototype.isUpMove = false;

Neo.RectEffectTool.prototype.downHandler = function(oe) {
    this.isUpMove = false;

    this.startX = this.endX = oe.clipMouseX;
    this.startY = this.endY = oe.clipMouseY;
};

Neo.RectEffectTool.prototype.upHandler = function(oe) {
    this.isUpMove = true;

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX);
    var height = Math.abs(this.startY - this.endY);
    var ctx = oe.canvasCtx[oe.current];

    if (width > 0 && height > 0) {
        oe._pushUndo();

        console.log(x + "," + y + "," + width + "," + height);
        this.doEffect(oe, x, y, width, height);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
};

Neo.RectEffectTool.prototype.moveHandler = function(oe) {
    this.endX = oe.clipMouseX;
    this.endY = oe.clipMouseY;

	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);
};

Neo.RectEffectTool.prototype.rollOutHandler= function(oe) {};
Neo.RectEffectTool.prototype.upMoveHandler = function(oe) {};
Neo.RectEffectTool.prototype.rollOverHandler= function(oe) {};

Neo.RectEffectTool.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasMousePosition(this.startX, this.startY, true);
    var end = oe.getDestCanvasMousePosition(this.endX, this.endY, true);

    var x = (start.x < end.x) ? start.x : end.x;
    var y = (start.y < end.y) ? start.y : end.y;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);
    oe.drawXORRect(ctx, x, y, width, height);
    ctx.restore();
};

/*
-------------------------------------------------------------------------
	EraseRect（消し四角）
-------------------------------------------------------------------------
*/

Neo.EraseRectTool = function() {};
Neo.EraseRectTool.prototype = new Neo.RectEffectTool();
Neo.EraseRectTool.prototype.isUpMove = false;
Neo.EraseRectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.eraseRect(ctx, x, y, width, height);
};

/*
-------------------------------------------------------------------------
	FlipH（左右反転）
-------------------------------------------------------------------------
*/

Neo.FlipHTool = function() {};
Neo.FlipHTool.prototype = new Neo.RectEffectTool();
Neo.FlipHTool.prototype.isUpMove = false;
Neo.FlipHTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.flipH(ctx, x, y, width, height);
};

/*
-------------------------------------------------------------------------
	FlipV（上下反転）
-------------------------------------------------------------------------
*/

Neo.FlipVTool = function() {};
Neo.FlipVTool.prototype = new Neo.RectEffectTool();
Neo.FlipVTool.prototype.isUpMove = false;
Neo.FlipVTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.flipV(ctx, x, y, width, height);
};

/*
-------------------------------------------------------------------------
	Merge（レイヤー結合）
-------------------------------------------------------------------------
*/

Neo.MergeTool = function() {};
Neo.MergeTool.prototype = new Neo.RectEffectTool();
Neo.MergeTool.prototype.isUpMove = false;
Neo.MergeTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.merge(ctx, x, y, width, height);
};

/*
-------------------------------------------------------------------------
	Dummy（何もしない時）
-------------------------------------------------------------------------
*/

Neo.DummyTool = function() {};
Neo.DummyTool.prototype = new Neo.ToolBase();
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



