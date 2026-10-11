import "./lz-string.js";
import { Neo } from "./neo.js";
import { translate } from "./dictionary.js";
import * as PainterMod from "./painter.js";
import * as Actions from "./actions.js";
import * as Tools from "./tools.js";
import * as UI from "./widgets.js";
import * as Commands from "./commands.js";
import "./container.js";

Object.assign(Neo, PainterMod, Actions, Tools, UI, Commands);
Neo.translate = translate;
/** @type {any} */ (window).Neo = Neo;
