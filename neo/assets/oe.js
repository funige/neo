'use strict';

var Oe = function() {
    this._undoMgr = new UndoManager(50);
    this.version = "0.2";
};


Oe.prototype.container;
Oe.prototype._undoMgr;
Oe.prototype.tool;

//Canvas Info
Oe.prototype.canvasWidth;
Oe.prototype.canvasHeight;
Oe.prototype.canvas = [];
Oe.prototype.canvasCtx = [];
Oe.prototype.visible = [];
Oe.prototype.current = 0;

//Temp Canvas Info
Oe.prototype.tempCanvas;
Oe.prototype.tempCanvasCtx;

//Destination Canvas for display
Oe.prototype.destCanvas;
Oe.prototype.destCanvasCtx;


Oe.prototype.backgroundColor = "#ffffff";
Oe.prototype.foregroundColor = "#000000";

Oe.prototype.lineWidth = 1;
Oe.prototype.alpha = 1;
Oe.prototype.zoom = 1;
Oe.prototype.zoomX = 0;
Oe.prototype.zoomY = 0;

Oe.prototype.isMouseDown;
Oe.prototype.isMouseDownRight;
Oe.prototype.prevMouseX;
Oe.prototype.prevMouseY;
Oe.prototype.mouseX;
Oe.prototype.mouseY;

Oe.prototype.isShiftDown = false;
Oe.prototype.isCtrlDown = false;
Oe.prototype.isAltDown = false;

Oe.prototype.onUpdateCanvas;
Oe.prototype._roundMask = [];


Oe.prototype.build = function(div, width, height)
{
    this.container = div;
    this._initCanvas(div, width, height);
    this._initRoundMask();

    this.setTool(new PenTool());
}

Oe.prototype.setTool = function(tool)
{
    if (this.tool && this.tool.kill) {
        this.tool.kill();
    }
    this.tool = tool;
    tool.init();
}

Oe.prototype._initCanvas = function(div, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.zoomX = width * 0.5;
    this.zoomY = height * 0.5;

    for (var i = 0; i < 2; i++) {
        this.canvas[i] = document.createElement("canvas");
        this.canvas[i].width = width;
        this.canvas[i].height = height;
        this.canvasCtx[i] = this.canvas[i].getContext("2d");
        this.canvasCtx[i].imageSmoothingEnabled = false;
        this.canvasCtx[i].mozImageSmoothingEnabled = false;
        this.visible[i] = true;
    }
//  this.canvasCtx[0].fillStyle = this.backgroundColor;
//  this.canvasCtx[0].fillRect(0, 0, width, height);

    this.destCanvas = document.createElement("canvas");
    this.destCanvasCtx = this.destCanvas.getContext("2d");
    this.destCanvas.width = width;
    this.destCanvas.height = height;
    this.container.appendChild(this.destCanvas);
    this.destCanvas.style.imageRendering = "pixelated";
    this.destCanvasCtx.imageSmoothingEnabled = false;
    this.destCanvasCtx.mozImageSmoothingEnabled = false;
    
    this.tempCanvas = document.createElement("canvas");
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.tempCanvasCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.style.position = "absolute";
    this.tempCanvas.enabled = false;

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
}

Oe.prototype._initRoundMask = function() {
    for (var r = 1; r <= 30; r++) {
        this._roundMask[r] = new Uint8Array(r * r);
        var mask = this._roundMask[r];
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
    this._roundMask[3][0] = 0;
    this._roundMask[3][2] = 0;
    this._roundMask[3][6] = 0;
    this._roundMask[3][8] = 0;

    this._roundMask[5][1] = 0;
    this._roundMask[5][3] = 0;
    this._roundMask[5][5] = 0;
    this._roundMask[5][9] = 0;
    this._roundMask[5][15] = 0;
    this._roundMask[5][19] = 0;
    this._roundMask[5][21] = 0;
    this._roundMask[5][23] = 0;
}

/*
-----------------------------------------------------------------------
	Mouse Event Handling
-----------------------------------------------------------------------
*/

Oe.prototype._keyDownHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;

    if (this.tool.keyDownHandler) {
        this.tool.keyDownHandler(oe);
    }
};

Oe.prototype._keyUpHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;

    if (this.tool.keyUpHandler) {
        this.tool.keyUpHandler(oe);
    }
};

Oe.prototype._rollOverHandler = function(e) {
    if (this.tool.rollOverHandler) {
        this.tool.rollOverHandler(this);
    }
};

Oe.prototype._rollOutHandler = function(e) {
	if (this.tool.rollOutHandler) {
		this.tool.rollOutHandler(this);
	}
};

Oe.prototype._mouseDownHandler = function(e) {
    if (e.target === document.getElementById("painter")) {
	    var rect = e.target.getBoundingClientRect();
        if (e.pageX - rect.left > 20 && 
            e.pageY - rect.top > 20) { // スクロールバーのドラッグを開始
            e.preventDefault();
            return;
        }
    }

	if (e.button == 2) {
		this.isMouseDownRight = true;
	} else {
		this.isMouseDown = true;
	}	
	
	this._updateMousePosition(e);
	this.prevMouseX = this.mouseX;
	this.prevMouseY = this.mouseY;
	this.tool.downHandler(this);
	
	//console.log(e.button);
	
	var ref = this;
	document.onmouseup = function(e) {
        ref._mouseUpHandler(e)
    };
};

