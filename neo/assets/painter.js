'use strict';

Neo.Painter = function() {
    this._undoMgr = new Neo.UndoManager(50);
    this._actionMgr = new Neo.ActionManager();
};

Neo.Painter.prototype.container;
Neo.Painter.prototype._undoMgr;
Neo.Painter.prototype._actionMgr;
Neo.Painter.prototype.tool;
Neo.Painter.prototype.inputText;

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
Neo.Painter.prototype.tempX = 0;
Neo.Painter.prototype.tempY = 0;

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

Neo.Painter.prototype.slowX = 0;
Neo.Painter.prototype.slowY = 0;
Neo.Painter.prototype.stab = null;

Neo.Painter.prototype.isShiftDown = false;
Neo.Painter.prototype.isCtrlDown = false;
Neo.Painter.prototype.isAltDown = false;

//Neo.Painter.prototype.touchModifier = null;
Neo.Painter.prototype.virtualRight = false;
Neo.Painter.prototype.virtualShift = false;

//Neo.Painter.prototype.onUpdateCanvas;
Neo.Painter.prototype._roundData = [];
Neo.Painter.prototype._toneData = [];
Neo.Painter.prototype.toolStack = [];

Neo.Painter.prototype.maskType = 0;
Neo.Painter.prototype.drawType = 0;
Neo.Painter.prototype.maskColor = "#000000";
Neo.Painter.prototype._currentColor = [];
Neo.Painter.prototype._currentMask = [];

Neo.Painter.prototype.aerr;

Neo.Painter.LINETYPE_NONE = 0;
Neo.Painter.LINETYPE_PEN = 1;
Neo.Painter.LINETYPE_ERASER = 2;
Neo.Painter.LINETYPE_BRUSH = 3;
Neo.Painter.LINETYPE_TONE = 4;
Neo.Painter.LINETYPE_DODGE = 5;
Neo.Painter.LINETYPE_BURN = 6;

Neo.Painter.MASKTYPE_NONE = 0;
Neo.Painter.MASKTYPE_NORMAL = 1;
Neo.Painter.MASKTYPE_REVERSE = 2;
Neo.Painter.MASKTYPE_ADD = 3;
Neo.Painter.MASKTYPE_SUB = 4;

Neo.Painter.DRAWTYPE_FREEHAND = 0;
Neo.Painter.DRAWTYPE_LINE = 1;
Neo.Painter.DRAWTYPE_BEZIER = 2;

Neo.Painter.ALPHATYPE_NONE = 0;
Neo.Painter.ALPHATYPE_PEN = 1;
Neo.Painter.ALPHATYPE_FILL = 2;
Neo.Painter.ALPHATYPE_BRUSH = 3;

Neo.Painter.TOOLTYPE_NONE = 0;
Neo.Painter.TOOLTYPE_PEN = 1;
Neo.Painter.TOOLTYPE_ERASER = 2;
Neo.Painter.TOOLTYPE_HAND = 3;
Neo.Painter.TOOLTYPE_SLIDER = 4;
Neo.Painter.TOOLTYPE_FILL = 5;
Neo.Painter.TOOLTYPE_MASK = 6;
Neo.Painter.TOOLTYPE_ERASEALL = 7;
Neo.Painter.TOOLTYPE_ERASERECT = 8;
Neo.Painter.TOOLTYPE_COPY = 9;
Neo.Painter.TOOLTYPE_PASTE = 10;
Neo.Painter.TOOLTYPE_MERGE = 11;
Neo.Painter.TOOLTYPE_FLIP_H = 12;
Neo.Painter.TOOLTYPE_FLIP_V = 13;

Neo.Painter.TOOLTYPE_BRUSH = 14;
Neo.Painter.TOOLTYPE_TEXT = 15;
Neo.Painter.TOOLTYPE_TONE = 16;
Neo.Painter.TOOLTYPE_BLUR = 17;
Neo.Painter.TOOLTYPE_DODGE = 18;
Neo.Painter.TOOLTYPE_BURN = 19;
Neo.Painter.TOOLTYPE_RECT = 20;
Neo.Painter.TOOLTYPE_RECTFILL = 21;
Neo.Painter.TOOLTYPE_ELLIPSE = 22;
Neo.Painter.TOOLTYPE_ELLIPSEFILL = 23;
Neo.Painter.TOOLTYPE_BLURRECT = 24;
Neo.Painter.TOOLTYPE_TURN = 25;

Neo.Painter.prototype.build = function(div, width, height)
{
    this.container = div;
    this._initCanvas(div, width, height);
    this._initRoundData();
    this._initToneData();
    this._initInputText();

    this.setTool(new Neo.PenTool());

};

