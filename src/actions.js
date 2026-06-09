"use strict";
//@ts-check
/*
  -----------------------------------------------------------------------
    Action Manager
  -----------------------------------------------------------------------
*/

Neo.ActionManager = class {
  constructor() {
    this._items = [];
    this._head = 0;
    this._index = 0;

    this._pause = false;
    this._mark = 0;

    this._speedTable = [-1, 0, 1, 11]; // [最, 早, 既, 鈍]

    Neo.speed = parseInt(Neo.config.speed || 0);
    this._prevSpeed = Neo.speed;
  }
};
Neo.ActionManager.prototype.isMouseDown = false;
Neo.ActionManager.prototype.speedMode = function () {
  if (Neo.speed < 0) {
    return 0;
  } else if (Neo.speed == 0) {
    return 1;
  } else if (Neo.speed <= 10) {
    return 2;
  } else {
    return 3;
  }
};

Neo.ActionManager.prototype.step = function () {
  if (!Neo.isAnimation) return;

  if (this._items.length > this._head) {
    this._items.length = this._head;
  }
  this._items.push([]);
  this._head++;
  this._index = 0;
};

Neo.ActionManager.prototype.back = function () {
  if (!Neo.isAnimation) return;

  if (this._head > 0) {
    this._head--;
  }
};

Neo.ActionManager.prototype.forward = function () {
  if (!Neo.isAnimation) return;

  if (this._head < this._items.length) {
    this._head++;
  }
};

Neo.ActionManager.prototype.push = function () {
  if (!Neo.isAnimation) return;

  var head = this._items[this._head - 1];
  for (var i = 0; i < arguments.length; i++) {
    head.push(arguments[i]);
  }
};

