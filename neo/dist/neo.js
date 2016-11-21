'use strict';

document.addEventListener("DOMContentLoaded", function() {
    Neo.init();
});

var Neo = function() {};

Neo.version = "0.6.0";

Neo.painter;
Neo.fullScreen = false;

Neo.config = {
    width: 300,
    height: 300,
   
    color_bk: "#ccccff",

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
    for (var i = 0; i < applets.length; i++) {
        var applet = applets[i];
        var code = applet.attributes.code.value;
        if (code == "pbbs.PaintBBS.class") {
            Neo.applet = applet;
            Neo.createContainer(applet);
            Neo.initConfig(applet);
            Neo.init2();
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
    Neo.canvas.oncontextmenu = function() {return false;};
//  Neo.painter.onUpdateCanvas = null;

    Neo.initSkin();
    Neo.initComponents();
    Neo.initButtons();

//  // insertCSSが終わってから
//  Neo.resizeCanvas();
//  Neo.container.style.visibility = "visible";
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
            Neo.config[p.name] = p.value;
        }

        var e = document.getElementById("container");
        Neo.config.inherit_color = Neo.getInheritColor(e);

        applet.outerHTML = "";
        document[name] = Neo;
    }

    Neo.config.reserves = [
        { size:1, color:"#000000", alpha:1.0, tool:Neo.Painter.TOOLTYPE_PEN },
        { size:5, color:"#FFFFFF", alpha:1.0, tool:Neo.Painter.TOOLTYPE_ERASER },
        { size:10, color:"#FFFFFF", alpha:1.0, tool:Neo.Painter.TOOLTYPE_ERASER },
    ];

    Neo.reservePen = Neo.clone(Neo.config.reserves[0]);
    Neo.reserveEraser = Neo.clone(Neo.config.reserves[1]);
};

