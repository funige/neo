"use strict";
//@ts-check
import { Neo, updateWindow, resizeCanvas, openURL } from "./container.js";
import { Painter } from "./painter.js";
import { translate } from "./dictionary.js";

export class Commands {
  constructor() {
    this.CommandBase = class {
      constructor() {
        /** @type {any} */
        this.data = null;

        // ズームの許容値を配列で定義
        this.zoom_steps = Neo.config.neo_enable_zoom_out
          ? [
              0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0,
              8.0, 10.0, 11.0, 12.0,
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
    this.ZoomPlusCommand = class extends this.CommandBase {
      /** @param {Painter} data */
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
        resizeCanvas();
        // resizeCanvas()でupdateDestCanvas()を引数付きで呼び出しているためコメントアウト
        // Neo.painter.updateDestCanvas();
      }
    };

    /**
     * @property {number} zoom - 現在のズーム値
     * @property {(newZoom: number) => void} setZoom - ズーム値を設定するメソッド
     */
    this.ZoomMinusCommand = class extends this.CommandBase {
      /** @param {Painter} data */
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
        resizeCanvas();
      }
    };

    /*
  ---------------------------------------------------
    UNDO
  ---------------------------------------------------
*/
    this.UndoCommand = class extends this.CommandBase {
      /** @param {Painter} data */
      constructor(data) {
        super();
        this.data = data;
      }
      execute() {
        this.data.cancelCopy();
        this.data.undo();
      }
    };

    this.RedoCommand = class extends this.CommandBase {
      /** @param {Painter} data */
      constructor(data) {
        super();
        this.data = data;
      }
      execute() {
        this.data.redo();
      }
    };

    this.WindowCommand = class extends this.CommandBase {
      /** @param {Painter} data */
      constructor(data) {
        super();
        this.data = data;
      }
      execute() {
        if (Neo.fullScreen) {
          if (confirm(translate("ページビュー？"))) {
            Neo.fullScreen = false;
            updateWindow();
          }
        } else {
          if (confirm(translate("ウィンドウビュー？"))) {
            Neo.fullScreen = true;
            updateWindow();
          }
        }
      }
    };

    this.SubmitCommand = class extends this.CommandBase {
      /** @param {Painter} data */
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

    this.CopyrightCommand = class extends this.CommandBase {
      /** @param {Painter} data */
      constructor(data) {
        super();
        this.data = data;
      }
      execute() {
        var url = "http://github.com/funige/neo/";
        if (
          confirm(
            translate(
              "PaintBBS NEOは、お絵かきしぃ掲示板 PaintBBS (©2000-2004 しぃちゃん) をhtml5化するプロジェクトです。\n\nPaintBBS NEOのホームページを表示しますか？",
            ) + "\n",
          )
        ) {
          openURL(url);
        }
      }
    };
  }
}
