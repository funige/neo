import { Neo } from "./neo.js";
import * as PainterMod from "./painter.js";
import * as Actions from "./actions.js";
import * as Tools from "./tools.js";
import * as Widgets from "./widgets.js";
import * as Commands from "./commands.js";
import "./container.js";

Object.assign(Neo, PainterMod, Actions, Tools, Widgets, Commands);
/** @type {any} */ (window).Neo = Neo;