Neo.ActionManager.prototype.pushCurrent = function () {
  if (!Neo.isAnimation) return;

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

/**
 * 指定された描画アクション（履歴データ）から、ブラシ設定（色、マスク、太さ）を復元する
 * @param {Array<*>} item - 描画アクションのデータ配列
 * [2]~[5]: RGBAカラー、[6]~[8]: マスクカラー、[9]: ブラシ幅、[10]: マスクタイプ
 */
Neo.ActionManager.prototype.getCurrent = function (item) {
  var oe = Neo.painter;

  oe._currentColor = [item[2], item[3], item[4], item[5]];
  oe._currentMask = [item[6], item[7], item[8]];
  oe._currentWidth = item[9];
  oe._currentMaskType = item[10];
};

Neo.ActionManager.prototype.skip = function () {
  for (var i = 0; i < this._items.length; i++) {
    if (this._items[i][0] == "restore") {
      this._head = i;
    }
  }
};

Neo.ActionManager.prototype.play = function () {
  if (Neo.viewerBar) Neo.viewerBar.update();

  if (this._pause) {
    console.log("suspend viewer");
    return;
  }

  if (this._head >= this._items.length || this._head >= this._mark) {
    Neo.painter.dirty = false;
    Neo.painter.busy = false;

    if (Neo.painter.busySkipped) {
      Neo.painter.busySkipped = false;
      console.log("animation skipped");
    } else {
      console.log("animation finished");
    }
    return;
  }

  var item = this._items[this._head];

  if (!Neo.viewer && !Neo.painter.busySkipped) {
    Neo.painter._pushUndo(
      0,
      0,
      Neo.painter.canvasWidth,
      Neo.painter.canvasHeight,
      true,
    );
  }

  if (Neo.viewer && Neo.viewerSpeed && this._index == 0) {
    Neo.viewerSpeed.update();
    //console.log("play", item[0], this._head + 1, this._items.length);
  }

  var func;
  // restoreが存在するかどうか判定
  //古いPCHファイルにはrestoreが存在しないためアニメーションをスキップできない
  const hasRestore = this._items.some((item) => item[0] === "restore");
  if (Neo.painter.busySkipped && hasRestore) {
    // アニメーションをスキップする時はrestoreのみを関数として扱う
    func =
      item[0] && this[item[0]] && item[0] === "restore" ? item[0] : "dummy";
  } else {
    // アニメーションを再生する時は全ての関数を実行する
    func = item[0] && this[item[0]] ? item[0] : "dummy";
  }

  var ref = this;
  var wait = this._prevSpeed < 0 ? 0 : this._prevSpeed;

  this[func](item, function (result) {
    if (result) {
      if (
        Neo.painter.busySkipped &&
        ref._head < ref._mark - 2 &&
        ref._mark - 2 >= 0 &&
        ref._items[ref._mark - 1][0] == "restore"
      ) {
        ref._head = ref._mark - 2;
      } else {
        ref._head++;
      }
      ref._index = 0;
      ref._prevSpeed = Neo.speed;
    }

    setTimeout(function () {
      Neo.painter._actionMgr.play();
    }, wait);
  });
};
/*
-------------------------------------------------------------------------
    Action
-------------------------------------------------------------------------
*/

Neo.ActionManager.prototype.clearCanvas = function () {
  if (typeof arguments[0] != "object") {
    this.push("clearCanvas");
  }

  var oe = Neo.painter;
  oe.canvasCtx[0].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  oe.canvasCtx[1].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 画面を指定色で塗りつぶす（バケツツール）。
 * @param {*} layer - レイヤー番号、または録画データ配列
 * @param {*} [x] - X座標、または再生用コールバック
 * @param {*} [y] - Y座標
 * @param {*} [color] - 塗りつぶし色
 */
Neo.ActionManager.prototype.floodFill = function (layer, x, y, color) {
  if (typeof layer != "object") {
    this.push("floodFill", layer, x, y, color);
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
};

Neo.ActionManager.prototype.eraseAll = function () {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    this.push("eraseAll", layer);
  } else {
    var item = arguments[0];
    layer = item[1];
  }

  var oe = Neo.painter;
  oe.canvasCtx[layer].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};
/**
 * 手書き線の描画アクション 等速
 * @param {number|Array<*>} x0 - 開始X座標、または一括描画するアクションデータ配列(item)
 * @param {number|null} [y0] - 開始Y座標
 * @param {number|null} [lineType] - 線の種類
 */
Neo.ActionManager.prototype.freeHand = function (x0, y0, lineType) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x0 = Number(x0);
    y0 = Number(y0);
    lineType = Number(lineType);

    this.push("freeHand", layer);
    this.pushCurrent();
    this.push(lineType, x0, y0, x0, y0);

    oe.drawLine(oe.canvasCtx[layer], x0, y0, x0, y0, lineType);
  } else if (!Neo.viewer || this._prevSpeed <= 0) {
    this.freeHandFast(arguments[0], arguments[1]);
  } else {
    var item = arguments[0];

    const layer = item[1];
    const lineType = item[11];
    this.getCurrent(item);

    var i = this._index;
    if (i == 0) {
      i = 12;
    } else {
      i += 2;
    }

    const x1 = item[i + 0];
    const y1 = item[i + 1];
    const x0 = item[i + 2];
    const y0 = item[i + 3];

    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

    this._index = i;
    const result = i + 2 + 3 >= item.length;

    if (!result) {
      oe.prevLine = null;
    }

    var callback = arguments[1];
    if (callback && typeof callback == "function") {
      callback(result);
    }
  }
};

/**
 * 手書き線の描画アクション 高速
 * @param {number|Array<*>} x0 - 開始X座標、または一括描画するアクションデータ配列(item)
 * @param {number|null} [y0] - 開始Y座標
 * @param {number|null} [lineType] - 線の種類
 */
Neo.ActionManager.prototype.freeHandFast = function (x0, y0, lineType) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x0 = Number(x0);
    y0 = Number(y0);
    lineType = Number(lineType);

    this.push("freeHand", layer);
    this.pushCurrent();
    this.push(lineType, x0, y0, x0, y0);

    oe.drawLine(oe.canvasCtx[layer], x0, y0, x0, y0, lineType);
  } else {
    let x0, y0, x1, y1, lineType;

    var item = arguments[0];
    var length = item.length;

    layer = item[1];
    this.getCurrent(item);

    lineType = item[11];
    x0 = item[12];
    y0 = item[13];

    for (var i = 14; i + 1 < length; i += 2) {
      x1 = x0;
      y1 = y0;
      x0 = item[i + 0];
      y0 = item[i + 1];
      oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
    }
    oe.prevLine = null;
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);
  }

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

