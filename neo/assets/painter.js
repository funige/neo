'use strict';

Neo.Painter = function() {
    this._undoMgr = new Neo.UndoManager(50);
};

Neo.Painter.prototype.container;
Neo.Painter.prototype._undoMgr;
Neo.Painter.prototype.tool;

//Canvas Info
Neo.Painter.prototype.canvasWidth;
Neo.Painter.prototype.canvasHeight;
Neo.Painter.prototype.canvas = [];
Neo.Painter.prototype.canvasCtx = [];
Neo.Painter.prototype.visible = [];
Neo.Painter.prototype.current = 0;

//Temp Canvas Info
Neo.Painter.prototype.tempCanvas;
Neo.Painter.prototype.tempCanvasCtx;

//Destination Canvas for display
Neo.Painter.prototype.destCanvas;
Neo.Painter.prototype.destCanvasCtx;


Neo.Painter.prototype.backgroundColor = "#ffffff";
Neo.Painter.prototype.foregroundColor = "#000000";

Neo.Painter.prototype.lineWidth = 1;
Neo.Painter.prototype.alpha = 1;
Neo.Painter.prototype.zoom = 1;
Neo.Painter.prototype.zoomX = 0;
Neo.Painter.prototype.zoomY = 0;

Neo.Painter.prototype.isMouseDown;
Neo.Painter.prototype.isMouseDownRight;
Neo.Painter.prototype.prevMouseX;
Neo.Painter.prototype.prevMouseY;
Neo.Painter.prototype.mouseX;
Neo.Painter.prototype.mouseY;

Neo.Painter.prototype.isShiftDown = false;
Neo.Painter.prototype.isCtrlDown = false;
Neo.Painter.prototype.isAltDown = false;

Neo.Painter.prototype.onUpdateCanvas;
Neo.Painter.prototype._roundData = [];
Neo.Painter.prototype._toneData = [];
Neo.Painter.prototype.toolStack = [];

Neo.Painter.prototype.maskType = 0;
Neo.Painter.prototype.maskColor = "#000000";
Neo.Painter.prototype._currentColor = [];
Neo.Painter.prototype._currentMask = [];


Neo.Painter.LINETYPE_NONE = 0;
Neo.Painter.LINETYPE_PEN = 1;
Neo.Painter.LINETYPE_ERASER = 2;
Neo.Painter.LINETYPE_XOR = 3;
Neo.Painter.LINETYPE_XOR2 = 4;

Neo.Painter.MASKTYPE_NONE = 0;
Neo.Painter.MASKTYPE_NORMAL = 1;
Neo.Painter.MASKTYPE_REVERSE = 2;

Neo.Painter.TOOLTYPE_NONE = 0;
Neo.Painter.TOOLTYPE_PEN = 1;
Neo.Painter.TOOLTYPE_ERASER = 2;
Neo.Painter.TOOLTYPE_FILL = 3;
Neo.Painter.TOOLTYPE_MASK = 4;
Neo.Painter.TOOLTYPE_ERASEALL = 5;


Neo.Painter.prototype.build = function(div, width, height)
{
    this.container = div;
    this._initCanvas(div, width, height);
    this._initRoundData();
    this._initToneData();

    this.setTool(new Neo.PenTool());
};

Neo.Painter.prototype.setTool = function(tool) {
    if (this.tool && this.tool.kill) {
        this.tool.kill();
    }
    this.tool = tool;
    tool.init();
};

Neo.Painter.prototype.pushTool = function(tool) {
    this.toolStack.push(this.tool);
    this.tool = tool;
    tool.init();
};

Neo.Painter.prototype.popTool = function() {
    var tool = this.tool;
    if (tool && tool.kill) {
        tool.kill();
    }
    this.tool = this.toolStack.pop();
};