Neo.initSkin = function() {
    var sheet = document.styleSheets[0];
    if (!sheet) return;

    if (Neo.config.color_bk) {
        sheet.addRule(".NEO #container", "background-color: " + Neo.config.color_bk);
    }
    Neo.styleSheet = sheet;
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

Neo.initComponents = function() {
    document.getElementById("copyright").innerHTML += "v" + Neo.version;

    //アプレットのborderの動作をエミュレート
    var container = document.getElementById("container");
    container.addEventListener("mousedown", function(e) {
        container.style.borderColor = Neo.config.inherit_color;
        e.stopPropagation();
    }, false);
    document.addEventListener("mousedown", function(e) {
        container.style.borderColor = 'transparent';
    }, false);

    if (Neo.styleSheet) {
        Neo.styleSheet.addRule("*", "user-select:none;");
        Neo.styleSheet.addRule("*", "-webkit-user-select:none;");
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

    Neo.fillButton = new Neo.Button().init("fill", {type:'fill'});

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

Neo.start = function() {
    if (Neo.applet) {
        Neo.resizeCanvas();
        Neo.container.style.visibility = "visible";

        var ipc = require('electron').ipcRenderer;
        ipc.sendToHost('neo-status', 'ok');
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
        toolTip.setSelected((current == toolTip) ? true : false);
        if (current == toolTip) {
            toolTip.update();
        }
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

    var width0 = Neo.painter.canvasWidth * Neo.painter.zoom;
    var height0 = Neo.painter.canvasHeight * Neo.painter.zoom;

    var width = (width0 < appletWidth - 100) ? width0 : appletWidth - 100;
    var height = (height0 < appletHeight - 120) ? height0 : appletHeight - 120;

    Neo.painter.destWidth = width;
    Neo.painter.destHeight = height;

    Neo.painter.destCanvas.width = width;
    Neo.painter.destCanvas.height = height;
    Neo.painter.destCanvasCtx = Neo.painter.destCanvas.getContext("2d");
    Neo.painter.destCanvasCtx.imageSmoothingEnabled = false;
    Neo.painter.destCanvasCtx.mozImageSmoothingEnabled = false;

    Neo.canvas.style.width = width + "px";
    Neo.canvas.style.height = height + "px";
    Neo.toolsWrapper.style.height = Neo.container.clientHeight + "px";
    
    Neo.painter.setZoom(Neo.painter.zoom);
    Neo.painter.updateDestCanvas();
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
    require('electron').shell.openExternal(url);
};

Neo.submit = function(board, blob) {
    var url = board + Neo.config.url_save;
    var header = new Blob([Neo.config.send_header || ""]);
    var headerLength = this.getSizeString(header.size);
    var imgLength = this.getSizeString(blob.size);
    var body = new Blob(['P', // PaintBBS
                         headerLength,
                         header,
                         imgLength,
                         '\r\n', 
                         blob], {type: 'blob'});

    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.onload = function (e) {
        console.log(request.response);
        
        var exitURL = board + Neo.config.url_exit;
        location.href = exitURL;
    }
    request.send(body);
};

/*
-----------------------------------------------------------------------
LiveConnect
-----------------------------------------------------------------------
*/

Neo.getColors = function() {
    console.log("getColors");
    return Neo.config.colors.join('\n');
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

/*
-----------------------------------------------------------------------
DOMツリーの作成
-----------------------------------------------------------------------
*/

Neo.createContainer = function(applet) {
    var neo = document.createElement("div");
    neo.className = "NEO";
    neo.id = "NEO";
    neo.innerHTML = (function() {/*

<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>

<div id="pageView" style="width:450px; height:470px; margin:auto;">
    <div id="container" style="visibility:hidden;">
        <div id="center">
            <div id="painterContainer">
                <div id="painterWrapper">
                    <div id="upper">
                        <div id="redo">やり直し</div>
                        <div id="undo">元に戻す</div>
                        <div id="fill">塗り潰し</div>
                   </div>
                    <div id="painter">
                        <div id="canvas">
                            <div id="scrollH"></div>
                            <div id="scrollV"></div>
                            <div id="zoomPlusWrapper">
                                <div id="zoomPlus">+</div>
                            </div>
                            <div id="zoomMinusWrapper">
                                <div id="zoomMinus">-</div>
                            </div>
                        </div>
                    </div>
                    <div id="lower">
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

                            <div id="toolPad" style="height:20px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="headerButtons">
            <div id="window">窓</div>
        </div>
        <div id="footerButtons">
            <div id="submit">投稿</div>
            <div id="copyright">(C)しいちゃん PaintBBS NEO</div>
        </div>
    </div>
</div>

<div id="windowView" style="display: none;">
</div>

*/}).toString().match(/\/\*([^]*)\*\//)[1];

    var parent = applet.parentNode;
    parent.appendChild(neo);
    parent.insertBefore(neo, applet);

//  applet.style.display = "none";
};


'use strict';

Neo.Painter = function() {
    this._undoMgr = new Neo.UndoManager(50);
};

Neo.Painter.prototype.container;
Neo.Painter.prototype._undoMgr;
Neo.Painter.prototype.tool;

//Canvas Info
Neo.Painter.prototype.canvasWidth;
Neo.Painter.prototype.canvasHeight;
Neo.Painter.prototype.canvas = [];
Neo.Painter.prototype.canvasCtx = [];
Neo.Painter.prototype.visible = [];
Neo.Painter.prototype.current = 0;

//Temp Canvas Info
Neo.Painter.prototype.tempCanvas;
Neo.Painter.prototype.tempCanvasCtx;
Neo.Painter.prototype.tempX = 0;
Neo.Painter.prototype.tempY = 0;

//Destination Canvas for display
Neo.Painter.prototype.destCanvas;
Neo.Painter.prototype.destCanvasCtx;


Neo.Painter.prototype.backgroundColor = "#ffffff";
Neo.Painter.prototype.foregroundColor = "#000000";

Neo.Painter.prototype.lineWidth = 1;
Neo.Painter.prototype.alpha = 1;
Neo.Painter.prototype.zoom = 1;
Neo.Painter.prototype.zoomX = 0;
Neo.Painter.prototype.zoomY = 0;

Neo.Painter.prototype.isMouseDown;
Neo.Painter.prototype.isMouseDownRight;
Neo.Painter.prototype.prevMouseX;
Neo.Painter.prototype.prevMouseY;
Neo.Painter.prototype.mouseX;
Neo.Painter.prototype.mouseY;

Neo.Painter.prototype.isShiftDown = false;
Neo.Painter.prototype.isCtrlDown = false;
Neo.Painter.prototype.isAltDown = false;

Neo.Painter.prototype.onUpdateCanvas;
Neo.Painter.prototype._roundData = [];
Neo.Painter.prototype._toneData = [];
Neo.Painter.prototype.toolStack = [];

Neo.Painter.prototype.maskType = 0;
Neo.Painter.prototype.drawType = 0;
Neo.Painter.prototype.maskColor = "#000000";
Neo.Painter.prototype._currentColor = [];
Neo.Painter.prototype._currentMask = [];

Neo.Painter.LINETYPE_NONE = 0;
Neo.Painter.LINETYPE_PEN = 1;
Neo.Painter.LINETYPE_ERASER = 2;
Neo.Painter.LINETYPE_BRUSH = 3;
Neo.Painter.LINETYPE_TONE = 4;
Neo.Painter.LINETYPE_DODGE = 4;
Neo.Painter.LINETYPE_BURN = 4;

Neo.Painter.MASKTYPE_NONE = 0;
Neo.Painter.MASKTYPE_NORMAL = 1;
Neo.Painter.MASKTYPE_REVERSE = 2;
Neo.Painter.MASKTYPE_ADD = 3;
Neo.Painter.MASKTYPE_SUB = 4;

Neo.Painter.DRAWTYPE_FREEHAND = 0;
Neo.Painter.DRAWTYPE_LINE = 1;
Neo.Painter.DRAWTYPE_BEZIER = 2;

Neo.Painter.ALPHATYPE_NONE = 0;
Neo.Painter.ALPHATYPE_PEN = 1;
Neo.Painter.ALPHATYPE_BRUSH = 2;
Neo.Painter.ALPHATYPE_FILL = 3;

Neo.Painter.TOOLTYPE_NONE = 0;
Neo.Painter.TOOLTYPE_PEN = 1;
Neo.Painter.TOOLTYPE_ERASER = 2;
Neo.Painter.TOOLTYPE_HAND = 3;
Neo.Painter.TOOLTYPE_SLIDER = 4;
Neo.Painter.TOOLTYPE_FILL = 5;
Neo.Painter.TOOLTYPE_MASK = 6;
Neo.Painter.TOOLTYPE_ERASEALL = 7;
Neo.Painter.TOOLTYPE_ERASERECT = 8;
Neo.Painter.TOOLTYPE_COPY = 9;
Neo.Painter.TOOLTYPE_PASTE = 10;
Neo.Painter.TOOLTYPE_MERGE = 11;
Neo.Painter.TOOLTYPE_FLIP_H = 12;
Neo.Painter.TOOLTYPE_FLIP_V = 13;

Neo.Painter.TOOLTYPE_BRUSH = 14;
Neo.Painter.TOOLTYPE_TEXT = 15;
Neo.Painter.TOOLTYPE_TONE = 16;
Neo.Painter.TOOLTYPE_BLUR = 17;
Neo.Painter.TOOLTYPE_DODGE = 18;
Neo.Painter.TOOLTYPE_BURN = 19;
Neo.Painter.TOOLTYPE_RECT = 20;
Neo.Painter.TOOLTYPE_RECTFILL = 21;
Neo.Painter.TOOLTYPE_ELLIPSE = 22;
Neo.Painter.TOOLTYPE_ELLIPSEFILL = 23;
Neo.Painter.TOOLTYPE_BLURRECT = 24;
Neo.Painter.TOOLTYPE_TURN = 25;

Neo.Painter.prototype.build = function(div, width, height)
{
    this.container = div;
    this._initCanvas(div, width, height);
    this._initRoundData();
    this._initToneData();

    this.setTool(new Neo.PenTool());

    //alert("quickload");
};

Neo.Painter.prototype.setTool = function(tool) {
    if (this.tool && this.tool.saveStates) this.tool.saveStates();

    if (this.tool && this.tool.kill) {
        this.tool.kill();
    }
    this.tool = tool;
    tool.init();
    if (this.tool && this.tool.loadStates) this.tool.loadStates();
};

Neo.Painter.prototype.pushTool = function(tool) {
    this.toolStack.push(this.tool);
    this.tool = tool;
    tool.init();
};

Neo.Painter.prototype.popTool = function() {
    var tool = this.tool;
    if (tool && tool.kill) {
        tool.kill();
    }
    this.tool = this.toolStack.pop();
};

Neo.Painter.prototype.getCurrentTool = function() {
    if (this.tool) {
        var tool = this.tool;
        if (tool && tool.type == Neo.Painter.TOOLTYPE_SLIDER) {
            var stack = this.toolStack;
            if (stack.length > 0) {
                tool = stack[stack.length - 1];
            }
        }
        return tool;
    }
    return null;
};

Neo.Painter.prototype.setToolByType = function(toolType) {
    switch (parseInt(toolType)) {
    case Neo.Painter.TOOLTYPE_PEN:        this.setTool(new Neo.PenTool()); break;
    case Neo.Painter.TOOLTYPE_ERASER:     this.setTool(new Neo.EraserTool()); break;
    case Neo.Painter.TOOLTYPE_HAND:       this.setTool(new Neo.HandTool()); break;
    case Neo.Painter.TOOLTYPE_FILL:       this.setTool(new Neo.FillTool()); break;
    case Neo.Painter.TOOLTYPE_ERASEALL:   this.setTool(new Neo.EraseAllTool()); break;
    case Neo.Painter.TOOLTYPE_ERASERECT:  this.setTool(new Neo.EraseRectTool()); break;

    case Neo.Painter.TOOLTYPE_COPY:       this.setTool(new Neo.CopyTool()); break;
    case Neo.Painter.TOOLTYPE_PASTE:      this.setTool(new Neo.PasteTool()); break;
    case Neo.Painter.TOOLTYPE_MERGE:      this.setTool(new Neo.MergeTool()); break;
    case Neo.Painter.TOOLTYPE_FLIP_H:     this.setTool(new Neo.FlipHTool()); break;
    case Neo.Painter.TOOLTYPE_FLIP_V:     this.setTool(new Neo.FlipVTool()); break;

    case Neo.Painter.TOOLTYPE_BRUSH:      this.setTool(new Neo.BrushTool()); break;
    case Neo.Painter.TOOLTYPE_TEXT:       this.setTool(new Neo.TextTool()); break;
    case Neo.Painter.TOOLTYPE_TONE:       this.setTool(new Neo.ToneTool()); break;
    case Neo.Painter.TOOLTYPE_BLUR:       this.setTool(new Neo.BlurTool()); break;
    case Neo.Painter.TOOLTYPE_DODGE:      this.setTool(new Neo.DodgeTool()); break;
    case Neo.Painter.TOOLTYPE_BURN:       this.setTool(new Neo.BurnTool()); break;

    case Neo.Painter.TOOLTYPE_RECT:       this.setTool(new Neo.RectTool()); break;
    case Neo.Painter.TOOLTYPE_RECTFILL:   this.setTool(new Neo.RectFillTool()); break;
    case Neo.Painter.TOOLTYPE_ELLIPSE:    this.setTool(new Neo.EllipseTool()); break;
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:this.setTool(new Neo.EllipseFillTool()); break;
    case Neo.Painter.TOOLTYPE_BLURRECT:   this.setTool(new Neo.BlurRectTool()); break;
    case Neo.Painter.TOOLTYPE_TURN:       this.setTool(new Neo.TurnTool()); break;

    default:
        console.log("unknown toolType " + toolType);
        break;
    }
};

Neo.Painter.prototype._initCanvas = function(div, width, height) {
    width = parseInt(width);
    height = parseInt(height);
    var destWidth = parseInt(div.clientWidth);
    var destHeight = parseInt(div.clientHeight);
    this.destWidth = width;
    this.destHeight = height;

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.zoomX = width * 0.5;
    this.zoomY = height * 0.5;

    for (var i = 0; i < 2; i++) {
        this.canvas[i] = document.createElement("canvas");
        this.canvas[i].width = width;
        this.canvas[i].height = height;
        this.canvasCtx[i] = this.canvas[i].getContext("2d");

        this.canvas[i].style.imageRendering = "pixelated";
        this.canvasCtx[i].imageSmoothingEnabled = false;
        this.canvasCtx[i].mozImageSmoothingEnabled = false;
        this.visible[i] = true;
    }

    this.tempCanvas = document.createElement("canvas");
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.tempCanvasCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.style.position = "absolute";
    this.tempCanvas.enabled = false;

    this.destCanvas = document.createElement("canvas");
    this.destCanvasCtx = this.destCanvas.getContext("2d");
    this.destCanvas.width = destWidth;
    this.destCanvas.height = destHeight;
    this.container.appendChild(this.destCanvas);

    this.destCanvas.style.imageRendering = "pixelated";
    this.destCanvasCtx.imageSmoothingEnabled = false;
    this.destCanvasCtx.mozImageSmoothingEnabled = false;

    var ref = this;

    var container = document.getElementById("container");
    container.onmousedown = function(e) {ref._mouseDownHandler(e)};
    container.onmousemove = function(e) {ref._mouseMoveHandler(e)};
    container.onmouseup = function(e) {ref._mouseUpHandler(e)};
    container.onmouseover = function(e) {ref._rollOverHandler(e)};
    container.onmouseout = function(e) {ref._rollOutHandler(e)};

    document.onkeydown = function(e) {ref._keyDownHandler(e)};
    document.onkeyup = function(e) {ref._keyUpHandler(e)};

    window.onbeforeunload = function(e) {ref._beforeUnloadHandler(e)};

    this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype._initRoundData = function() {
    for (var r = 1; r <= 30; r++) {
        this._roundData[r] = new Uint8Array(r * r);
        var mask = this._roundData[r];
        var d = Math.floor(r / 2.0);
        var index = 0;
        for (var x = 0; x < r; x++) {
            for (var y = 0; y < r; y++) {
                var xx = x + 0.5 - r/2.0;
                var yy = y + 0.5 - r/2.0;
                mask[index++] = (xx*xx + yy*yy <= r*r/4) ? 1 : 0;
            }
        }
    }
    this._roundData[3][0] = 0;
    this._roundData[3][2] = 0;
    this._roundData[3][6] = 0;
    this._roundData[3][8] = 0;

    this._roundData[5][1] = 0;
    this._roundData[5][3] = 0;
    this._roundData[5][5] = 0;
    this._roundData[5][9] = 0;
    this._roundData[5][15] = 0;
    this._roundData[5][19] = 0;
    this._roundData[5][21] = 0;
    this._roundData[5][23] = 0;
};

Neo.Painter.prototype._initToneData = function() {
    var pattern = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    for (var i = 0; i < 16; i++) {
        this._toneData[i] = new Uint8Array(16);
        for (var j = 0; j < 16; j++) {
            this._toneData[i][j] = (i >= pattern[j]) ? 1 : 0;
        }
    }
};

Neo.Painter.prototype.getToneData = function(alpha) {
    var alphaTable = [23, 
                      47, 
                      69, 
                      92, 
                      114,
                      114,
                      114, 
                      138, 
                      161, 
                      184, 
                      184, 
                      207, 
                      230,
                      230,
                      253,
                     ];

    for (var i = 0; i < alphaTable.length; i++) {
        if (alpha < alphaTable[i]) {
            return this._toneData[i];
        }
    }
    console.log("toneData " + i);
    return this._toneData[i];
};

/*
-----------------------------------------------------------------------
	Mouse Event Handling
-----------------------------------------------------------------------
*/

Neo.Painter.prototype._keyDownHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;
    if (e.keyCode == 32) this.isSpaceDown = true;

    if (!this.isShiftDown && this.isCtrlDown) {
        if (!this.isAltDown) {
            if (e.keyCode == 90 || e.keyCode == 85) this.undo(); //Ctrl+Z,Ctrl.U
            if (e.keyCode == 89) this.redo(); //Ctrl+Y
        } else {
            if (e.keyCode == 90) this.redo(); //Ctrl+Alt+Z
        }
    }

    if (!this.isShiftDown && !this.isCtrlDown && !this.isAltDown) {
        if (e.keyCode == 107) new Neo.ZoomPlusCommand(this).execute(); // +
        if (e.keyCode == 109) new Neo.ZoomMinusCommand(this).execute(); // -
    }

    if (this.tool.keyDownHandler) {
        this.tool.keyDownHandler(e);
    }

    //スペース・Shift+スペースででスクロールしないように
    if (e.keyCode == 32) e.preventDefault();
};

Neo.Painter.prototype._keyUpHandler = function(e) {
    this.isShiftDown = e.shiftKey;
    this.isCtrlDown = e.ctrlKey;
    this.isAltDown = e.altKey;
    if (e.keyCode == 32) this.isSpaceDown = false;

    if (this.tool.keyUpHandler) {
        this.tool.keyUpHandler(oe);
    }
};

Neo.Painter.prototype._rollOverHandler = function(e) {
    if (this.tool.rollOverHandler) {
        this.tool.rollOverHandler(this);
    }
};

Neo.Painter.prototype._rollOutHandler = function(e) {
	if (this.tool.rollOutHandler) {
		this.tool.rollOutHandler(this);
    }
};

Neo.Painter.prototype._mouseDownHandler = function(e) {
    if (e.button == 2) {
        this.isMouseDownRight = true;

    } else {
        if (!e.shiftKey && e.ctrlKey && e.altKey) {
            this.isMouseDown = true;

        } else {
            if (e.ctrlKey || e.altKey) {
                this.isMouseDownRight = true;
            } else {
                this.isMouseDown = true;
            }
        }
    }
	
	this._updateMousePosition(e);
	this.prevMouseX = this.mouseX;
	this.prevMouseY = this.mouseY;

    if (this.isMouseDownRight) {
        this.isMouseDownRight = false;
        if (!this.isWidget(e.target)) {
            this.pickColor(this.mouseX, this.mouseY);
            return;
        }
    }

    //console.log(e.target.id || "??");

    if (e.target['data-bar']) {
        this.pushTool(new Neo.HandTool());

    } else if (this.isSpaceDown) {
        this.pushTool(new Neo.HandTool());
        this.tool.reverse = true;

    } else if (e.target['data-slider'] != undefined) {
        this.pushTool(new Neo.SliderTool());
        this.tool.target = e.target;

    } else if (e.ctrlKey && e.altKey && !e.shiftKey) {
        this.pushTool(new Neo.SliderTool());
        this.tool.target = Neo.sliders[Neo.SLIDERTYPE_SIZE].element;
        this.tool.alt = true;

    } else if (this.isWidget(e.target)) {
        this.isMouseDown = false;
        this.pushTool(new Neo.DummyTool());
    }

	this.tool.downHandler(this);
	//console.log(e.button);
	
	var ref = this;
	document.onmouseup = function(e) {
        ref._mouseUpHandler(e)
    };
};

Neo.Painter.prototype._mouseUpHandler = function(e) {
	this.isMouseDown = false;
	this.isMouseDownRight = false;
	this.tool.upHandler(this);
	document.onmouseup = undefined;
};

Neo.Painter.prototype._mouseMoveHandler = function(e) {
	this._updateMousePosition(e);
		
	if (this.isMouseDown || this.isMouseDownRight) {
		this.tool.moveHandler(this);
	} else {
		if (this.tool.upMoveHandler) {
			this.tool.upMoveHandler(this);
		}
	}
	this.prevMouseX = this.mouseX;
	this.prevMouseY = this.mouseY;
};


Neo.Painter.prototype._updateMousePosition = function(e) {
    var rect = this.destCanvas.getBoundingClientRect();

    if (this.zoom <= 0) this.zoom = 1; //なぜか0になることがあるので

	this.mouseX = (e.clientX - rect.left) / this.zoom 
            + this.zoomX 
            - this.destCanvas.width * 0.5 / this.zoom;
	this.mouseY = (e.clientY - rect.top)  / this.zoom 
            + this.zoomY 
            - this.destCanvas.height * 0.5 / this.zoom;
	
	if (isNaN(this.prevMouseX)) {
		this.prevMouseX = this.mouseX;
	}
	if (isNaN(this.prevMouseY)) {
		this.prevMosueY = this.mouseY;
	}

    this.rawMouseX = e.clientX;
    this.rawMouseY = e.clientY;
    this.clipMouseX = Math.max(Math.min(this.canvasWidth, this.mouseX), 0);
    this.clipMouseY = Math.max(Math.min(this.canvasHeight, this.mouseY), 0);
};

Neo.Painter.prototype._beforeUnloadHandler = function(e) {
    // quick save
};

/*
-------------------------------------------------------------------------
	Undo
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.undo = function() {
	var undoItem = this._undoMgr.popUndo();
	if (undoItem) {
		this._pushRedo();
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Neo.Painter.prototype.redo = function() {
	var undoItem = this._undoMgr.popRedo();
	if (undoItem) {
		this._pushUndo(0,0,this.canvasWidth, this.canvasHeight, true);
		this.canvasCtx[0].putImageData(undoItem.data[0], undoItem.x,undoItem.y);
		this.canvasCtx[1].putImageData(undoItem.data[1], undoItem.x,undoItem.y);
		this.updateDestCanvas(undoItem.x, undoItem.y, undoItem.width, undoItem.height);
	}
};

Neo.Painter.prototype.hasUndo = function() {
	return true;
};

Neo.Painter.prototype._pushUndo = function(x, y, w, h, holdRedo) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new Neo.UndoItem();
	undoItem.x = 0;
	undoItem.y = 0;
	undoItem.width = w;
	undoItem.height = h;
	undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
	this._undoMgr.pushUndo(undoItem, holdRedo);
};

Neo.Painter.prototype._pushRedo = function(x, y, w, h) {
	x = (x == undefined) ? 0 : x;
	y = (y == undefined) ? 0 : y;
	w = (w == undefined) ? this.canvasWidth : w;
	h = (h == undefined) ? this.canvasHeight : h;
	var undoItem = new Neo.UndoItem();
	undoItem.x = 0;
	undoItem.y = 0;
	undoItem.width = w;
	undoItem.height = h;
	undoItem.data = [this.canvasCtx[0].getImageData(x, y, w, h),
                     this.canvasCtx[1].getImageData(x, y, w, h)];
	this._undoMgr.pushRedo(undoItem);
};


/*
-------------------------------------------------------------------------
	Data Cache for Undo / Redo
-------------------------------------------------------------------------
*/

Neo.UndoManager = function(_maxStep){
	this._maxStep = _maxStep;
	this._undoItems = [];
	this._redoItems = [];
}
Neo.UndoManager.prototype._maxStep;
Neo.UndoManager.prototype._redoItems;
Neo.UndoManager.prototype._undoItems;

//アクションをしてUndo情報を更新
Neo.UndoManager.prototype.pushUndo = function(undoItem, holdRedo) {
	this._undoItems.push(undoItem);
	if (this._undoItems.length > this._maxStep) {
		this._undoItems.shift();
	}
	
	if (!holdRedo == true) {
		this._redoItems = [];
    }
};

Neo.UndoManager.prototype.popUndo = function() {
	return this._undoItems.pop();
}

Neo.UndoManager.prototype.pushRedo = function(undoItem) {
	this._redoItems.push(undoItem);
}

Neo.UndoManager.prototype.popRedo = function() {
	return this._redoItems.pop();
}


Neo.UndoItem = function() {}
Neo.UndoItem.prototype.data;
Neo.UndoItem.prototype.x;
Neo.UndoItem.prototype.y;
Neo.UndoItem.prototype.width;
Neo.UndoItem.prototype.height;

/*
-------------------------------------------------------------------------
	Zoom Controller
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.setZoom = function(value) {
	this.zoom = value;

    var container = document.getElementById("container");
    var width = this.canvasWidth * this.zoom;
    var height = this.canvasHeight * this.zoom;
    if (width > container.clientWidth - 100) width = container.clientWidth - 100;
    if (height > container.clientHeight - 130) height = container.clientHeight - 130;
    this.destWidth = width;
    this.destHeight = height;

	this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight, false);
	this.setZoomPosition(this.zoomX, this.zoomY);
};

Neo.Painter.prototype.setZoomPosition = function(x, y) {
	var minx = (this.destCanvas.width / this.zoom) * 0.5;
	var maxx = this.canvasWidth - minx;
	var miny = (this.destCanvas.height / this.zoom) * 0.5;
	var maxy = this.canvasHeight - miny;

	
	x = Math.max(Math.min(maxx,x),minx);
	y = Math.max(Math.min(maxy,y),miny);
	
	//console.log(minx, maxx, miny, maxy, this.zoomX, this.zoomY);
	
	this.zoomX = x;
	this.zoomY = y;
	this.updateDestCanvas(0,0,this.canvasWidth,this.canvasHeight,false);
    
    this.scrollBarX = (maxx == minx) ? 0 : (x - minx) / (maxx - minx);
    this.scrollBarY = (maxy == miny) ? 0 : (y - miny) / (maxy - miny);
    this.scrollWidth = maxx - minx;
    this.scrollHeight = maxy - miny;

    if (Neo.scrollH) Neo.scrollH.update(this);
    if (Neo.scrollV) Neo.scrollV.update(this);
};


/*
-------------------------------------------------------------------------
	Drawing Helper
-------------------------------------------------------------------------
*/

Neo.Painter.prototype.submit = function(board) {
    Neo.submit(board, this.getPNG());
};

Neo.Painter.prototype.dataURLtoBlob = function(dataURL) {
    var byteString;
    if (dataURL.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURL.split(',')[1]);
    } else {
        byteString = unescape(dataURL.split(',')[1]);
    }

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:'image/png'});
};

Neo.Painter.prototype.getPNG = function() {
    var width = this.canvasWidth;
    var height = this.canvasHeight;
    var pngCanvas = document.createElement("canvas");
    pngCanvas.width = width;
    pngCanvas.height = height;
    var pngCanvasCtx = pngCanvas.getContext("2d");
    pngCanvasCtx.fillStyle = "#ffffff";
    pngCanvasCtx.fillRect(0, 0, width, height);

	if (this.visible[0]) {
	    pngCanvasCtx.drawImage(this.canvas[0], 
                               0, 0, width, height, 
                               0, 0, width, height);
    }
    if (this.visible[1]) {
	    pngCanvasCtx.drawImage(this.canvas[1], 
                               0, 0, width, height, 
                               0, 0, width, height);
    }

    var dataURL = pngCanvas.toDataURL('image/png');
    return this.dataURLtoBlob(dataURL);
};

Neo.Painter.prototype.clearCanvas = function(doConfirm) {
	if (!doConfirm || window.confirm("全消しします")) {
		//Register undo first;
		this._pushUndo();
	
		this.canvasCtx[0].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.canvasCtx[1].clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
	}
};

Neo.Painter.prototype.updateDestCanvas = function(x, y, width, height, useTemp) {	
	this.destCanvasCtx.save();

	this.destCanvasCtx.translate(this.destCanvas.width*.5, this.destCanvas.height*.5);
	this.destCanvasCtx.scale(this.zoom, this.zoom);
	this.destCanvasCtx.translate(-this.zoomX, -this.zoomY);
	this.destCanvasCtx.globalAlpha = 1.0;
	this.destCanvasCtx.fillStyle = "#ffffff";
	this.destCanvasCtx.fillRect(0, 0, width, height);

	if (this.visible[0]) {
	    this.destCanvasCtx.drawImage(this.canvas[0], 
                                     x, y, width, height, 
                                     x, y, width, height);
    }
    if (this.visible[1]) {
	    this.destCanvasCtx.drawImage(this.canvas[1], 
                                     x, y, width, height, 
                                     x, y, width, height);
    }
	if (useTemp) {
		this.destCanvasCtx.globalAlpha = 1.0; //this.alpha;
		this.destCanvasCtx.drawImage(this.tempCanvas, 
                                     x, y, width, height, 
                                     x + this.tempX, y + this.tempY, width, height);
	}
	this.destCanvasCtx.restore();
	
	if (this.onUpdateCanvas) {
        this.onUpdateCanvas(this);
    }
};

Neo.Painter.prototype.fillContext = function(color) {
};

Neo.Painter.prototype.getColor = function(c) {
    if (!c) c = this.foregroundColor;
    var r = parseInt(c.substr(1, 2), 16);
    var g = parseInt(c.substr(3, 2), 16);
    var b = parseInt(c.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);
    return a <<24 | b<<16 | g<<8 | r;
};

Neo.Painter.prototype.getColorString = function(c) {
    var rgb = ("000000" + (c & 0xffffff).toString(16)).substr(-6);
    return '#' + rgb;
};

Neo.Painter.prototype.setColor = function(c) {
    if (typeof c != "string") c = this.getColorString(c);
    this.foregroundColor = c;

    Neo.updateUI();
};

Neo.Painter.prototype.getAlpha = function(type) {
    var a1 = this.alpha;

    switch (type) {
    case Neo.Painter.ALPHATYPE_PEN:
        if (a1 > 0.5) {
            a1 = 1.0/16 + (a1 - 0.5) * 30.0/16;
        } else {
            a1 = Math.sqrt(2 * a1) / 16.0;
        }
        a1 = Math.min(1, Math.max(0, a1));
        break;

    case Neo.Painter.ALPHATYPE_BRUSH:
        //値が小さい時（1〜128ぐらい）は再現が難しいのであきらめた
        a1 = -0.00056 * a1 + 0.0042 / (1.0 - a1) - 0.0042;
        a1 = Math.min(1.0, Math.max(0, a1));
        break;

    case Neo.Painter.ALPHATYPE_FILL:
        a1 = -0.00056 * a1 + 0.0042 / (1.0 - a1) - 0.0042;
        a1 = Math.min(1.0, Math.max(0, a1 * 10));
        break;
    }
    return a1;
};

Neo.Painter.prototype.prepareDrawing = function () {
    var r = parseInt(this.foregroundColor.substr(1, 2), 16);
    var g = parseInt(this.foregroundColor.substr(3, 2), 16);
    var b = parseInt(this.foregroundColor.substr(5, 2), 16);
    var a = Math.floor(this.alpha * 255);

    var maskR = parseInt(this.maskColor.substr(1, 2), 16);
    var maskG = parseInt(this.maskColor.substr(3, 2), 16);
    var maskB = parseInt(this.maskColor.substr(5, 2), 16);

    this._currentColor = [r, g, b, a];
    this._currentMask = [maskR, maskG, maskB];
};

Neo.Painter.prototype.isMasked = function (buf8, index) {
    var r = this._currentMask[0];
    var g = this._currentMask[1];
    var b = this._currentMask[2];

    switch (this.maskType) {
    case Neo.Painter.MASKTYPE_NONE:
        return;

    case Neo.Painter.MASKTYPE_NORMAL:
        return (buf8[index + 3] != 0 &&
                buf8[index + 0] == r &&
                buf8[index + 1] == g &&
                buf8[index + 2] == b) ? true : false;

    case Neo.Painter.MASKTYPE_REVERSE:
        return (buf8[index + 3] != 0 &&
                buf8[index + 0] == r &&
                buf8[index + 1] == g &&
                buf8[index + 2] == b) ? false : true;
    }
    return false;
};

Neo.Painter.prototype.addStrokePoint = function(stroke, strokeWidth, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = y * strokeWidth + x;
    var a1 = this._currentColor[3] / 255.0;

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++]) {
                var a0 = buf8[index + 3] / 255.0;
                var a = a0 + a1 - a0 * a1;
                buf8[index + 3] = Math.floor(a * 255 + 0.5);
            }
            index++;
        }
        index += strokeWidth - d;
    }
};

