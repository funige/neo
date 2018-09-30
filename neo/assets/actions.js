'use strict';

Neo.Action = function() {
};

Neo.Action.play = function(item) {
    if (Neo.Action[item.type]) {
        Neo.Action[item.type](item)
    }
}

Neo.Action.undo = function(item) {
    console.log('[undo]')
}

/*
-------------------------------------------------------------------------
    Recorder
-------------------------------------------------------------------------
*/

Neo.ActionManager = function() {
    this._items = [];
    this._head = 0;
}

Neo.ActionManager.prototype.step = function() {
    if (this._items.length > this._head) {
        this._items.length = this._head;
    }
    this._items.push([]);
    this._head++;
    console.log("step")
}

Neo.ActionManager.prototype.back = function() {
    if (this._head > 0) {
        this._head--;
    }
    console.log("back", this._items.length, this._head);
}

Neo.ActionManager.prototype.forward = function() {
    if (this._head < this._items.length) {
        this._head++;
    }
    console.log("forward", this._items.length, this._head);
}

/*
-------------------------------------------------------------------------
    Player
-------------------------------------------------------------------------
*/

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
        }, 100);
    }
}

Neo.ActionManager.prototype.apply = function(item) {
    if (Neo.ActionManager.prototype[item[0]]) {
        (Neo.ActionManager.prototype[item[0]])(item);
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
    } else {
    }
    
    var oe = Neo.painter;
    oe.canvasCtx[0].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.canvasCtx[1].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);
}

Neo.ActionManager.prototype.doFloodFill = function(layer, x, y, color) {
    if (typeof layer != "object") {
        var head = this._items[this._head - 1];
        head.push('doFloodFill');
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

Neo.ActionManager.prototype.doEraseAll = function(layer) {
    if (typeof layer != "object") {
        var head = this._items[this._head - 1];
        head.push('doEraseAll');
        head.push(layer);

    } else {
        var item = layer;
        layer = item[1];
    }

    var oe = Neo.painter;
    oe.canvasCtx[layer].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
}

Neo.ActionManager.prototype.doFreeHand = function(x0, y0, lineType) {
    var oe = Neo.painter;
    var layer = oe.current;
    
    if (arguments.length > 1) {
        var head = this._items[this._head - 1];

        head.push('doFreeHand');
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

        lineType = item[10];
        x0 = item[11];
        y0 = item[12];
        var x1, y1;

        for (var i = 13; i + 2 < length; i += 2) {
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

Neo.ActionManager.prototype.doFreeHandMove = function(x0, y0, x1, y1, lineType) {
    if (arguments.length > 1) {
        var oe = Neo.painter;
        var layer = oe.current;
        var head = this._items[this._head - 1];
        if (head.length == 0) {
            head.push('doFreeHand')
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
                lineType != head[10]) {
                console.log('eror in doFreeHandMove???', x, y, lineType, head)
            }
        }
        oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
        
    } else {
        console.log('error in doFreeHandMove: called from recorder', head);
    }
}

Neo.ActionManager.prototype.doLine = function(
    x0, y0,
    x1, y1,
    lineType)
{
    var layer;
    var oe = Neo.painter;

    if (arguments.length > 1) {
        var head = this._items[this._head - 1];
        layer = oe.current;

        head.push('doLine');
        head.push(layer);
        oe.setCurrent(head);

        head.push(lineType);
        head.push(x0, y0, x1, y1);

    } else {
        var item = arguments[0];

        layer = item[1];
        oe.getCurrent(item);

        lineType = item[10];
        x0 = item[11];
        y0 = item[12];
        x1 = item[13];
        y1 = item[14];
    }
    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
}

Neo.ActionManager.prototype.doBezier = function(
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
        
        head.push('doBezier');
        head.push(layer);
        oe.setCurrent(head);

        head.push(lineType);
        head.push(x0, y0, x1, y1, x2, y2, x3, y3);

    } else {
        var item = arguments[0];
        layer = item[1];
        oe.getCurrent(item);
        
        lineType = item[10];
        x0 = item[11];
        y0 = item[12];
        x1 = item[13];
        y1 = item[14];
        x2 = item[15];
        y2 = item[16];
        x3 = item[17];
        y3 = item[18];
    }
    oe.drawBezier(oe.canvasCtx[layer], x0, y0, x1, y1, x2, y2, x3, y3, lineType);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
}

Neo.ActionManager.prototype.doText = function(layer,
    x, y,
    color,
    alpha,
    string,
    size,
    family)
{
    if (typeof layer != "object") {
        var head = this._items[this._head - 1];
        head.push('doText');
        head.push(layer);
        head.push(x);
        head.push(y);
        head.push(color);
        head.push(alpha);
        head.push(string);
        head.push(size);
        head.push(family);

    } else {
        var item = layer
        layer = item[1];
        x = item[2];
        y = item[3];
        color = item[4];
        alpha = item[5];
        string = item[6];
        size = item[7];
        family = item[8];
    }

    var oe = Neo.painter;
    oe.doText(layer, x, y, color, alpha, string, size, family);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
}