Neo.Painter.prototype.setToolByType = function(toolType) {
    switch (parseInt(toolType)) {
    case Neo.Painter.TOOLTYPE_PEN:      this.setTool(new Neo.PenTool());      break;
    case Neo.Painter.TOOLTYPE_ERASER:   this.setTool(new Neo.EraserTool());   break;
    case Neo.Painter.TOOLTYPE_FILL:     this.setTool(new Neo.FillTool());     break;
    case Neo.Painter.TOOLTYPE_ERASEALL: this.setTool(new Neo.EraseAllTool()); break;

    default:
        console.log("unknown toolType " + toolType);
        break;
    }
};

Neo.Painter.prototype._initCanvas = function(div, width, height) {
    var destWidth = parseInt(div.clientWidth);
    var destHeight = parseInt(div.clientHeight);
    this.destWidth = width;
    this.destHeight = height;

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.zoomX = width * 0.5;
    this.zoomY = height * 0.5;

    for (var i = 0; i < 2; i++) {
        this.canvas[i] = document.createElement("canvas");
        this.canvas[i].width = width;
        this.canvas[i].height = height;
        this.canvasCtx[i] = this.canvas[i].getContext("2d");

        this.canvas[i].style.imageRendering = "pixelated";
        this.canvasCtx[i].imageSmoothingEnabled = false;
        this.canvasCtx[i].mozImageSmoothingEnabled = false;
        this.visible[i] = true;
    }

    this.tempCanvas = document.createElement("canvas");
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.tempCanvasCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.style.position = "absolute";
    this.tempCanvas.enabled = false;

    this.destCanvas = document.createElement("canvas");
    this.destCanvasCtx = this.destCanvas.getContext("2d");
    this.destCanvas.width = destWidth;
    this.destCanvas.height = destHeight;
    this.container.appendChild(this.destCanvas);

    this.destCanvas.style.imageRendering = "pixelated";
    this.destCanvasCtx.imageSmoothingEnabled = false;
    this.destCanvasCtx.mozImageSmoothingEnabled = false;

    var ref = this;

    var container = document.getElementById("container");
    container.onmousedown = function(e) {ref._mouseDownHandler(e)};
    container.onmousemove = function(e) {ref._mouseMoveHandler(e)};
    container.onmouseup = function(e) {ref._mouseUpHandler(e)};
    container.onmouseover = function(e) {ref._rollOverHandler(e)};
    container.onmouseout = function(e) {ref._rollOutHandler(e)};
    container.onkeydown = function(e) {ref._keyDownHandler(e)};
    document.onkeyup = function(e) {ref._keyUpHandler(e)};

    container.onfocus = function(e) {alert('focus');};
    container.onblur = function(e) {alert('blur');};

    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype._initRoundData = function() {
    for (var r = 1; r <= 30; r++) {
        this._roundData[r] = new Uint8Array(r * r);
        var mask = this._roundData[r];
        var d = Math.floor(r / 2.0);
        var index = 0;
        for (var x = 0; x < r; x++) {
            for (var y = 0; y < r; y++) {
                var xx = x + 0.5 - r/2.0;
                var yy = y + 0.5 - r/2.0;
                mask[index++] = (xx*xx + yy*yy <= r*r/4) ? 1 : 0;
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
};

Neo.Painter.prototype._initToneData = function() {
    var pattern = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    for (var i = 0; i < 16; i++) {
        this._toneData[i] = new Uint8Array(16);
        for (var j = 0; j < 16; j++) {
            this._toneData[i][j] = (i <= pattern[j]) ? 1 : 0;
        }
    }
};

/*
-----------------------------------------------------------------------
	Mouse Event Handling
-----------------------------------------------------------------------
*/

Neo.Painter.prototype._keyDownHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;

    if (this.tool.keyDownHandler) {
        this.tool.keyDownHandler(oe);
    }
};

Neo.Painter.prototype._keyUpHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;

    if (this.tool.keyUpHandler) {
        this.tool.keyUpHandler(oe);
    }
};

Neo.Painter.prototype._rollOverHandler = function(e) {
    if (this.tool.rollOverHandler) {
        this.tool.rollOverHandler(this);
    }
};

Neo.Painter.prototype._rollOutHandler = function(e) {
	if (this.tool.rollOutHandler) {
		this.tool.rollOutHandler(this);
    }
};

Neo.Painter.prototype._mouseDownHandler = function(e) {
	if (e.button == 2 || e.ctrlKey || e.altKey) {
		this.isMouseDownRight = true;
	} else {
		this.isMouseDown = true;
	}	
	
	this._updateMousePosition(e);
	this.prevMouseX = this.mouseX;
	this.prevMouseY = this.mouseY;

    if (this.isMouseDownRight) {
        this.isMouseDownRight = false;
        if (!e.target['data-ui']) {
            this.pickColor(this.mouseX, this.mouseY);
            return;
        }
    }

    if (e.target == document.getElementById("scrollH") ||
        e.target == document.getElementById("scrollV")) {
        this.pushTool(new Neo.HandTool());

    } else if (e.target['data-slider']) {
        this.pushTool(new Neo.SliderTool());
        this.tool.target = e.target;

    } else if (e.target['data-ui']) {
        this.isMouseDown = false;
        this.pushTool(new Neo.DummyTool());
    }

	this.tool.downHandler(this);
	//console.log(e.button);
	
	var ref = this;
	document.onmouseup = function(e) {
        ref._mouseUpHandler(e)
    };
};

Neo.Painter.prototype._mouseUpHandler = function(e) {
	this.isMouseDown = false;
	this.isMouseDownRight = false;
	this.tool.upHandler(this);
	document.onmouseup = undefined;
};

Neo.Painter.prototype._mouseMoveHandler = function(e) {
	this._updateMousePosition(e);
		
	//console.log("test",this.mouseX, this.mouseY, this.prevMouseX, this.prevMouseY);	
	if (this.isMouseDown || this.isMouseDownRight) {
		this.tool.moveHandler(this);
	} else {
		if (this.tool.upMoveHandler) {
			this.tool.upMoveHandler(this);
		}
	}
	this.prevMouseX = this.mouseX;
	this.prevMouseY = this.mouseY;
};


Neo.Painter.prototype._updateMousePosition = function(e) {
    var rect = this.destCanvas.getBoundingClientRect();

    if (this.zoom <= 0) this.zoom = 1; //なぜか0になることがあるので

	this.mouseX = (e.clientX - rect.left) / this.zoom 
            + this.zoomX 
            - this.destCanvas.width * 0.5 / this.zoom;
	this.mouseY = (e.clientY - rect.top)  / this.zoom 
            + this.zoomY 
            - this.destCanvas.height * 0.5 / this.zoom;
	
	if (isNaN(this.prevMouseX)) {
		this.prevMouseX = this.mouseX;
	}
	if (isNaN(this.prevMouseY)) {
		this.prevMosueY = this.mouseY;
	}

    this.rawMouseX = e.clientX;
    this.rawMouseY = e.clientY;
};

/*
-------------------------------------------------------------------------
	Undo
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.undo = function() {
	var undoItem = this._undoMgr.popUndo();
	if (undoItem) {
		this._pushRedo();
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Neo.Painter.prototype.redo = function() {
	var undoItem = this._undoMgr.popRedo();
	if (undoItem) {
		this._pushUndo(0,0,this.canvasWidth, this.canvasHeight, true);
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Neo.Painter.prototype.hasUndo = function() {
	return true;
};

Neo.Painter.prototype._pushUndo = function(x, y, w, h, holdRedo) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new Neo.UndoItem();
	undoItem.x = 0;
	undoItem.y = 0;
	undoItem.width = w;
	undoItem.height = h;
	undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
	this._undoMgr.pushUndo(undoItem, holdRedo);
};

Neo.Painter.prototype._pushRedo = function(x, y, w, h) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new Neo.UndoItem();
	undoItem.x = 0;
	undoItem.y = 0;
	undoItem.width = w;
	undoItem.height = h;
	undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
	this._undoMgr.pushRedo(undoItem);
};


/*
-------------------------------------------------------------------------
	Data Cache for Undo / Redo
-------------------------------------------------------------------------
*/

Neo.UndoManager = function(_maxStep){
	this._maxStep = _maxStep;
	this._undoItems = [];
	this._redoItems = [];
}
Neo.UndoManager.prototype._maxStep;
Neo.UndoManager.prototype._redoItems;
Neo.UndoManager.prototype._undoItems;

//アクションをしてUndo情報を更新
Neo.UndoManager.prototype.pushUndo = function(undoItem, holdRedo) {
	this._undoItems.push(undoItem);
	if (this._undoItems.length > this._maxStep) {
		this._undoItems.shift();
	}
	
	if (!holdRedo == true) {
		this._redoItems = [];
    }
};

Neo.UndoManager.prototype.popUndo = function() {
	return this._undoItems.pop();
}

Neo.UndoManager.prototype.pushRedo = function(undoItem) {
	this._redoItems.push(undoItem);
}

Neo.UndoManager.prototype.popRedo = function() {
	return this._redoItems.pop();
}


Neo.UndoItem = function() {}
Neo.UndoItem.prototype.data;
Neo.UndoItem.prototype.x;
Neo.UndoItem.prototype.y;
Neo.UndoItem.prototype.width;
Neo.UndoItem.prototype.height;

/*
-------------------------------------------------------------------------
	Zoom Controller
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.setZoom = function(val){
	this.zoom = val;

    var container = document.getElementById("container");
    var width = this.canvasWidth * val;
    var height = this.canvasHeight * val;
    if (width > container.clientWidth - 100) width = container.clientWidth - 100;
    if (height > container.clientHeight - 130) height = container.clientHeight - 130;
    this.destWidth = width;
    this.destHeight = height;

	this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, false);
	this.setZoomPosition(this.zoomX, this.zoomY);
}

Neo.Painter.prototype.setZoomPosition = function(x,y){
//	var minx = this.canvasWidth/this.zoom*0.5;
//	var maxx = this.canvasWidth-minx;
//	var miny = this.canvasHeight/this.zoom*0.5;
//	var maxy = this.canvasHeight-miny;

	var minx = (this.destCanvas.width / this.zoom) * 0.5;
	var maxx = this.canvasWidth - minx;
	var miny = (this.destCanvas.height / this.zoom) * 0.5;
	var maxy = this.canvasHeight - miny;

	
	x = Math.max(Math.min(maxx,x),minx);
	y = Math.max(Math.min(maxy,y),miny);
	
	//console.log(minx, maxx, miny, maxy, this.zoomX, this.zoomY);
	
	this.zoomX = x;
	this.zoomY = y;
	this.updateDestCanvas(0,0,this.canvasWidth,this.canvasHeight,false);
}


/*
-------------------------------------------------------------------------
	Drawing Helper
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.submit = function(board) {
    Neo.submit(board, this.getPNG());
};

Neo.Painter.prototype.dataURLtoBlob = function(dataURL) {
    var byteString;
    if (dataURL.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURL.split(',')[1]);
    } else {
        byteString = unescape(dataURL.split(',')[1]);
    }

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:'image/png'});
};

Neo.Painter.prototype.getPNG = function() {
    var width = this.canvasWidth;
    var height = this.canvasHeight;
    var pngCanvas = document.createElement("canvas");
    pngCanvas.width = width;
    pngCanvas.height = height;
    var pngCanvasCtx = pngCanvas.getContext("2d");
    pngCanvasCtx.fillStyle = "#ffffff";
    pngCanvasCtx.fillRect(0, 0, width, height);

	if (this.visible[0]) {
	    pngCanvasCtx.drawImage(this.canvas[0], 
                               0, 0, width, height, 
                               0, 0, width, height);
    }
    if (this.visible[1]) {
	    pngCanvasCtx.drawImage(this.canvas[1], 
                               0, 0, width, height, 
                               0, 0, width, height);
    }

    var dataURL = pngCanvas.toDataURL('image/png');
    return this.dataURLtoBlob(dataURL);
};

Neo.Painter.prototype.clearCanvas = function(doConfirm) {
	if (!doConfirm || window.confirm("全消しします")) {
		//Register undo first;
		this._pushUndo();
	
		this.canvasCtx[0].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.canvasCtx[1].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
	}
};

Neo.Painter.prototype.updateDestCanvas = function(x, y, width, height, useTemp) {	
	this.destCanvasCtx.save();

	this.destCanvasCtx.translate(this.destCanvas.width*.5, this.destCanvas.height*.5);
	this.destCanvasCtx.scale(this.zoom, this.zoom);
	this.destCanvasCtx.translate(-this.zoomX, -this.zoomY);
	this.destCanvasCtx.globalAlpha = 1.0;
	this.destCanvasCtx.fillStyle = "#ffffff";
	this.destCanvasCtx.fillRect(0, 0, width, height);

	if (this.visible[0]) {
	    this.destCanvasCtx.drawImage(this.canvas[0], 
                                     x, y, width, height, 
                                     x, y, width, height);
    }
    if (this.visible[1]) {
	    this.destCanvasCtx.drawImage(this.canvas[1], 
                                     x, y, width, height, 
                                     x, y, width, height);
    }
	if (useTemp) {
		this.destCanvasCtx.globalAlpha = this.alpha;
		this.destCanvasCtx.drawImage(this.tempCanvas, 
                                     x, y, width, height, 
                                     x, y, width, height);
	}
	this.destCanvasCtx.restore();
	
	if (this.onUpdateCanvas) {
        this.onUpdateCanvas(this);
    }
};

Neo.Painter.prototype.fillContext = function(color) {
};

Neo.Painter.prototype.getColor = function() {
    var r = parseInt(this.foregroundColor.substr(1, 2), 16);
    var g = parseInt(this.foregroundColor.substr(3, 2), 16);
    var b = parseInt(this.foregroundColor.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);
    return a <<24 | b<<16 | g<<8 | r;
};

Neo.Painter.prototype.getColorString = function(c) {
    var rgb = ("000000" + (c & 0xffffff).toString(16)).substr(-6);
    return '#' + rgb;
};

Neo.Painter.prototype.setColor = function(c) {
    if (typeof c != "string") c = this.getColorString(c);
    this.foregroundColor = c;

    Neo.updateUIColor();
};

Neo.Painter.prototype.prepareDrawing = function () {
    var r = parseInt(this.foregroundColor.substr(1, 2), 16);
    var g = parseInt(this.foregroundColor.substr(3, 2), 16);
    var b = parseInt(this.foregroundColor.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);

    var maskR = parseInt(this.maskColor.substr(1, 2), 16);
    var maskG = parseInt(this.maskColor.substr(3, 2), 16);
    var maskB = parseInt(this.maskColor.substr(5, 2), 16);

    this._currentColor = [r, g, b, a];
    this._currentMask = [maskR, maskG, maskB];
};

Neo.Painter.prototype.isMasked = function (buf8, index) {
    var r = this._currentMask[0];
    var g = this._currentMask[1];
    var b = this._currentMask[2];

    switch (this.maskType) {
    case Neo.Painter.MASKTYPE_NONE:
        return;

    case Neo.Painter.MASKTYPE_NORMAL:
        return (buf8[index + 3] != 0 &&
                buf8[index + 0] == r &&
                buf8[index + 1] == g &&
                buf8[index + 2] == b) ? true : false;

    case Neo.Painter.MASKTYPE_REVERSE:
        return (buf8[index + 3] != 0 &&
                buf8[index + 0] == r &&
                buf8[index + 1] == g &&
                buf8[index + 2] == b) ? false : true;
    }
    return false;
};

Neo.Painter.prototype.drawPoint = function(buf8, width, x, y, type) {
    switch (type) {
    case Neo.Painter.LINETYPE_PEN:
        this.drawPencilPoint(buf8, width, x, y);
        break;

    case Neo.Painter.LINETYPE_ERASER:
        this.drawEraserPoint(buf8, width, x, y);
        break;
                
    case Neo.Painter.LINETYPE_XOR:
        this.drawXORPixel(buf8, width, x, y);
        break;

    case Neo.Painter.LINETYPE_XOR2:
        this.drawXORPixel2(buf8, width, x, y);
        break;

    default:
        break;
    }
};

Neo.Painter.prototype.drawPencilPoint = function(buf8, width, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;

    var r = this._currentColor[0];
    var g = this._currentColor[1];
    var b = this._currentColor[2];
    var a = this._currentColor[3];

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var k = (buf8[index + 3] / 255.0) * (1.0 - (a / 255.0));

                buf8[index + 0] *= k;
                buf8[index + 1] *= k;
                buf8[index + 2] *= k;
                buf8[index + 0] += r * (1.0 - k);
                buf8[index + 1] += g * (1.0 - k);
                buf8[index + 2] += b * (1.0 - k);
                buf8[index + 3] += a / (d * (255.0 - a) / 255.0); //要修正
            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.drawEraserPoint = function(buf8, width, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;
    var a = Math.floor(this.alpha * 255);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++]) {
                var k = (buf8[index + 3] / 255.0) * (1.0 - (a / 255.0));

                buf8[index + 3] -= a / (d * (255.0 - a) / 255.0); //要修正
            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.drawXORPixel = function(buf8, width, x, y) {
    var index = (y * width + x) * 4;
    buf8[index + 0] ^= 0x7f;
    buf8[index + 1] ^= 0xff;
    buf8[index + 2] ^= 0xff;
};

Neo.Painter.prototype.drawXORPixel2 = function(buf8, width, x, y) {
    var index = (y * width + x) * 4;
    buf8[index + 0] ^= 0xff;
    buf8[index + 1] ^= 0x00;
    buf8[index + 2] ^= 0x00;
};


Neo.Painter.prototype.prevLine = null; // 始点または終点が2度プロットされることがあるので
Neo.Painter.prototype.drawLine = function(ctx, x0, y0, x1, y1, type) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);
    var prev = [x0, y0, x1, y1];

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);
    var r = Math.ceil(this.lineWidth / 2);

    var left = ((x0 < x1) ? x0 : x1) - r;
    var top = ((y0 < y1) ? y0 : y1) - r;

    var imageData = ctx.getImageData(left, top, width + r*2, height + r*2);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        

    while (true) {
        if (this.prevLine == null ||
            !((this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
              (this.prevLine[2] == x0 && this.prevLine[3] == y0))) {
            
            this.drawPoint(buf8, imageData.width, x0 - left, y0 - top, type);
        }

        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
    
    this.prevLine = prev;
};

Neo.Painter.prototype.drawCircle = function(ctx, x, y, r, type) {
    x = Math.round(x);
    y = Math.round(y);
    r = Math.round(r);

    var left = (x-r)-1;
    var top = (y-r)-1;

    var imageData = ctx.getImageData(left, top, r*2+2, r*2+2);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var x0 = -r;
    var y0 = 0;
    var err = 2-2*r;

    do {
        this.drawPoint(buf8, imageData.width, x-x0-left, y+y0-top, type);
        this.drawPoint(buf8, imageData.width, x-y0-left, y-x0-top, type);
        this.drawPoint(buf8, imageData.width, x+x0-left, y-y0-top, type);
        this.drawPoint(buf8, imageData.width, x+y0-left, y+x0-top, type);
        r = err;
        if (r <= y0) err += ++y0*2+1;
        if (r > x0 || err > y0) err += ++x0*2+1;

    } while (x0 < 0);
 

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
};

Neo.Painter.prototype.__drawLine = function(ctx, x0, y0, x1, y1) {
    // 線がボケる奴
	ctx.beginPath();
	ctx.moveTo(x0,y0);
	ctx.lineTo(x1,y1);
	ctx.stroke();
};

Neo.Painter.prototype.drawRect = function(ctx, x, y, w, h, isStroke, isFill) {
	ctx.beginPath();
	ctx.moveTo(x,y);
	ctx.lineTo(x+w,y);
	ctx.lineTo(x+w,y+h);
	ctx.lineTo(x,y+h);
	ctx.closePath();
	
	if(isFill)
		ctx.fill();
	
	if(isStroke)
		ctx.stroke();
};

Neo.Painter.prototype.drawEllipse = function(ctx, x, y, w, h, isStroke, isFill) {
	//
	// FOLLOWING CODE IS REFFERENCED FROM, http://webreflection.blogspot.com/2009/01/ellipse-and-circle-for-canvas-2d.html
	// many thanks.
	//
	ctx.beginPath();
	var hB = (w / 2) * .5522848,
        vB = (h / 2) * .5522848,
        eX = x + w,
        eY = y + h,
        mX = x + w / 2,
        mY = y + h / 2;
        ctx.moveTo(x, mY);
        ctx.bezierCurveTo(x, mY - vB, mX - hB, y, mX, y);
        ctx.bezierCurveTo(mX + hB, y, eX, mY - vB, eX, mY);
        ctx.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        ctx.bezierCurveTo(mX - hB, eY, x, mY + vB, x, mY);
        ctx.closePath();
	if(isFill)
		ctx.fill();
	
	if(isStroke)
		ctx.stroke();
};


Neo.Painter.prototype.pickColor = function(x, y) {
    var r = 0xff, g = 0xff, b = 0xff, a;

    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && x < this.canvasWidth &&
        y >= 0 && y < this.canvasHeight) {

        for (var i = 0; i < 2; i++) {
            if (this.visible[i]) {
                var ctx = this.canvasCtx[i];
                var imageData = ctx.getImageData(x, y, 1, 1);
                var buf32 = new Uint32Array(imageData.data.buffer);
                var buf8 = new Uint8ClampedArray(imageData.data.buffer);

                var a = buf8[3] / 255.0;
                r = r * (1.0 - a) + buf8[2] * a;
                g = g * (1.0 - a) + buf8[1] * a;
                b = b * (1.0 - a) + buf8[0] * a;
            }
        }
	    r = Math.max(Math.min(Math.round(r), 255), 0);
	    g = Math.max(Math.min(Math.round(g), 255), 0);
	    b = Math.max(Math.min(Math.round(b), 255), 0);
        var result = r | g<<8 | b<<16;
    }
    this.setColor(result);
};

Neo.Painter.prototype.fillHorizontalLine = function(buf32, x0, x1, y) {
    var index = y * this.canvasWidth + x0;
    var fillColor = this.getColor();
    for (var x = x0; x <= x1; x++) {
        buf32[index++] = fillColor;
    }
};

Neo.Painter.prototype.scanLine = function(x0, x1, y, baseColor, buf32, stack) {
    var width = this.canvasWidth;

    while (x0 <= x1) {
        for (; x0 <= x1; x0++) {
            if (buf32[y * width + x0] == baseColor) break;
        }
        if (x1 < x0) break;

        for (; x0 <= x1; x0++) {
            if (buf32[y * width + x0] != baseColor) break;
        }
        stack.push({x:x0 - 1, y: y})
    }
};

Neo.Painter.prototype.fill = function(x, y, ctx) {
    // http://sandbox.serendip.ws/javascript_canvas_scanline_seedfill.html
    x = Math.round(x);
    y = Math.round(y);

    var imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var width = imageData.width;
    var stack = [{x: x, y: y}];

    var baseColor = buf32[y * width + x];
    var fillColor = this.getColor();

    if ((baseColor & 0xffffff00) == 0 ||
        (baseColor & 0xffffff) != (fillColor & 0xffffff)) {
        while (stack.length > 0) {
            var point = stack.pop();
            var x0 = point.x;
            var x1 = point.x;
            var y = point.y;

            if (buf32[y * width + x] == fillColor) 
                break;

            for (; 0 < x0; x0--) {
                if (buf32[y * width + (x0 - 1)] != baseColor) break;
            }
            for (; x1 < this.canvasHeight - 1; x1++) {
                if (buf32[y * width + (x1 + 1)] != baseColor) break;
            }
            this.fillHorizontalLine(buf32, x0, x1, y);
        
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

	this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
};

