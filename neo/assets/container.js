'use strict';

document.addEventListener("DOMContentLoaded", function() {
    Neo.init();

    if (!navigator.userAgent.match("Electron")) {
        Neo.start();
    }
});

var Neo = function() {};

Neo.version = "1.4.11";
Neo.painter;
Neo.fullScreen = false;
Neo.uploaded = false;
Neo.viewer = false;

Neo.config = {
    width: 300,
    height: 300,

    colors: [ 
        "#000000", "#FFFFFF",
        "#B47575", "#888888",
        "#FA9696", "#C096C0",
        "#FFB6FF", "#8080FF",
        "#25C7C9", "#E7E58D",
        "#E7962D", "#99CB7B",
        "#FCECE2", "#F9DDCF"
    ]
};

Neo.reservePen = {};
Neo.reserveEraser = {};

Neo.SLIDERTYPE_RED = 0;
Neo.SLIDERTYPE_GREEN = 1;
Neo.SLIDERTYPE_BLUE = 2;
Neo.SLIDERTYPE_ALPHA = 3;
Neo.SLIDERTYPE_SIZE = 4;

document.neo = Neo;

Neo.init = function() {
    var applets = document.getElementsByTagName('applet');
    if (applets.length == 0) {
        applets = document.getElementsByTagName('applet-dummy');
    }

    for (var i = 0; i < applets.length; i++) {
        var applet = applets[i];
        var name = applet.attributes.name.value;

        if (name == "paintbbs" || name == "pch") {
            Neo.applet = applet;

            if (name == "paintbbs") {
                Neo.initConfig(applet);
                Neo.createContainer(applet);
                Neo.init2();

            } else {
                Neo.viewer = true;
                Neo.initConfig(applet);
                
                var pch = Neo.getPCH(function(pch) {
                    if (pch) {
                        Neo.createViewer(applet);
                        Neo.config.width = pch.width;
                        Neo.config.height = pch.height;
                        Neo.initViewer(pch);
                        
                        applet.parentNode.removeChild(applet)
                    }
                });
            }
            break;
        }
    }
};

Neo.init2 = function() {
    var pageview = document.getElementById("pageView");
    pageview.style.width = Neo.config.applet_width + "px";
    pageview.style.height = Neo.config.applet_height + "px";

    Neo.canvas = document.getElementById("canvas");
    Neo.container = document.getElementById("container");
    Neo.toolsWrapper = document.getElementById("toolsWrapper");

    Neo.painter = new Neo.Painter();
    Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);

    Neo.container.oncontextmenu = function() {return false;};

    // 動画記録
    Neo.animation = (Neo.config.thumbnail_type == "animation");
    
    // 続きから描く
    Neo.storage = (Neo.isMobile()) ? localStorage : sessionStorage;

    var filename = Neo.getFilename();
    var message = (!filename || filename.slice(-4).toLowerCase() != ".pch") ?
        "描きかけの画像があります。復元しますか？" :
        "描きかけの画像があります。動画の読み込みを中止して復元しますか？";
    
    if (Neo.storage.getItem('timestamp') && confirm(Neo.translate(message))) {
        var oe = Neo.painter;
        setTimeout(function () {
            oe.loadSession(function () {
                oe._pushUndo();
                oe._actionMgr.restore();
            })
        }, 1);
        
    } else if (filename) {
        if (filename.slice(-4).toLowerCase() == ".pch") {
            Neo.painter.loadAnimation(filename)
        
        } else {
            Neo.painter.loadImage(filename);
        }
    }
    
    window.addEventListener("pagehide", function(e) {
        if (!Neo.uploaded && Neo.painter.isDirty()) {
            Neo.painter.saveSession();
        } else {
            Neo.painter.clearSession();
        }
    }, false);
}

Neo.initConfig = function(applet) {
    if (applet) {
        var name = applet.attributes.name.value || "neo";
        var appletWidth = applet.attributes.width;
        var appletHeight = applet.attributes.height;
        if (appletWidth) Neo.config.applet_width = parseInt(appletWidth.value);
        if (appletHeight) Neo.config.applet_height = parseInt(appletHeight.value);

        var params = applet.getElementsByTagName('param');
        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            Neo.config[p.name] = Neo.fixConfig(p.value);

            if (p.name == "image_width") Neo.config.width = parseInt(p.value);
            if (p.name == "image_height") Neo.config.height = parseInt(p.value);
        }

        var emulationMode = Neo.config.neo_emulation_mode || "2.22_8x";
        Neo.config.neo_alt_translation = emulationMode.slice(-1).match(/x/i);

        if (Neo.viewer && !Neo.config.color_bar) {
            Neo.config.color_bar = "#ddddff";
        }

        Neo.readStyles();
        Neo.applyStyle("color_bk", "#ccccff");
        Neo.applyStyle("color_bk2", "#bbbbff");
        Neo.applyStyle("color_tool_icon", "#e8dfae");
        Neo.applyStyle("color_icon", "#ccccff");
        Neo.applyStyle("color_iconselect", "#ffaaaa");
        Neo.applyStyle("color_text", "#666699");
        Neo.applyStyle("color_bar", "#6f6fae");
        Neo.applyStyle("tool_color_button", "#e8dfae");
        Neo.applyStyle("tool_color_button2", "#f8daaa");
        Neo.applyStyle("tool_color_text", "#773333");
        Neo.applyStyle("tool_color_bar", "#ddddff");
        Neo.applyStyle("tool_color_frame", "#000000");

        // viewer用
        if (Neo.viewer) {
            Neo.applyStyle("color_back", "#ccccff");
            Neo.applyStyle("color_bar_select", "#407675");
        }
        
        var e = document.getElementById("container");
        Neo.config.inherit_color = Neo.getInheritColor(e);
        if (!Neo.config.color_frame) Neo.config.color_frame = Neo.config.color_text;
    }

    Neo.config.reserves = [
        { size:1,
          color:"#000000", alpha:1.0,
          tool:Neo.Painter.TOOLTYPE_PEN,
          drawType:Neo.Painter.DRAWTYPE_FREEHAND
        },
        { size:5,
          color:"#FFFFFF", alpha:1.0,
          tool:Neo.Painter.TOOLTYPE_ERASER,
          drawType:Neo.Painter.DRAWTYPE_FREEHAND
        },
        { size:10,
          color:"#FFFFFF", alpha:1.0,
          tool:Neo.Painter.TOOLTYPE_ERASER,
          drawType:Neo.Painter.DRAWTYPE_FREEHAND
        },
    ];

    Neo.reservePen = Neo.clone(Neo.config.reserves[0]);
    Neo.reserveEraser = Neo.clone(Neo.config.reserves[1]);
};