Neo.Painter.prototype.setStroke = function(buf8, width, stroke, left, top, type) {
};

Neo.Painter.prototype.createAlphaBuffer = function(buf8) {
    var size = buf8.length / 4;
    var alphaBuffer = new Uint16Array(size);
    var src = 3;
    for (var i = 0; i < size; i++) {
        alphaBuffer[i] = buf8[src] * 0x100;
        src += 4;
    }
    return alphaBuffer;
};


Neo.Painter.prototype.setPoint = function(buf8, bufWidth, x0, y0, left, top, type) {
    var x = x0 - left;
    var y = y0 - top;

    switch (type) {
    case Neo.Painter.LINETYPE_PEN:
        this.setPenPoint(buf8, bufWidth, x, y);
        break;

    case Neo.Painter.LINETYPE_BRUSH:
        this.setBrushPoint(buf8, bufWidth, x, y);
        break;

    case Neo.Painter.LINETYPE_TONE:
        this.setTonePoint(buf8, bufWidth, x, y, x0, y0);
        break;

    case Neo.Painter.LINETYPE_ERASER:
        this.setEraserPoint(buf8, bufWidth, x, y);
        break;

/*
    case Neo.Painter.LINETYPE_DODGE:
        this.setDodgePoint(buf8, bufWidth, x, y);
        break;

    case Neo.Painter.LINETYPE_BURN:
        this.setBurnPoint(buf8, bufWidth, x, y);
        break;
*/
    default:
        break;
    }
};


Neo.Painter.prototype.setPenPoint = function(buf8, width, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_PEN);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                var a = a0 + a1 - a0 * a1;
                if (a > 0) {
                    var a1x = Math.max(a1, 1.0/255);

//                  var r = (r1 * a1x + r0 * a0 * (1 - a1x)) / a;
//                  var g = (g1 * a1x + g0 * a0 * (1 - a1x)) / a;
//                  var b = (b1 * a1x + b0 * a0 * (1 - a1x)) / a;
                    var r = (r1 * a1x + r0 * a0) / (a0 + a1x);
                    var g = (g1 * a1x + g0 * a0) / (a0 + a1x);
                    var b = (b1 * a1x + b0 * a0) / (a0 + a1x);

                    r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                    g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                    b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
                }

                var tmp = a * 255;
                a = Math.ceil(tmp);

                buf8[index + 0] = r;
                buf8[index + 1] = g;
                buf8[index + 2] = b;
                buf8[index + 3] = a;

            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.setBrushPoint = function(buf8, width, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var index = (y * width + x) * 4;

    var shape = this._roundData[d];
    var shapeIndex = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.Painter.ALPHATYPE_BRUSH);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var r0 = buf8[index + 0];
                var g0 = buf8[index + 1];
                var b0 = buf8[index + 2];
                var a0 = buf8[index + 3] / 255.0;

                var a = a0 + a1 - a0 * a1;
                if (a > 0) {
                    var a1x = Math.max(a1, 1.0/255);

//                  var r = (r1 * a1x + r0 * a0 * (1 - a1x)) / a;
//                  var g = (g1 * a1x + g0 * a0 * (1 - a1x)) / a;
//                  var b = (b1 * a1x + b0 * a0 * (1 - a1x)) / a;
                    var r = (r1 * a1x + r0 * a0) / (a0 + a1x);
                    var g = (g1 * a1x + g0 * a0) / (a0 + a1x);
                    var b = (b1 * a1x + b0 * a0) / (a0 + a1x);

                    r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                    g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                    b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
                }

                var tmp = a * 255;
                a = Math.ceil(tmp);

                buf8[index + 0] = r;
                buf8[index + 1] = g;
                buf8[index + 2] = b;
                buf8[index + 3] = a;

            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.setTonePoint = function(buf8, width, x, y, x0, y0) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;

    var r = this._currentColor[0];
    var g = this._currentColor[1];
    var b = this._currentColor[2];
    var a = this._currentColor[3];

    var toneData = this.getToneData(a);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                if (toneData[(x0+j)%4 + ((y0+i)%4 * 4)]) {
                    buf8[index + 0] = r;
                    buf8[index + 1] = g;
                    buf8[index + 2] = b;
                    buf8[index + 3] = 255;
                }
            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.setEraserPoint = function(buf8, width, x, y) {
    var d = this.lineWidth;
    var r0 = Math.floor(d / 2);
    x -= r0;
    y -= r0;

    var shape = this._roundData[d];
    var shapeIndex = 0;
    var index = (y * width + x) * 4;
    var a = Math.floor(this.alpha * 255);

    for (var i = 0; i < d; i++) {
        for (var j = 0; j < d; j++) {
            if (shape[shapeIndex++] && !this.isMasked(buf8, index)) {
                var k = (buf8[index + 3] / 255.0) * (1.0 - (a / 255.0));

                buf8[index + 3] -= a / (d * (255.0 - a) / 255.0); //要修正
            }
            index += 4;
        }
        index += (width - d) * 4;
    }
};

Neo.Painter.prototype.xorPixel = function(buf32, bufWidth, x, y, c) {
    var index = y * bufWidth + x;
    if (!c) c = 0xffffff;
    buf32[index] ^= c;
};

Neo.Painter.prototype.prevLine = null; // 始点または終点が2度プロットされることがあるので
Neo.Painter.prototype.drawLine = function(ctx, x0, y0, x1, y1, type) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);
    var prev = [x0, y0, x1, y1];

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);
    var r = Math.ceil(this.lineWidth / 2);

    var left = ((x0 < x1) ? x0 : x1) - r;
    var top = ((y0 < y1) ? y0 : y1) - r;

    var imageData = ctx.getImageData(left, top, width + r*2, height + r*2);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        


    while (true) {
        if (this.prevLine == null ||
            !((this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
              (this.prevLine[2] == x0 && this.prevLine[3] == y0))) {
            this.setPoint(buf8, imageData.width, x0, y0, left, top, type);
//          this.addStrokePoint(stroke, stroke.width, x0 - left, y0 - top);
        }

        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

//  this.setStroke(buf8, imageData.width, stroke, left, top, type);
    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
    
    this.prevLine = prev;
};

Neo.Painter.prototype.xorRect = function(buf32, bufWidth, x, y, width, height, c) {
    var index = y * bufWidth + x;
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            buf32[index] ^= c;
            index++;
        }
        index += width - bufWidth;
    }
};

Neo.Painter.prototype.drawXORRect = function(ctx, x, y, width, height, isFill, c) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    if (width == 0 || height == 0) return;

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var index = 0;
    if (!c) c = 0xffffff;

    if (isFill) {
        this.xorRect(buf32, width, 0, 0, width, height, c);

    } else {
        for (var i = 0; i < width; i++) { //top
            buf32[index] = buf32[index] ^= c;
            index++;
        }
        if (height > 1) {
            index = width;
            for (var i = 1; i < height; i++) { //left
                buf32[index] = buf32[index] ^= c;
                index += width;
            }
            if (width > 1) {
                index = width * 2 - 1;
                for (var i = 1; i < height - 1; i++) { //right
                    buf32[index] = buf32[index] ^= c;
                    index += width;
                }
                index = width * (height - 1) + 1;
                for (var i = 1; i < width; i++) { // bottom
                    buf32[index] = buf32[index] ^= c;
                    index++;
                }
            }
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.drawXOREllipse = function(ctx, x, y, width, height, isFill, c) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    if (width == 0 || height == 0) return;
    if (!c) c = 0xffffff;

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);


    var a = width-1, b = height-1, b1 = b&1; /* values of diameter */
    var dx = 4*(1-a)*b*b, dy = 4*(b1+1)*a*a; /* error increment */
    var err = dx+dy+b1*a*a, e2; /* error of 1.step */

    var x0 = x;
    var y0 = y;
    var x1 = x0+a;
    var y1 = y0+b;

    if (x0 > x1) { x0 = x1; x1 += a; }
    if (y0 > y1) y0 = y1;
    y0 += Math.floor((b+1)/2); y1 = y0-b1;   /* starting pixel */
    a *= 8*a; b1 = 8*b*b;
    var ymin = y0 - 1;

    do {
        if (isFill) {
            if (ymin < y0) {
                this.xorRect(buf32, width, x0-x, y0 - y, x1 - x0, 1, c);
                if (y0 != y1) {
                    this.xorRect(buf32, width, x0-x, y1 - y, x1 - x0, 1, c);
                }
                ymin = y0;
            }
        } else {
            this.xorPixel(buf32, width, x1-x, y0-y, c);
            if (x0 != x1) {
                this.xorPixel(buf32, width, x0-x, y0-y, c);
            }
            if (y0 != y1) {
                this.xorPixel(buf32, width, x0-x, y1-y, c);
                if (x0 != x1) {
                    this.xorPixel(buf32, width, x1-x, y1-y, c);
                }
            }
        }
        e2 = 2*err;
        if (e2 <= dy) { y0++; y1--; err += dy += a; }  /* y step */ 
        if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; } /* x step */
    } while (x0 <= x1);

    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.drawXORLine = function(ctx, x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y0 = Math.round(y0);
    y1 = Math.round(y1);

    var width = Math.abs(x1 - x0);
    var height = Math.abs(y1 - y0);

    var left = ((x0 < x1) ? x0 : x1);
    var top = ((y0 < y1) ? y0 : y1);
    console.log("left:"+left+" top:"+top+" width:"+width+" height:"+height);

    var imageData = ctx.getImageData(left, top, width + 1, height + 1);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var dx = width, sx = x0 < x1 ? 1 : -1;
    var dy = height, sy = y0 < y1 ? 1 : -1; 
    var err = (dx > dy ? dx : -dy) / 2;        

    while (true) {
        if (this.prevLine == null ||
            !((this.prevLine[0] == x0 && this.prevLine[1] == y0) ||
              (this.prevLine[2] == x0 && this.prevLine[3] == y0))) {
            
            this.xorPixel(buf32, imageData.width, x0 - left, y0 - top, c);
        }

        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, left, top);
};