Neo.ActionManager.prototype.freeHandMove = function (x0, y0, x1, y1, lineType) {
  if (arguments.length > 1) {
    var oe = Neo.painter;
    var layer = oe.current;
    var head = this._items[this._head - 1];
    if (head && head.length == 0) {
      this.push("freeHand", layer);
      this.pushCurrent();
      this.push(lineType, x1, y1, x0, y0);
    } else if (Neo.isAnimation) {
      head.push(x0, y0);

      // 記録漏れがないか確認
      var x = head[head.length - 4];
      var y = head[head.length - 3];
      if (
        x1 != head[head.length - 4] ||
        y1 != head[head.length - 3] ||
        lineType != head[11]
      ) {
        console.log("eror in freeHandMove?", x, y, lineType, head);
      }
    }
    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
  } else {
    console.log("error in freeHandMove: called from recorder", head);
  }
};

/**
 * 直線描画
 * @param {number|Array<*>} x0 - 始点X座標、または描画データ配列
 * @param {number|null} [y0] - 始点Y座標、またはコールバック関数
 * @param {number|null} [x1] - 終点X座標
 * @param {number|null} [y1] - 終点Y座標
 * @param {number|null} [lineType] - 線の種類
 */
Neo.ActionManager.prototype.line = function (x0, y0, x1, y1, lineType) {
  var oe = Neo.painter;
  var layer = oe.current;
  if (typeof arguments[0] != "object") {
    x0 = Number(x0);
    y0 = Number(y0);
    x1 = Number(x1);
    y1 = Number(y1);
    lineType = Number(lineType);

    this.push("line", layer);
    this.pushCurrent();
    this.push(lineType, x0, y0, x1, y1);

    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
  } else {
    //描き手順のObjectが渡された場合は、描画データを展開する
    const item = arguments[0];

    const layer = item[1];
    this.getCurrent(item);

    const lineType = item[11];
    const x0 = item[12];
    const y0 = item[13];
    let x1 = item[14];
    let y1 = item[15];
    if (x1 === null) x1 = x0;
    if (y1 === null) y1 = y0;

    oe.drawLine(oe.canvasCtx[layer], x0, y0, x1, y1, lineType);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * ベジェ曲線描画
 * @param {number|Array<*>} x0 - 始点X座標、または描画データ配列
 * @param {number|null} [y0] - 始点Y座標、またはコールバック関数
 * @param {number|null} [x1] - 制御点1 X座標
 * @param {number|null} [y1] - 制御点1 Y座標
 * @param {number|null} [x2] - 制御点2 X座標
 * @param {number|null} [y2] - 制御点2 Y座標
 * @param {number|null} [x3] - 終点X座標
 * @param {number|null} [y3] - 終点Y座標
 * @param {number} [lineType] - 線の種類
 */
Neo.ActionManager.prototype.bezier = function (
  x0,
  y0,
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  lineType,
) {
  var oe = Neo.painter;
  var layer = oe.current;
  var isReplay = true;

  if (typeof arguments[0] != "object") {
    x0 = Number(x0);
    y0 = Number(y0);
    x1 = Number(x1);
    y1 = Number(y1);
    x2 = Number(x2);
    y2 = Number(y2);
    x3 = Number(x3);
    y3 = Number(y3);
    lineType = Number(lineType);
    this.push("bezier", layer);
    this.pushCurrent();
    this.push(lineType, x0, y0, x1, y1, x2, y2, x3, y3);
    isReplay = false;
    oe.drawBezier(
      oe.canvasCtx[layer],
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      lineType,
      isReplay,
    );
  } else {
    const item = arguments[0];
    const layer = item[1];
    this.getCurrent(item);

    const lineType = item[11];
    const x0 = item[12];
    const y0 = item[13];
    const x1 = item[14];
    const y1 = item[15];
    const x2 = item[16];
    const y2 = item[17];
    const x3 = item[18];
    const y3 = item[19];
    oe.drawBezier(
      oe.canvasCtx[layer],
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      lineType,
      isReplay,
    );
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 塗り潰し
 * @param {number|Array<*>} x - 始点X座標、またはアクションデータ配列
 * @param {number|null} [y] - 始点Y座標、またはコールバック関数
 * @param {number|null} [width] - 矩形の幅
 * @param {number|null} [height] - 矩形の高さ
 * @param {number|null} [type] - 塗りつぶしの種類(四角楕円など)
 */
Neo.ActionManager.prototype.fill = function (x, y, width, height, type) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);
    type = Number(type);

    this.push("fill", layer);
    this.pushCurrent();
    this.push(x, y, width, height, type);
    oe.doFill(layer, x, y, width, height, type);
  } else {
    const item = arguments[0];
    const layer = item[1];
    this.getCurrent(item);

    const x = item[11];
    const y = item[12];
    const width = item[13];
    const height = item[14];
    const type = item[15];

    oe.doFill(layer, x, y, width, height, type);
  }

  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 左右反転
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 反転する幅
 * @param {number} [height] - 反転する高さ
 */
Neo.ActionManager.prototype.flipH = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("flipH", layer, x, y, width, height);
    oe.flipH(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.flipH(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 上下反転
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 反転する幅
 * @param {number} [height] - 反転する高さ
 */
Neo.ActionManager.prototype.flipV = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("flipV", layer, x, y, width, height);
    oe.flipV(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.flipV(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * レイヤー結合
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 結合する幅
 * @param {number} [height] - 結合する高さ
 */
Neo.ActionManager.prototype.merge = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("merge", layer, x, y, width, height);
    oe.merge(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.merge(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形ぼかし
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - ぼかす範囲の幅
 * @param {number} [height] - ぼかす範囲の高さ
 */
Neo.ActionManager.prototype.blurRect = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("blurRect", layer, x, y, width, height);
    oe.blurRect(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.blurRect(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形消去
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 消去する幅
 * @param {number} [height] - 消去する高さ
 */
Neo.ActionManager.prototype.eraseRect2 = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("eraseRect2", layer);
    this.pushCurrent();
    this.push(x, y, width, height);
    oe.eraseRect(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    this.getCurrent(item);

    const x = item[11];
    const y = item[12];
    const width = item[13];
    const height = item[14];
    oe.eraseRect(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形消去
 * @deprecated 現在はeraseRect2 が使用されているため、この関数は未使用
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 消去する幅
 * @param {number} [height] - 消去する高さ
 */
Neo.ActionManager.prototype.eraseRect = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("eraseRect", layer, x, y, width, height);
    oe.eraseRect(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.eraseRect(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形コピー
 * @description 指定された範囲の画像をコピーし、oe.tool にその座標とサイズを記憶する。
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - コピーする幅
 * @param {number} [height] - コピーする高さ
 */
Neo.ActionManager.prototype.copy = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("copy", layer, x, y, width, height);
    oe.copy(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.copy(layer, x, y, width, height);
  }

  oe.tool.x = x;
  oe.tool.y = y;
  oe.tool.width = width;
  oe.tool.height = height;
  //  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形ペースト
 * @param {number|Array<*>} x - コピー元の開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - コピー元の開始Y座標、またはコールバック関数
 * @param {number} [width] - ペーストする幅
 * @param {number} [height] - ペーストする高さ
 * @param {number} [dx] - 貼り付け先のX座標
 * @param {number} [dy] - 貼り付け先のY座標
 */
Neo.ActionManager.prototype.paste = function (x, y, width, height, dx, dy) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);
    dx = Number(dx);
    dy = Number(dy);

    this.push("paste", layer, x, y, width, height, dx, dy);
    oe.paste(layer, x, y, width, height, dx, dy);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    const dx = item[6];
    const dy = item[7];
    oe.paste(layer, x, y, width, height, dx, dy);
  }

  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * 矩形傾け
 * @description ツールバーの「傾け」ボタンに対応する、指定範囲を90度回転させる処理。
 * @param {number|Array<*>} x - 開始X座標、またはアクションデータ配列
 * @param {number|function(boolean):void} [y] - 開始Y座標、またはコールバック関数
 * @param {number} [width] - 変形する範囲の幅
 * @param {number} [height] - 変形する範囲の高さ
 */
Neo.ActionManager.prototype.turn = function (x, y, width, height) {
  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);

    this.push("turn", layer, x, y, width, height);
    oe.turn(layer, x, y, width, height);
  } else {
    const item = arguments[0];
    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const width = item[4];
    const height = item[5];
    oe.turn(layer, x, y, width, height);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/**
 * テキストツールによる描画処理
 * @param {Object|number} x - 描画データ配列、またはX座標
 * @param {number|function} [y] - Y座標、またはコールバック関数
 * @param {number} [color] - 色ID
 * @param {number} [alpha] - 不透明度
 * @param {string} [string] - 入力された文字列
 * @param {string} [size] - フォントサイズ 16pxのように単位まで指定する
 * @param {string} [family] - フォントファミリー
 */
Neo.ActionManager.prototype.text = function (
  x,
  y,
  color,
  alpha,
  string,
  size,
  family,
) {
  string = String(string);
  size = String(size);
  family = String(family);

  var oe = Neo.painter;
  var layer = oe.current;

  if (typeof arguments[0] != "object") {
    const numX = Number(x);
    const numY = Number(y);
    const numColor = Number(color);
    const numAlpha = Number(alpha);

    this.push(
      "text",
      layer,
      numX,
      numY,
      numColor,
      numAlpha,
      string,
      size,
      family,
    );
    oe.doText(layer, numX, numY, numColor, numAlpha, string, size, family);
  } else {
    const item = arguments[0];

    const layer = item[1];
    const x = item[2];
    const y = item[3];
    const color = item[4];
    const alpha = item[5];
    const string = item[6];
    const size = item[7];
    const family = item[8];

    oe.doText(layer, x, y, color, alpha, string, size, family);
  }
  oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight);

  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

Neo.ActionManager.prototype.restore = function () {
  var oe = Neo.painter;
  var width = oe.canvasWidth;
  var height = oe.canvasHeight;

  if (typeof arguments[0] != "object") {
    this.push("restore");

    const _img0 = oe.canvas[0].toDataURL("image/png");
    const _img1 = oe.canvas[1].toDataURL("image/png");
    this.push(_img0, _img1);
  } else {
    var item = arguments[0];
    var callback = arguments[1];

    const img0 = new Image();
    const img1 = new Image();
    img0.onload = function () {
      img1.onload = function () {
        oe.canvasCtx[0].clearRect(0, 0, width, height);
        oe.canvasCtx[1].clearRect(0, 0, width, height);
        oe.canvasCtx[0].drawImage(img0, 0, 0);
        oe.canvasCtx[1].drawImage(img1, 0, 0);
        oe.updateDestCanvas(0, 0, width, height);

        if (callback && typeof callback == "function") callback(true);
      };
      img1.src = item[2];
    };
    img0.src = item[1];
  }
};

Neo.ActionManager.prototype.dummy = function () {
  var callback = arguments[1];
  if (callback && typeof callback == "function") callback(true);
};

/*
  -----------------------------------------------------------------------
    動画表示モード
  -----------------------------------------------------------------------
*/
/**@param {HTMLElement} applet */
Neo.createViewer = function (applet) {
  var neo = document.createElement("div");
  neo.className = "NEO";
  neo.id = "NEO";

  var html =
    '<div id="neo-pageView" style="margin:auto;">' +
    '<div id="neo-container" style="visibility:visible;" class="o">' +
    '<div id="neo-painter" style="background-color:white;">' +
    '<div id="neo-canvas" style="background-color:white;">' +
    "</div>" +
    "</div>" +
    '<div id="neo-viewerButtonsWrapper" style="display:block;">' +
    '<div id="neo-viewerButtons" style="display:block;">' +
    '<div id="neo-viewerPlay"></div>' +
    '<div id="neo-viewerStop"></div>' +
    '<div id="neo-viewerRewind"></div>' +
    '<div id="neo-viewerSpeed" style="padding-left:2px; margin-top: 1px;"></div>' +
    '<div id="neo-viewerPlus"></div>' +
    '<div id="neo-viewerMinus"></div>' +
    '<div id="neo-viewerBar" style="display:inline-block;">' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>";

  neo.innerHTML = html.replace(/\[(.*?)\]/g, function (match, str) {
    return Neo.translate(str);
  });

  var parent = applet.parentNode;
  parent?.appendChild(neo);
  parent?.insertBefore(neo, applet);

  // applet.style.display = "none";

  // NEOを組み込んだURLをアプリ版で開くとDOMツリーが2重にできて格好悪いので消しておく
  setTimeout(function () {
    /** @type {NodeListOf<HTMLElement>} */
    const tmp = document.querySelectorAll(".NEO");

    if (tmp.length > 1) {
      for (var i = 1; i < tmp.length; i++) {
        tmp[i].style.display = "none";
      }
    }
  }, 0);
};

/**
 * ビューアの初期化処理
 * @description
 * アプレットのDOM構成、スタイルの適用、キャンバスの生成、
 * および操作イベントのリスナー登録を行う。
 * @param {Object} [pch] - PCHファイルデータ（あれば再生を開始する）
 * @param {Array<*>} [pch.data] - 再生用アクションデータ
 */
Neo.initViewer = function (pch) {
  const pageview = document.getElementById("neo-pageView");
  if (!pageview) return;
  var pageWidth = Neo.config.applet_width;
  var pageHeight = Neo.config.applet_height;
  pageview.style.width = pageWidth + "px";
  pageview.style.height = pageHeight + "px";

  Neo.canvas = document.getElementById("neo-canvas");
  if (!Neo.canvas) {
    console.error("initViewer: Canvas element not found");
    return;
  }
  Neo.container = document.getElementById("neo-container");
  if (!Neo.container) {
    console.error("initViewer: Container element not found");
    return;
  }
  Neo.container.style.backgroundColor = Neo.config.color_back;
  Neo.container.style.border = "0";

  var dx = (pageWidth - Neo.config.width) / 2;
  var dy = (pageHeight - Neo.config.height - 26) / 2;

  var painter = document.getElementById("neo-painter");

  const viewerWrapperOnTop =
    Neo.config.neo_viewer_buttonswrapper_top &&
    window.innerHeight < pageHeight + 100;
  if (painter) {
    painter.style.marginTop = "0";
    painter.style.position = "absolute";
    painter.style.padding = "0";
    painter.style.bottom = viewerWrapperOnTop ? "0" : dy + 26 + "px";
    painter.style.left = dx + "px";
  }

  var viewerButtonsWrapper = document.getElementById(
    "neo-viewerButtonsWrapper",
  );
  if (viewerButtonsWrapper) {
    viewerButtonsWrapper.style.width = pageWidth - 2 + "px";
    viewerButtonsWrapper.style.position = viewerWrapperOnTop ? "absolute" : "";
    viewerButtonsWrapper.style.top = viewerWrapperOnTop ? "0" : "";
  }

  var viewerBar = document.getElementById("neo-viewerBar");
  if (viewerBar) {
    viewerBar.style.position = "absolute";
    viewerBar.style.right = "2px";
    viewerBar.style.top = "1px";
    viewerBar.style.width = pageWidth - 24 * 6 - 2 + "px";
  }

  Neo.canvas.style.width = Neo.config.width + "px";
  Neo.canvas.style.height = Neo.config.height + "px";

  Neo.painter = new Neo.Painter();
  Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);

  Neo.container.oncontextmenu = function () {
    return false;
  };

  Neo.painter._actionMgr.isMouseDown = false;
  painter?.addEventListener(
    "pointerdown",
    function () {
      Neo.painter._actionMgr.isMouseDown = true;
    },
    false,
  );
  painter?.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
    },
    { passive: false, capture: false },
  );

  document.addEventListener(
    "pointermove",
    function (e) {
      e.preventDefault();
      if (Neo.painter._actionMgr.isMouseDown) {
        var zoom = Neo.painter.zoom;
        var x = Neo.painter.zoomX - e.movementX / zoom;
        var y = Neo.painter.zoomY - e.movementY / zoom;
        Neo.painter.setZoomPosition(x, y);
      }
    },
    { passive: false, capture: false },
  );
  document.addEventListener(
    "pointerup",
    function () {
      Neo.painter._actionMgr.isMouseDown = false;
      if (Neo.viewerBar) {
        Neo.viewerBar.isMouseDown = false;
      }
    },
    false,
  );

  if (pch && pch.data && pch.data.length > 0) {
    //Neo.config.pch_file) {
    Neo.painter._actionMgr._items = pch.data;
    Neo.startViewer();
    setTimeout(() => {
      Neo.painter.play();
    }, 50);
  }
};
/**
 * PCHビューアの起動と環境構築
 * @description
 * 1. 古いアプレット要素の破棄とDOM移行。
 * 2. 設定値(Neo.config)に基づくCSSルールの動的生成。
 * 3. プレイヤーコントロール(ボタン類)の生成と機能バインディング。
 */
Neo.startViewer = function () {
  if (Neo.applet) {
    var name = Neo.applet.getAttribute("name") || "pch";
    if (!document[name]) document[name] = Neo;
    if (Neo.applet.parentNode) {
      Neo.applet.parentNode.removeChild(Neo.applet);
    }
  }

  Neo.styleSheet = Neo.getStyleSheet();
  var lightBack = Neo.multColor(Neo.config.color_back, 1.3);
  var darkBack = Neo.multColor(Neo.config.color_back, 0.7);

  Neo.addRule(".NEO #neo-viewerButtons", "color", Neo.config.color_text);
  Neo.addRule(
    ".NEO #neo-viewerButtons",
    "background-color",
    Neo.config.color_back,
  );

  Neo.addRule(
    ".NEO #neo-viewerButtonsWrapper",
    "border",
    "1px solid " + Neo.config.color_frame + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons",
    "border",
    "1px solid " + Neo.config.color_back + " !important",
  );
  Neo.addRule(
    ".NEO #neo-viewerButtons",
    "border-left",
    "1px solid " + lightBack + " !important",
  );
  Neo.addRule(
    ".NEO #neo-viewerButtons",
    "border-top",
    "1px solid " + lightBack + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOff",
    "background-color",
    Neo.config.color_icon + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOff:active",
    "background-color",
    darkBack + " !important",
  );
  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOn",
    "background-color",
    darkBack + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons >div",
    "border",
    "1px solid " + Neo.config.color_frame + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOff:hover",
    "border",
    "1px solid" + Neo.config.color_bar_select + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOff:active",
    "border",
    "1px solid" + Neo.config.color_bar_select + " !important",
  );
  Neo.addRule(
    ".NEO #neo-viewerButtons >div.buttonOn",
    "border",
    "1px solid" + Neo.config.color_bar_select + " !important",
  );

  Neo.addRule(
    ".NEO #neo-viewerBar >div",
    "background-color",
    Neo.config.color_bar,
  );
  //  Neo.addRule(".NEO #neo-viewerBar:active", "background-color", darkBack);
  Neo.addRule(
    ".NEO #neo-viewerBarMark",
    "background-color",
    Neo.config.color_text + " !important",
  );

  setTimeout(function () {
    Neo.viewerPlay = new Neo.ViewerButton().init("neo-viewerPlay");
    if (!Neo.viewerPlay) {
      console.error("startViewer: ViewerPlay not found");
      return;
    }
    Neo.viewerPlay.setSelected(true);
    Neo.viewerPlay.onmouseup = function () {
      Neo.painter.onplay();
    };
    Neo.viewerStop = new Neo.ViewerButton().init("neo-viewerStop");
    if (!Neo.viewerStop) {
      console.error("startViewer: ViewerStop not found");
      return;
    }

    Neo.viewerStop.onmouseup = function () {
      Neo.painter.onstop();
    };
    Neo.viewerSpeed = new Neo.ViewerButton().init("neo-viewerSpeed");
    if (!Neo.viewerSpeed) {
      console.error("startViewer: ViewerSpeed not found");
      return;
    }

    Neo.viewerSpeed.onmouseup = function () {
      Neo.painter.onspeed();
      this.update();
    };
    const neo_viewerRewind = new Neo.ViewerButton().init("neo-viewerRewind");
    if (neo_viewerRewind) {
      neo_viewerRewind.onmouseup = function () {
        Neo.painter.onrewind();
      };
    }
    const neo_viewerPlus = new Neo.ViewerButton().init("neo-viewerPlus");
    if (neo_viewerPlus) {
      neo_viewerPlus.onmouseup = function () {
        new Neo.ZoomPlusCommand(Neo.painter).execute();
      };
    }
    const neo_viewerMinus = new Neo.ViewerButton().init("neo-viewerMinus");
    if (neo_viewerMinus) {
      neo_viewerMinus.onmouseup = function () {
        new Neo.ZoomMinusCommand(Neo.painter).execute();
      };
    }

    var length = Neo.painter._actionMgr._items.length;
    Neo.viewerBar = new Neo.ViewerBar().init("neo-viewerBar", {
      length: length,
    });
  }, 0);
};

Neo.getFilename = function () {
  return Neo.config.pch_file || Neo.config.image_canvas;
};

/**
 * PCHファイルを非同期で取得し、デコードする。
 * @description
 * 読み込み失敗時はコンソールにエラーを出力し、処理を終了する。
 * @param {string} filename - 対象のPCHファイルパス
 * @param {function({data: any[][], width: number, height: number}):void} callback - デコードされたPCHデータを受け取るコールバック
 */
Neo.getPCH = function (filename, callback) {
  if (!filename || filename.slice(-4).toLowerCase() != ".pch") return null;

  fetch(filename)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      var pch = Neo.decodePCH(buffer);
      if (pch) {
        if (callback) callback(pch);
      } else {
        console.log("not a NEO animation");
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

/**
 * PCHファイルのバイナリデータをデコードし、構造化されたオブジェクトに変換する。
 * * @typedef {Object} PCHData
 * @property {number} width - キャンバスの横幅
 * @property {number} height - キャンバスの高さ
 * @property {Array<any>} data - 描画命令の配列（fixPCH適用済み）
 * * @param {ArrayBuffer} rawdata - fetchで取得した生のバイナリデータ
 * @returns {PCHData|null} デコード成功時はオブジェクト、失敗時はnullを返す
 * * @example
 * const pch = Neo.decodePCH(buffer);
 * if (pch) {
 * console.log(`Canvas size: ${pch.width}x${pch.height}`);
 * }
 */
Neo.decodePCH = function (rawdata) {
  var byteArray = new Uint8Array(rawdata);
  var data = LZString.decompressFromUint8Array(byteArray.subarray(12));
  var header = byteArray.subarray(0, 12);
  if (!data) {
    throw new Error("Failed to decompress data");
  }
  if (
    header[0] == "N".charCodeAt(0) &&
    header[1] == "E".charCodeAt(0) &&
    header[2] == "O".charCodeAt(0)
  ) {
    var width = header[4] + header[5] * 0x100;
    var height = header[6] + header[7] * 0x100;
    var items = Neo.fixPCH(JSON.parse(data));
    return {
      width: width,
      height: height,
      data: items,
    };
  } else {
    return null;
  }
};

/**
 * PCHデータの描画命令配列を修正し、不正なコマンドを解消する。
 * @description
 * 描画命令の中に 'eraseAll' が混入している時は、独立した要素として分割し再配置する。
 * @param {Array<string>} items - 復元された描画命令の配列
 * @returns {Array<string>} 修正済みの描画命令配列
 */
Neo.fixPCH = function (items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var index = item.indexOf("eraseAll");
    if (index > 0) {
      var tmp = item.slice(index);
      var tmp2 = item.slice(0, index);
      console.log("fix eraseAll", tmp2, tmp);

      items[i] = tmp2;
      items.splice(i, 0, tmp);
    }
  }
  return items;
};

/*
  -----------------------------------------------------------------------
    LiveConnect
  -----------------------------------------------------------------------
*/

Neo.playPCH = function () {
  Neo.painter.onplay();
};

Neo.suspendDraw = function () {
  Neo.painter.onstop();
};

Neo.setSpeed = function (value) {
  Neo.speed = value;
};

/**
 * レイヤー可視性
 * @param {number} layer - 対象となるレイヤーのインデックス
 * @param {number|boolean} value - 表示状態（0またはfalseで非表示、それ以外で表示）
 */
Neo.setVisit = function (layer, value) {
  Neo.painter.visible[layer] = value == 0 ? false : true;
  Neo.painter.updateDestCanvas(
    0,
    0,
    Neo.painter.canvasWidth,
    Neo.painter.canvasHeight,
  );
};

Neo.setMark = function (value) {
  Neo.painter._actionMgr._mark = value;
  Neo.painter.onmark();
};

Neo.getSeek = function () {
  return Neo.painter._actionMgr._head;
};

Neo.getLineCount = function () {
  return Neo.painter._actionMgr._items.length;
};