Neo.fixConfig = function(value) {
    // javaでは"#12345"を色として解釈するがjavascriptでは"#012345"に変換しないとだめ
    if (value.match(/^#[0-9a-fA-F]{5}$/)) {
        value = "#0" + value.slice(1);
    }
    return value;
};

Neo.getStyleSheet = function() {
    var sheet = document.styleSheets[0];
    if (!sheet) {
        var style = document.createElement("style");
        document.head.appendChild(style); // must append before you can access sheet property
        sheet = style.sheet;
    }
    return sheet;
};

Neo.initSkin = function() {
    Neo.styleSheet = Neo.getStyleSheet();
    var lightBorder = Neo.multColor(Neo.config.color_icon, 1.3);
    var darkBorder = Neo.multColor(Neo.config.color_icon, 0.7);
    var lightBar = Neo.multColor(Neo.config.color_bar, 1.3);
    var darkBar = Neo.multColor(Neo.config.color_bar, 0.7);
    var bgImage = Neo.painter ? Neo.backgroundImage() : "";

    Neo.addRule(".NEO #container", "background-image", "url(" + bgImage + ")");
    Neo.addRule(".NEO .colorSlider .label", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .sizeSlider .label", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .layerControl .label1", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .layerControl .label0", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .toolTipOn .label", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .toolTipOff .label", "color", Neo.config.tool_color_text);

    Neo.addRule(".NEO #toolSet", "background-color", Neo.config.color_bk);
    Neo.addRule(".NEO #tools", "color", Neo.config.tool_color_text);
    Neo.addRule(".NEO .layerControl .bg", "border-bottom", "1px solid " + Neo.config.tool_color_text);

    Neo.addRule(".NEO .buttonOn", "color", Neo.config.color_text);
    Neo.addRule(".NEO .buttonOff", "color", Neo.config.color_text);

    Neo.addRule(".NEO .buttonOff", "background-color", Neo.config.color_icon);
    Neo.addRule(".NEO .buttonOff", "border-top", "1px solid ",  Neo.config.color_icon);
    Neo.addRule(".NEO .buttonOff", "border-left", "1px solid ", Neo.config.color_icon);
    Neo.addRule(".NEO .buttonOff", "box-shadow", "0 0 0 1px " + Neo.config.color_icon + ", 0 0 0 2px " + Neo.config.color_frame);

    Neo.addRule(".NEO .buttonOff:hover", "background-color", Neo.config.color_icon);
    Neo.addRule(".NEO .buttonOff:hover", "border-top", "1px solid " + lightBorder);
    Neo.addRule(".NEO .buttonOff:hover", "border-left", "1px solid " + lightBorder);
    Neo.addRule(".NEO .buttonOff:hover", "box-shadow", "0 0 0 1px " + Neo.config.color_iconselect + ", 0 0 0 2px " + Neo.config.color_frame);

    Neo.addRule(".NEO .buttonOff:active, .NEO .buttonOn", "background-color", darkBorder);
    Neo.addRule(".NEO .buttonOff:active, .NEO .buttonOn", "border-top", "1px solid " + darkBorder);
    Neo.addRule(".NEO .buttonOff:active, .NEO .buttonOn", "border-left", "1px solid " + darkBorder);
    Neo.addRule(".NEO .buttonOff:active, .NEO .buttonOn", "box-shadow", "0 0 0 1px " + Neo.config.color_iconselect + ", 0 0 0 2px " + Neo.config.color_frame);

    
    Neo.addRule(".NEO #canvas", "border", "1px solid " + Neo.config.color_frame);
    Neo.addRule(".NEO #scrollH, .NEO #scrollV", "background-color", Neo.config.color_icon);
    Neo.addRule(".NEO #scrollH, .NEO #scrollV", "box-shadow", "0 0 0 1px white" + ", 0 0 0 2px " + Neo.config.color_frame);

    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "background-color", Neo.config.color_bar);
    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "box-shadow", "0 0 0 1px " + Neo.config.color_icon);
    Neo.addRule(".NEO #scrollH div:hover, .NEO #scrollV div:hover", "box-shadow", "0 0 0 1px " + Neo.config.color_iconselect);

    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "border-top", "1px solid " + lightBar);
    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "border-left", "1px solid " + lightBar);
    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "border-right", "1px solid " + darkBar);
    Neo.addRule(".NEO #scrollH div, .NEO #scrollV div", "border-bottom", "1px solid " + darkBar);

    Neo.addRule(".NEO .toolTipOn", "background-color", Neo.multColor(Neo.config.tool_color_button, 0.7));
    Neo.addRule(".NEO .toolTipOff", "background-color", Neo.config.tool_color_button);
    Neo.addRule(".NEO .toolTipFixed", "background-color", Neo.config.tool_color_button2);

    Neo.addRule(".NEO .colorSlider, .NEO .sizeSlider", "background-color", Neo.config.tool_color_bar);
    Neo.addRule(".NEO .reserveControl", "background-color", Neo.config.tool_color_bar);
    Neo.addRule(".NEO .reserveControl", "background-color", Neo.config.tool_color_bar);
    Neo.addRule(".NEO .layerControl", "background-color", Neo.config.tool_color_bar);

    Neo.addRule(".NEO .colorTipOn, .NEO .colorTipOff", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .toolTipOn, .NEO .toolTipOff", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .toolTipFixed", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .colorSlider, .NEO .sizeSlider", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .reserveControl", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .layerControl", "box-shadow", "0 0 0 1px " + Neo.config.tool_color_frame);
    Neo.addRule(".NEO .reserveControl .reserve", "border", "1px solid " + Neo.config.tool_color_frame);

    if (navigator.language.indexOf("ja") != 0) {
        var labels = ["Fixed", "On", "Off"];
        for (var i = 0; i < labels.length; i++) {
            var selector = ".NEO .toolTip" + labels[i] + " .label";
            Neo.addRule(selector, "letter-spacing", "0px !important");
        }
    }
};