Neo.Painter.prototype.eraseRect = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var a = 1.0 - this.alpha;
    if (a != 0) {
        a = Math.ceil(2.0 / a);
    } else {
        a = 255;
    }

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            if (!this.isMasked(buf8, index)) {
                buf8[index + 3] -= a;
            }
            index += 4;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.flipH = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var half = Math.floor(width / 2);
    for (var j = 0; j < height; j++) {
        var index = j * width;
        var index2 = index + (width - 1);
        for (var i = 0; i < half; i++) {
            var value = buf32[index + i];
            buf32[index + i] = buf32[index2 -i];
            buf32[index2 - i] = value;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.flipV = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var half = Math.floor(height / 2);
    for (var j = 0; j < half; j++) {
        var index = j * width;
        var index2 = (height - 1 - j) * width;
        for (var i = 0; i < width; i++) {
            var value = buf32[index + i];
            buf32[index + i] = buf32[index2 + i];
            buf32[index2 + i] = value;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.merge = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = [];
    var buf32 = [];
    var buf8 = [];
    for (var i = 0; i < 2; i++) {
        imageData[i] = this.canvasCtx[i].getImageData(x, y, width, height);
        buf32[i] = new Uint32Array(imageData[i].data.buffer);
        buf8[i] = new Uint8ClampedArray(imageData[i].data.buffer);
    }

    var dst = this.current;
    var src = (dst == 1) ? 0 : 1;
    var size = width * height;
    var index = 0; 
    for (var i = 0; i < size; i++) {
        var r0 = buf8[0][index + 0];
        var g0 = buf8[0][index + 1];
        var b0 = buf8[0][index + 2];
        var a0 = buf8[0][index + 3] / 255.0;
        var r1 = buf8[1][index + 0];
        var g1 = buf8[1][index + 1];
        var b1 = buf8[1][index + 2];
        var a1 = buf8[1][index + 3] / 255.0;

        var a = a0 + a1 - a0 * a1;
        if (a > 0) {
            var r = Math.floor((r1 * a1 + r0 * a0 * (1 - a1)) / a + 0.5);
            var g = Math.floor((g1 * a1 + g0 * a0 * (1 - a1)) / a + 0.5);
            var b = Math.floor((b1 * a1 + b0 * a0 * (1 - a1)) / a + 0.5);
        }
        buf8[src][index + 0] = 0;
        buf8[src][index + 1] = 0;
        buf8[src][index + 2] = 0;
        buf8[src][index + 3] = 0;
        buf8[dst][index + 0] = r;
        buf8[dst][index + 1] = g;
        buf8[dst][index + 2] = b;
        buf8[dst][index + 3] = Math.floor(a * 255 + 0.5);
        index += 4;
    }

    for (var i = 0; i < 2; i++) {
        imageData[i].data.set(buf8[i]);
        this.canvasCtx[i].putImageData(imageData[i], x, y);
    }
};

Neo.Painter.prototype.blurRect = function(ctx, x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var clone = new Uint8ClampedArray(buf8.length);

    for (var i = 0; i < buf8.length; i++) {
        clone[i] = buf8[i];
    }

    var index = 0;
    var a0 = this.alpha;
    var a1 = 1.0 - this.alpha;

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var rgbaw = [0, 0, 0, 0, 0];

            this.addNeighbor(clone, index, a1, rgbaw);
            if (i > 0) this.addNeighbor(clone, index - 1, a0, rgbaw);
            if (i < width - 1) this.addNeighbor(clone, index + 1, a0, rgbaw);

            if (j > 0) {
                this.addNeighbor(clone, index - width, a0, rgbaw);
                if (i > 0) this.addNeighbor(clone, index - width-1, a0, rgbaw);
                if (i < width-1) this.addNeighbor(clone, index - width+1, a0, rgbaw);
            }
            if (j < height - 1) {
                this.addNeighbor(clone, index + width, a0, rgbaw);
                if (i > 0) this.addNeighbor(clone, index + width-1, a0, rgbaw);
                if (i < width-1) this.addNeighbor(clone, index + width+1, a0, rgbaw);
            }

            buf8[index*4 + 0] = Math.round(rgbaw[0] / rgbaw[4]);
            buf8[index*4 + 1] = Math.round(rgbaw[1] / rgbaw[4]);
            buf8[index*4 + 2] = Math.round(rgbaw[2] / rgbaw[4]);
            buf8[index*4 + 3] = Math.round(rgbaw[3] / rgbaw[4]);
            index++;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.addNeighbor = function(buffer, index, a, rgbaw) {
    rgbaw[0] += buffer[index*4 + 0] * a;
    rgbaw[1] += buffer[index*4 + 1] * a;
    rgbaw[2] += buffer[index*4 + 2] * a;
    rgbaw[3] += buffer[index*4 + 3] * a;
    rgbaw[4] += a;
};

Neo.Painter.prototype.pickColor = function(x, y) {
    var r = 0xff, g = 0xff, b = 0xff, a;

    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && x < this.canvasWidth &&
        y >= 0 && y < this.canvasHeight) {

        for (var i = 0; i < 2; i++) {
            if (this.visible[i]) {
                var ctx = this.canvasCtx[i];
                var imageData = ctx.getImageData(x, y, 1, 1);
                var buf32 = new Uint32Array(imageData.data.buffer);
                var buf8 = new Uint8ClampedArray(imageData.data.buffer);

                var a = buf8[3] / 255.0;
                r = r * (1.0 - a) + buf8[2] * a;
                g = g * (1.0 - a) + buf8[1] * a;
                b = b * (1.0 - a) + buf8[0] * a;
            }
        }
	    r = Math.max(Math.min(Math.round(r), 255), 0);
	    g = Math.max(Math.min(Math.round(g), 255), 0);
	    b = Math.max(Math.min(Math.round(b), 255), 0);
        var result = r | g<<8 | b<<16;
    }
    this.setColor(result);
};

Neo.Painter.prototype.fillHorizontalLine = function(buf32, x0, x1, y) {
    var index = y * this.canvasWidth + x0;
    var fillColor = this.getColor();
    for (var x = x0; x <= x1; x++) {
        buf32[index++] = fillColor;
    }
};

Neo.Painter.prototype.scanLine = function(x0, x1, y, baseColor, buf32, stack) {
    var width = this.canvasWidth;

    while (x0 <= x1) {
        for (; x0 <= x1; x0++) {
            if (buf32[y * width + x0] == baseColor) break;
        }
        if (x1 < x0) break;

        for (; x0 <= x1; x0++) {
            if (buf32[y * width + x0] != baseColor) break;
        }
        stack.push({x:x0 - 1, y: y})
    }
};

Neo.Painter.prototype.fill = function(x, y, ctx) {
    // http://sandbox.serendip.ws/javascript_canvas_scanline_seedfill.html
    x = Math.round(x);
    y = Math.round(y);

    var imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var width = imageData.width;
    var stack = [{x: x, y: y}];

    var baseColor = buf32[y * width + x];
    var fillColor = this.getColor();

    if ((baseColor & 0xffffff00) == 0 ||
        (baseColor & 0xffffff) != (fillColor & 0xffffff)) {
        while (stack.length > 0) {
            var point = stack.pop();
            var x0 = point.x;
            var x1 = point.x;
            var y = point.y;

            if (buf32[y * width + x] == fillColor) 
                break;

            for (; 0 < x0; x0--) {
                if (buf32[y * width + (x0 - 1)] != baseColor) break;
            }
            for (; x1 < this.canvasHeight - 1; x1++) {
                if (buf32[y * width + (x1 + 1)] != baseColor) break;
            }
            this.fillHorizontalLine(buf32, x0, x1, y);
        
            if (y + 1 < this.canvasHeight) {
                this.scanLine(x0, x1, y + 1, baseColor, buf32, stack);
            }
            if (y - 1 >= 0) {
                this.scanLine(x0, x1, y - 1, baseColor, buf32, stack);
            }
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);

	this.updateDestCanvas(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype.copy = function(x, y, width, height) {
    this.tempX = 0;
    this.tempY = 0;
	this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.tempCanvasCtx.drawImage(this.canvas[this.current],
                                 x, y, width, height,
                                 x, y, width, height);
};

Neo.Painter.prototype.paste = function(x, y, width, height) {
    this.canvasCtx[this.current].clearRect(x + this.tempX, y + this.tempY, width, height);
    this.canvasCtx[this.current].drawImage(this.tempCanvas,
                                 x, y, width, height,
                                 x + this.tempX, y + this.tempY, width, height);

    this.tempX = 0;
    this.tempY = 0;
	this.tempCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
};

Neo.Painter.prototype.turn = function(x, y, width, height) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    var ctx = this.canvasCtx[this.current];

    // 傾けツールのバグを再現するため一番上のラインで対象領域を埋める
    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var clone = new Uint32Array(buf32.length);

    var index = 0;
    for (var j = 1; j < height; j++) {
        var index = j * width;
        for (var i = 0; i < width; i++) {
            clone[index + i] = buf32[index + i];
            buf32[index + i] = buf32[i];
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);

    // 90度回転させて貼り付け
    imageData = ctx.getImageData(x, y, height, width);
    buf32 = new Uint32Array(imageData.data.buffer);
    buf8 = new Uint8ClampedArray(imageData.data.buffer);

    index = 0;
    for (var j = height - 1; j >= 0; j--) {
        for (var i = 0; i < width; i++) {
            buf32[i * height + j] = clone[index++];
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.doFill = function(ctx, x, y, width, height, maskFunc) {
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    var imageData = ctx.getImageData(x, y, width, height);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);

    var index = 0;

    var r1 = this._currentColor[0];
    var g1 = this._currentColor[1];
    var b1 = this._currentColor[2];
    var a1 = this.getAlpha(Neo.ALPHATYPE_FILL);

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            if (maskFunc && maskFunc.call(this, i, j, width, height)) {
                if (!this.isMasked(buf8, index)) {
                    var r0 = buf8[index + 0];
                    var g0 = buf8[index + 1];
                    var b0 = buf8[index + 2];
                    var a0 = buf8[index + 3] / 255.0;

                    var a = a0 + a1 - a0 * a1;

                    if (a > 0) {
//                      var a1x = Math.max(a1, 1.0/255);
                        var a1x = a1;
                        var ax = 1 + a0 * (1 - a1x);

//                      var r = (r1 * a1x + r0 * a0 * (1 - a1x)) / a;
//                      var g = (g1 * a1x + g0 * a0 * (1 - a1x)) / a;
//                      var b = (b1 * a1x + b0 * a0 * (1 - a1x)) / a;
                        var r = (r1 + r0 * a0 * (1 - a1x)) / ax;
                        var g = (g1 + g0 * a0 * (1 - a1x)) / ax;
                        var b = (b1 + b0 * a0 * (1 - a1x)) / ax

                        r = (r1 > r0) ? Math.ceil(r) : Math.floor(r);
                        g = (g1 > g0) ? Math.ceil(g) : Math.floor(g);
                        b = (b1 > b0) ? Math.ceil(b) : Math.floor(b);
                    }

                    var tmp = a * 255;
                    a = Math.ceil(tmp);

                    buf8[index + 0] = r;
                    buf8[index + 1] = g;
                    buf8[index + 2] = b;
                    buf8[index + 3] = a;
                }
            }
            index += 4;
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, x, y);
};

Neo.Painter.prototype.rectFillMask = function(x, y, width, height) {
    return true;
};

Neo.Painter.prototype.rectMask = function(x, y, width, height) {
    var d = this.lineWidth;
    return (x < d || x > width - 1 - d || 
            y < d || y > height -1 - d) ? true : false;
};

Neo.Painter.prototype.ellipseFillMask = function(x, y, width, height) {
    var cx = width / 2 - 0.5;
    var cy = height / 2 - 0.5;
    x = (x - cx) / cx;
    y = (y - cy) / cy;

    return ((x * x) + (y * y) < 1) ? true : false;
}

Neo.Painter.prototype.ellipseMask = function(x, y, width, height) {
    var d = this.lineWidth;
    var cx = width / 2 - 0.5;
    var cy = height / 2 - 0.5;

    if (cx <= d || cy <= d) return this.ellipseFillMask(x, y, width, height);

    var x2 = (x - cx) / (cx - d);
    var y2 = (y - cy) / (cy - d);

    x = (x - cx) / cx;
    y = (y - cy) / cy;

    if ((x * x) + (y * y) < 1) {
        if ((x2 * x2) + (y2 * y2) >= 1) {
            return true;
        }
    }
    return  false;
}

/*
-----------------------------------------------------------------------
*/

Neo.Painter.prototype.getDestCanvasMousePosition = function(mx, my, isClip) {
    var mx = Math.round(mx);
    var my = Math.round(my);
    var x = (mx - this.zoomX + this.destCanvas.width * 0.5 / this.zoom) * this.zoom;
    var y = (my - this.zoomY + this.destCanvas.height * 0.5 / this.zoom) * this.zoom;

    if (isClip) {
        x = Math.max(Math.min(x, this.destCanvas.width), 0);
        y =  Math.max(Math.min(y, this.destCanvas.height), 0);
    }
    return {x:x, y:y};
};

Neo.Painter.prototype.isWidget = function(element) {
    while (1) {
        if (element == null ||
            element.id == "canvas" || 
            element.id == "container") break;

        if (element.id == "tools" ||
            element.className == "buttonOn" || 
            element.className == "buttonOff") {
            return true;
        }
        element = element.parentNode;
    }
    return  false;
};
'use strict';

Neo.ToolBase = function() {};

Neo.ToolBase.prototype.startX;
Neo.ToolBase.prototype.startY;
Neo.ToolBase.prototype.init = function(oe) {}
Neo.ToolBase.prototype.kill = function(oe) {}
Neo.ToolBase.prototype.lineType = Neo.Painter.LINETYPE_NONE;

Neo.ToolBase.prototype.downHandler = function(oe) {
	this.startX = oe.mouseX;
	this.startY = oe.mouseY;
};

Neo.ToolBase.prototype.upHandler = function(oe) {
};

Neo.ToolBase.prototype.moveHandler = function(oe) {
};

Neo.ToolBase.prototype.transformForZoom = function(oe) {
	var ctx = oe.destCanvasCtx;
	ctx.translate(oe.canvasWidth * 0.5, oe.canvasHeight * 0.5);
	ctx.scale(oe.zoom, oe.zoom);
	ctx.translate(-oe.zoomX, -oe.zoomY);
};

Neo.ToolBase.prototype.getType = function() {
    return this.type;
};

Neo.ToolBase.prototype.getToolButton = function() {
    switch (this.type) {
    case Neo.Painter.TOOLTYPE_PEN:
    case Neo.Painter.TOOLTYPE_BRUSH:
    case Neo.Painter.TOOLTYPE_TEXT:
        return Neo.penTip;

    case Neo.Painter.TOOLTYPE_TONE:
    case Neo.Painter.TOOLTYPE_BLUR:
    case Neo.Painter.TOOLTYPE_DODGE:
    case Neo.Painter.TOOLTYPE_BURN:
        return Neo.pen2Tip;

    case Neo.Painter.TOOLTYPE_RECT:
    case Neo.Painter.TOOLTYPE_RECTFILL:
    case Neo.Painter.TOOLTYPE_ELLIPSE:
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.effectTip;

    case Neo.Painter.TOOLTYPE_COPY:
    case Neo.Painter.TOOLTYPE_MERGE:
    case Neo.Painter.TOOLTYPE_BLURRECT:
    case Neo.Painter.TOOLTYPE_FLIP_H:
    case Neo.Painter.TOOLTYPE_FLIP_V:
    case Neo.Painter.TOOLTYPE_TURN:
        return Neo.effect2Tip;

    case Neo.Painter.TOOLTYPE_ERASER:
    case Neo.Painter.TOOLTYPE_ERASERALL:
    case Neo.Painter.TOOLTYPE_ERASERRECT:
        return Neo.eraserTip;

    case Neo.Painter.TOOLTYPE_FILL:
        return Neo.fillButton;
    }
    return null;
};

Neo.ToolBase.prototype.getReserve = function() {
    switch (this.type) {
    case Neo.Painter.TOOLTYPE_ERASER:
        return Neo.reserveEraser;

    case Neo.Painter.TOOLTYPE_PEN:
    case Neo.Painter.TOOLTYPE_BRUSH:
    case Neo.Painter.TOOLTYPE_TONE:
    case Neo.Painter.TOOLTYPE_ERASERRECT:
    case Neo.Painter.TOOLTYPE_ERASERALL:
    case Neo.Painter.TOOLTYPE_COPY:
    case Neo.Painter.TOOLTYPE_MERGE:
    case Neo.Painter.TOOLTYPE_FIP_H:
    case Neo.Painter.TOOLTYPE_FIP_V:

    case Neo.Painter.TOOLTYPE_DODGE:
    case Neo.Painter.TOOLTYPE_BURN:
    case Neo.Painter.TOOLTYPE_BLUR:
    case Neo.Painter.TOOLTYPE_BLURRECT:

    case Neo.Painter.TOOLTYPE_TEXT:
    case Neo.Painter.TOOLTYPE_TURN:
    case Neo.Painter.TOOLTYPE_RECT:
    case Neo.Painter.TOOLTYPE_RECTFILL:
    case Neo.Painter.TOOLTYPE_ELLIPSE:
    case Neo.Painter.TOOLTYPE_ELLIPSEFILL:
        return Neo.reservePen;

    }
    return null;
};

Neo.ToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.updateUI();
    }
};

Neo.ToolBase.prototype.saveStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        reserve.size = Neo.painter.lineWidth;
    }
};

/*
-------------------------------------------------------------------------
	DrawToolBase（描画ツールのベースクラス）
-------------------------------------------------------------------------
*/

Neo.DrawToolBase = function() {};
Neo.DrawToolBase.prototype = new Neo.ToolBase();
Neo.DrawToolBase.prototype.isUpMove = false;

Neo.DrawToolBase.prototype.downHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandDownHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineDownHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierDownHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.upHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineUpHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierUpHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.moveHandler = function(oe) {	
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierMoveHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.upMoveHandler = function(oe) {
    switch (oe.drawType) {
    case Neo.Painter.DRAWTYPE_FREEHAND:
        this.freeHandUpMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_LINE:
        this.lineUpMoveHandler(oe); break;
    case Neo.Painter.DRAWTYPE_BEZIER:
        this.bezierUpMoveHandler(oe); break;
    }
};

Neo.DrawToolBase.prototype.rollOverHandler= function(oe) {};
Neo.DrawToolBase.prototype.rollOutHandler= function(oe) {
	if (!oe.isMouseDown && !oe.isMouseDownRight){
		oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
		oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	}
};

Neo.DrawToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 1.0;
        Neo.updateUI();
    };
};


/* FreeHand (手書き) */

Neo.DrawToolBase.prototype.freeHandDownHandler = function(oe) {
	//Register undo first;
	oe._pushUndo();

    oe.prepareDrawing();
	this.isUpMove = false;
	var ctx = oe.canvasCtx[oe.current];

	if (oe.alpha >= 1) {
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.mouseX, oe.mouseY, this.lineType);
    }
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.DrawToolBase.prototype.freeHandUpHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0,0,oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);

    oe.prevLine = null;
};

