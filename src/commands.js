"use strict";
//@ts-check
Neo.CommandBase = class {
  constructor() {
    this.data = null;
  }
};
Neo.CommandBase.prototype.data;
Neo.CommandBase.prototype.execute = function () {};

/*
  ---------------------------------------------------
    ZOOM
  ---------------------------------------------------
*/
/**
 * @typedef {Object} ZoomPlusData
 * @property {number} zoom - 現在のズーム値
 * @property {(newZoom: number) => void} setZoom - ズーム値を設定するメソッド
 */
Neo.ZoomPlusCommand = class extends Neo.CommandBase {
  /** @param {ZoomPlusData} data */
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.ZoomPlusCommand.prototype.execute = function () {
  if (this.data.zoom >= 1 && this.data.zoom < 12) {
    this.data.setZoom(this.data.zoom + 1);
  } else if (this.data.zoom < 1) {
    this.data.setZoom(this.data.zoom + 0.2);
  }
  Neo.resizeCanvas();
  // Neo.resizeCanvas()でupdateDestCanvas()を引数付きで呼び出しているためコメントアウト
  // Neo.painter.updateDestCanvas();
};

/**
 * @typedef {Object} ZoomMinusData
 * @property {number} zoom - 現在のズーム値
 * @property {(newZoom: number) => void} setZoom - ズーム値を設定するメソッド
 */
Neo.ZoomMinusCommand = class extends Neo.CommandBase {
  /** @param {ZoomMinusData} data */
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.ZoomMinusCommand.prototype.execute = function () {
  if (this.data.zoom >= 2) {
    this.data.setZoom(this.data.zoom - 1);
  } else if (Neo.config.neo_enable_zoom_out && this.data.zoom >= 0.4) {
    this.data.setZoom(this.data.zoom - 0.2);
  }
  Neo.resizeCanvas();
  // Neo.resizeCanvas()でupdateDestCanvas()を引数付きで呼び出しているためコメントアウト
  // Neo.painter.updateDestCanvas();
};

/*
  ---------------------------------------------------
    UNDO
  ---------------------------------------------------
*/
Neo.UndoCommand = class extends Neo.CommandBase {
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.UndoCommand.prototype.execute = function () {
  this.data.cancelCopy();
  this.data.undo();
};

Neo.RedoCommand = class extends Neo.CommandBase {
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.RedoCommand.prototype.execute = function () {
  this.data.redo();
};

Neo.WindowCommand = class extends Neo.CommandBase {
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.WindowCommand.prototype.execute = function () {
  if (Neo.fullScreen) {
    if (confirm(Neo.translate("ページビュー？"))) {
      Neo.fullScreen = false;
      Neo.updateWindow();
    }
  } else {
    if (confirm(Neo.translate("ウィンドウビュー？"))) {
      Neo.fullScreen = true;
      Neo.updateWindow();
    }
  }
};

Neo.SubmitCommand = class extends Neo.CommandBase {
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.SubmitCommand.prototype.execute = function () {
  var board = location.href.replace(/[^/]*$/, "");
  this.data.submit(board);
};

Neo.CopyrightCommand = class extends Neo.CommandBase {
  constructor(data) {
    super();
    this.data = data;
  }
};
Neo.CopyrightCommand.prototype.execute = function () {
  var url = "http://github.com/funige/neo/";
  if (
    confirm(
      Neo.translate(
        "PaintBBS NEOは、お絵かきしぃ掲示板 PaintBBS (©2000-2004 しぃちゃん) をhtml5化するプロジェクトです。\n\nPaintBBS NEOのホームページを表示しますか？",
      ) + "\n",
    )
  ) {
    Neo.openURL(url);
  }
};
