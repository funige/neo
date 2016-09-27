
var ToolBase = function() {};

ToolBase.prototype.startX;
ToolBase.prototype.startY;
ToolBase.prototype.init = function(oe) {}
ToolBase.prototype.kill = function(oe) {}

ToolBase.prototype.downHandler = function(oe) {
	this.startX = oe.mouseX;
	this.startY = oe.mouseY;
};

ToolBase.prototype.upHandler = function(oe) {
};

ToolBase.prototype.moveHandler = function(oe) {
};

ToolBase.prototype.transformForZoom = function(oe) {
	var ctx = oe.destCanvasCtx;
	ctx.translate(oe.canvasWidth * 0.5, oe.canvasHeight * 0.5);
	ctx.scale(oe.zoom, oe.zoom);
	ctx.translate(-oe.zoomX, -oe.zoomY);
}


/*
-------------------------------------------------------------------------
	Pen2（しぃペインターの鉛筆）
    半透明で塗ってもムラにならない奴
-------------------------------------------------------------------------
*/

var PenTool2 = function() {};
PenTool2.prototype = new ToolBase();
PenTool2.prototype.isUpMove = false;
PenTool2.prototype.getColor = function(oe) {
	return oe.foregroundColor;
}

PenTool2.prototype.downHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
	isUpMove = false;
	var ctx = oe.tempCanvasCtx;
	ctx.save();
	ctx.lineWidth = oe.lineWidth;
	ctx.lineCap = "round";	
	ctx.fillStyle = this.getColor(oe);

	if (oe.alpha >= 1) oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	ctx.restore();
};

PenTool2.prototype.upHandler = function(oe) {
	//Register undo first;
	oe._pushUndo();
	var ctx = oe.canvasCtx[oe.current];
	ctx.globalAlpha = oe.alpha;
	ctx.drawImage(oe.tempCanvas, 0, 0, oe.canvasWidth, oe.canvasHeight);
	ctx.globalAlpha = 1.0;
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);
};

PenTool2.prototype.moveHandler = function(oe) {	
	var ctx = oe.tempCanvasCtx;
	ctx.lineWidth = oe.lineWidth;
	ctx.lineCap = "round";	
	ctx.strokeStyle = this.getColor(oe);
	oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
};

PenTool2.prototype.drawCursor = function(oe) {
	var mx = oe.mouseX;
	var my = oe.mouseY;
	var d = oe.lineWidth;
	var ctx = oe.destCanvasCtx;
	ctx.save();
		this.transformForZoom(oe)
		ctx.lineWidth = oe.lineWidth;
		ctx.lineCap = "round";	
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "";
		ctx.lineWidth = 1/oe.zoom;
		ctx.globalAlpha = 1;
		oe.drawEllipse(ctx, mx+1/oe.zoom-d*0.5, my+1/oe.zoom-d*0.5, d, d, true, false);
		ctx.strokeStyle = "#ffffff";
		oe.drawEllipse(ctx, mx-d*0.5, my-d*0.5, d, d, true, false);
	ctx.restore();
}

PenTool2.prototype.upMoveHandler = function(oe) {
	isUpMove = true;
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);
}
PenTool2.prototype.rollOverHandler= function(oe) {}

PenTool2.prototype.rollOutHandler= function(oe) {
	if(!oe.isMouseDown && !oe.isMouseDownRight){
		oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
		oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	}
}

/*
-------------------------------------------------------------------------
	Pen（鉛筆）
-------------------------------------------------------------------------
*/

var PenTool = PenTool2; //後で


/*
-------------------------------------------------------------------------
	Color Picker Tool
-------------------------------------------------------------------------
*/

var ColorPickerTool = function() {};
ColorPickerTool.prototype = new ToolBase();
ColorPickerTool.onchange;
ColorPickerTool.prototype.r;
ColorPickerTool.prototype.g;
ColorPickerTool.prototype.b;

ColorPickerTool.cursorData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJZJREFUeNqs09ENgCAMBFBKmIL9Z4MxKlUhUEFo4RI/1Pg4sQIiGm0AoDycnHSmxGoox56CKO4EstWsF9ozK2k12l+ClpvVEAcztIT1Go0aOs2rpetNo2kzKTTECAohmBjjMnTf56tniMd7/wt9mu1ADbYLTUdDAhWs10oKdeeMED7Zon80taJPio+BRnvAi6ib1LkEGADbiJyV5zf+0wAAAABJRU5ErkJggg%3D%3D"
ColorPickerTool.cursorCanvas;
ColorPickerTool.cursorOffsetX;
ColorPickerTool.cursorOffsetY;

ColorPickerTool.prototype.downHandler = function(oe) {
	this._pick(oe);
};


ColorPickerTool.prototype.upHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
};


ColorPickerTool.prototype.moveHandler = function(oe) {
	if (oe.isMouseDown || oe.isMouseDownRight){
		this._pick(oe);
	}
};

ColorPickerTool.prototype.upMoveHandler = function(oe) {
	//draw picker image
}

ColorPickerTool.prototype.rollOverHandler= function(oe) {}

ColorPickerTool.prototype.rollOutHandler= function(oe) {}

ColorPickerTool.prototype._pick = function(oe) {
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	
	var x = oe.mouseX;
	var y = oe.mouseY;
	var cap = oe.canvasCtx.getImageData(x,y,1,1);
	this.r = cap.data[0];
	this.g = cap.data[1];
	this.b = cap.data[2];
	
	oe.foregroundColor = "rgb(" + this.r + "," + this.g + "," + this.b +")";
	if(ColorPickerTool.onchange)
		ColorPickerTool.onchange(this);
	
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawPickerView(oe);
	return;
	var ctx = oe.tempCanvasCtx;
	ctx.save();
	
	ctx.lineWidth = 32;
	ctx.strokeStyle = "#808080"//oe.foregroundColor
	oe.drawEllipse(ctx, x-100, y-100, 200, 200, true, false);
	
	ctx.lineWidth = 16;
	ctx.strokeStyle = oe.foregroundColor
	oe.drawEllipse(ctx, x-100, y-100, 200, 200, true, false);
	
	ctx.restore();
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
}


ColorPickerTool.prototype.drawPickerView = function(oe)
{
	var x = oe.mouseX;
	var y = oe.mouseY;
	var d = 200 / oe.zoom;
	
	var ctx = oe.destCanvasCtx;
	ctx.save();
		this.transformForZoom(oe)
		ctx.globalAlpha = 1;
		
		ctx.strokeStyle = "#808080";
		ctx.lineWidth = 32 / oe.zoom;
		oe.drawEllipse(ctx, x-d*0.5, y-d*0.5, d, d, true, false);
		
		ctx.strokeStyle = oe.foregroundColor
		ctx.lineWidth = 16 / oe.zoom;
		oe.drawEllipse(ctx, x-d*0.5, y-d*0.5, d, d, true, false);
	ctx.restore();
}