Neo.DrawToolBase.prototype.freeHandMoveHandler = function(oe) {
	var ctx = oe.canvasCtx[oe.current];
	oe.drawLine(ctx, oe.mouseX, oe.mouseY, oe.prevMouseX, oe.prevMouseY, this.lineType);
	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
};

Neo.DrawToolBase.prototype.freeHandUpMoveHandler = function(oe) {
    this.isUpMove = true;
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
};

Neo.DrawToolBase.prototype.drawCursor = function(oe) {
    if (oe.lineWidth <= 8) return;
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var d = oe.lineWidth;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var x = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var r = d * 0.5 * oe.zoom;

    var c = (this.type == Neo.Painter.TOOLTYPE_ERASER) ? 0x0000ff : 0xffff7f;
    oe.drawXOREllipse(ctx, x-r, y-r, r*2, r*2, false, c);

    ctx.restore();
}


/* Line (直線) */

Neo.DrawToolBase.prototype.lineDownHandler = function(oe) {
    this.isUpMove = false;
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
    oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
};

Neo.DrawToolBase.prototype.lineUpHandler = function(oe) {
    if (this.isUpMove == false) {
        this.isUpMove = true;

        oe._pushUndo();
        oe.prepareDrawing();
        var ctx = oe.canvasCtx[oe.current];
        oe.drawLine(ctx, oe.mouseX, oe.mouseY, this.startX, this.startY, this.lineType);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
};

Neo.DrawToolBase.prototype.lineMoveHandler = function(oe) {
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawLineCursor(oe);
};

Neo.DrawToolBase.prototype.lineUpMoveHandler = function(oe) {
};

Neo.DrawToolBase.prototype.drawLineCursor = function(oe) {
    var mx = oe.mouseX;
    var my = oe.mouseY;
    var nx = this.startX;
    var ny = this.startY;
    var ctx = oe.destCanvasCtx;
    ctx.save();
    this.transformForZoom(oe)

    var x0 = (mx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y0 = (my - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    var x1 = (nx - oe.zoomX + oe.destCanvas.width * 0.5 / oe.zoom) * oe.zoom;
    var y1 = (ny - oe.zoomY + oe.destCanvas.height * 0.5 / oe.zoom) * oe.zoom;
    oe.drawXORLine(ctx, x0, y0, x1, y1);

    ctx.restore();
};


/* Bezier (BZ曲線) */

Neo.DrawToolBase.prototype.bezierDownHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierUpHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierMoveHandler = function(oe) {};
Neo.DrawToolBase.prototype.bezierUpMoveHandler = function(oe) {};

Neo.DrawToolBase.prototype.drawBezierCursor = function(oe) {};


/*
-------------------------------------------------------------------------
	Pen（鉛筆）
-------------------------------------------------------------------------
*/

Neo.PenTool = function() {};
Neo.PenTool.prototype = new Neo.DrawToolBase();
Neo.PenTool.prototype.type = Neo.Painter.TOOLTYPE_PEN;
Neo.PenTool.prototype.lineType = Neo.Painter.LINETYPE_PEN;

Neo.PenTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 1.0;
        Neo.updateUI();
    };
}

/*
-------------------------------------------------------------------------
	Brush（水彩）
-------------------------------------------------------------------------
*/

Neo.BrushTool = function() {};
Neo.BrushTool.prototype = new Neo.DrawToolBase();
Neo.BrushTool.prototype.type = Neo.Painter.TOOLTYPE_BRUSH;
Neo.BrushTool.prototype.lineType = Neo.Painter.LINETYPE_BRUSH;

Neo.BrushTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = this.getAlpha();
        Neo.updateUI();
    }
};

Neo.BrushTool.prototype.getAlpha = function() {
    var alpha = 241 - Math.floor(Neo.painter.lineWidth / 2) * 6;
    return alpha / 255.0;
};

/*
-------------------------------------------------------------------------
	Tone（トーン）
-------------------------------------------------------------------------
*/

Neo.ToneTool = function() {};
Neo.ToneTool.prototype = new Neo.DrawToolBase();
Neo.ToneTool.prototype.type = Neo.Painter.TOOLTYPE_TONE;
Neo.ToneTool.prototype.lineType = Neo.Painter.LINETYPE_TONE;

Neo.ToneTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 23 / 255.0;
        Neo.updateUI();
    }
};

/*
-------------------------------------------------------------------------
	Eraser（消しペン）
-------------------------------------------------------------------------
*/

Neo.EraserTool = function() {};
Neo.EraserTool.prototype = new Neo.DrawToolBase();
Neo.EraserTool.prototype.type = Neo.Painter.TOOLTYPE_ERASER;
Neo.EraserTool.prototype.lineType = Neo.Painter.LINETYPE_ERASER;

/*
-------------------------------------------------------------------------
	Hand（スクロール）
-------------------------------------------------------------------------
*/

Neo.HandTool = function() {};
Neo.HandTool.prototype = new Neo.ToolBase();
Neo.HandTool.prototype.type = Neo.Painter.TOOLTYPE_HAND;
Neo.HandTool.prototype.isUpMove = false;
Neo.HandTool.prototype.reverse = false;

Neo.HandTool.prototype.downHandler = function(oe) {
	oe.tempCanvasCtx.clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);

	this.isDrag = true;
	this.startX = oe.rawMouseX;
	this.startY = oe.rawMouseY;
};

Neo.HandTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();
};

Neo.HandTool.prototype.moveHandler = function(oe) {	
    if (this.isDrag) {
        var dx = this.startX - oe.rawMouseX;
        var dy = this.startY - oe.rawMouseY;

        var ax = oe.destCanvas.width / (oe.canvasWidth * oe.zoom);
        var ay = oe.destCanvas.height / (oe.canvasHeight * oe.zoom);
        var barWidth = oe.destCanvas.width * ax;
        var barHeight = oe.destCanvas.height * ay;
        var scrollWidthInScreen = oe.destCanvas.width - barWidth - 2;
        var scrollHeightInScreen = oe.destCanvas.height - barHeight - 2;

        dx *= oe.scrollWidth / scrollWidthInScreen;
        dy *= oe.scrollHeight / scrollHeightInScreen;

        if (this.reverse) {
            dx *= -1;
            dy *= -1;
        }

        oe.setZoomPosition(oe.zoomX - dx, oe.zoomY - dy);

        this.startX = oe.rawMouseX;
        this.startY = oe.rawMouseY;
    }
};

Neo.HandTool.prototype.rollOutHandler= function(oe) {};
Neo.HandTool.prototype.upMoveHandler = function(oe) {}
Neo.HandTool.prototype.rollOverHandler= function(oe) {}

/*
-------------------------------------------------------------------------
	Slider（色やサイズのスライダを操作している時）
-------------------------------------------------------------------------
*/

Neo.SliderTool = function() {};
Neo.SliderTool.prototype = new Neo.ToolBase();
Neo.SliderTool.prototype.type = Neo.Painter.TOOLTYPE_SLIDER;
Neo.SliderTool.prototype.isUpMove = false;
Neo.SliderTool.prototype.alt = false;