Oe.prototype._mouseUpHandler = function(e) {
	this.isMouseDown = false;
	this.isMouseDownRight = false;
	this.tool.upHandler(this);
	document.onmouseup = undefined;
};

Oe.prototype._mouseMoveHandler = function(e) {
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


Oe.prototype._updateMousePosition = function(e) {
    var rect = this.destCanvas.getBoundingClientRect();

    if (this.zoom <= 0) this.zoom = 1; //なぜか0になることがあるので

	this.mouseX = (e.clientX - rect.left) / this.zoom 
            + this.zoomX 
            - this.canvasWidth * 0.5 / this.zoom;
	this.mouseY = (e.clientY - rect.top)  / this.zoom 
            + this.zoomY 
            - this.canvasHeight * 0.5 / this.zoom;
	
	if (isNaN(this.prevMouseX)) {
		this.prevMouseX = this.mouseX;
	}
	if (isNaN(this.prevMouseY)) {
		this.prevMosueY = this.mouseY;
	}
};

/*
-------------------------------------------------------------------------
	Undo
-------------------------------------------------------------------------
*/

Oe.prototype.undo = function() {
	var undoItem = this._undoMgr.popUndo();
	if (undoItem) {
		this._pushRedo();
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Oe.prototype.redo = function() {
	var undoItem = this._undoMgr.popRedo();
	if (undoItem) {
		this._pushUndo(0,0,this.canvasWidth, this.canvasHeight, true);
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Oe.prototype.hasUndo = function() {
	return true;
};

Oe.prototype._pushUndo = function(x, y, w, h, holdRedo) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new UndoItem();
	undoItem.x = 0;
	undoItem.y = 0;
	undoItem.width = w;
	undoItem.height = h;
	undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
	this._undoMgr.pushUndo(undoItem, holdRedo);
};

Oe.prototype._pushRedo = function(x, y, w, h) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new UndoItem();
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
	Drawing Helper
-------------------------------------------------------------------------
*/

Oe.prototype.dataURLtoBlob = function(dataURL) {
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

Oe.prototype.getPNG = function() {
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

Oe.prototype.clearCanvas = function(doConfirm) {
	if (!doConfirm || window.confirm("全消しします")) {
		//Register undo first;
		oe._pushUndo();
	
		this.canvasCtx[0].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.canvasCtx[1].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
	}
};

Oe.prototype.updateDestCanvas = function(x,y,width,height, useTemp) {	
	this.destCanvasCtx.save();

	this.destCanvasCtx.translate(this.canvasWidth * 0.5, this.canvasHeight * 0.5);
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

Oe.prototype.fillContext = function(color) {
};

Oe.prototype.setPixel = function(imageData, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var n = (y * imageData.width + x) * 4;
    var data = imageData.data;
    var mask = this._roundMask[d];
    var index = 0;
    
    var r = parseInt(this.foregroundColor.substr(1, 2), 16);
    var g = parseInt(this.foregroundColor.substr(3, 2), 16);
    var b = parseInt(this.foregroundColor.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (mask[index++]) {
                data[n++] = r;
                data[n++] = g;
                data[n++] = b;
                data[n++] = a;
            } else {
                n += 4;
            }
        }
        n += (imageData.width - d) * 4;
    }
};

Oe.prototype.drawLine = function(ctx, x0, y0, x1, y1) {
    //http://stackoverflow.com/questions/25277023/complete-solution-for-drawing-1-pixel-line-on-html5-canvas
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);
    var r = Math.ceil(this.lineWidth / 2);

    var left = ((x0 < x1) ? x0 : x1) - r;
    var top = ((y0 < y1) ? y0 : y1) - r;

    var imageData = ctx.getImageData(left, top, width + r*2, height + r*2);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        

    while (true) {
        this.setPixel(imageData, x0 - left , y0 - top);
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }
    ctx.putImageData(imageData, left, top);
};

Oe.prototype.__drawLine = function(ctx, x0, y0, x1, y1) {
    // 線がボケる奴
	ctx.beginPath();
	ctx.moveTo(x0,y0);
	ctx.lineTo(x1,y1);
	ctx.stroke();
};

Oe.prototype.drawRect = function(ctx, x, y, w, h, isStroke, isFill) {
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

Oe.prototype.drawEllipse = function(ctx, x, y, w, h, isStroke, isFill) {
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
}


/*
-------------------------------------------------------------------------
	Data Cache for Undo / Redo
-------------------------------------------------------------------------
*/

var UndoManager = function(_maxStep){
	this._maxStep = _maxStep;
	this._undoItems = [];
	this._redoItems = [];
}
UndoManager.prototype._maxStep;
UndoManager.prototype._redoItems;
UndoManager.prototype._undoItems;

//アクションをしてUndo情報を更新
UndoManager.prototype.pushUndo = function(undoItem, holdRedo) {
	this._undoItems.push(undoItem);
	if (this._undoItems.length > this._maxStep) {
		this._undoItems.shift();
	}
	
	if (!holdRedo == true) {
		this._redoItems = [];
    }
};

UndoManager.prototype.popUndo = function() {
	return this._undoItems.pop();
}

UndoManager.prototype.pushRedo = function(undoItem) {
	this._redoItems.push(undoItem);
}

UndoManager.prototype.popRedo = function() {
	return this._redoItems.pop();
}


var UndoItem = function() {}
UndoItem.prototype.data;
UndoItem.prototype.x;
UndoItem.prototype.y;
UndoItem.prototype.width;
UndoItem.prototype.height;
