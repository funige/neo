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

Neo.ActionManager.prototype.play = function() {
    if (this._head < this._items.length) {
        var item = this._items[this._head];

        //console.log("play", item[0], this._head, this._items.length);
        if (item[0] && this[item[0]]) {
            (this[item[0]])(item);
        }
        this._head++;

        setTimeout(function() {
            Neo.painter._actionMgr.play();
        }, 10);
    }
}


/*
-------------------------------------------------------------------------
    Action
-------------------------------------------------------------------------
*/

Neo.ActionManager.prototype.clearCanvas = function() {
    if (typeof arguments[0] != "object") {
        var head = this._items[this._head - 1]
        head.push('clearCanvas')
    }
    
    var oe = Neo.painter;
    oe.canvasCtx[0].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.canvasCtx[1].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);
}

Neo.ActionManager.prototype.floodFill = function(layer, x, y, color) {
    if (typeof layer != "object") {
        var head = this._items[this._head - 1];
        head.push('floodFill');
        head.push(layer);
        head.push(x);
        head.push(y);
        head.push(color);

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
    
    if (typeof layer != "object") {
        var head = this._items[this._head - 1];
        head.push('eraseAll');
        head.push(layer);

    } else {
        var item = layer;
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
        var head = this._items[this._head - 1];

        head.push('freeHand');
        head.push(layer);
        oe.setCurrent(head);

        head.push(lineType);
        head.push(x0, y0, x0, y0);
        
        oe.drawLine(oe.canvasCtx[layer], x0, y0, x0, y0, lineType);

    } else {
        var item = arguments[0];
        var length = item.length;
        
        layer = item[1];
        oe.getCurrent(item);

        lineType = item[11];
        x0 = item[12];
        y0 = item[13];
        var x1, y1;

        for (var i = 14; i + 2 < length; i += 2) {
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
        if (head.length == 0) {
            head.push('freeHand')
            head.push(layer)
            oe.setCurrent(head);

            head.push(lineType);
            head.push(x1, y1, x0, y0);

        } else {
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('line');
        head.push(layer);
        oe.setCurrent(head);

        head.push(lineType);
        head.push(x0, y0, x1, y1);

    } else {
        var item = arguments[0];

        layer = item[1];
        oe.getCurrent(item);

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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;
        
        head.push('bezier');
        head.push(layer);
        oe.setCurrent(head);

        head.push(lineType);
        head.push(x0, y0, x1, y1, x2, y2, x3, y3);

    } else {
        var item = arguments[0];
        layer = item[1];
        oe.getCurrent(item);
        
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
    oe.drawBezier(oe.canvasCtx[layer], x0, y0, x1, y1, x2, y2, x3, y3, lineType);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
}

Neo.ActionManager.prototype.fill = function(x, y, width, height, type) {
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('fill');
        head.push(layer);
        oe.setCurrent(head);

        head.push(x, y, width, height);
        head.push(type);

    } else {
        var item = arguments[0];
        layer = item[1];
        oe.getCurrent(item);

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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('flipH');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('flipV');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('merge');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('blurRect');
        head.push(layer);

        head.push(x, y, width, height);
        
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

Neo.ActionManager.prototype.eraseRect = function(x, y, width, height) {
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('eraseRect');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('copy');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('paste');
        head.push(layer);

        head.push(x, y, width, height);
        head.push(dx, dy);
        
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
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('turn');
        head.push(layer);

        head.push(x, y, width, height);
        
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
    var layer;
    var oe = Neo.painter;
    
    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;
        
        head.push('text');
        head.push(layer);
        head.push(x);
        head.push(y);
        head.push(color);
        head.push(alpha);
        head.push(string);
        head.push(size);
        head.push(family);

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