Neo.SliderTool.prototype.downHandler = function(oe) {
	this.isDrag = true;
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    var rect = this.target.getBoundingClientRect();
    var sliderType = this.target['data-slider'];
    Neo.sliders[sliderType].downHandler(oe.rawMouseX - rect.left, 
                                        oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.upHandler = function(oe) {
    this.isDrag = false;
    oe.popTool();

    var rect = this.target.getBoundingClientRect();
    var sliderType = this.target['data-slider'];
    Neo.sliders[sliderType].upHandler(oe.rawMouseX - rect.left, 
                                      oe.rawMouseY - rect.top);
};

Neo.SliderTool.prototype.moveHandler = function(oe) {	
    if (this.isDrag) {
        var rect = this.target.getBoundingClientRect();
        var sliderType = this.target['data-slider'];
        Neo.sliders[sliderType].moveHandler(oe.rawMouseX - rect.left, 
                                            oe.rawMouseY - rect.top);
    }
};

Neo.SliderTool.prototype.upMoveHandler = function(oe) {}
Neo.SliderTool.prototype.rollOutHandler= function(oe) {};
Neo.SliderTool.prototype.rollOverHandler= function(oe) {}

/*
-------------------------------------------------------------------------
	Fill（塗り潰し）
-------------------------------------------------------------------------
*/

Neo.FillTool = function() {};
Neo.FillTool.prototype = new Neo.ToolBase();
Neo.FillTool.prototype.type = Neo.Painter.TOOLTYPE_FILL;
Neo.FillTool.prototype.isUpMove = false;

Neo.FillTool.prototype.downHandler = function(oe) {
    oe._pushUndo();
    oe.fill(oe.mouseX, oe.mouseY, oe.canvasCtx[oe.current]);
};

Neo.FillTool.prototype.upHandler = function(oe) {
};

Neo.FillTool.prototype.moveHandler = function(oe) {	
};

Neo.FillTool.prototype.rollOutHandler= function(oe) {};
Neo.FillTool.prototype.upMoveHandler = function(oe) {}
Neo.FillTool.prototype.rollOverHandler= function(oe) {}


/*
-------------------------------------------------------------------------
	EraseAll（全消し）
-------------------------------------------------------------------------
*/

Neo.EraseAllTool = function() {};
Neo.EraseAllTool.prototype = new Neo.ToolBase();
Neo.EraseAllTool.prototype.type = Neo.Painter.TOOLTYPE_ERASEALL;
Neo.EraseAllTool.prototype.isUpMove = false;

Neo.EraseAllTool.prototype.downHandler = function(oe) {
    oe._pushUndo();

    oe.prepareDrawing();
	oe.canvasCtx[oe.current].clearRect(0, 0, oe.canvasWidth, oe.canvasHeight);
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.EraseAllTool.prototype.upHandler = function(oe) {
};

Neo.EraseAllTool.prototype.moveHandler = function(oe) {	
};

Neo.EraseAllTool.prototype.rollOutHandler= function(oe) {};
Neo.EraseAllTool.prototype.upMoveHandler = function(oe) {};
Neo.EraseAllTool.prototype.rollOverHandler= function(oe) {};


/*
-------------------------------------------------------------------------
	EffectToolBase（エフェックトツールのベースクラス）
-------------------------------------------------------------------------
*/

Neo.EffectToolBase = function() {};
Neo.EffectToolBase.prototype = new Neo.ToolBase();
Neo.EffectToolBase.prototype.isUpMove = false;

Neo.EffectToolBase.prototype.downHandler = function(oe) {
    this.isUpMove = false;

    this.startX = this.endX = oe.clipMouseX;
    this.startY = this.endY = oe.clipMouseY;
};

Neo.EffectToolBase.prototype.upHandler = function(oe) {
    this.isUpMove = true;

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX);
    var height = Math.abs(this.startY - this.endY);
    var ctx = oe.canvasCtx[oe.current];

    if (width > 0 && height > 0) {
        oe._pushUndo();
        oe.prepareDrawing();

//      console.log(x + "," + y + "," + width + "," + height);
        this.doEffect(oe, x, y, width, height);
    }
};

Neo.EffectToolBase.prototype.moveHandler = function(oe) {
    this.endX = oe.clipMouseX;
    this.endY = oe.clipMouseY;

	oe.updateDestCanvas(0,0,oe.canvasWidth, oe.canvasHeight, true);
	this.drawCursor(oe);
};

Neo.EffectToolBase.prototype.rollOutHandler= function(oe) {};
Neo.EffectToolBase.prototype.upMoveHandler = function(oe) {};
Neo.EffectToolBase.prototype.rollOverHandler= function(oe) {};

Neo.EffectToolBase.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

    var start = oe.getDestCanvasMousePosition(this.startX, this.startY, true);
    var end = oe.getDestCanvasMousePosition(this.endX, this.endY, true);

    var x = (start.x < end.x) ? start.x : end.x;
    var y = (start.y < end.y) ? start.y : end.y;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);

    if (this.isEllipse) {
        oe.drawXOREllipse(ctx, x, y, width, height, this.isFill);

    } else {
        oe.drawXORRect(ctx, x, y, width, height, this.isFill);
    }
    ctx.restore();
};

Neo.EffectToolBase.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = this.defaultAlpha || 1.0;
        Neo.updateUI();
    };
}

/*
-------------------------------------------------------------------------
	EraseRect（消し四角）
-------------------------------------------------------------------------
*/

Neo.EraseRectTool = function() {};
Neo.EraseRectTool.prototype = new Neo.EffectToolBase();
Neo.EraseRectTool.prototype.type = Neo.Painter.TOOLTYPE_ERASERECT;

Neo.EraseRectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.eraseRect(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	FlipH（左右反転）
-------------------------------------------------------------------------
*/

Neo.FlipHTool = function() {};
Neo.FlipHTool.prototype = new Neo.EffectToolBase();
Neo.FlipHTool.prototype.type = Neo.Painter.TOOLTYPE_FLIP_H;

Neo.FlipHTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.flipH(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	FlipV（上下反転）
-------------------------------------------------------------------------
*/

Neo.FlipVTool = function() {};
Neo.FlipVTool.prototype = new Neo.EffectToolBase();
Neo.FlipVTool.prototype.type = Neo.Painter.TOOLTYPE_FLIP_V;

Neo.FlipVTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.flipV(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	BlurRect（角取り）
-------------------------------------------------------------------------
*/

Neo.BlurRectTool = function() {};
Neo.BlurRectTool.prototype = new Neo.EffectToolBase();
Neo.BlurRectTool.prototype.type = Neo.Painter.TOOLTYPE_BLURRECT;

Neo.BlurRectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.blurRect(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

Neo.BlurRectTool.prototype.loadStates = function() {
    var reserve = this.getReserve();
    if (reserve) {
        Neo.painter.lineWidth = reserve.size;
        Neo.painter.alpha = 0.5;
        Neo.updateUI();
        console.log("blurrect...");
    };
}

/*
-------------------------------------------------------------------------
	Turn（傾け）
-------------------------------------------------------------------------
*/

Neo.TurnTool = function() {};
Neo.TurnTool.prototype = new Neo.EffectToolBase();
Neo.TurnTool.prototype.type = Neo.Painter.TOOLTYPE_TURN;

Neo.TurnTool.prototype.upHandler = function(oe) {
    this.isUpMove = true;

    var x = (this.startX < this.endX) ? this.startX : this.endX;
    var y = (this.startY < this.endY) ? this.startY : this.endY;
    var width = Math.abs(this.startX - this.endX);
    var height = Math.abs(this.startY - this.endY);

    if (width > 0 && height > 0) {
        oe._pushUndo();
        oe.turn(x, y, width, height);
        oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    }
};

/*
-------------------------------------------------------------------------
	Merge（レイヤー結合）
-------------------------------------------------------------------------
*/

Neo.MergeTool = function() {};
Neo.MergeTool.prototype = new Neo.EffectToolBase();
Neo.MergeTool.prototype.type = Neo.Painter.TOOLTYPE_MERGE;

Neo.MergeTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.merge(ctx, x, y, width, height);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	Copy（コピー）
-------------------------------------------------------------------------
*/

Neo.CopyTool = function() {};
Neo.CopyTool.prototype = new Neo.EffectToolBase();
Neo.CopyTool.prototype.type = Neo.Painter.TOOLTYPE_COPY;

Neo.CopyTool.prototype.doEffect = function(oe, x, y, width, height) {
    oe.copy(x, y, width, height);
    oe.setToolByType(Neo.Painter.TOOLTYPE_PASTE);
    oe.tool.x = x;
    oe.tool.y = y;
    oe.tool.width = width;
    oe.tool.height = height;
};

/*
-------------------------------------------------------------------------
	Paste（ペースト）
-------------------------------------------------------------------------
*/

Neo.PasteTool = function() {};
Neo.PasteTool.prototype = new Neo.ToolBase();
Neo.PasteTool.prototype.type = Neo.Painter.TOOLTYPE_PASTE;

Neo.PasteTool.prototype.downHandler = function(oe) {
    this.startX = oe.mouseX;
    this.startY = oe.mouseY;
    this.drawCursor(oe);
};

Neo.PasteTool.prototype.upHandler = function(oe) {
    oe._pushUndo();

    oe.paste(this.x, this.y, this.width, this.height);
	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);

    oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
};

Neo.PasteTool.prototype.moveHandler = function(oe) {
    var dx = oe.mouseX - this.startX;
    var dy = oe.mouseY - this.startY;
    oe.tempX = dx;
    oe.tempY = dy;

	oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
    this.drawCursor(oe);
};

Neo.PasteTool.prototype.keyDownHandler = function(e) {
    if (e.keyCode == 27) { //Escでキャンセル
        var oe = Neo.painter;
	    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
        oe.setToolByType(Neo.Painter.TOOLTYPE_COPY);
    }
};

Neo.PasteTool.prototype.drawCursor = function(oe) {
    var ctx = oe.destCanvasCtx;

    ctx.save();
    this.transformForZoom(oe);

  var start = oe.getDestCanvasMousePosition(this.x, this.y, true);
    var end = oe.getDestCanvasMousePosition(this.x + this.width, this.y + this.height, true);

    var x = start.x + oe.tempX * oe.zoom;
    var y = start.y + oe.tempY * oe.zoom;
    var width = Math.abs(start.x - end.x);
    var height = Math.abs(start.y - end.y);
    oe.drawXORRect(ctx, x, y, width, height);
    ctx.restore();
};

/*
-------------------------------------------------------------------------
	Rect（線四角）
-------------------------------------------------------------------------
*/

Neo.RectTool = function() {};
Neo.RectTool.prototype = new Neo.EffectToolBase();
Neo.RectTool.prototype.type = Neo.Painter.TOOLTYPE_RECT;

Neo.RectTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.rectMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	RectFill（四角）
-------------------------------------------------------------------------
*/

Neo.RectFillTool = function() {};
Neo.RectFillTool.prototype = new Neo.EffectToolBase();
Neo.RectFillTool.prototype.type = Neo.Painter.TOOLTYPE_RECTFILL;

Neo.RectFillTool.prototype.isFill = true;
Neo.RectFillTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.rectFillMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	Ellipse（線楕円）
-------------------------------------------------------------------------
*/

Neo.EllipseTool = function() {};
Neo.EllipseTool.prototype = new Neo.EffectToolBase();
Neo.EllipseTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSE;
//Neo.EllipseTool.prototype.isUpMove = false;
Neo.EllipseTool.prototype.isEllipse = true;
Neo.EllipseTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.ellipseMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	EllipseFill（楕円）
-------------------------------------------------------------------------
*/

Neo.EllipseFillTool = function() {};
Neo.EllipseFillTool.prototype = new Neo.EffectToolBase();
Neo.EllipseFillTool.prototype.type = Neo.Painter.TOOLTYPE_ELLIPSEFILL;
//Neo.EllipseFillTool.prototype.isUpMove = false;
Neo.EllipseFillTool.prototype.isEllipse = true;
Neo.EllipseFillTool.prototype.isFill = true;
Neo.EllipseFillTool.prototype.doEffect = function(oe, x, y, width, height) {
    var ctx = oe.canvasCtx[oe.current];
    oe.doFill(ctx, x, y, width, height, oe.ellipseFillMask);
    oe.updateDestCanvas(0, 0, oe.canvasWidth, oe.canvasHeight, true);
};

/*
-------------------------------------------------------------------------
	Dummy（何もしない時）
-------------------------------------------------------------------------
*/

Neo.DummyTool = function() {};
Neo.DummyTool.prototype = new Neo.ToolBase();
Neo.DummyTool.prototype.type = Neo.Painter.TOOLTYPE_NONE;
Neo.DummyTool.prototype.isUpMove = false;

Neo.DummyTool.prototype.downHandler = function(oe) {
};

Neo.DummyTool.prototype.upHandler = function(oe) {
    oe.popTool();
};

Neo.DummyTool.prototype.moveHandler = function(oe) {};
Neo.DummyTool.prototype.upMoveHandler = function(oe) {}
Neo.DummyTool.prototype.rollOverHandler= function(oe) {}
Neo.DummyTool.prototype.rollOutHandler= function(oe) {}




'use strict';

Neo.CommandBase = function() {
};
Neo.CommandBase.prototype.data;
Neo.CommandBase.prototype.execute = function() {}


/*
---------------------------------------------------
	ZOOM
---------------------------------------------------
*/
Neo.ZoomPlusCommand = function(data) {this.data = data};
Neo.ZoomPlusCommand.prototype = new Neo.CommandBase();
Neo.ZoomPlusCommand.prototype.execute = function() {
	if (this.data.zoom < 12) {
        this.data.setZoom(this.data.zoom + 1);
    }
    Neo.resizeCanvas();
    Neo.painter.updateDestCanvas();
};

Neo.ZoomMinusCommand = function(data) {this.data = data};
Neo.ZoomMinusCommand.prototype = new Neo.CommandBase();
Neo.ZoomMinusCommand.prototype.execute = function() {
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
Neo.UndoCommand = function(data) {this.data = data};
Neo.UndoCommand.prototype = new Neo.CommandBase();
Neo.UndoCommand.prototype.execute = function() {
	this.data.undo();
};

Neo.RedoCommand = function(data) {this.data = data};
Neo.RedoCommand.prototype = new Neo.CommandBase();
Neo.RedoCommand.prototype.execute = function() {
	this.data.redo();
};


/*
---------------------------------------------------
---------------------------------------------------
*/



Neo.WindowCommand = function(data) {this.data = data};
Neo.WindowCommand.prototype = new Neo.CommandBase();
Neo.WindowCommand.prototype.execute = function() {
    if (Neo.fullScreen) {
        if (confirm("ページビュー？")) { 
            Neo.fullScreen = false;
            Neo.updateWindow();
        }
    } else {
        if (confirm("ウィンドウビュー？")) {
            Neo.fullScreen = true;
            Neo.updateWindow();
        }
    }
};

Neo.SubmitCommand = function(data) {this.data = data};
Neo.SubmitCommand.prototype = new Neo.CommandBase();
Neo.SubmitCommand.prototype.execute = function() {
    var board = location.href.replace(/[^/]*$/, '');
    console.log("submit: " + board);
    this.data.submit(board);
};

Neo.CopyrightCommand = function(data) {this.data = data};
Neo.CopyrightCommand.prototype = new Neo.CommandBase();
Neo.CopyrightCommand.prototype.execute = function() {
//  var url = "https://web.archive.org/web/20070924062559/http://www.shichan.jp";
    var url = "http://hp.vector.co.jp/authors/VA016309/";
    if (confirm(url + "\nしぃちゃんのホームページを表示しますか？")) {
        Neo.openURL(url);
    }
};

'use strict';

/*
-------------------------------------------------------------------------
	Button
-------------------------------------------------------------------------
*/

Neo.Button = function() {};
Neo.Button.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.selected = false;
    this.isMouseDown = false;
    
    var ref = this;
	this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
	this.element.onmouseup = function(e) { ref._mouseUpHandler(e); }
	this.element.onmouseover = function(e) { ref._mouseOverHandler(e); }
	this.element.onmouseout = function(e) { ref._mouseOutHandler(e); }
    this.element.className = (!this.params.type == 'fill') ? "button" : "buttonOff";

    return this;
};

Neo.Button.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
    if (this.onmousedown) this.onmousedown(this);
};
Neo.Button.prototype._mouseUpHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;

        if ((this.params.type == "fill") && (this.selected == false)) {
            for (var i = 0; i < Neo.toolButtons.length; i++) {
                var toolTip = Neo.toolButtons[i];
                toolTip.setSelected((this.selected) ? false : true);
            }
            Neo.painter.setToolByType(Neo.Painter.TOOLTYPE_FILL);
        }

        if (this.onmouseup) this.onmouseup(this);
    }
};
Neo.Button.prototype._mouseOutHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.onmouseout) this.onmouseout(this);
    }
};
Neo.Button.prototype._mouseOverHandler = function(e) {
    if (this.onmouseover) this.onmouseover(this);
};

Neo.Button.prototype.setSelected = function(selected) {
    if (selected) {
        this.element.className = "buttonOn";
    } else {
        this.element.className = "buttonOff";
    }
    this.selected = selected;
};