Neo.Painter.prototype.setTool = function(tool) {
    if (this.tool && this.tool.saveStates) this.tool.saveStates();

    if (this.tool && this.tool.kill) {
        this.tool.kill();
    }
    this.tool = tool;
    tool.init();
    if (this.tool && this.tool.loadStates) this.tool.loadStates();
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

Neo.Painter.prototype.getCurrentTool = function() {
    if (this.tool) {
        var tool = this.tool;
        if (tool && tool.type == Neo.Painter.TOOLTYPE_SLIDER) {
            var stack = this.toolStack;
            if (stack.length > 0) {
                tool = stack[stack.length - 1];
            }
        }
        return tool;
    }
    return null;
};

Neo.Painter.prototype.setToolByType = function(toolType) {
    switch (parseInt(toolType)) {
    case Neo.Painter.TOOLTYPE_PEN:        this.setTool(new Neo.PenTool()); break;
    case Neo.Painter.TOOLTYPE_ERASER:     this.setTool(new Neo.EraserTool()); break;
    case Neo.Painter.TOOLTYPE_HAND:       this.setTool(new Neo.HandTool()); break;
    case Neo.Painter.TOOLTYPE_FILL:       this.setTool(new Neo.FillTool()); break;
    case Neo.Painter.TOOLTYPE_ERASEALL:   this.setTool(new Neo.EraseAllTool()); break;
    case Neo.Painter.TOOLTYPE_ERASERECT:  this.setTool(new Neo.EraseRectTool()); break;

    case Neo.Painter.TOOLTYPE_COPY:       this.setTool(new Neo.CopyTool()); break;
    case Neo.Painter.TOOLTYPE_PASTE:      this.setTool(new Neo.PasteTool()); break;
    case Neo.Painter.TOOLTYPE_MERGE:      this.setTool(new Neo.MergeTool()); break;
    case Neo.Painter.TOOLTYPE_FLIP_H:     this.setTool(new Neo.FlipHTool()); break;
    case Neo.Painter.TOOLTYPE_FLIP_V:     this.setTool(new Neo.FlipVTool()); break;

    case Neo.Painter.TOOLTYPE_BRUSH:      this.setTool(new Neo.BrushTool()); break;
    case Neo.Painter.TOOLTYPE_TEXT:       this.setTool(new Neo.TextTool()); break;
    case Neo.Painter.TOOLTYPE_TONE:       this.setTool(new Neo.ToneTool()); break;
    case Neo.Painter.TOOLTYPE_BLUR:       this.setTool(new Neo.BlurTool()); break;
    case Neo.Painter.TOOLTYPE_DODGE:      this.setTool(new Neo.DodgeTool()); break;
    case Neo.Painter.TOOLTYPE_BURN:       this.setTool(new Neo.BurnTool()); break;

    case Neo.Painter.TOOLTYPE_RECT:       this.setTool(new Neo.RectTool()); break;
    case Neo.Painter.TOOLTYPE_RECTFILL:   this.setTool(new Neo.RectFillTool()); break;
    case Neo.Painter.TOOLTYPE_ELLIPSE:    this.setTool(new Neo.EllipseTool()); break;
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:this.setTool(new Neo.EllipseFillTool()); break;
    case Neo.Painter.TOOLTYPE_BLURRECT:   this.setTool(new Neo.BlurRectTool()); break;
    case Neo.Painter.TOOLTYPE_TURN:       this.setTool(new Neo.TurnTool()); break;

    default:
        console.log("unknown toolType " + toolType);
        break;
    }
};

Neo.Painter.prototype._initCanvas = function(div, width, height) {
    width = parseInt(width);
    height = parseInt(height);
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

    var array = this.container.getElementsByTagName("canvas");
    if (array.length > 0) {
        this.destCanvas = array[0];
    } else {
        this.destCanvas = document.createElement("canvas");
        this.container.appendChild(this.destCanvas);
    }

    this.destCanvasCtx = this.destCanvas.getContext("2d");
    this.destCanvas.width = destWidth;
    this.destCanvas.height = destHeight;

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
    container.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
    }, false);
    container.addEventListener("touchmove", function(e) {
        ref._mouseMoveHandler(e);
    }, false);
    container.addEventListener("touchend", function(e) {
        ref._mouseUpHandler(e);
    }, false);

    document.onkeydown = function(e) {ref._keyDownHandler(e)};
    document.onkeyup = function(e) {ref._keyUpHandler(e)};

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
            this._toneData[i][j] = (i >= pattern[j]) ? 1 : 0;
        }
    }
};

Neo.Painter.prototype.getToneData = function(alpha) {
    var alphaTable = [23, 
                      47, 
                      69, 
                      92, 
                      114,
                      114,
                      114, 
                      138, 
                      161, 
                      184, 
                      184, 
                      207, 
                      230,
                      230,
                      253,
                     ];

    for (var i = 0; i < alphaTable.length; i++) {
        if (alpha < alphaTable[i]) {
            return this._toneData[i];
        }
    }
    return this._toneData[i];
};

Neo.Painter.prototype._initInputText = function() {
    var text = document.getElementById("inputtext");
    if (!text) {
        text = document.createElement("div");
    }

    text.id = "inputext";
    text.setAttribute("contentEditable", true);
    text.spellcheck = false;
    text.className = "inputText";
    text.innerHTML = "";

    text.style.display = "none";
//  text.style.userSelect = "none";
    Neo.painter.container.appendChild(text);
    this.inputText = text;

    this.updateInputText();
};

Neo.Painter.prototype.hideInputText = function() {
    var text = this.inputText;
    text.blur();
    text.style.display = "none";
};

Neo.Painter.prototype.updateInputText = function() {
    var text = this.inputText;
    var d = this.lineWidth;
    var fontSize = Math.round(d * 55/28 + 7);
    var height = Math.round(d * 68/28 + 12);

    text.style.fontSize = fontSize + "px";
    text.style.lineHeight = fontSize + "px";
    text.style.height = fontSize + "px";
    text.style.marginTop = -fontSize + "px";
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
    if (e.keyCode == 32) this.isSpaceDown = true;

    if (!this.isShiftDown && this.isCtrlDown) {
        if (!this.isAltDown) {
            if (e.keyCode == 90 || e.keyCode == 85) this.undo(); //Ctrl+Z,Ctrl.U
            if (e.keyCode == 89) this.redo(); //Ctrl+Y
        } else {
            if (e.keyCode == 90) this.redo(); //Ctrl+Alt+Z
        }
    }

    if (!this.isShiftDown && !this.isCtrlDown && !this.isAltDown) {
        if (e.keyCode == 107) new Neo.ZoomPlusCommand(this).execute(); // +
        if (e.keyCode == 109) new Neo.ZoomMinusCommand(this).execute(); // -
    }

    if (this.tool.keyDownHandler) {
        this.tool.keyDownHandler(e);
    }

    //スペース・Shift+スペースででスクロールしないように
    if (document.activeElement != this.inputText) e.preventDefault();
};

Neo.Painter.prototype._keyUpHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;
    if (e.keyCode == 32) this.isSpaceDown = false;

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
    if (e.target == Neo.painter.destCanvas) {
        //よくわからないがChromeでドラッグの時カレットが出るのを防ぐ
        //http://stackoverflow.com/questions/2745028/chrome-sets-cursor-to-text-while-dragging-why    
        e.preventDefault(); 
    }

    if (e.type == "touchstart" && e.touches.length > 1) return;

    if (e.button == 2 || this.virtualRight) {
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

    if (this.isMouseDownRight) {
        this.isMouseDownRight = false;
        if (!this.isWidget(e.target)) {
            this.pickColor(this.mouseX, this.mouseY);
            return;
        }
    }

    if (!this.isUIPaused()) {
        if (e.target['data-bar']) {
            this.pushTool(new Neo.HandTool());

        } else if (this.isSpaceDown && document.activeElement != this.inputText) {
            this.pushTool(new Neo.HandTool());
            this.tool.reverse = true;

        } else if (e.target['data-slider'] != undefined) {
            this.pushTool(new Neo.SliderTool());
            this.tool.target = e.target;

        } else if (e.ctrlKey && e.altKey && !e.shiftKey) {
            this.pushTool(new Neo.SliderTool());
            this.tool.target = Neo.sliders[Neo.SLIDERTYPE_SIZE].element;
            this.tool.alt = true;

        } else if (this.isWidget(e.target)) {
            this.isMouseDown = false;
            this.pushTool(new Neo.DummyTool());

        }
    }

//  console.warn("down -" + e.target.id + e.target.className)
    if (!(e.target.className == "o" && e.type == "touchdown")) {
        this.tool.downHandler(this);
    }

//  var ref = this;
//  document.onmouseup = function(e) {
//      ref._mouseUpHandler(e)
//  };
};