Neo.addRule = function(selector, styleName, value, sheet) {
    if (!sheet) sheet = Neo.styleSheet;
    if (sheet.addRule) {
        sheet.addRule(selector, styleName + ":" + value, sheet.rules.length);

    } else if (sheet.insertRule) {
        var rule = selector + "{" + styleName + ":" + value + "}";
        var index = sheet.cssRules.length;
        sheet.insertRule(rule, index);
    }
};

Neo.readStyles = function() {
    Neo.rules = {};
    for (var i = 0; i < document.styleSheets.length; i++) {
        Neo.readStyle(document.styleSheets[i]);
    }
};

Neo.readStyle = function(sheet) {
    try {
        var rules = sheet.cssRules;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (rule.styleSheet) {
                Neo.readStyle(rule.styleSheet);
                continue;
            }

            var selector = rule.selectorText
            if (selector) {
                selector = selector.replace(/^(.NEO\s+)?\./, '')

                var css = rule.cssText || rule.style.cssText;
                var result = css.match(/color:\s*(.*)\s*;/)
                if (result) {
                    var hex = Neo.colorNameToHex(result[1]);
                    if (hex) {
                        Neo.rules[selector] = hex;
                    }
                }
            }
        }
    } catch (e) {}
};

Neo.applyStyle = function(name, defaultColor) {
    if (Neo.config[name] == undefined) {
        Neo.config[name] = Neo.rules[name] || defaultColor;
    }
};

Neo.getInheritColor = function(e) {
    var result = "#000000";
    while (e && e.style) {
        if (e.style.color != "") { 
            result = e.style.color; 
            break;
        }
        if (e.attributes["text"]) {
            result = e.attributes["text"].value; 
            break;
        }
        e = e.parentNode;
    }
    return result;
};