Neo.Button.prototype.update = function() {
};

/*
-------------------------------------------------------------------------
	ColorTip
-------------------------------------------------------------------------
*/

Neo.colorTips = [];

Neo.ColorTip = function() {};
Neo.ColorTip.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;

    this.selected = (this.name == "color1") ? true : false;
    this.isMouseDown = false;

    var ref = this;
    this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
    this.element.onmouseup = function(e) { ref._mouseUpHandler(e); }
    this.element.onmouseover = function(e) { ref._mouseOverHandler(e); }
    this.element.onmouseout = function(e) { ref._mouseOutHandler(e); }
    this.element.className = "colorTipOff";

    var index = parseInt(this.name.slice(5)) - 1;
    this.element.style.left = (index % 2) ? "0px" : "26px";
    this.element.style.top = Math.floor(index / 2) * 21 + "px";

    // base64 ColorTip.png
    this.element.innerHTML = "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAASCAYAAAAg9DzcAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAANklEQVRIx+3OAQkAMADDsO3+Pe8qCj+0Akq6bQFqS2wTCpwE+R4IiyVYsGDBggULfirBgn8HX7BzCRwDx1QeAAAAAElFTkSuQmCC' />"

    this.setColor(Neo.config.colors[params.index - 1]);
//  this.color = Neo.config.colors[params.index - 1];
//  this.element.style.backgroundColor = this.color;

    this.setSelected(this.selected);
    Neo.colorTips.push(this);
};

Neo.ColorTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
    for (var i = 0; i < Neo.colorTips.length; i++) {
        var colorTip = Neo.colorTips[i];
        if (this == colorTip && e.shiftKey) {
            this.setColor(Neo.config.colors[this.params.index - 1]);
        }
        colorTip.setSelected(this == colorTip) ? true : false;
    }
    Neo.painter.setColor(this.color);
    Neo.updateUIColor(true, false);

    if (this.onmousedown) this.onmousedown(this);
};
Neo.ColorTip.prototype._mouseUpHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.onmouseup) this.onmouseup(this);
    }
};
Neo.ColorTip.prototype._mouseOutHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.onmouseout) this.onmouseout(this);
    }
};
Neo.ColorTip.prototype._mouseOverHandler = function(e) {
    if (this.onmouseover) this.onmouseover(this);
};

Neo.ColorTip.prototype.setSelected = function(selected) {
    if (selected) {
        this.element.className = "colorTipOn";
    } else {
        this.element.className = "colorTipOff";
    }
    this.selected = selected;
};

Neo.ColorTip.prototype.setColor = function(color) {
    this.color = color;
    this.element.style.backgroundColor = color;
};

Neo.ColorTip.getCurrent = function() {
    for (var i = 0; i < Neo.colorTips.length; i++) {
        var colorTip = Neo.colorTips[i];
        if (colorTip.selected) return colorTip;
    }
    return null;
};

/*
-------------------------------------------------------------------------
	ToolTip
-------------------------------------------------------------------------
*/

Neo.toolTips = [];
Neo.toolButtons = [];

Neo.ToolTip = function() {};

Neo.ToolTip.prototype.prevMode = -1;

Neo.ToolTip.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.params.type = this.element.id;
    this.name = name;
    this.mode = 0;
    
    this.isMouseDown = false;

    var ref = this;
    this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
    this.element.onmouseup = function(e) { ref._mouseUpHandler(e); }
    this.element.onmouseover = function(e) { ref._mouseOverHandler(e); }
    this.element.onmouseout = function(e) { ref._mouseOutHandler(e); }

    this.selected = (this.params.type == "pen") ? true : false;
    this.setSelected(this.selected);

    this.element.innerHTML = "<canvas width=46 height=18></canvas><div class='label'></div>";
    this.canvas = this.element.getElementsByTagName('canvas')[0];
    this.label = this.element.getElementsByTagName('div')[0];

    this.update();
    return this;
};

Neo.ToolTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    if (this.isTool) {
        if (this.selected == false) {
            for (var i = 0; i < Neo.toolButtons.length; i++) {
                var toolTip = Neo.toolButtons[i];
                toolTip.setSelected((this == toolTip) ? true : false);
            }

        } else {
            var length = this.toolStrings.length;
            if (e.button == 2 || e.ctrlKey || e.altKey) {
                this.mode--;
                if (this.mode < 0) this.mode = length - 1;
            } else {
                this.mode++;
                if (this.mode >= length) this.mode = 0;
            }
        }
        Neo.painter.setToolByType(this.tools[this.mode]);
        this.update();
    }

    if (this.onmousedown) this.onmousedown(this);
};

Neo.ToolTip.prototype._mouseUpHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.onmouseup) this.onmouseup(this);
    }
};

Neo.ToolTip.prototype._mouseOutHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.onmouseout) this.onmouseout(this);
    }
};
Neo.ToolTip.prototype._mouseOverHandler = function(e) {
    if (this.onmouseover) this.onmouseover(this);
};

Neo.ToolTip.prototype.setSelected = function(selected) {
    if (selected) {
        this.element.className = "toolTipOn";
    } else {
        this.element.className = "toolTipOff";
    }
    this.selected = selected;
};

Neo.ToolTip.prototype.update = function() {};

Neo.ToolTip.prototype.draw = function(c) {
    if (this.hasTintImage) {
        if (typeof c != "string") c = Neo.painter.getColorString(c);
        var ctx = this.canvas.getContext("2d");
        
        if (this.prevMode != this.mode) {
            this.prevMode = this.mode;

            var img = new Image();
            img.src = this.toolIcons[this.mode];
            img.onload = function() {
                var ref = this;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawTintImage(ctx, img, c, 0, 0);
            }.bind(this);

        } else {
            this.tintImage(ctx, c);
        }
    }
};

Neo.ToolTip.prototype.drawTintImage = function(ctx, img, c, x, y) {
    ctx.drawImage(img, x, y);
    this.tintImage(ctx, c);
};

Neo.ToolTip.prototype.tintImage = function(ctx, c) {
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

Neo.ToolTip.bezier = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAT0lEQVRIx+3SQQoAIAhE0en+h7ZVEEKBZrX5b5sjKknAkRYpNslaMLPq44ZI9wwHs0vMQ/v87u0Kk8xfsaI242jbMdjPi5Y0r/zTAAAAD3UOjRf9jcO4sgAAAABJRU5ErkJggg==";
Neo.ToolTip.blur = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAASUlEQVRIx+3VMQ4AIAgEQeD/f8bWWBnJYUh2SgtgK82G8/MhzVKwxOtTLgIUx6tDout4laiPIICA0Qj4bXxAy0+8LZP9yACAJwsqkggS55eiZgAAAABJRU5ErkJggg==";
Neo.ToolTip.brush = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAQUlEQVRIx2NgGOKAEcb4z8CweRA4xpdUPSxofJ8BdP8WcjQxDaCDqQLQY4CsUBgFo2AUjIJRMApGwSgYBaNgZAIA0CoDwDbZu8oAAAAASUVORK5CYII=";
Neo.ToolTip.burn = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAPklEQVRIx+3PMRIAMAQAQbzM0/0sKZPeiDG57TQ4keH0Htx9VR+MCM1vOezl8xUsv4IAAkYjoBsB3QgAgL9tYXgF19rh9yoAAAAASUVORK5CYII=";
Neo.ToolTip.dodge = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAPklEQVRIx+3PMRIAMAQAQbzM0/0sKZPeiDG57TQ4keH0HiJiVR90d81vOezl8xUsv4IAAkYjoBsB3QgAgL9tIyQHV/nXwScAAAAASUVORK5CYII=";
Neo.ToolTip.ellipse = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAATklEQVRIx+2VMQ4AIAgD6/8fjbOJi1LFmt4OPQ0KIE7LNgggCBLbHkuFM9lM+Om+QwDjpksyb4tT86vlvzgEbYxefQPyv5D8HjDGGGOk6b3jJ+lYubd8AAAAAElFTkSuQmCC";
Neo.ToolTip.ellipsefill = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAVUlEQVRIx+2VURIAEAgFc/9D5waSHpV5+43ZHRMizRnRA1REARLHHq6NCFl01Nail+LeEDMgU34nYhlQQd6K+PsGKkSEZyArBPoK3Y6K/AOEEEJIayZHbhIKjkZrFwAAAABJRU5ErkJggg==";
Neo.ToolTip.eraser = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABQElEQVRIx+1WQY7CMAwcI37Cad+yXOgH4Gu8gAt9CtrDirfMHjZJbbcktVSpQnROSeMkY3vsFHhzSG3xfLpz/JVmG0mIqDkIMcc6+7Kejx6fdb0dq7w09rVFkrjejrMOunQ9vg7f/5QEIAd6E1Eo38WF8fF7n8sdALCrLerIzoFI4sI0Vtv1SYZ8CVbeF7tzF7JugIkVkxOauc6CIe8842S+XmMfsq7TN9LRTngZmTmVD4SrnzYaGYhFoxCWgajXuMjYGTuJ3dlwIBIN3U0cUVqLXCs5E7YeVsvAYJul5HWeLUhL3EpstQwooqoOTEHDOebpMn7ngkUsg3RotU8X1MkuVDrYohkIupC0YArX6T+PfX3kcbQLNV/iCKi6EB3xqXdAZ0JKthZ8B0QEl673NIEX/0I/z36Rf6ENGzZ8EP4A8Lp+9e9VWC4AAAAASUVORK5CYII=";
Neo.ToolTip.freehand = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAdUlEQVRIx+2WUQrAMAhD3dj9r+y+VoSyLhYDynzQv1qiJlCR4hzeAhVRsiC3Jkj0c5hN7Lx7IQ9SphLE1ICdwko420purEWQuywN3pqxgcw2+WwAtU1GzoqiLZNwZBvMAIcO8y3YKUO8mkbmjPzjK9E0TUPjBoeyLAS0usjLAAAAAElFTkSuQmCC";
Neo.ToolTip.line = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAU0lEQVRIx+2UQQ4AIAjD8P+PxivRGDQC47C+oN1hIgTLQAt4qIga2c23XYAVPkm3CVhlb4ShAa/rQgMi1i0NyFg3LaBq3bAA1LpfAd7/EkIIIR2YXFYSCpWS8w8AAAAASUVORK5CYII=";
Neo.ToolTip.rect = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAQElEQVRIx+3TMQ4AIAhD0WK8/5VxdcIYY8rw3wok7YAEr6iGKaU74BY0ro+6FKhyDHe4VxRwm6eFLn8AAADwwQIwTQgGo9ZMywAAAABJRU5ErkJggg==";
Neo.ToolTip.rectfill = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAANElEQVRIx+3PIQ4AIBADwcL//3xYBMEgLiQztmab0GvcxkqqO3ALPbbO7rBXDnRzAADgYwvqDwIMJlGb5QAAAABJRU5ErkJggg==";
Neo.ToolTip.tone = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAO0lEQVRIx+3PIQ4AMAgEwaP//zNVVZUELiQ7CgWstFy8IaVsPhT1Lb/T+fQEAtwIcCPAjQC39QEAgJIL6DQCFhAqsRkAAAAASUVORK5CYII=";

/*
-------------------------------------------------------------------------
	PenTip
-------------------------------------------------------------------------
*/

Neo.penTip;

Neo.PenTip = function() {};
Neo.PenTip.prototype = new Neo.ToolTip();

Neo.PenTip.prototype.toolStrings = ["鉛筆", "水彩"]; 
Neo.PenTip.prototype.tools = [Neo.Painter.TOOLTYPE_PEN,
                              Neo.Painter.TOOLTYPE_BRUSH];

Neo.PenTip.prototype.init  = function(name, params) {
    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.PenTip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    this.draw(Neo.painter.foregroundColor);
    if (this.label) {
        this.label.innerHTML = this.toolStrings[this.mode];
    }
};

Neo.PenTip.prototype.draw = function(c) {
    if (typeof c != "string") c = Neo.painter.getColorString(c);
    if (this.canvas) {
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = c;
        ctx.fillRect(2, 3, 33, 1.2);
    }
};

/*
-------------------------------------------------------------------------
	Pen2Tip
-------------------------------------------------------------------------
*/

Neo.pen2Tip;

Neo.Pen2Tip = function() {};
Neo.Pen2Tip.prototype = new Neo.ToolTip();

//Neo.Pen2Tip.prototype.toolStrings = ["トーン", "ぼかし", "覆い焼き", "焼き込み"]; 
Neo.Pen2Tip.prototype.toolStrings = ["トーン"];
Neo.Pen2Tip.prototype.tools = [Neo.Painter.TOOLTYPE_TONE];
//                             Neo.Painter.TOOLTYPE_BLUR,
//                             Neo.Painter.TOOLTYPE_DODGE,
//                             Neo.Painter.TOOLTYPE_BURN];

Neo.Pen2Tip.prototype.hasTintImage = true;
Neo.Pen2Tip.prototype.toolIcons = [Neo.ToolTip.tone];

Neo.Pen2Tip.prototype.init  = function(name, params) {
    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.Pen2Tip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    this.draw(Neo.painter.foregroundColor);
    this.label.innerHTML = this.toolStrings[this.mode];
};

/*
-------------------------------------------------------------------------
	EraserTip
-------------------------------------------------------------------------
*/

Neo.eraserTip;

Neo.EraserTip = function() {};
Neo.EraserTip.prototype = new Neo.ToolTip();

Neo.EraserTip.prototype.toolStrings = ["消しペン", "消し四角", "全消し"];
Neo.EraserTip.prototype.tools = [Neo.Painter.TOOLTYPE_ERASER, 
                                 Neo.Painter.TOOLTYPE_ERASERECT,
                                 Neo.Painter.TOOLTYPE_ERASEALL];

Neo.EraserTip.prototype.init  = function(name, params) {
    this.drawOnce = false;
    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.EraserTip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    if (this.drawOnce == false) {
        this.draw();
        this.drawOnce = true;
    }
    this.label.innerHTML = this.toolStrings[this.mode];
};

Neo.EraserTip.prototype.draw = function() {
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var img = new Image();
    
    img.src = Neo.ToolTip.eraser;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
};

/*
-------------------------------------------------------------------------
	EffectTip
-------------------------------------------------------------------------
*/

Neo.effectTip;

Neo.EffectTip = function() {};
Neo.EffectTip.prototype = new Neo.ToolTip();

Neo.EffectTip.prototype.toolStrings = ["四角", "線四角", "楕円", "線楕円"];
Neo.EffectTip.prototype.tools = [Neo.Painter.TOOLTYPE_RECTFILL,
                                 Neo.Painter.TOOLTYPE_RECT,
                                 Neo.Painter.TOOLTYPE_ELLIPSEFILL,
                                 Neo.Painter.TOOLTYPE_ELLIPSE];

Neo.EffectTip.prototype.hasTintImage = true;
Neo.EffectTip.prototype.toolIcons = [Neo.ToolTip.rectfill,
                                     Neo.ToolTip.rect,
                                     Neo.ToolTip.ellipsefill,
                                     Neo.ToolTip.ellipse];

Neo.EffectTip.prototype.init = function(name, params) {
    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.EffectTip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    this.draw(Neo.painter.foregroundColor);
    this.label.innerHTML = this.toolStrings[this.mode];
};

/*
-------------------------------------------------------------------------
	Effect2Tip
-------------------------------------------------------------------------
*/

Neo.effect2Tip;

Neo.Effect2Tip = function() {};
Neo.Effect2Tip.prototype = new Neo.ToolTip();

Neo.Effect2Tip.prototype.toolStrings = ["コピー", "ﾚｲﾔ結合", 
                                        //"角取り", 
                                        "左右反転", "上下反転", "傾け"];
Neo.Effect2Tip.prototype.tools = [Neo.Painter.TOOLTYPE_COPY,
                                  Neo.Painter.TOOLTYPE_MERGE,
                                  //Neo.Painter.TOOLTYPE_BLURRECT,
                                  Neo.Painter.TOOLTYPE_FLIP_H,
                                  Neo.Painter.TOOLTYPE_FLIP_V,
                                  Neo.Painter.TOOLTYPE_TURN];

Neo.Effect2Tip.prototype.init = function(name, params) {
    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.Effect2Tip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    this.label.innerHTML = this.toolStrings[this.mode];
};

Neo.Effect2Tip.prototype.draw = function() {
};

/*
-------------------------------------------------------------------------
	MaskTip
-------------------------------------------------------------------------
*/

Neo.maskTip;

Neo.MaskTip = function() {};
Neo.MaskTip.prototype = new Neo.ToolTip();

Neo.MaskTip.prototype.toolStrings = ["通常", "マスク", "逆マスク"];

Neo.MaskTip.prototype.init = function(name, params) {
    this.fixed = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.MaskTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    if (e.button == 2 || e.ctrlKey || e.altKey) {
        Neo.painter.maskColor = Neo.painter.foregroundColor;

    } else {
        var length = this.toolStrings.length;
        this.mode++;
        if (this.mode >= length) this.mode = 0;
        Neo.painter.maskType = this.mode;
    }
    this.update();

    if (this.onmousedown) this.onmousedown(this);
}

Neo.MaskTip.prototype.update = function() {
    this.draw(Neo.painter.maskColor);
    this.label.innerHTML = this.toolStrings[this.mode];
};

Neo.MaskTip.prototype.draw = function(c) {
    if (typeof c != "string") c = Neo.painter.getColorString(c);

    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = c;
    ctx.fillRect(1, 1, 43, 9);
};

/*
-------------------------------------------------------------------------
	DrawTip
-------------------------------------------------------------------------
*/

Neo.drawTip;

Neo.DrawTip = function() {};
Neo.DrawTip.prototype = new Neo.ToolTip();

Neo.DrawTip.prototype.toolStrings = ["手書き", "直線"]; //, "BZ曲線"];

Neo.DrawTip.prototype.hasTintImage = true;
Neo.DrawTip.prototype.toolIcons = [Neo.ToolTip.freehand, Neo.ToolTip.line];

Neo.DrawTip.prototype.init = function(name, params) {
    this.fixed = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.DrawTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    var length = this.toolStrings.length;
    if (e.button == 2 || e.ctrlKey || e.altKey) {
        this.mode--;
        if (this.mode < 0) this.mode = length - 1;
    } else {
        this.mode++;
        if (this.mode >= length) this.mode = 0;
    }
    Neo.painter.drawType = this.mode;
    this.update();

    if (this.onmousedown) this.onmousedown(this);
}

Neo.DrawTip.prototype.update = function() {
    this.draw(Neo.painter.foregroundColor);
    this.label.innerHTML = this.toolStrings[this.mode];
};

/*
-------------------------------------------------------------------------
	ColorSlider
-------------------------------------------------------------------------
*/

Neo.sliders = [];

Neo.ColorSlider = function() {};

Neo.ColorSlider.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.isMouseDown = false;
    this.value = 0;
    this.type = this.params.type;

    this.element.className = "colorSlider";
    this.element.innerHTML = "<div class='slider'></div><div class='label'></div>"; 
    this.slider = this.element.getElementsByClassName('slider')[0];
    this.label = this.element.getElementsByClassName('label')[0];

    this.element['data-slider'] = params.type;
    this.slider['data-slider'] = params.type;
    this.label['data-slider'] = params.type;

    switch (this.type) {
    case Neo.SLIDERTYPE_RED: 
        this.prefix = "R";
        this.slider.style.backgroundColor = "#fa9696"; 
        break;
    case Neo.SLIDERTYPE_GREEN: 
        this.prefix = "G";
        this.slider.style.backgroundColor = "#82f238"; 
        break;
    case Neo.SLIDERTYPE_BLUE: 
        this.prefix = "B";
        this.slider.style.backgroundColor = "#8080ff"; 
        break;
    case Neo.SLIDERTYPE_ALPHA: 
        this.prefix = "A";
        this.slider.style.backgroundColor = "#aaaaaa"; 
        this.value = 255;
        break;
    }
    this.label.innerHTML = this.prefix + "99";

    this.update();
    return this;
};