Neo.Painter.prototype._mouseUpHandler = function(e) {
    this.isMouseDown = false;
    this.isMouseDownRight = false;
    this.tool.upHandler(this);
//  document.onmouseup = undefined;

    if (e.target.id != "right") {
        this.virtualRight = false;
        Neo.RightButton.clear();
    }
    
//  if (e.changedTouches) {
//      for (var i = 0; i < e.changedTouches.length; i++) {
//          var touch = e.changedTouches[i];
//          if (touch.identifier == this.touchModifier) {
//              this.touchModifier = null;
//          }
//      }
//  }
};

Neo.Painter.prototype._mouseMoveHandler = function(e) {
    this._updateMousePosition(e);

    if (e.type == "touchmove" && e.touches.length > 1) return;

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
    if (!(e.target.className == "o" && e.type == "touchmove")) {
        e.preventDefault();
    }
};


Neo.Painter.prototype.getPosition = function(e) {
    if (e.clientX !== undefined) {
        return {x: e.clientX, y: e.clientY, e: e.type};

    } else {
        var touch = e.changedTouches[0];
        return {x: touch.clientX, y: touch.clientY, e: e.type};

//      for (var i = 0; i < e.changedTouches.length; i++) {
//          var touch = e.changedTouches[i];
//          if (!this.touchModifier || this.touchModifier != touch.identifier) {
//              return {x: touch.clientX, y: touch.clientY, e: e.type};
//          }
//      }
//      console.log("getPosition error");
//      return {x:0, y:0};
    }
}

Neo.Painter.prototype._updateMousePosition = function(e) {
    var rect = this.destCanvas.getBoundingClientRect();
//  var x = (e.clientX !== undefined) ? e.clientX : e.touches[0].clientX;
//  var y = (e.clientY !== undefined) ? e.clientY : e.touches[0].clientY;
    var pos = this.getPosition(e);
    var x = pos.x;
    var y = pos.y;
    
    if (this.zoom <= 0) this.zoom = 1; //なぜか0になることがあるので

    this.mouseX = (x - rect.left) / this.zoom 
        + this.zoomX 
        - this.destCanvas.width * 0.5 / this.zoom;
    this.mouseY = (y - rect.top)  / this.zoom 
        + this.zoomY 
        - this.destCanvas.height * 0.5 / this.zoom;

    if (isNaN(this.prevMouseX)) {
        this.prevMouseX = this.mouseX;
    }
    if (isNaN(this.prevMouseY)) {
        this.prevMosueY = this.mouseY;
    }

    this.slowX = this.slowX * 0.8 + this.mouseX * 0.2;
    this.slowY = this.slowY * 0.8 + this.mouseY * 0.2;
    var now = new Date().getTime();
    if (this.stab) {
        var pause = this.stab[3];
        if (pause) {
            // ポーズ中
            if (now > pause) {
                this.stab = [this.slowX, this.slowY, now];
            }
    
        } else {
            // ポーズされていないとき
            var prev = this.stab[2];
            if (now - prev > 150) { // 150ms以上止まっていたらポーズをオンにする
                this.stab[3] = now + 200 // 200msペンの位置を固定

            } else {
                this.stab = [this.slowX, this.slowY, now];
            }
        }
    } else {
        this.stab = [this.slowX, this.slowY, now];
    }
    
    this.rawMouseX = x;
    this.rawMouseY = y;
    this.clipMouseX = Math.max(Math.min(this.canvasWidth, this.mouseX), 0);
    this.clipMouseY = Math.max(Math.min(this.canvasHeight, this.mouseY), 0);
};

Neo.Painter.prototype._beforeUnloadHandler = function(e) {
    // quick save
};

Neo.Painter.prototype.getStabilized = function() {
    return this.stab;
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
        this._actionMgr.back();

        this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
        this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
        this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
    }
};

Neo.Painter.prototype.redo = function() {
    var undoItem = this._undoMgr.popRedo();
    
    if (undoItem) {
        this._actionMgr.forward();
        
        this._pushUndo(0,0,this.canvasWidth, this.canvasHeight, true);
        this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
        this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
        this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
    }
};

//Neo.Painter.prototype.hasUndo = function() {
//    return true;
//};

Neo.Painter.prototype._pushUndo = function(x, y, w, h, holdRedo) {
    x = (x === undefined) ? 0 : x;
    y = (y === undefined) ? 0 : y;
    w = (w === undefined) ? this.canvasWidth : w;
    h = (h === undefined) ? this.canvasHeight : h;
    var undoItem = new Neo.UndoItem();
    undoItem.x = 0;
    undoItem.y = 0;
    undoItem.width = w;
    undoItem.height = h;
    undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
    this._undoMgr.pushUndo(undoItem, holdRedo);

    if (!holdRedo) {
        this._actionMgr.step();
    }
};

Neo.Painter.prototype._pushRedo = function(x, y, w, h) {
    x = (x === undefined) ? 0 : x;
    y = (y === undefined) ? 0 : y;
    w = (w === undefined) ? this.canvasWidth : w;
    h = (h === undefined) ? this.canvasHeight : h;
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

Neo.Painter.prototype.setZoom = function(value) {
    this.zoom = value;

    var container = document.getElementById("container");
    var width = this.canvasWidth * this.zoom;
    var height = this.canvasHeight * this.zoom;
    if (width > container.clientWidth - 100) width = container.clientWidth - 100;
    if (height > container.clientHeight - 130) height = container.clientHeight - 130;
    this.destWidth = width;
    this.destHeight = height;

    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, false);
    this.setZoomPosition(this.zoomX, this.zoomY);
};

