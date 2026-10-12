import { Neo } from "./neo.js";

// 副作用で Neo.xxx = ... を実行するファイルは、名前なしで読み込む
import "./painter.js";
import "./actions.js";
import "./tools.js";
import "./widgets.js";
import "./commands.js";
import "./dictionary.js";
import "./container.js";

/** @type {any} */ (window).Neo = Neo;