Neo.ColorSlider.prototype.downHandler = function(x, y) {
    this.slide(x, y);
};

Neo.ColorSlider.prototype.moveHandler = function(x, y) {
    this.slide(x, y);
};

Neo.ColorSlider.prototype.upHandler = function(x, y) {
};

Neo.ColorSlider.prototype.slide = function(x, y) {
    var value;
    if (x >= 0 && x <= 49 && y >= 0 && y <= 15) {
        value = (x - 0.5) * 255.0 / 48.0;
        value = Math.round(value / 5) * 5;

        this.value0 = value;
        this.x0 = x;

    } else {
        var d = (x - this.x0) / 3.0;
        value = this.value0 + d; 
    }
    var min = (this.type == Neo.SLIDERTYPE_ALPHA) ? 1 : 0;
    this.value = Math.max(Math.min(255, value), min);

    if (this.type == Neo.SLIDERTYPE_ALPHA) {
        Neo.painter.alpha = this.value / 255.0;
        this.update();

    } else {
        var r = Neo.sliders[Neo.SLIDERTYPE_RED].value;
        var g = Neo.sliders[Neo.SLIDERTYPE_GREEN].value;
        var b = Neo.sliders[Neo.SLIDERTYPE_BLUE].value;

        Neo.painter.setColor(r<<16 | g<<8 | b);
        Neo.updateUIColor(true, true);
    }
};

Neo.ColorSlider.prototype.update = function() {
    var color = Neo.painter.getColor();
    var alpha = Neo.painter.alpha * 255;

    switch (this.type) {
    case Neo.SLIDERTYPE_RED:   this.value = (color & 0x0000ff); break;
    case Neo.SLIDERTYPE_GREEN: this.value = (color & 0x00ff00) >> 8; break;
    case Neo.SLIDERTYPE_BLUE:  this.value = (color & 0xff0000) >> 16; break;
    case Neo.SLIDERTYPE_ALPHA: this.value = alpha; break;
    }

    var width = this.value * 49.0 / 255.0;
    width = Math.max(Math.min(48, width), 1);

    this.slider.style.width = width.toFixed(2) + "px";
    this.label.innerHTML = this.prefix + this.value.toFixed(0);
};

/*
-------------------------------------------------------------------------
	SizeSlider
-------------------------------------------------------------------------
*/

Neo.SizeSlider = function() {};

Neo.SizeSlider.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.isMouseDown = false;
    this.value = 1;

    this.element.className = "sizeSlider";
    this.element.innerHTML = "<div class='slider'></div><div class='label'></div>"; 
    this.slider = this.element.getElementsByClassName('slider')[0];
    this.label = this.element.getElementsByClassName('label')[0];

    this.element['data-slider'] = params.type;
    this.slider['data-slider'] = params.type;
    this.label['data-slider'] = params.type;

    this.slider.style.backgroundColor = Neo.painter.foregroundColor;
    this.update();
    return this;
};

Neo.SizeSlider.prototype.downHandler = function(x, y) {
    this.value0 = this.value;
    this.y0 = y;
    this.slide(x, y);
};

Neo.SizeSlider.prototype.moveHandler = function(x, y) {
    this.slide(x, y);
};

Neo.SizeSlider.prototype.upHandler = function(x, y) {
};

Neo.SizeSlider.prototype.slide = function(x, y) {
    var value;
    if (!Neo.painter.tool.alt) {
        if (x >= 0 && x <= 49 && y >= 0 && y <= 34) {
            value = (y - 0.5) * 30.0 / 33.0;
            value = Math.round(value);
            
            this.value0 = value;
            this.y0 = y;

        } else {
            var d = (y - this.y0) / 7.0;
            value = this.value0 + d; 
        }
    } else {
        // Ctrl+Alt+ドラッグでサイズ変更するとき
        var d = y - this.y0;
        value = this.value0 + d; 
    }
    this.setSize(value);
};

Neo.SizeSlider.prototype.setSize = function(value) {
    Neo.painter.lineWidth = Math.max(Math.min(30, Math.round(value)), 1);

    var tool = Neo.painter.getCurrentTool();
    if (tool && (tool.type == Neo.Painter.TOOLTYPE_BRUSH)) {
        Neo.painter.alpha = tool.getAlpha();
        Neo.sliders[Neo.SLIDERTYPE_ALPHA].update();
    }
    this.update();
};

Neo.SizeSlider.prototype.update = function() {
    this.value = Neo.painter.lineWidth;

    var height = this.value * 34.0 / 30.0;
    height = Math.max(Math.min(34, height), 1);

    this.slider.style.height = height.toFixed(2) + "px";
    this.label.innerHTML = this.value + "px";
    this.slider.style.backgroundColor = Neo.painter.foregroundColor;
};

/*
-------------------------------------------------------------------------
	LayerControl
-------------------------------------------------------------------------
*/

Neo.LayerControl = function() {};
Neo.LayerControl.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.isMouseDown = false;

    var ref = this;
    this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
    this.element.className = "layerControl";
    this.element.innerHTML = "<div class='bg'></div><div class='label0'>Layer0</div><div class='label1'>Layer1</div><div class='line1'></div><div class='line0'></div>";

    this.bg = this.element.getElementsByClassName('bg')[0];
    this.label0 = this.element.getElementsByClassName('label0')[0];
    this.label1 = this.element.getElementsByClassName('label1')[0];
    this.line0 = this.element.getElementsByClassName('line0')[0];
    this.line1 = this.element.getElementsByClassName('line1')[0];

    this.line0.style.display = "none";
    this.line1.style.display = "none";
    this.label1.style.display = "none";

    this.update();
    return this;
};

Neo.LayerControl.prototype._mouseDownHandler = function(e) {
    if (e.button == 2 || e.ctrlKey || e.altKey) {
        var visible = Neo.painter.visible[Neo.painter.current];
        Neo.painter.visible[Neo.painter.current] = (visible) ? false : true;

    } else {
        var current = Neo.painter.current;
        Neo.painter.current = (current) ? 0 : 1
    }
    Neo.painter.updateDestCanvas(0, 0, Neo.painter.canvasWidth, Neo.painter.canvasHeight);
    if (Neo.painter.tool.type == Neo.Painter.TOOLTYPE_PASTE) {
        Neo.painter.tool.drawCursor(Neo.painter);
    }
    this.update();

    if (this.onmousedown) this.onmousedown(this);
};

Neo.LayerControl.prototype.update = function() {
    this.label0.style.display = (Neo.painter.current == 0) ? "block" : "none";
    this.label1.style.display = (Neo.painter.current == 1) ? "block" : "none";
    this.line0.style.display = (Neo.painter.visible[0]) ? "none" : "block";
    this.line1.style.display = (Neo.painter.visible[1]) ? "none" : "block";
};

/*
-------------------------------------------------------------------------
	ReserveControl
-------------------------------------------------------------------------
*/
Neo.reserveControls = [];

Neo.ReserveControl = function() {};
Neo.ReserveControl.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;

    var ref = this;
    this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
    this.element.className = "reserve";

    var index = parseInt(this.name.slice(7)) - 1;
    this.element.style.top = "1px";
    this.element.style.left = (index * 15 + 2) + "px";

    this.reserve = Neo.clone(Neo.config.reserves[index]);
    this.update();

    Neo.reserveControls.push(this);
    return this;
};
  
Neo.ReserveControl.prototype._mouseDownHandler = function(e) {
    if (e.button == 2 || e.ctrlKey || e.altKey) {
        this.save();
    } else {
        this.load();
    }
    this.update();
};

Neo.ReserveControl.prototype.load = function() {
    Neo.painter.foregroundColor = this.reserve.color;
    Neo.painter.lineWidth = this.reserve.size;
    Neo.painter.alpha = this.reserve.alpha;
    Neo.painter.setToolByType(this.reserve.tool)
    Neo.updateUI();
};

Neo.ReserveControl.prototype.save = function() {
    this.reserve.color = Neo.painter.foregroundColor;
    this.reserve.size = Neo.painter.lineWidth;
    this.reserve.alpha = Neo.painter.alpha;
    this.reserve.tool = Neo.painter.tool.getType();
    this.element.style.backgroundColor = this.reserve.color;
    this.update();
    Neo.updateUI();
};

Neo.ReserveControl.prototype.update = function() {
    this.element.style.backgroundColor = this.reserve.color;
};

/*
-------------------------------------------------------------------------
	ScrollBarButton
-------------------------------------------------------------------------
*/

Neo.scrollH;
Neo.scrollV;

Neo.ScrollBarButton = function() {};
Neo.ScrollBarButton.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;

    this.element.innerHTML = "<div></div>";
    this.barButton = this.element.getElementsByTagName("div")[0];
    this.element['data-bar'] = true;
    this.barButton['data-bar'] = true;

    if (name == "scrollH") Neo.scrollH = this;
    if (name == "scrollV") Neo.scrollV = this;
    return this;
};

Neo.ScrollBarButton.prototype.update = function(oe) {
    if (this.name == "scrollH") {
        var a = oe.destCanvas.width / (oe.canvasWidth * oe.zoom);
        var barWidth = oe.destCanvas.width * a;
        var barX = (oe.scrollBarX) * (oe.destCanvas.width - barWidth - 2);
        this.barButton.style.width = (Math.ceil(barWidth) - 4) + "px";
        this.barButton.style.left = Math.ceil(barX) + "px";

    } else {
        var a = oe.destCanvas.height / (oe.canvasHeight * oe.zoom);
        var barHeight = oe.destCanvas.height * a;
        var barY = (oe.scrollBarY) * (oe.destCanvas.height - barHeight - 2);
        this.barButton.style.height = (Math.ceil(barHeight) - 4) + "px";
        this.barButton.style.top = Math.ceil(barY) + "px";
    }
};


