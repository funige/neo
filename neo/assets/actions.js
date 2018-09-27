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
        console.log("play", item[0], this._head, this._items.length);
        if (item[0] && this[item[0]]) {
            (this[item[0]])(item);
        }
        this._head++;

        setTimeout(function() {
            Neo.painter._actionMgr.play();
        }, 1000);
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