Neo.Painter.prototype.setZoomPosition = function(x, y) {
    var minx = (this.destCanvas.width / this.zoom) * 0.5;
    var maxx = this.canvasWidth - minx;
    var miny = (this.destCanvas.height / this.zoom) * 0.5;
    var maxy = this.canvasHeight - miny;


    x = Math.round(Math.max(Math.min(maxx,x),minx));
    y = Math.round(Math.max(Math.min(maxy,y),miny));

    this.zoomX = x;
    this.zoomY = y;
    this.updateDestCanvas(0,0,this.canvasWidth,this.canvasHeight,false);
    
    this.scrollBarX = (maxx == minx) ? 0 : (x - minx) / (maxx - minx);
    this.scrollBarY = (maxy == miny) ? 0 : (y - miny) / (maxy - miny);
    this.scrollWidth = maxx - minx;
    this.scrollHeight = maxy - miny;

    if (Neo.scrollH) Neo.scrollH.update(this);
    if (Neo.scrollV) Neo.scrollV.update(this);
    
    this.hideInputText();
};


/*
-------------------------------------------------------------------------
    Drawing Helper
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.submit = function(board) {
    var thumbnail = null;
    var thumbnail2 = null;

    if (this.useThumbnail()) {
        thumbnail = this.getThumbnail(Neo.config.thumbnail_type || "png");
        if (Neo.config.thumbnail_type2) {
            thumbnail2 = this.getThumbnail(Neo.config.thumbnail_type2);
        }
    }
    Neo.submit(board, this.getPNG(), thumbnail2, thumbnail);
};

Neo.Painter.prototype.useThumbnail = function() {
    var thumbnailWidth = this.getThumbnailWidth();
    var thumbnailHeight = this.getThumbnailHeight();
    if (thumbnailWidth && thumbnailHeight) {
        if (thumbnailWidth < this.canvasWidth ||
            thumbnailHeight < this.canvasHeight) {
            return true;
        }
    }
    return false;
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

Neo.Painter.prototype.getImage = function(imageWidth, imageHeight) {
    var width = this.canvasWidth;
    var height = this.canvasHeight;
    imageWidth = imageWidth || width;
    imageHeight = imageHeight || height;

    var pngCanvas = document.createElement("canvas");
    pngCanvas.width = imageWidth;
    pngCanvas.height = imageHeight;
    var pngCanvasCtx = pngCanvas.getContext("2d");
    pngCanvasCtx.fillStyle = "#ffffff";
    pngCanvasCtx.fillRect(0, 0, imageWidth, imageHeight);

    if (this.visible[0]) {
        pngCanvasCtx.drawImage(this.canvas[0], 
                               0, 0, width, height, 
                               0, 0, imageWidth, imageHeight);
    }
    if (this.visible[1]) {
        pngCanvasCtx.drawImage(this.canvas[1], 
                               0, 0, width, height, 
                               0, 0, imageWidth, imageHeight);
    }
    return pngCanvas;
};
    
Neo.Painter.prototype.getPNG = function() {
    var image = this.getImage();
    var dataURL = image.toDataURL('image/png');
    return this.dataURLtoBlob(dataURL);
};

Neo.Painter.prototype.getThumbnail = function(type) {
    if (type != "animation") {
        var thumbnailWidth = this.getThumbnailWidth();
        var thumbnailHeight = this.getThumbnailHeight();
        if (thumbnailWidth || thumbnailHeight) {
            var width = this.canvasWidth;
            var height = this.canvasHeight;
            if (thumbnailWidth == 0) {
                thumbnailWidth = thumbnailHeight * width / height;
            }
            if (thumbnailHeight == 0) {
                thumbnailHeight = thumbnailWidth * height / width;
            }
        } else {
            thumbnailWidth = thumbnailHeight = null;
        }

        console.log("get thumbnail", thumbnailWidth, thumbnailHeight);
        
        var image = this.getImage(thumbnailWidth, thumbnailHeight);
        var dataURL = image.toDataURL('image/' + type);
        return this.dataURLtoBlob(dataURL);
        
    } else {
        return new Blob([]); //animationには対応していないのでダミーデータを返す
    }
};

Neo.Painter.prototype.getThumbnailWidth = function() {
    var width = Neo.config.thumbnail_width;
    if (width) {
        if (width.match(/%$/)) {
            return Math.floor(this.canvasWidth * (parseInt(width) / 100.0));
        } else {
            return parseInt(width);
        }
    }
    return 0;
};

Neo.Painter.prototype.getThumbnailHeight = function() {
    var height = Neo.config.thumbnail_height;
    if (height) {
        if (height.match(/%$/)) {
            return Math.floor(this.canvasHeight * (parseInt(height) / 100.0));
        } else {
            return parseInt(height);
        }
    }
    return 0;
};

Neo.Painter.prototype.clearCanvas = function(doConfirm) {
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
};

Neo.Painter.prototype.updateDestCanvas = function(x, y, width, height, useTemp) {
    var canvasWidth = this.canvasWidth;
    var canvasHeight = this.canvasHeight;
    var updateAll = false;
    if (x == 0 && y == 0 && width == canvasWidth && height == canvasHeight) {
        updateAll = true;
    };

    if (x + width > this.canvasWidth) width = this.canvasWidth - x;
    if (y + height > this.canvasHeight) height = this.canvasHeight - y;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (width <= 0 || height <= 0) return;

    var ctx = this.destCanvasCtx;
    ctx.save();
    ctx.fillStyle = "#ffffff";

    var fillWidth = width
    var fillHeight = height
    
    if (updateAll) {
        ctx.fillRect(0, 0, this.destCanvas.width, this.destCanvas.height);

    } else {
        //カーソルの描画ゴミが残るのをごまかすため
        if (x + width == this.canvasWidth) fillWidth = width + 1;
        if (y + height == this.canvasHeight) fillHeight = height + 1;
    }
    
    ctx.translate(this.destCanvas.width*.5, this.destCanvas.height*.5);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.zoomX, -this.zoomY);
    ctx.globalAlpha = 1.0;
    ctx.msImageSmoothingEnabled = 0;

    if (!updateAll) {
        ctx.fillRect(x, y, fillWidth, fillHeight);
    }

    if (this.visible[0]) {
        ctx.drawImage(this.canvas[0], 
                      x, y, width, height, 
                      x, y, width, height);
    }
    if (this.visible[1]) {
        ctx.drawImage(this.canvas[1], 
                      x, y, width, height, 
                      x, y, width, height);
    }
    if (useTemp) {
        ctx.globalAlpha = 1.0; //this.alpha;
        ctx.drawImage(this.tempCanvas, 
                      x, y, width, height, 
                      x + this.tempX, y + this.tempY, width, height);
    }
    ctx.restore();
};

Neo.Painter.prototype.getBound = function(x0, y0, x1, y1, r) {
    var left = Math.floor((x0 < x1) ? x0 : x1);
    var top = Math.floor((y0 < y1) ? y0 : y1);
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
};

Neo.Painter.prototype.getColor = function(c) {
    if (!c) c = this.foregroundColor;
    var r = parseInt(c.substr(1, 2), 16);
    var g = parseInt(c.substr(3, 2), 16);
    var b = parseInt(c.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);
    return a<<24 | b<<16 | g<<8 | r;
};

Neo.Painter.prototype.getColorString = function(c) {
    var rgb = ("000000" + (c & 0xffffff).toString(16)).substr(-6);
    return '#' + rgb;
};

Neo.Painter.prototype.setColor = function(c) {
    if (typeof c != "string") c = this.getColorString(c);
    this.foregroundColor = c;

    Neo.updateUI();
};

Neo.Painter.prototype.getAlpha = function(type) {
    var a1 = this.alpha;

    switch (type) {
    case Neo.Painter.ALPHATYPE_PEN:
        if (a1 > 0.5) {
            a1 = 1.0/16 + (a1 - 0.5) * 30.0/16;
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
    if (a1 < 1.0/255) {
        this.aerr += a1;
        a1 = 0;
        while (this.aerr > 1.0/255) {
            a1 = 1.0/255;
            this.aerr -= 1.0/255;
        }
    }
    return a1;
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
    this._currentWidth = this.lineWidth;
};

Neo.Painter.prototype.isMasked = function (buf8, index) {
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

    var type = this.maskType;

    //TODO
    //いろいろ試したのですが半透明で描画するときの加算・逆加算を再現する方法がわかりません。
    //とりあえず単純に無視しています。
    if (type == Neo.Painter.MASKTYPE_ADD ||
        type == Neo.Painter.MASKTYPE_SUB) {
        if (this._currentColor[3] < 250) {
            type = Neo.Painter.MASKTYPE_NONE;
        }
    }

    switch (type) {
    case Neo.Painter.MASKTYPE_NONE:
        return;

    case Neo.Painter.MASKTYPE_NORMAL:
        return (r0 == r &&
                g0 == g &&
                b0 == b) ? true : false;

    case Neo.Painter.MASKTYPE_REVERSE:
        return (r0 != r ||
                g0 != g ||
                b0 != b) ? true : false;

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
};

Neo.Painter.prototype.setPoint = function(buf8, bufWidth, x0, y0, left, top, type) {
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
};


Neo.Painter.prototype.setPenPoint = function(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
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
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                var a = a0 + a1 - a0 * a1;
                if (a > 0) {
                    var a1x = Math.max(a1, 1.0/255);

                    var r = (r1 * a1x + r0 * a0 * (1 - a1x)) / a;
                    var g = (g1 * a1x + g0 * a0 * (1 - a1x)) / a;
                    var b = (b1 * a1x + b0 * a0 * (1 - a1x)) / a;

                    r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                    g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                    b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
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
};

Neo.Painter.prototype.setBrushPoint = function(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
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
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                var a = a0 + a1 - a0 * a1;
                if (a > 0) {
                    var a1x = Math.max(a1, 1.0/255);

                    var r = (r1 * a1x + r0 * a0) / (a0 + a1x);
                    var g = (g1 * a1x + g0 * a0) / (a0 + a1x);
                    var b = (b1 * a1x + b0 * a0) / (a0 + a1x);

                    r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                    g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                    b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
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
};

Neo.Painter.prototype.setTonePoint = function(buf8, width, x, y, x0, y0) {
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
                if (toneData[((y0+i)%4) + (((x0+j)%4) * 4)]) {
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
};

Neo.Painter.prototype.setEraserPoint = function(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;
    var a = Math.floor(this.alpha * 255);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var k = (buf8[index + 3] / 255.0) * (1.0 - (a / 255.0));

                buf8[index + 3] -= a / (d * (255.0 - a) / 255.0); 
            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.setBlurPoint = function(buf8, width, x, y, x0, y0) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var height = buf8.length / (width * 4);

//  var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);
    var a1 = this.alpha / 12;
    if (a1 == 0) return;
    var blur = a1;

    var tmp = new Uint8ClampedArray(buf8.length);
    for (var i = 0; i < buf8.length; i++) {
        tmp[i] = buf8[i];
    }

    var left = x0 - x - r0;
    var top = y0 - y - r0;

    var xstart = 0, xend = d;
    var ystart = 0, yend = d;
    if (xstart > left) xstart = -left;
    if (ystart > top) ystart = -top;
    if (xend > this.canvasWidth - left) xend = this.canvasWidth - left;
    if (yend > this.canvasHeight - top) yend = this.canvasHeight - top;

    for (var j = ystart; j < yend; j++) {
        var index = (j * width + xstart) * 4;
        for (var i = xstart; i < xend; i++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var rgba = [0, 0, 0, 0, 0];

                this.addBlur(tmp, index, 1.0 - blur*4, rgba);
                if (i > xstart) this.addBlur(tmp, index - 4, blur, rgba);
                if (i < xend - 1) this.addBlur(tmp, index + 4, blur, rgba);
                if (j > ystart) this.addBlur(tmp, index - width*4, blur, rgba);
                if (j < yend - 1) this.addBlur(tmp, index + width*4, blur, rgba);

                buf8[index + 0] = Math.round(rgba[0]);
                buf8[index + 1] = Math.round(rgba[1]);
                buf8[index + 2] = Math.round(rgba[2]);
                buf8[index + 3] = Math.round((rgba[3] / rgba[4]) * 255.0);
            }
            index += 4;
        }
    }
};

Neo.Painter.prototype.setDodgePoint = function(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
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
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                if (a1 != 255.0) {
                    var r1 = r0 * 255 / (255 - a1);
                    var g1 = g0 * 255 / (255 - a1);
                    var b1 = b0 * 255 / (255 - a1);
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
};

Neo.Painter.prototype.setBurnPoint = function(buf8, width, x, y) {
    var d = this._currentWidth;
    var r0 = Math.floor(d / 2);
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
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                if (a1 != 255.0) {
                    var r1 = 255 - (255 - r0) * 255 / (255 - a1);
                    var g1 = 255 - (255 - g0) * 255 / (255 - a1);
                    var b1 = 255 - (255 - b0) * 255 / (255 - a1);
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
};

//////////////////////////////////////////////////////////////////////

Neo.Painter.prototype.xorPixel = function(buf32, bufWidth, x, y, c) {
    var index = y * bufWidth + x;
    if (!c) c = 0xffffff;
    buf32[index] ^= c;
};

Neo.Painter.prototype.getBezierPoint = function(t, x0, y0, x1, y1, x2, y2, x3, y3) {
    var a0 = (1 - t) * (1 - t) * (1 - t);
    var a1 = (1 - t) * (1 - t) * t * 3;
    var a2 = (1 - t) *  t * t * 3;
    var a3 = t * t * t;

    var x = x0 * a0 + x1 * a1 + x2 * a2 + x3 * a3;
    var y = y0 * a0 + y1 * a1 + y2 * a2 + y3 * a3;
    return [x, y];
};

var nmax = 1;

Neo.Painter.prototype.drawBezier = function(ctx, x0, y0, x1, y1, x2, y2, x3, y3, type) {
    var xmax = Math.max(x0, x1, x2, x3);
    var xmin = Math.min(x0, x1, x2, x3);
    var ymax = Math.max(y0, y1, y2, y3);
    var ymin = Math.min(y0, y1, y2, y3);
    var n = Math.ceil(((xmax - xmin) + (ymax - ymin)) * 2.5);

    if (n > nmax) {
        n = (n < nmax * 2) ? n : nmax * 2;
        nmax = n;
    }

    for (var i = 0; i < n; i++) {
        var t = i * 1.0 / n;
        var p = this.getBezierPoint(t, x0, y0, x1, y1, x2, y2, x3, y3);
        this.drawPoint(ctx, p[0], p[1], type);
    }
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
    var r = Math.ceil(this._currentWidth / 2);
//  var r = Math.ceil(this.lineWidth / 2);

    var left = ((x0 < x1) ? x0 : x1) - r;
    var top = ((y0 < y1) ? y0 : y1) - r;

    var imageData = ctx.getImageData(left, top, width + r*2, height + r*2);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        
    this.aerr = 0;

    while (true) {
        if (this.prevLine == null ||
            !((this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
              (this.prevLine[2] == x0 && this.prevLine[3] == y0))) {
            this.setPoint(buf8, imageData.width, x0, y0, left, top, type);
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

Neo.Painter.prototype.drawPoint = function(ctx, x, y, type) {
    this.drawLine(ctx, x, y, x, y, type);
};

Neo.Painter.prototype.xorRect = function(buf32, bufWidth, x, y, width, height, c) {
    var index = y * bufWidth + x;
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            buf32[index] ^= c;
            index++;
        }
        index += width - bufWidth;
    }
};

Neo.Painter.prototype.drawXORRect = function(ctx, x, y, width, height, isFill, c) {
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
        for (var i = 0; i < width; i++) { //top
            buf32[index] = buf32[index] ^= c;
            index++;
        }
        if (height > 1) {
            index = width;
            for (var i = 1; i < height; i++) { //left
                buf32[index] = buf32[index] ^= c;
                index += width;
            }
            if (width > 1) {
                index = width * 2 - 1;
                for (var i = 1; i < height - 1; i++) { //right
                    buf32[index] = buf32[index] ^= c;
                    index += width;
                }
                index = width * (height - 1) + 1;
                for (var i = 1; i < width; i++) { // bottom
                    buf32[index] = buf32[index] ^= c;
                    index++;
                }
            }
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.drawXOREllipse = function(ctx, x, y, width, height, isFill, c) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    if (width == 0 || height == 0) return;
    if (!c) c = 0xffffff;

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);


    var a = width-1, b = height-1, b1 = b&1; /* values of diameter */
    var dx = 4*(1-a)*b*b, dy = 4*(b1+1)*a*a; /* error increment */
    var err = dx+dy+b1*a*a, e2; /* error of 1.step */

    var x0 = x;
    var y0 = y;
    var x1 = x0+a;
    var y1 = y0+b;

    if (x0 > x1) { x0 = x1; x1 += a; }
    if (y0 > y1) y0 = y1;
    y0 += Math.floor((b+1)/2); y1 = y0-b1;   /* starting pixel */
    a *= 8*a; b1 = 8*b*b;
    var ymin = y0 - 1;

    do {
        if (isFill) {
            if (ymin < y0) {
                this.xorRect(buf32, width, x0-x, y0 - y, x1 - x0, 1, c);
                if (y0 != y1) {
                    this.xorRect(buf32, width, x0-x, y1 - y, x1 - x0, 1, c);
                }
                ymin = y0;
            }
        } else {
            this.xorPixel(buf32, width, x1-x, y0-y, c);
            if (x0 != x1) {
                this.xorPixel(buf32, width, x0-x, y0-y, c);
            }
            if (y0 != y1) {
                this.xorPixel(buf32, width, x0-x, y1-y, c);
                if (x0 != x1) {
                    this.xorPixel(buf32, width, x1-x, y1-y, c);
                }
            }
        }
        e2 = 2*err;
        if (e2 <= dy) { y0++; y1--; err += dy += a; }  /* y step */ 
        if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; } /* x step */
    } while (x0 <= x1);

    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.drawXORLine = function(ctx, x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);

    var left = ((x0 < x1) ? x0 : x1);
    var top = ((y0 < y1) ? y0 : y1);
