"use strict";

Neo.CommandBase = function () {};
Neo.CommandBase.prototype.data;
Neo.CommandBase.prototype.execute = function () {};

/*
  ---------------------------------------------------
    ZOOM
  ---------------------------------------------------
*/
Neo.ZoomPlusCommand = function (data) {
  this.data = data;
};
Neo.ZoomPlusCommand.prototype = new Neo.CommandBase();
Neo.ZoomPlusCommand.prototype.execute = function () {
  if (this.data.zoom < 12) {
    this.data.setZoom(this.data.zoom + 1);
  }
  Neo.resizeCanvas();
  Neo.painter.updateDestCanvas();
};

Neo.ZoomMinusCommand = function (data) {
  this.data = data;
};
Neo.ZoomMinusCommand.prototype = new Neo.CommandBase();
Neo.ZoomMinusCommand.prototype.execute = function () {
  if (this.data.zoom >= 2) {
    this.data.setZoom(this.data.zoom - 1);
  }
  Neo.resizeCanvas();
  Neo.painter.updateDestCanvas();
};

/*
  ---------------------------------------------------
    UNDO
  ---------------------------------------------------
*/
Neo.UndoCommand = function (data) {
  this.data = data;
};
Neo.UndoCommand.prototype = new Neo.CommandBase();
Neo.UndoCommand.prototype.execute = function () {
  this.data.undo();
};

Neo.RedoCommand = function (data) {
  this.data = data;
};
Neo.RedoCommand.prototype = new Neo.CommandBase();
Neo.RedoCommand.prototype.execute = function () {
  this.data.redo();
};

Neo.WindowCommand = function (data) {
  this.data = data;
};
Neo.WindowCommand.prototype = new Neo.CommandBase();
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

Neo.SubmitCommand = function (data) {
  this.data = data;
};
Neo.SubmitCommand.prototype = new Neo.CommandBase();
Neo.SubmitCommand.prototype.execute = function () {
  var board = location.href.replace(/[^/]*$/, "");
  this.data.submit(board);
};

Neo.CopyrightCommand = function (data) {
  this.data = data;
};
Neo.CopyrightCommand.prototype = new Neo.CommandBase();
Neo.CopyrightCommand.prototype.execute = function () {
  var url = "http://github.com/funige/neo/";
  if (
    confirm(
      Neo.translate(
        "PaintBBS NEOは、お絵描きしぃ掲示板 PaintBBS (©2000-2004 しぃちゃん) をhtml5化するプロジェクトです。\n\nPaintBBS NEOのホームページを表示しますか？"
      ) + "\n"
    )
  ) {
    Neo.openURL(url);
  }
};