Neo.backgroundImage = function() {
    var c1 = Neo.painter.getColor(Neo.config.color_bk) | 0xff000000;
    var c2 = Neo.painter.getColor(Neo.config.color_bk2) | 0xff000000;
    var bgCanvas = document.createElement("canvas");
    bgCanvas.width = 16;
    bgCanvas.height = 16;
    var ctx = bgCanvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, 16, 16);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var index = 0;
    for (var y = 0; y < 16; y++) {
        for (var x = 0; x < 16; x++) {
            buf32[index++] = (x == 14 || y == 14) ? c2 : c1;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
    return bgCanvas.toDataURL('image/png');
};

Neo.multColor = function(c, scale) {
    var r = Math.round(parseInt(c.substr(1, 2), 16) * scale);
    var g = Math.round(parseInt(c.substr(3, 2), 16) * scale);
    var b = Math.round(parseInt(c.substr(5, 2), 16) * scale);
    r = ("0" + Math.min(Math.max(r, 0), 255).toString(16)).substr(-2);
    g = ("0" + Math.min(Math.max(g, 0), 255).toString(16)).substr(-2);
    b = ("0" + Math.min(Math.max(b, 0), 255).toString(16)).substr(-2);
    return '#' + r + g + b;
};

Neo.colorNameToHex = function(name) {
    var colors = {"aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff","aquamarine":"#7fffd4", "azure":"#f0ffff", "beige":"#f5f5dc", "bisque":"#ffe4c4", "black":"#000000", "blanchedalmond":"#ffebcd", "blue":"#0000ff", "blueviolet":"#8a2be2", "brown":"#a52a2a", "burlywood":"#deb887", "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff", "darkblue":"#00008b", "darkcyan":"#008b8b", "darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f", "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkturquoise":"#00ced1", "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dodgerblue":"#1e90ff", "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff", "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#008000", "greenyellow":"#adff2f", "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred ":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c", "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", "lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2", "lightgrey":"#d3d3d3", "lightgreen":"#90ee90", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightsteelblue":"#b0c4de", "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6", "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", "mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370d8", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee", "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080", "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#ffa500", "orangered":"#ff4500", "orchid":"#da70d6", "palegoldenrod":"#eee8aa", "palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#d87093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#ffc0cb", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#800080", "rebeccapurple":"#663399", "red":"#ff0000", "rosybrown":"#bc8f8f", "royalblue":"#4169e1", "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4", "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee", "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32"};

    var rgb = name.toLowerCase().match(/rgb\((.*),(.*),(.*)\)/);
    if (rgb) {
        var r = ("0" + parseInt(rgb[1]).toString(16)).slice(-2)
        var g = ("0" + parseInt(rgb[2]).toString(16)).slice(-2)
        var b = ("0" + parseInt(rgb[3]).toString(16)).slice(-2)
        return "#" + r + g + b
    }

    if (typeof colors[name.toLowerCase()] != 'undefined') {
        return colors[name.toLowerCase()];
    }
    return false;
};

Neo.initComponents = function() {
    var copyright = document.getElementById("copyright")
    if (copyright) copyright.innerHTML += "v" + Neo.version;

    // アプレットのborderの動作をエミュレート
    if (navigator.userAgent.search("FireFox") > -1) {
        var container = document.getElementById("container");
        container.addEventListener("mousedown", function(e) {
            container.style.borderColor = Neo.config.inherit_color;
            e.stopPropagation();
        }, false);
        document.addEventListener("mousedown", function(e) {
            container.style.borderColor = 'transparent';
        }, false);
    }

    // ドラッグしたまま画面外に移動した時
    document.addEventListener("mouseup", function(e) {
        if (Neo.painter && !Neo.painter.isContainer(e.target)) {
            Neo.painter.cancelTool(e.target);
        }
    }, false);

    // 投稿に失敗する可能性があるときは警告を表示する
    Neo.showWarning();

    if (Neo.styleSheet) {
        Neo.addRule("*", "user-select", "none");
        Neo.addRule("*", "-webkit-user-select", "none");
        Neo.addRule("*", "-ms-user-select", "none");
    }
}

Neo.initButtons = function() {
    new Neo.Button().init("undo").onmouseup = function() {
        new Neo.UndoCommand(Neo.painter).execute();
    };
    new Neo.Button().init("redo").onmouseup = function () {
        new Neo.RedoCommand(Neo.painter).execute();
    };
    new Neo.Button().init("window").onmouseup = function() {
        new Neo.WindowCommand(Neo.painter).execute();
    };
    new Neo.Button().init("submit").onmouseup = function() {
        new Neo.SubmitCommand(Neo.painter).execute();
    };
    new Neo.Button().init("copyright").onmouseup = function() {
        new Neo.CopyrightCommand(Neo.painter).execute();
    };
    new Neo.Button().init("zoomPlus").onmouseup = function() {
        new Neo.ZoomPlusCommand(Neo.painter).execute();
    };
    new Neo.Button().init("zoomMinus").onmouseup = function() {
        new Neo.ZoomMinusCommand(Neo.painter).execute();
    };

    Neo.fillButton = new Neo.FillButton().init("fill");
    Neo.rightButton = new Neo.RightButton().init("right");

    if (Neo.isMobile()) {
        Neo.rightButton.element.style.display = "block";
    }
    
    // toolTip
    Neo.penTip = new Neo.PenTip().init("pen");
    Neo.pen2Tip = new Neo.Pen2Tip().init("pen2");
    Neo.effectTip = new Neo.EffectTip().init("effect");
    Neo.effect2Tip = new Neo.Effect2Tip().init("effect2");
    Neo.eraserTip = new Neo.EraserTip().init("eraser");
    Neo.drawTip = new Neo.DrawTip().init("draw");
    Neo.maskTip = new Neo.MaskTip().init("mask");

    Neo.toolButtons = [Neo.fillButton, 
                       Neo.penTip, 
                       Neo.pen2Tip, 
                       Neo.effectTip,
                       Neo.effect2Tip,
                       Neo.drawTip,
                       Neo.eraserTip];

    // colorTip
    for (var i = 1; i <= 14; i++) {
        new Neo.ColorTip().init("color" + i, {index:i});
    };
    
    // colorSlider
    Neo.sliders[Neo.SLIDERTYPE_RED] = new Neo.ColorSlider().init(
        "sliderRed", {type:Neo.SLIDERTYPE_RED});
    Neo.sliders[Neo.SLIDERTYPE_GREEN] = new Neo.ColorSlider().init(
        "sliderGreen", {type:Neo.SLIDERTYPE_GREEN});
    Neo.sliders[Neo.SLIDERTYPE_BLUE] = new Neo.ColorSlider().init(
        "sliderBlue", {type:Neo.SLIDERTYPE_BLUE});
    Neo.sliders[Neo.SLIDERTYPE_ALPHA] = new Neo.ColorSlider().init(
        "sliderAlpha", {type:Neo.SLIDERTYPE_ALPHA});

    // sizeSlider
    Neo.sliders[Neo.SLIDERTYPE_SIZE] = new Neo.SizeSlider().init(
        "sliderSize", {type:Neo.SLIDERTYPE_SIZE});

    // reserveControl
    for (var i = 1; i <= 3; i++) {
        new Neo.ReserveControl().init("reserve" + i, {index:i});    
    };

    new Neo.LayerControl().init("layerControl");
    new Neo.ScrollBarButton().init("scrollH");
    new Neo.ScrollBarButton().init("scrollV");
};

Neo.start = function(isApp) {
    if (Neo.viewer) {
        Neo.startViewer();
        return;
    }

    Neo.initSkin();
    Neo.initComponents();

    Neo.initButtons();

    Neo.isApp = isApp;
    if (Neo.applet) {
        var name = Neo.applet.attributes.name.value || "paintbbs";
        Neo.applet.outerHTML = "";
        document[name] = Neo;
        
        Neo.resizeCanvas();
        Neo.container.style.visibility = "visible";

        if (Neo.isApp) {
            var ipc = require('electron').ipcRenderer;
            ipc.sendToHost('neo-status', 'ok');

        } else {
            if (document.paintBBSCallback) {
                document.paintBBSCallback('start');
            }
        }
    }
};

Neo.isIE = function() {
    var ms = false;
    if (/MSIE 10/i.test(navigator.userAgent)) {
        ms = true; // This is internet explorer 10
    }
    if (/MSIE 9/i.test(navigator.userAgent) ||
        /rv:11.0/i.test(navigator.userAgent)) {
        ms = true; // This is internet explorer 9 or 11
    }
    return ms
};

Neo.isMobile = function() {
    return navigator.userAgent.match(/Android|iPhone|iPad|iPod/i);
};

Neo.showWarning = function() {
    var futaba = location.hostname.match(/2chan.net/i);
    var samplebbs = location.hostname.match(/neo.websozai.jp/i);

    var chrome = navigator.userAgent.match(/Chrome\/(\d+)/i);
    if (chrome && chrome.length > 1) chrome = chrome[1];

    var edge = navigator.userAgent.match(/Edge\/(\d+)/i);
    if (edge && edge.length > 1) edge = edge[1];

    var ms = Neo.isIE();

    var str = "";
    if (futaba || samplebbs) {
        if (ms || (edge && edge < 15)) {
            str = Neo.translate("このブラウザでは<br>投稿に失敗することがあります<br>");
        }
    }

    // もし<PARAM NAME="neo_warning" VALUE="...">があれば表示する
    if (Neo.config.neo_warning) {
        str += Neo.config.neo_warning;
    }

    var warning = document.getElementById("neoWarning")
    if (warning) {
        warning.innerHTML = str;
        setTimeout(function() { warning.style.opacity = "0"; }, 15000);
    }        
};

/*
  -----------------------------------------------------------------------
    UIの更新
  -----------------------------------------------------------------------
*/

Neo.updateUI = function() {
    var current = Neo.painter.tool.getToolButton();
    for (var i = 0; i < Neo.toolButtons.length; i++) {
        var toolTip = Neo.toolButtons[i];
        if (current) {
            if (current == toolTip) {
                toolTip.setSelected(true);
                toolTip.update();
            } else {
                toolTip.setSelected(false);
            }
        }
    }
    if (Neo.drawTip) {
        Neo.drawTip.update();
    }
    
    Neo.updateUIColor(true, false);
}

Neo.updateUIColor = function(updateSlider, updateColorTip) {
    for (var i = 0; i < Neo.toolButtons.length; i++) {
        var toolTip = Neo.toolButtons[i];
        toolTip.update();
    }

    if (updateSlider) {
        for (var i = 0; i < Neo.sliders.length; i++) {
            var slider = Neo.sliders[i];
            slider.update();
        }
    }

    // パレットを変更するとき
    if (updateColorTip) {
        var colorTip = Neo.ColorTip.getCurrent();
        if (colorTip) {
            colorTip.setColor(Neo.painter.foregroundColor);
        }
    }
};

/*
  -----------------------------------------------------------------------
    リサイズ対応
  -----------------------------------------------------------------------
*/

Neo.updateWindow = function() {
    if (Neo.fullScreen) {
        document.getElementById("windowView").style.display = "block";
        document.getElementById("windowView").appendChild(Neo.container);

    } else {
        document.getElementById("windowView").style.display = "none";
        document.getElementById("pageView").appendChild(Neo.container);
    }
    Neo.resizeCanvas();
};

Neo.resizeCanvas = function() {
    var appletWidth = Neo.container.clientWidth;
    var appletHeight = Neo.container.clientHeight;

    var canvasWidth = Neo.painter.canvasWidth;
    var canvasHeight = Neo.painter.canvasHeight;

    var width0 = canvasWidth * Neo.painter.zoom;
    var height0 = canvasHeight * Neo.painter.zoom;

    var width = (width0 < appletWidth - 100) ? width0 : appletWidth - 100;
    var height = (height0 < appletHeight - 120) ? height0 : appletHeight - 120;

    //width, heightは偶数でないと誤差が出るため
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    Neo.painter.destWidth = width;
    Neo.painter.destHeight = height;

    Neo.painter.destCanvas.width = width;
    Neo.painter.destCanvas.height = height;
    Neo.painter.destCanvasCtx = Neo.painter.destCanvas.getContext("2d");
    Neo.painter.destCanvasCtx.imageSmoothingEnabled = false;
    Neo.painter.destCanvasCtx.mozImageSmoothingEnabled = false;

    Neo.canvas.style.width = width + "px";
    Neo.canvas.style.height = height + "px";

    if (Neo.toolsWrapper) {
        var top  = (Neo.container.clientHeight - toolsWrapper.clientHeight) / 2;
        Neo.toolsWrapper.style.top = ((top > 0) ? top : 0) + "px";

        if (top < 0) {
            var s = Neo.container.clientHeight / toolsWrapper.clientHeight;
            Neo.toolsWrapper.style.transform =
                "translate(0, " + top + "px) scale(1," + s + ")";
        } else {
            Neo.toolsWrapper.style.transform = "";
        }
    }
    
    Neo.painter.setZoom(Neo.painter.zoom);
    Neo.painter.updateDestCanvas(0, 0, canvasWidth, canvasHeight);
};

/*
  -----------------------------------------------------------------------
    投稿
  -----------------------------------------------------------------------
*/

Neo.clone = function(src) {
    var dst = {};
    for (var k in src) {
        dst[k] = src[k];
    }
    return dst;
};

Neo.getSizeString = function(len) {
    var result = String(len);
    while (result.length < 8) {
        result = "0" + result;
    }
    return result;
};

Neo.openURL = function(url) {
    if (Neo.isApp) {
        require('electron').shell.openExternal(url);

    } else {
        window.open(url, '_blank');
    }
};

Neo.submit = function(board, blob, thumbnail, thumbnail2) {
    var url = board + Neo.config.url_save;
    var headerString = Neo.str_header || "";
    console.log("submit url=" + url + " header=" + headerString);

    if (document.paintBBSCallback) {
        var result = document.paintBBSCallback('check')
        if (result == 0 || result == "false") {
            return;
        }

        result = document.paintBBSCallback('header')
        if (result && typeof result == "string") {
            headerString == result;
        }
    }
    if (!headerString) headerString = Neo.config.send_header || "";

    var imageType = Neo.config.send_header_image_type;
    if (imageType && imageType == "true") {
        headerString = "image_type=png&" + headerString
        console.log("header=" + headerString);
    }

    var header = new Blob([headerString]);
    var headerLength = this.getSizeString(header.size);
    var imgLength = this.getSizeString(blob.size);

    var array = ['P', // PaintBBS
                 headerLength,
                 header,
                 imgLength,
                 '\r\n', 
                 blob];

    if (thumbnail) {
        var thumbnailLength = this.getSizeString(thumbnail.size);
        array.push(thumbnailLength, thumbnail);
    }
    if (thumbnail2) {
        var thumbnail2Length = this.getSizeString(thumbnail2.size);
        array.push(thumbnail2Length, thumbnail2);
    }
    
    var body = new Blob(array, {type: 'application/octet-binary'}); //これが必要！！

    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    
    request.onload = function(e) {
        console.log(request.response, 'status=', request.status);
        if (request.status / 100 == 2) {
            Neo.uploaded = true;
        }

        var url = Neo.config.url_exit;
        if (url[0] == '/') {
            url = url.replace(/^.*\//, ''); //よくわかんないけどとりあえず
        }

        // ふたばのpaintpost.phpは、画像投稿に成功するとresponseに
        // "./futaba.php?mode=paintcom&amp;painttmp=.png"
        // という文字列を返します。
        // 
        // NEOでは、responseに文字列"painttmp="が含まれる場合は
        // <PARAM>で指定されたurl_exitを無視して、このURLにジャンプします。
        var responseURL = request.response.replace(/&amp;/g, '&');
        if (responseURL.match(/painttmp=/)) {
            url = responseURL;
        }
        var exitURL = board + url;

        // しぃちゃんのドキュメントをよく見たら
        // responseが "URL:〜" の形だった場合はそこへ飛ばすって書いてありました。
        // こっちを使うべきでした……
        if (responseURL.match(/^URL:/)) {
            exitURL = responseURL.replace(/^URL:/, '');
        }

        location.href = exitURL;
    };
    request.onerror = function(e) {
        console.log("error");
    };
    request.onabort = function(e) {
        console.log("abort");
    };
    request.ontimeout = function(e) {
        console.log("timeout");
    };

    request.send(body);
};

/*
  -----------------------------------------------------------------------
    LiveConnect
  -----------------------------------------------------------------------
*/

Neo.getColors = function() {
    console.log("getColors")
    console.log("defaultColors==", Neo.config.colors.join('\n'));
    var array = []
    for (var i = 0; i < 14; i++) {
        array.push(Neo.colorTips[i].color)
    }
    return array.join('\n');
    //  return Neo.config.colors.join('\n');
};

Neo.setColors = function(colors) {
    console.log("setColors");
    var array = colors.split('\n');
    for (var i = 0; i < 14; i++) {
        var color = array[i];
        Neo.config.colors[i] = color;
        Neo.colorTips[i].setColor(color);
    }
};


Neo.pExit = function() {
    new Neo.SubmitCommand(Neo.painter).execute();
};

Neo.str_header = "";

/*
  -----------------------------------------------------------------------
    DOMツリーの作成
  -----------------------------------------------------------------------
*/

Neo.createContainer = function(applet) {
    var neo = document.createElement("div");
    neo.className = "NEO";
    neo.id = "NEO";
    var html = (function() {/*

<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>

<div id="pageView" style="width:450px; height:470px; margin:auto;">
<div id="container" style="visibility:hidden;" class="o">
<div id="center" class="o">
<div id="painterContainer" class="o">
<div id="painterWrapper" class="o">
<div id="upper" class="o">
<div id="redo">[やり直し]</div>
<div id="undo">[元に戻す]</div>
<div id="fill">[塗り潰し]</div>
<div id="right" style="display:none;">[右]</div>
</div>
<div id="painter">
<div id="canvas"> <!-- class="o">-->
<div id="scrollH"></div>
<div id="scrollV"></div>
<div id="zoomPlusWrapper">
<div id="zoomPlus">+</div>
</div>
<div id="zoomMinusWrapper">
<div id="zoomMinus">-</div>
</div>
<div id="neoWarning"></div>
</div>
</div>
<div id="lower" class="o">
</div>
</div>
<div id="toolsWrapper">
<div id="tools">
<div id="toolSet">
<div id="pen"></div>
<div id="pen2"></div>
<div id="effect"></div>
<div id="effect2"></div>
<div id="eraser"></div>
<div id="draw"></div>
<div id="mask"></div>

<div class="colorTips">
<div id="color2"></div><div id="color1"></div><br>
<div id="color4"></div><div id="color3"></div><br>
<div id="color6"></div><div id="color5"></div><br>
<div id="color8"></div><div id="color7"></div><br>
<div id="color10"></div><div id="color9"></div><br>
<div id="color12"></div><div id="color11"></div><br>
<div id="color14"></div><div id="color13"></div>
</div>

<div id="sliderRed"></div>
<div id="sliderGreen"></div>
<div id="sliderBlue"></div>
<div id="sliderAlpha"></div>
<div id="sliderSize"></div>

<div class="reserveControl" style="margin-top:4px;">
<div id="reserve1"></div>
<div id="reserve2"></div>
<div id="reserve3"></div>
</div>
<div id="layerControl" style="margin-top:6px;"></div>

<!--<div id="toolPad" style="height:20px;"></div>-->
</div>
</div>
</div>
</div>
</div>
<div id="headerButtons">
<div id="window">[窓]</div>
</div>
<div id="footerButtons">
<div id="submit">[投稿]</div>
<div id="copyright">[(C)しぃちゃん PaintBBS NEO]</div>
</div>
</div>
</div>

<div id="windowView" style="display: none;">

</div>


                                 */}).toString().match(/\/\*([^]*)\*\//)[1];

    neo.innerHTML = html.replace(/\[(.*?)\]/g, function(match, str) {
	return Neo.translate(str)
    })
    
    var parent = applet.parentNode;
    parent.appendChild(neo);
    parent.insertBefore(neo, applet);

    //  applet.style.display = "none";

    // NEOを組み込んだURLをアプリ版で開くとDOMツリーが2重にできて格好悪いので消しておく
    setTimeout(function() {
        var tmp = document.getElementsByClassName("NEO");
        if (tmp.length > 1) {
            for (var i = 1; i < tmp.length; i++) {
                tmp[i].style.display = "none";
            }
        }
    }, 0);
};

/*
  -----------------------------------------------------------------------
    動画表示モード
  -----------------------------------------------------------------------
*/

Neo.createViewer = function(applet) {
    var neo = document.createElement("div");
    neo.className = "NEO";
    neo.id = "NEO";
    var html = (function() {/*
<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>

<div id="pageView" style="margin:auto;">
<div id="container" style="visibility:visible;" class="o">

<div id="painter" style="background-color:white;">
<div id="canvas" style="background-color:white;">
</div>
</div>


<div id="viewerButtonsWrapper" style="display:block;">
<div id="viewerButtons" style="display:block;">

<div id="viewerPlay"></div>
<div id="viewerStop"></div>
<div id="viewerRewind"></div>
<div id="viewerSpeed" style="padding-left:2px;"></div>
<div id="viewerPlus"></div>
<div id="viewerMinus"></div>

<div id="viewerBar" style="display:inline-block;">
  <div style="width:calc(30% - 2px); height:16px; position: absolute; top: 1px; left: 1px;"></div>
</div>
</div>

</div>
</div>
                                 */}).toString().match(/\/\*([^]*)\*\//)[1];

    neo.innerHTML = html.replace(/\[(.*?)\]/g, function(match, str) {
	return Neo.translate(str)
    })
    
    var parent = applet.parentNode;
    parent.appendChild(neo);
    parent.insertBefore(neo, applet);

    // applet.style.display = "none";

    // NEOを組み込んだURLをアプリ版で開くとDOMツリーが2重にできて格好悪いので消しておく
    setTimeout(function() {
        var tmp = document.getElementsByClassName("NEO");
        if (tmp.length > 1) {
            for (var i = 1; i < tmp.length; i++) {
                tmp[i].style.display = "none";
            }
        }
    }, 0);
};

Neo.initViewer = function(pch) {
    var pageview = document.getElementById("pageView");
    var pageWidth = Neo.config.applet_width;
    var pageHeight = Neo.config.applet_height;
    pageview.style.width = pageWidth + "px";
    pageview.style.height = pageHeight + "px";
    
    Neo.canvas = document.getElementById("canvas");
    Neo.container = document.getElementById("container");
    Neo.container.style.backgroundColor = Neo.config.color_back;
    Neo.container.style.border = "0";

    var dx = (pageWidth - Neo.config.width) / 2;
    var dy = (pageHeight - Neo.config.height - 26) / 2;
    
    var painter = document.getElementById("painter");

    painter.style.marginTop = "0";
    painter.style.position = "absolute";
    painter.style.padding = "0";
    painter.style.bottom = (dy + 26) + "px";
    painter.style.left = (dx) + "px";

    var viewerButtonsWrapper = document.getElementById("viewerButtonsWrapper");
    viewerButtonsWrapper.style.width = (pageWidth - 2) + "px";
    
    var viewerBar = document.getElementById("viewerBar");
    viewerBar.style.position = "absolute";
    viewerBar.style.right = "2px";
    viewerBar.style.top = "1px";
    viewerBar.style.width = (pageWidth - (24 * 6) - 2) + "px"; 
    
    Neo.canvas.style.width = Neo.config.width + "px";
    Neo.canvas.style.height = Neo.config.height + "px";
    
    Neo.painter = new Neo.Painter();
    Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);
    
    Neo.container.oncontextmenu = function() {return false;};

    if (pch) {//Neo.config.pch_file) {
        Neo.painter._actionMgr._items = pch.data;
        Neo.painter._actionMgr.play(10);
    }
};

Neo.startViewer = function() {
    Neo.styleSheet = Neo.getStyleSheet();
    var lightBack = Neo.multColor(Neo.config.color_back, 1.3);
    var darkBack = Neo.multColor(Neo.config.color_back, 0.7);
    
    Neo.addRule(".NEO #viewerButtons", "color", Neo.config.color_text);
    Neo.addRule(".NEO #viewerButtons", "background-color", Neo.config.color_back);

    Neo.addRule(".NEO #viewerButtonsWrapper", "border", "1px solid " + Neo.config.color_frame + " !important");

    Neo.addRule(".NEO #viewerButtons", "border", "1px solid " + Neo.config.color_back + " !important");
    Neo.addRule(".NEO #viewerButtons", "border-left", "1px solid " + lightBack + " !important");
    Neo.addRule(".NEO #viewerButtons", "border-top", "1px solid " + lightBack + " !important");

    Neo.addRule(".NEO #viewerButtons >div.buttonOff", "background-color", Neo.config.color_icon + " !important");
    Neo.addRule(".NEO #viewerButtons >div.buttonOff:active", "background-color", darkBack + " !important");

    Neo.addRule(".NEO #viewerButtons >div", "border", "1px solid " + Neo.config.color_frame + " !important");
    
    Neo.addRule(".NEO #viewerButtons >div.buttonOff:hover", "border", "1px solid" + Neo.config.color_bar_select + " !important");
    Neo.addRule(".NEO #viewerButtons >div.buttonOff:active", "border", "1px solid" + Neo.config.color_bar_select + " !important");

    Neo.addRule(".NEO #viewerBar >div", "background-color", Neo.config.color_bar + " !important");

    setTimeout(function () {
        new Neo.ViewerButton().init("viewerPlay");
        new Neo.ViewerButton().init("viewerStop");
        new Neo.ViewerButton().init("viewerRewind").onmouseup = function() {
            console.log("whehehe;");
        };
        new Neo.ViewerButton().init("viewerSpeed");
        new Neo.ViewerButton().init("viewerPlus");
        new Neo.ViewerButton().init("viewerMinus");
    }, 100);
};

Neo.getFilename = function() {
    return Neo.config.pch_file || Neo.config.image_canvas;
};

Neo.getPCH = function(callback) {
    var filename = Neo.getFilename();
    if (!filename || filename.slice(-4).toLowerCase() != ".pch") return null;
    
    var request = new XMLHttpRequest();
    request.open("GET", filename, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        var byteArray = new Uint8Array(request.response);
        var data = LZString.decompressFromUint8Array(byteArray.slice(12));
        var header = byteArray.slice(0, 12);

        if ((header[0] == "N".charCodeAt(0)) &&
            (header[1] == "E".charCodeAt(0)) &&
            (header[2] == "O".charCodeAt(0))) {
            var width = header[4] + header[5] * 0x100
            var height = header[6] + header[7] * 0x100
            console.log('NEO animation:', width, 'x', height);
            if (callback) {
                var items = Neo.fixPCH(JSON.parse(data))
                callback({
                    width:width,
                    height:height,
                    data:items
                });
            }
            
        } else {
            console.log('not a NEO animation:');
        }
    }
    request.send();
};

Neo.fixPCH = function(items) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        var index = item.indexOf('eraseAll');
        if (index > 0) {
            var tmp = item.slice(index);
            var tmp2 = item.slice(0, index);
            console.log("fix eraseAll", tmp2, tmp);

            items[i] = tmp2;
            items.splice(i, 0, tmp)
        }
    }
    return items;
};

Neo.tintImage = function(ctx, c) {
    c = (Neo.painter.getColor(c) & 0xffffff);
    
    var imageData = ctx.getImageData(0, 0, 46, 18);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    for (var i = 0; i < buf32.length; i++) {
        var a = buf32[i] & 0xff000000;
        if (a) {
            buf32[i] = buf32[i] & a | c;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
};