//  console.log("left:"+left+" top:"+top+" width:"+width+" height:"+height);

    var imageData = ctx.getImageData(left, top, width + 1, height + 1);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        

    while (true) {
        if (this.prevLine == null ||
            !((this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
              (this.prevLine[2] == x0 && this.prevLine[3] == y0))) {
            
            this.xorPixel(buf32, imageData.width, x0 - left, y0 - top, c);
        }

        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
};


Neo.Painter.prototype.eraseRect = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var a = 1.0 - this.alpha;
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
};

Neo.Painter.prototype.flipH = function(ctx, x, y, width, height) {
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
            buf32[index + i] = buf32[index2 -i];
            buf32[index2 - i] = value;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.flipV = function(ctx, x, y, width, height) {
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
};

Neo.Painter.prototype.merge = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = [];
    var buf32 = [];
    var buf8 = [];
    for (var i = 0; i < 2; i++) {
        imageData[i] = this.canvasCtx[i].getImageData(x, y, width, height);
        buf32[i] = new Uint32Array(imageData[i].data.buffer);
        buf8[i] = new Uint8ClampedArray(imageData[i].data.buffer);
    }

    var dst = this.current;
    var src = (dst == 1) ? 0 : 1;
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
            var r = Math.floor((r1 * a1 + r0 * a0 * (1 - a1)) / a + 0.5);
            var g = Math.floor((g1 * a1 + g0 * a0 * (1 - a1)) / a + 0.5);
            var b = Math.floor((b1 * a1 + b0 * a0 * (1 - a1)) / a + 0.5);
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
};

