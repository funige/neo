'use strict';


/*
  -----------------------------------------------------------------------
    Action Manager
  -----------------------------------------------------------------------
*/

Neo.ActionManager = function() {
    this._items = [];
    this._head = 0;
    this._index = 0;
    
    this._pause = false;
    this._mark = 0;

    this._speedTable = [-1, 0, 1, 11];
    this._speed = parseInt(Neo.config.speed || 0);
    this._speedMode = this.generateSpeedTable();

    this._prevSpeed = this._speed; // freeHandの途中で速度が変わると困るので
};

Neo.ActionManager.prototype.generateSpeedTable = function() {
    var speed = this._speed;
    var mode = 0;

    if (speed < 0) {
        mode = 0;

    } else if (speed == 0) {
        mode = 1;
        
    } else if (speed <= 10) {
        mode = 2;

    } else {
        mode = 3;
    }
    this._speedTable[mode] = speed;
    return mode;
};

Neo.ActionManager.prototype.step = function() {
    if (!Neo.animation) return;
    
    if (this._items.length > this._head) {
        this._items.length = this._head;
    }
    this._items.push([]);
    this._head++;
    this._index = 0;
};

Neo.ActionManager.prototype.back = function() {
    if (!Neo.animation) return;

    if (this._head > 0) {
        this._head--;
    }
};

Neo.ActionManager.prototype.forward = function() {
    if (!Neo.animation) return;

    if (this._head < this._items.length) {
        this._head++;
    }
};

Neo.ActionManager.prototype.push = function() {
    if (!Neo.animation) return;

    var head = this._items[this._head - 1];
    for (var i = 0; i < arguments.length; i++) {
        head.push(arguments[i]);
    }
};

Neo.ActionManager.prototype.pushCurrent = function() {
    if (!Neo.animation) return;

    var oe = Neo.painter;
    var head = this._items[this._head - 1];

    var color = oe._currentColor;
    var mask = oe._currentMask;
    var width = oe._currentWidth;
    var type = oe._currentMaskType;

    head.push(color[0], color[1], color[2], color[3]);
    head.push(mask[0], mask[1], mask[2]);
    head.push(width);
    head.push(type);
};

Neo.ActionManager.prototype.getCurrent = function(item) {
    var oe = Neo.painter;

    oe._currentColor = [item[2], item[3], item[4], item[5]];
    oe._currentMask = [item[6], item[7], item[8]];
    oe._currentWidth = item[9];
    oe._currentMaskType = item[10];
};

Neo.ActionManager.prototype.skip = function(wait) {
    for (var i = 0; i < this._items.length; i++) {
        if (this._items[i][0] == 'restore') {
            this._head = i;
        }
    }
};

Neo.ActionManager.prototype.play = function(wait) {
    if (!wait) {
        wait = (this._prevSpeed < 0) ? 0 : this._prevSpeed;
        wait *= 1; //2
    }
    if (Neo.viewerBar) Neo.viewerBar.update();
    
    if (this._pause) {
        console.log('suspend viewer');
        return;
    }

    if ((this._head < this._items.length) && (this._head < this._mark)) {
        var item = this._items[this._head];

        if (!Neo.viewer) {
            Neo.painter._pushUndo(0, 0,
                                  Neo.painter.canvasWidth,
                                  Neo.painter.canvasHeight,
                                  true);
        }

        if (Neo.viewer && Neo.viewerBar) {
            console.log("play", item[0], this._head + 1, this._items.length);
        }

        var that = this;
        if (item[0] && this[item[0]]) {
            (this[item[0]])(item, function(result) {
                if (result) {
                    that._head++;
                    that._index = 0;
                    that._prevSpeed = that._speed;
                }

                if (!Neo.viewer ||
                    ((that._prevSpeed < 0) && (that._head % 10 != 0))) {
                    Neo.painter._actionMgr.play();

                } else {
                    setTimeout(function () {
                        Neo.painter._actionMgr.play();
                    }, wait);
                }
            });
        }

    } else {
        Neo.painter.dirty = false;
        Neo.painter.busy = false;
    }
}

/*
-------------------------------------------------------------------------
    Action
-------------------------------------------------------------------------
*/

