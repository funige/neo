'use strict';


Neo.ActionManager = function() {
    this._items = [];
    this._head = 0;
}

Neo.ActionManager.prototype.step = function() {
    if (!Neo.animation) return;
    
    if (this._items.length > this._head) {
        this._items.length = this._head;
    }
    this._items.push([]);
    this._head++;
}

Neo.ActionManager.prototype.back = function() {
    if (!Neo.animation) return;

    if (this._head > 0) {
        this._head--;
    }
}

Neo.ActionManager.prototype.forward = function() {
    if (!Neo.animation) return;

    if (this._head < this._items.length) {
        this._head++;
    }
}

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

Neo.ActionManager.prototype.play = function(wait) {
    if (!wait) wait = 0;
    
    if (this._head < this._items.length) {
        var item = this._items[this._head];

        if (!Neo.viewer) {
            Neo.painter._pushUndo(0, 0,
                                  Neo.painter.canvasWidth,
                                  Neo.painter.canvasHeight,
                                  true);
        }

        if (Neo.viewer) {
            console.log("play", item[0], this._head, this._items.length);
        }

        if (item[0] != "restore") {
            // sync
            if (item[0] && this[item[0]]) {
                (this[item[0]])(item);
            }
            this._head++;

            setTimeout(function() {
                Neo.painter._actionMgr.play(wait);
            }, wait);

        } else {
            // async
            if (item[0] && this[item[0]]) {
                (this[item[0]])(item, function() {
                    Neo.painter._actionMgr.play(wait);
                });
            }
            this._head++;
        }

    } else {
        Neo.painter.dirty = false;
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
}

Neo.ActionManager.prototype.freeHand = function(x0, y0, lineType) {
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (arguments.length > 1) {
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

    if (arguments.length > 1) {
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
    
    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.fill = function(x, y, width, height, type) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.flipH = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.flipV = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.merge = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.blurRect = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.eraseRect2 = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.eraseRect = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.copy = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.paste = function(x, y, width, height, dx, dy) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.turn = function(x, y, width, height) {
    var oe = Neo.painter;
    var layer = oe.current;

    if (arguments.length > 1) {
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
    
    if (arguments.length > 1) {
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
}

Neo.ActionManager.prototype.restore = function() {
    var oe = Neo.painter;
    var width = oe.canvasWidth;
    var height = oe.canvasHeight;
    
    if (arguments.length == 0) {
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

                if (callback) callback();
            }
        }
    }
}