Neo.Painter.prototype.blurRect = function(ctx, x, y, width, height) {
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
    var a1 = this.alpha / 12;
    var blur = a1;

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var rgba = [0, 0, 0, 0, 0];

            this.addBlur(tmp, index, 1.0 - blur*4, rgba);

            if (i > 0) this.addBlur(tmp, index - 4, blur, rgba);
            if (i < width - 1) this.addBlur(tmp, index + 4, blur, rgba);
            if (j > 0) this.addBlur(tmp, index - width*4, blur, rgba);
            if (j < height - 1) this.addBlur(tmp, index + width*4, blur, rgba);

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
};

Neo.Painter.prototype.addBlur = function(buffer, index, a, rgba) {
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


    if (this.current > 0) {
        if (a == 0 && (result == 0xffffff || this.getEmulationMode() < 2.16)) {
            this.setToolByType(Neo.eraserTip.tools[Neo.eraserTip.mode]);

        } else {
            if (Neo.eraserTip.selected) {
                this.setToolByType(Neo.penTip.tools[Neo.penTip.mode]);
            }
        }
    }
};

Neo.Painter.prototype.fillHorizontalLine = function(buf32, x0, x1, y, color) {
    var index = y * this.canvasWidth + x0;
    for (var x = x0; x <= x1; x++) {
        buf32[index++] = color;
    }
};

