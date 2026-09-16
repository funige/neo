"use strict";
//@ts-check
Neo.CommandBase = class {
  constructor() {
    /** @type {any} */
    this.data = null;

    // ズームの許容値を配列で定義
    this.zoom_steps = Neo.config.neo_enable_zoom_out
      ? [
          0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0,
          10.0, 11.0, 12.0,
        ]
      : [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0, 11.0, 12.0];
  }
  execute() {}
};

/*
  ---------------------------------------------------
    ZOOM
  ---------------------------------------------------
*/
/**
 * @property {number} zoom - 現在のズーム値
 * @property {(newZoom: number) => void} setZoom - ズーム値を設定するメソッド
 */
Neo.ZoomPlusCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }

  execute() {
    const steps = this.zoom_steps;
    // 現在のズームに最も近い（または一致する）インデックスを探す
    let currentIndex = steps.findIndex((s) => s >= this.data.zoom);
    if (currentIndex === -1) currentIndex = steps.length - 1;

    // 完全に一致しない場合の調整（現在値より大きい最初のステップを採用、または次のインデックスへ）
    if (
      steps[currentIndex] === this.data.zoom &&
      currentIndex < steps.length - 1
    ) {
      currentIndex++;
    } else if (steps[currentIndex] > this.data.zoom) {
      // そのまま現在のcurrentIndexのステップを採用
    } else if (currentIndex < steps.length - 1) {
      currentIndex++;
    }

    if (currentIndex < steps.length) {
      this.data.setZoom(steps[currentIndex]);
    }

    // console.log(this.data.zoom);
    Neo.resizeCanvas();
    // Neo.resizeCanvas()でupdateDestCanvas()を引数付きで呼び出しているためコメントアウト
    // Neo.painter.updateDestCanvas();
  }
};

/**
 * @property {number} zoom - 現在のズーム値
 * @property {(newZoom: number) => void} setZoom - ズーム値を設定するメソッド
 */
Neo.ZoomMinusCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }

  execute() {
    const steps = this.zoom_steps;
    let currentIndex = steps.findIndex((s) => s >= this.data.zoom);

    if (currentIndex > 0) {
      if (steps[currentIndex] === this.data.zoom) {
        currentIndex--;
      } else {
        // 現在値がステップの間にいる場合は、下のステップに落とす
        currentIndex = Math.max(0, currentIndex - 1);
      }
      this.data.setZoom(steps[currentIndex]);
    }

    // console.log(this.data.zoom);
    Neo.resizeCanvas();
  }
};

/*
  ---------------------------------------------------
    UNDO
  ---------------------------------------------------
*/
Neo.UndoCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }
  execute() {
    this.data.cancelCopy();
    this.data.undo();
  }
};

Neo.RedoCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }
  execute() {
    this.data.redo();
  }
};

Neo.WindowCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }
  execute() {
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
  }
};

Neo.SubmitCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }
  execute() {
    //基準ディレクトリパス（URL形式、末尾は "/"）
    var baseURL = location.href.replace(/[^/]*$/, "");
    this.data.submit(baseURL);
  }
};

Neo.CopyrightCommand = class extends Neo.CommandBase {
  /** @param {Neo.Painter} data */
  constructor(data) {
    super();
    this.data = data;
  }
  execute() {
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
  }
};