Neo.ActionManager.prototype.clearCanvas = function() {
    if (typeof arguments[0] != "object") {
        this.push('clearCanvas');
    }
    
    var oe = Neo.painter;
    oe.canvasCtx[0].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.canvasCtx[1].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.floodFill = function(layer, x, y, color) {
    if (typeof layer != "object") {
        this.push('floodFill', layer, x, y, color);

    } else {
        var item = layer;
        layer = item[1];
        x = item[2];
        y = item[3];
        color = item[4];
    }

    var oe = Neo.painter;
    oe.doFloodFill(layer, x, y, color);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.eraseAll = function() {
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (typeof arguments[0] != "object") {
        this.push('eraseAll', layer);

    } else {
        var item = arguments[0];
        layer = item[1];
    }

    var oe = Neo.painter;
    oe.canvasCtx[layer].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.freeHand = function(x0, y0, lineType) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('freeHand', layer);
        this.pushCurrent();
        this.push(lineType, x0, y0, x0, y0);
        
        oe.drawLine(oe.canvasCtx[layer], x0, y0, x0, y0, lineType);

    } else if (!Neo.viewer || this._prevSpeed <= 0) {
        this.freeHandFast(arguments[0], arguments[1]);
        
    } else {
        var item = arguments[0];

        layer = item[1];
        lineType = item[11];
        this.getCurrent(item);

        var i = this._index;
        if (i == 0) {
            i = 12;
        } else {
            i += 2;
        }

        var x1 = item[i + 0];
        var y1 = item[i + 1];
        x0 = item[i + 2];
        y0 = item[i + 3];

        oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

        this._index = i;
        var result = (i + 2 + 3) >= item.length;
 
        if (!result) {
            oe.prevLine = null;
        }
        
        var callback = arguments[1];
        if (callback && typeof callback == "function") {
            callback(result);
        }
    }
}

Neo.ActionManager.prototype.freeHandFast = function(x0, y0, lineType) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('freeHand', layer);
        this.pushCurrent();
        this.push(lineType, x0, y0, x0, y0);
        
        oe.drawLine(oe.canvasCtx[layer], x0, y0, x0, y0, lineType);

    } else {
        var item = arguments[0];
        var length = item.length;
        
        layer = item[1];
        this.getCurrent(item);

        lineType = item[11];
        x0 = item[12];
        y0 = item[13];
        var x1, y1;

        for (var i = 14; i + 1 < length; i += 2) {
            x1 = x0;
            y1 = y0;
            x0 = item[i + 0]
            y0 = item[i + 1]
            oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
        }
        oe.prevLine = null;
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.freeHandMove = function(x0, y0, x1, y1, lineType) {
    if (arguments.length > 1) {
        var oe = Neo.painter;
        var layer = oe.current;
        var head = this._items[this._head - 1];
        if (head && head.length == 0) {
            this.push('freeHand', layer);
            this.pushCurrent();
            this.push(lineType, x1, y1, x0, y0);

        } else if (Neo.animation) {
            head.push(x0, y0);

            // 記録漏れがないか確認
            var x = head[head.length - 4]
            var y = head[head.length - 3]
            if (x1 != head[head.length - 4] ||
                y1 != head[head.length - 3] ||
                lineType != head[11]) {
                console.log('eror in freeHandMove?', x, y, lineType, head)
            }
        }
        oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
        
    } else {
        console.log('error in freeHandMove: called from recorder', head);
    }
}

Neo.ActionManager.prototype.line = function(
    x0, y0,
    x1, y1,
    lineType)
{
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('line', layer);
        this.pushCurrent();
        this.push(lineType, x0, y0, x1, y1);

    } else {
        var item = arguments[0];

        layer = item[1];
        this.getCurrent(item);

        lineType = item[11];
        x0 = item[12];
        y0 = item[13];
        x1 = item[14];
        y1 = item[15];
    }
    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.bezier = function(
    x0, y0,
    x1, y1,
    x2, y2,
    x3, y3,
    lineType)
{
    var oe = Neo.painter;
    var layer = oe.current;
    var isReplay = true;
    
    if (typeof arguments[0] != "object") {
        this.push('bezier', layer)
        this.pushCurrent();
        this.push(lineType, x0, y0, x1, y1, x2, y2, x3, y3);
        isReplay = false;
        
    } else {
        var item = arguments[0];
        layer = item[1];
        this.getCurrent(item);
        
        lineType = item[11];
        x0 = item[12];
        y0 = item[13];
        x1 = item[14];
        y1 = item[15];
        x2 = item[16];
        y2 = item[17];
        x3 = item[18];
        y3 = item[19];
    }
    oe.drawBezier(oe.canvasCtx[layer], x0, y0, x1, y1, x2, y2, x3, y3, lineType, isReplay);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.fill = function(x, y, width, height, type) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('fill', layer);
        this.pushCurrent();
        this.push(x, y, width, height, type);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        this.getCurrent(item);
        
        x = item[11];
        y = item[12];
        width = item[13];
        height = item[14];
        type = item[15];
    }

    oe.doFill(layer, x, y, width, height, type);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.flipH = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('flipH', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.flipH(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.flipV = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (typeof arguments[0] != "object") {
        this.push('flipV', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.flipV(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.merge = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('merge', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.merge(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.blurRect = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;


    if (typeof arguments[0] != "object") {
        this.push('blurRect', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.blurRect(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.eraseRect2 = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('eraseRect2', layer);
        this.pushCurrent();
        this.push(x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        this.getCurrent(item);
        
        x = item[11];
        y = item[12];
        width = item[13];
        height = item[14];
    }
    oe.eraseRect(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.eraseRect = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('eraseRect', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.eraseRect(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.copy = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('copy', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }

    oe.copy(layer, x, y, width, height);
    oe.tool.x = x;
    oe.tool.y = y;
    oe.tool.width = width;
    oe.tool.height = height;
//  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.paste = function(x, y, width, height, dx, dy) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('paste', layer, x, y, width, height, dx, dy);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
        dx = item[6];
        dy = item[7];
    }

    oe.paste(layer, x, y, width, height, dx, dy);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.turn = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (typeof arguments[0] != "object") {
        this.push('turn', layer, x, y, width, height);
        
    } else {
        var item = arguments[0];
        layer = item[1];
        x = item[2];
        y = item[3];
        width = item[4];
        height = item[5];
    }
    oe.turn(layer, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.text = function(
    x, y,
    color,
    alpha,
    string,
    size,
    family)
{
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (typeof arguments[0] != "object") {
        this.push('text', layer, x, y, color, alpha, string, size, family);

    } else {
        var item = arguments[0];
        
        layer = item[1];
        x = item[2];
        y = item[3];
        color = item[4];
        alpha = item[5];
        string = item[6];
        size = item[7];
        family = item[8];
    }
    oe.doText(layer, x, y, color, alpha, string, size, family);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var callback = arguments[1];
    if (callback && typeof callback == "function") callback(true);
}

Neo.ActionManager.prototype.restore = function() {
    var oe = Neo.painter;
    var width = oe.canvasWidth;
    var height = oe.canvasHeight;
    
    if (typeof arguments[0] != "object") {
        this.push('restore');

        var img0 = oe.canvas[0].toDataURL('image/png');
        var img1 = oe.canvas[1].toDataURL('image/png');
        this.push(img0, img1);
        
    } else {
        var item = arguments[0];
        var callback = arguments[1];

        var img0 = new Image();
        img0.src = item[1];
        img0.onload = function() {
            var img1 = new Image();
            img1.src = item[2];
            img1.onload = function() {
                oe.canvasCtx[0].clearRect(0, 0, width, height);
                oe.canvasCtx[1].clearRect(0, 0, width, height);
                oe.canvasCtx[0].drawImage(img0, 0, 0);
                oe.canvasCtx[1].drawImage(img1, 0, 0);
                oe.updateDestCanvas(0, 0, width, height);

                if (callback && typeof callback == "function") callback(true);
            }
        }
    }
}

/*
  -----------------------------------------------------------------------
    動画表示モード
  -----------------------------------------------------------------------
*/

Neo.createViewer = function(applet) {
    var neo = document.createElement("div");
    neo.className = "NEO";
    neo.id = "NEO";
    var html = (function() {/*
<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>

<div id="pageView" style="margin:auto;">
<div id="container" style="visibility:visible;" class="o">

<div id="painter" style="background-color:white;">
<div id="canvas" style="background-color:white;">
</div>
</div>


<div id="viewerButtonsWrapper" style="display:block;">
<div id="viewerButtons" style="display:block;">

<div id="viewerPlay"></div>
<div id="viewerStop"></div>
<div id="viewerRewind"></div>
<div id="viewerSpeed" style="padding-left:2px; margin-top: 1px;">ほ</div>
<div id="viewerPlus"></div>
<div id="viewerMinus"></div>

<div id="viewerBar" style="display:inline-block;">
<!--
  <div id="viewerBarLeft" style="width:calc(50% - 2px); height:16px; position: absolute; top: 1px; left: 1px;"></div>
  <div id="viewerBarMark" style="background-color:red; width:1px; height:16px; position:absolute; top:1px; left:1px;"></div>
-->
</div>
</div>

</div>
</div>
                                 */}).toString().match(/\/\*([^]*)\*\//)[1];

    neo.innerHTML = html.replace(/\[(.*?)\]/g, function(match, str) {
	return Neo.translate(str)
    })
    
    var parent = applet.parentNode;
    parent.appendChild(neo);
    parent.insertBefore(neo, applet);

    // applet.style.display = "none";

    // NEOを組み込んだURLをアプリ版で開くとDOMツリーが2重にできて格好悪いので消しておく
    setTimeout(function() {
        var tmp = document.getElementsByClassName("NEO");
        if (tmp.length > 1) {
            for (var i = 1; i < tmp.length; i++) {
                tmp[i].style.display = "none";
            }
        }
    }, 0);
};

Neo.initViewer = function(pch) {
    var pageview = document.getElementById("pageView");
    var pageWidth = Neo.config.applet_width;
    var pageHeight = Neo.config.applet_height;
    pageview.style.width = pageWidth + "px";
    pageview.style.height = pageHeight + "px";
    
    Neo.canvas = document.getElementById("canvas");
    Neo.container = document.getElementById("container");
    Neo.container.style.backgroundColor = Neo.config.color_back;
    Neo.container.style.border = "0";

    var dx = (pageWidth - Neo.config.width) / 2;
    var dy = (pageHeight - Neo.config.height - 26) / 2;
    
    var painter = document.getElementById("painter");

    painter.style.marginTop = "0";
    painter.style.position = "absolute";
    painter.style.padding = "0";
    painter.style.bottom = (dy + 26) + "px";
    painter.style.left = (dx) + "px";

    var viewerButtonsWrapper = document.getElementById("viewerButtonsWrapper");
    viewerButtonsWrapper.style.width = (pageWidth - 2) + "px";
    
    var viewerBar = document.getElementById("viewerBar");
    viewerBar.style.position = "absolute";
    viewerBar.style.right = "2px";
    viewerBar.style.top = "1px";
    viewerBar.style.width = (pageWidth - (24 * 6) - 2) + "px"; 
    
    Neo.canvas.style.width = Neo.config.width + "px";
    Neo.canvas.style.height = Neo.config.height + "px";
    
    Neo.painter = new Neo.Painter();
    Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);
    
    Neo.container.oncontextmenu = function() {return false;};

    painter.addEventListener('mousedown', function() {
        Neo.painter._actionMgr.isMouseDown = true;
    }, false);
    
    document.addEventListener('mousemove', function(e) {
        if (Neo.painter._actionMgr.isMouseDown) {
            var zoom = Neo.painter.zoom;
            var x = Neo.painter.zoomX - e.movementX / zoom;
            var y = Neo.painter.zoomY - e.movementY / zoom;
            Neo.painter.setZoomPosition(x, y);
        }
    }, false);
    document.addEventListener('mouseup', function() {
        Neo.painter._actionMgr.isMouseDown = false;
        Neo.viewerBar.isMouseDown = false;
    }, false);
    
    if (pch) {//Neo.config.pch_file) {
        Neo.painter._actionMgr._items = pch.data;
        Neo.painter.play();
    }
};

Neo.startViewer = function() {
    var name = Neo.applet.attributes.name.value || "pch";
    if (!document[name]) document[name] = Neo;
    Neo.applet.parentNode.removeChild(Neo.applet);

    Neo.styleSheet = Neo.getStyleSheet();
    var lightBack = Neo.multColor(Neo.config.color_back, 1.3);
    var darkBack = Neo.multColor(Neo.config.color_back, 0.7);
    
    Neo.addRule(".NEO #viewerButtons", "color", Neo.config.color_text);
    Neo.addRule(".NEO #viewerButtons", "background-color", Neo.config.color_back);

    Neo.addRule(".NEO #viewerButtonsWrapper", "border", "1px solid " + Neo.config.color_frame + " !important");

    Neo.addRule(".NEO #viewerButtons", "border", "1px solid " + Neo.config.color_back + " !important");
    Neo.addRule(".NEO #viewerButtons", "border-left", "1px solid " + lightBack + " !important");
    Neo.addRule(".NEO #viewerButtons", "border-top", "1px solid " + lightBack + " !important");

    Neo.addRule(".NEO #viewerButtons >div.buttonOff", "background-color", Neo.config.color_icon + " !important");

    Neo.addRule(".NEO #viewerButtons >div.buttonOff:active", "background-color", darkBack + " !important");
    Neo.addRule(".NEO #viewerButtons >div.buttonOn", "background-color", darkBack + " !important");

    Neo.addRule(".NEO #viewerButtons >div", "border", "1px solid " + Neo.config.color_frame + " !important");
    
    Neo.addRule(".NEO #viewerButtons >div.buttonOff:hover", "border", "1px solid" + Neo.config.color_bar_select + " !important");

    Neo.addRule(".NEO #viewerButtons >div.buttonOff:active", "border", "1px solid" + Neo.config.color_bar_select + " !important");
    Neo.addRule(".NEO #viewerButtons >div.buttonOn", "border", "1px solid" + Neo.config.color_bar_select + " !important");

    Neo.addRule(".NEO #viewerBar >div", "background-color", Neo.config.color_bar);
//  Neo.addRule(".NEO #viewerBar:active", "background-color", darkBack);
    Neo.addRule(".NEO #viewerBarMark", "background-color", Neo.config.color_text + " !important");

    setTimeout(function () {
        Neo.viewerPlay = new Neo.ViewerButton().init("viewerPlay");
        Neo.viewerPlay.setSelected(true);
        Neo.viewerPlay.onmouseup = function() {
            Neo.painter.onplay();
        }
        Neo.viewerStop = new Neo.ViewerButton().init("viewerStop");
        Neo.viewerStop.onmouseup = function() {
            Neo.painter.onstop();
        }
        
        new Neo.ViewerButton().init("viewerRewind").onmouseup = function() {
            Neo.painter.onrewind();
        }
        new Neo.ViewerButton().init("viewerSpeed").onmouseup = function() {
            Neo.painter.onspeed();
            this.update();
        };
        new Neo.ViewerButton().init("viewerPlus").onmouseup = function() {
            new Neo.ZoomPlusCommand(Neo.painter).execute();
        };
        new Neo.ViewerButton().init("viewerMinus").onmouseup = function() {
            new Neo.ZoomMinusCommand(Neo.painter).execute();
        };

        var length = Neo.painter._actionMgr._items.length;
        Neo.viewerBar = new Neo.ViewerBar().init("viewerBar", { length:length });

    }, 0);
};

Neo.getFilename = function() {
    return Neo.config.pch_file || Neo.config.image_canvas;
};

Neo.getPCH = function(filename, callback) {
    if (!filename || filename.slice(-4).toLowerCase() != ".pch") return null;
    
    var request = new XMLHttpRequest();
    request.open("GET", filename, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        var byteArray = new Uint8Array(request.response);
//      var data = LZString.decompressFromUint8Array(byteArray.slice(12));
//      var header = byteArray.slice(0, 12);
        var data = LZString.decompressFromUint8Array(byteArray.subarray(12));
        var header = byteArray.subarray(0, 12);

        if ((header[0] == "N".charCodeAt(0)) &&
            (header[1] == "E".charCodeAt(0)) &&
            (header[2] == "O".charCodeAt(0))) {
            var width = header[4] + header[5] * 0x100
            var height = header[6] + header[7] * 0x100

            //console.log('NEO animation:', width, 'x', height);
            if (callback) {
                var items = Neo.fixPCH(JSON.parse(data))
                callback({
                    width:width,
                    height:height,
                    data:items
                });
            }
            
        } else {
            console.log('not a NEO animation:');
        }
    }
    request.send();
};

Neo.fixPCH = function(items) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        var index = item.indexOf('eraseAll');
        if (index > 0) {
            var tmp = item.slice(index);
            var tmp2 = item.slice(0, index);
            console.log("fix eraseAll", tmp2, tmp);

            items[i] = tmp2;
            items.splice(i, 0, tmp)
        }
    }
    return items;
};

/*
  -----------------------------------------------------------------------
    LiveConnect
  -----------------------------------------------------------------------
*/

Neo.playPCH = function() {
    Neo.painter.onplay();
};

Neo.suspendDraw = function() {
    Neo.painter.onstop();
};

Neo.setSpeed = function(value) {
    Neo.painter._actionMgr._speed = value;
};

Neo.setMark = function(value) {
    Neo.painter._actionMgr._mark = value;
    Neo.painter.onmark();
};

Neo.getSeek = function() {
    return Neo.painter._actionMgr._head;
};

Neo.getLineCount = function() {
    return Neo.painter._actionMgr._items.length;
};
