'use strict';

var Neo = function() {};

Neo.version = "0.3.5";

Neo.painter;
Neo.config;
Neo.fullScreen = false;


Neo.init = function() {
    sssl(["assets/jquery-1.4.2.min.js",
          "assets/painter.js",
          "assets/tools.js",
          "assets/commands.js",
          "assets/widgets.js"], function() { Neo.init2(); });
};

Neo.init2 = function() {
    Neo.config = new Object;
    var pair = location.search.substring(1).split('&');
    for (var i = 0; pair[i]; i++) {
        var tmp = pair[i].split('=');
        Neo.config[tmp[0]] = tmp[1];
    }
    Neo.config.width = parseInt(Neo.config.width || 300);
    Neo.config.height = parseInt(Neo.config.height || 300);

    Neo.canvas = document.getElementById("canvas");
    Neo.container = document.getElementById("container");
    Neo.toolsWrapper = document.getElementById("toolsWrapper");

    Neo.painter = new Neo.Painter();
    Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);
    Neo.canvas.oncontextmenu = function() {return false;};
//  Neo.painter.onUpdateCanvas = null;

    Neo.resizeCanvas();

    initComponents();
    initButtons();

    Neo.painter._pushUndo();
}

function initComponents() {
    var toolSet = document.getElementById("toolSet");
    document.getElementById("tools").appendChild(toolSet);
    document.getElementById("copyright").innerHTML += "v" + Neo.version;

    //お絵描き中はアプレットのborderを選択状態にする
    var container = document.getElementById("container");
    container.addEventListener("mousedown", function(e) {
        container.style.borderColor = '#800000';
        e.stopPropagation();
    }, false);
    document.addEventListener("mousedown", function(e) {
        container.style.borderColor = 'transparent';
    }, false);
}

function initButtons() {
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
    var url = "http://" + board + "/paintpost.php";
    var header = new Blob();

    var headerLength = this.getSizeString(header.size);
    var imgLength = this.getSizeString(blob.size);
    var body = new Blob(['P', // PaintBBS
                         headerLength,
                         header,
                         imgLength,
                         '\r\n', 
                         blob], {type: 'blob'});

    if (1) {
        // xhrで直接送信する場合
        var request = new XMLHttpRequest();
        request.open("POST", url, true);
        request.onload = function (e) {
            console.log(request.response);

            var exitURL = "http://" + board + "/futaba.php?mode=paintcom";
            location.href = exitURL;
        }
        request.send(body);

    } else {
        // node経由で送信する場合
        var arrayBuffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arrayBuffer = this.result;
            var dataView = new DataView(arrayBuffer);

            var headers = { 
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'PaintBBS/2.x'
            };
            var options = {
                url: url,
                method: 'POST',
                headers: headers,
                body: new Uint8Array(arrayBuffer),
            }

            var request = require('request');
            request(options, function(error, response, body) {
                if (body) console.log(body);

                var exitURL = "http://" + board + "/futaba.php?mode=paintcom";
                Neo.openURL(exitURL);
            });
        };
        fileReader.readAsArrayBuffer(body);
    }
};


//simple, small script loader
//https://gist.github.com/aFarkas/936413
(function(){
	var firstScript = document.getElementsByTagName('script')[0];
	var scriptHead = firstScript.parentNode;
	var re = /ded|co/;
	var onload = 'onload';
	var onreadystatechange = 'onreadystatechange'; 
	var readyState = 'readyState';
	
	var load = function(src, fn){
		var script = document.createElement('script');
		script[onload] = script[onreadystatechange] = function(){
			if(!this[readyState] || re.test(this[readyState])){
				script[onload] = script[onreadystatechange] = null;
				fn && fn(script);
				script = null;
			}
		};
		script.async = true;
		script.src = src;
		scriptHead.insertBefore(script, firstScript);
	};
	window.sssl = function(srces, fn){
		if(typeof srces == 'string'){
			load(srces, fn);
			return;
		}
		var src = srces.shift();
		load(src, function(){
			if(srces.length){
				window.sssl(srces, fn);
			} else {
				fn && fn();
			}
		});
	};
})();