Neo.Painter.prototype.scanLine = function(x0, x1, y, baseColor, buf32, stack) {
    var width = this.canvasWidth;
    for (var x = x0; x <= x1; x++) {
        stack.push({x:x, y: y})
    }
};

Neo.Painter.prototype.doFloodFill = function(layer, x, y, fillColor) {
    x = Math.round(x);
    y = Math.round(y);
    var ctx = this.canvasCtx[layer];
    
    if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) {
        return;
    }
    
    var imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var width = imageData.width;
    var stack = [{x: x, y: y}];

    var baseColor = buf32[y * width + x];

    if ((baseColor & 0xff000000) == 0 || (baseColor != fillColor)) {
        while (stack.length > 0) {
            if (stack.length > 1000000) {
                console.log('too much stack')
                break;
            }
            var point = stack.pop();
            var x = point.x;
            var y = point.y;
            var x0 = x;
            var x1 = x;
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
};

Neo.Painter.prototype.copy = function(x, y, width, height) {
    this.tempX = 0;
    this.tempY = 0;
    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    var imageData = this.canvasCtx[this.current].getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    this.temp = new Uint32Array(buf32.length);
    for (var i = 0; i < buf32.length; i++) {
        this.temp[i] = buf32[i];
    }

    //tempCanvasに乗せる画像を作る
    imageData = this.tempCanvasCtx.getImageData(x, y, width, height);
    buf32 = new Uint32Array(imageData.data.buffer);
    buf8 = new Uint8ClampedArray(imageData.data.buffer);
    for (var i = 0; i < buf32.length; i++) {
        if (this.temp[i] >> 24) {
            buf32[i] = this.temp[i] | 0xff000000;
        } else {
            buf32[i] = 0xffffffff;
        }
    }
    imageData.data.set(buf8);
    this.tempCanvasCtx.putImageData(imageData, x, y);
};


Neo.Painter.prototype.paste = function(x, y, width, height) {
    var ctx = this.canvasCtx[this.current];
//  console.log(this.tempX, this.tempY);

    var imageData = ctx.getImageData(x + this.tempX, y + this.tempY, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    for (var i = 0; i < buf32.length; i++) {
        buf32[i] = this.temp[i];
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x + this.tempX, y + this.tempY);

    this.temp = null;
    this.tempX = 0;
    this.tempY = 0;
    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype.turn = function(x, y, width, height) {
    var ctx = this.canvasCtx[this.current];
    
    // 傾けツールのバグを再現するため一番上のラインで対象領域を埋める
    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var temp = new Uint32Array(buf32.length);

    var index = 0;
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            temp[index] = buf32[index];
            if (index >= width) {
                buf32[index] = buf32[index % width];
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
};

Neo.Painter.prototype.doFill = function(ctx, x, y, width, height, maskFunc) {
    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.ALPHATYPE_FILL);

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            if (maskFunc && maskFunc.call(this, i, j, width, height)) {
                //なぜか加算逆加算は適用されない
                if (this.maskType >= Neo.Painter.MASKTYPE_ADD || 
                    !this.isMasked(buf8, index)) {
                    var r0 = buf8[index + 0];
                    var g0 = buf8[index + 1];
                    var b0 = buf8[index + 2];
                    var a0 = buf8[index + 3] / 255.0;

                    var a = a0 + a1 - a0 * a1;

                    if (a > 0) {
                        var a1x = a1;
                        var ax = 1 + a0 * (1 - a1x);

                        var r = (r1 + r0 * a0 * (1 - a1x)) / ax;
                        var g = (g1 + g0 * a0 * (1 - a1x)) / ax;
                        var b = (b1 + b0 * a0 * (1 - a1x)) / ax

                        r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                        g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                        b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
                    }

                    var tmp = a * 255;
                    a = Math.ceil(tmp);

                    buf8[index + 0] = r;
                    buf8[index + 1] = g;
                    buf8[index + 2] = b;
                    buf8[index + 3] = a;
                }
            }
            index += 4;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.rectFillMask = function(x, y, width, height) {
    return true;
};

Neo.Painter.prototype.rectMask = function(x, y, width, height) {
    var d = this._currentWidth;
//  var d = this.lineWidth;
    return (x < d || x > width - 1 - d || 
            y < d || y > height - 1 - d) ? true : false;
};

Neo.Painter.prototype.ellipseFillMask = function(x, y, width, height) {
    var cx = (width - 1) / 2.0;
    var cy = (height - 1) / 2.0;
    x = (x - cx) / (cx + 1);
    y = (y - cy) / (cy + 1);

    return ((x * x) + (y * y) < 1) ? true : false;
}

Neo.Painter.prototype.ellipseMask = function(x, y, width, height) {
    var d = this._currentWidth;
//  var d = this.lineWidth;
    var cx = (width - 1) / 2.0;
    var cy = (height - 1) / 2.0;

    if (cx <= d || cy <= d) return this.ellipseFillMask(x, y, width, height);

    var x2 = (x - cx) / (cx - d + 1);
    var y2 = (y - cy) / (cy - d + 1);

    x = (x - cx) / (cx + 1);
    y = (y - cy) / (cy + 1);

    if ((x * x) + (y * y) < 1) {
        if ((x2 * x2) + (y2 * y2) >= 1) {
            return true;
        }
    }
    return  false;
}

/*
-----------------------------------------------------------------------
*/

Neo.Painter.prototype.getDestCanvasPosition = function(mx, my, isClip, isCenter) {
    var mx = Math.floor(mx); //Math.round(mx);
    var my = Math.floor(my); //Math.round(my);
    if (isCenter) {
       mx += 0.499;
       my += 0.499;
    }
    var x = (mx - this.zoomX + this.destCanvas.width * 0.5 / this.zoom) * this.zoom;
    var y = (my - this.zoomY + this.destCanvas.height * 0.5 / this.zoom) * this.zoom;

    if (isClip) {
        x = Math.max(Math.min(x, this.destCanvas.width), 0);
        y =  Math.max(Math.min(y, this.destCanvas.height), 0);
    }
    return {x:x, y:y};
};

Neo.Painter.prototype.isWidget = function(element) {
    while (1) {
        if (element == null ||
            element.id == "canvas" || 
            element.id == "container") break;

        if (element.id == "tools" ||
            element.className == "buttonOn" || 
            element.className == "buttonOff" ||
            element.className == "inputText") {
            return true;
        }
        element = element.parentNode;
    }
    return  false;
};

Neo.Painter.prototype.isContainer = function(element) {
    while (1) {
        if (element == null) break;
        if (element.id == "container") return true;
        element = element.parentNode;
    }
    return false;
};

Neo.Painter.prototype.cancelTool = function(e) {
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
};

Neo.Painter.prototype.loadImage = function (filename) {
    console.log("loadImage " + filename);
    var img = new Image();
    img.src = filename;
    img.onload = function() {
        var oe = Neo.painter;
        oe.canvasCtx[0].drawImage(img, 0, 0);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);
    };
};

Neo.Painter.prototype.loadSession = function (filename) {
    if (Neo.storage) {
        var img0 = new Image();
        img0.src = Neo.storage.getItem('layer0');
        img0.onload = function() {
            var img1 = new Image();
            img1.src = Neo.storage.getItem('layer1');
            img1.onload = function() {
                var oe = Neo.painter;
                oe.canvasCtx[0].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
                oe.canvasCtx[1].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
                oe.canvasCtx[0].drawImage(img0, 0, 0);
                oe.canvasCtx[1].drawImage(img1, 0, 0);
                oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);
            }
        }
    }
};

Neo.Painter.prototype.saveSession = function() {
    if (Neo.storage) {
        Neo.storage.setItem('timestamp', +(new Date()));
        Neo.storage.setItem('layer0', this.canvas[0].toDataURL('image/png'));
        Neo.storage.setItem('layer1', this.canvas[1].toDataURL('image/png'));
    }
};

Neo.Painter.prototype.clearSession = function() {
    if (Neo.storage) {
        Neo.storage.removeItem('timestamp');
        Neo.storage.removeItem('layer0');
        Neo.storage.removeItem('layer1');
    }
};

Neo.Painter.prototype.sortColor = function(r0, g0, b0) {
    var min = (r0 < g0) ? ((r0 < b0) ? 0 : 2) : ((g0 < b0) ? 1 : 2);
    var max = (r0 > g0) ? ((r0 > b0) ? 0 : 2) : ((g0 > b0) ? 1 : 2);
    var mid = (min + max == 1) ? 2 : ((min + max == 2) ? 1 : 0);
    return [min, mid, max];
};

Neo.Painter.prototype.doText = function(layer, x, y,
                                        color, alpha,
                                        string, fontSize, fontFamily) {
    //テキスト描画
    if (string.length <= 0) return;

    //描画位置がずれるので適当に調整
    var offset = parseInt(fontSize, 10);
    var ctx = this.tempCanvasCtx;
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.save();
    ctx.translate(x, y);
    ctx.font = fontSize + " " + fontFamily;

    ctx.fillStyle = 0;
    ctx.fillText(string, 0, 0);
    ctx.restore();

    // 適当に二値化
    var r = color & 0xff;
    var g = (color & 0xff00) >> 8;
    var b = (color & 0xff0000) >> 16;
    var a = Math.round(alpha * 255.0);

    var imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var length = this.canvasWidth * this.canvasHeight;
    var index = 0;
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
    ctx.drawImage(this.tempCanvas,
                  0, 0, this.canvasWidth, this.canvasHeight,
                  0, 0, this.canvasWidth, this.canvasHeight);

    this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype.isUIPaused = function() {
    if (this.drawType == Neo.Painter.DRAWTYPE_BEZIER) {
        if (this.tool.step && this.tool.step > 0) {
            return true;
        }
    }
    return false;
};

Neo.Painter.prototype.getEmulationMode = function() {
    return parseFloat(Neo.config.neo_emulation_mode || 2.22)
};

/*
-------------------------------------------------------------------------
    Animation保存テスト
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.snapshot = [];
Neo.Painter.prototype.saveSnapshot = function() {
    var width = this.canvasWidth;
    var height = this.canvasHeight;
    this.snapshot = [this.canvasCtx[0].getImageData(0, 0, width, height),
                     this.canvasCtx[1].getImageData(0, 0, width, height)];
};

Neo.Painter.prototype.loadSnapshot = function() {
    this.canvasCtx[0].putImageData(this.snapshot[0], 0, 0);
    this.canvasCtx[1].putImageData(this.snapshot[1], 0, 0);
};

Neo.Painter.prototype.play = function() {
    this.saveSnapshot();

    if (this._actionMgr) {
        this._actionMgr.clearCanvas();
        this._actionMgr._head = 0;
        this.prevLine = null;

        this._actionMgr.play();
    }
};

