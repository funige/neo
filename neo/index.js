'use strict';

const shell = require('electron').shell;

function openExternal(url) {
    shell.openExternal(url);
}

function postImage(url) {
    var request = require('request');
    request(url, function(error, response, body) {
        console.log(body);
    })
}

////////////////////////////////////////////////////////////////

var oe;
var active = true;

function init() {
	oe = new Oekaki('canvas');
	oe.init();
}

var Oekaki = function (id) {
	var canvas = document.getElementById(id);

	var color = "800000";
	var penWidth = 3;

	var history = [];
	var maxHistory = 50;

	var dragging = false;
	var moving = false;
	var prevX, prevY;

	var o$ = function(id) {
		if (opener) {
			return opener.document.getElementById(id);
		}
		return null;
	};

	var line = function(fromX, fromY, toX, toY) {
		var context = canvas.getContext("2d");
		context.lineCap = "round";
		context.strokeStyle = "#" + color;
		context.lineWidth = penWidth;

		context.beginPath();
		context.moveTo(fromX, fromY);
		context.lineTo(toX, toY);
		context.stroke();
		context.closePath();
	};

	var push_history = function(data) {
		var context = canvas.getContext("2d");
		var data = context.getImageData(0, 0, canvas.width, canvas.height);

		if (history.length <= 0 || history[history.length - 1] != data) {
			history.push(data);
			if (history.length > maxHistory) {
				history.shift(data);
			}
		}
	};

	var draw = function(data) {
		var context = canvas.getContext("2d");
		var img = new Image();
		img.src = "data:image/png;base64," + data;
		img.onload = function() { context.drawImage(img, 0, 0); };
	};

    var getSizeString = function (len) {
        var result = String(len);
        while (result.length < 8) {
            result = "0" + result;
        }
        return result;
    };

    var dataURItoBlob = function(dataURI) {
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURI.split(',')[1]);
        } else {
            byteString = unescape(dataURI.split(',')[1]);
        }

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ia], {type:'blob'});
    };

    this.submit = function(board) {
        deactivate();

        var dataURL = canvas.toDataURL('image/png');
        var blob = dataURItoBlob(dataURL);
        var url = "http://" + board + "/paintpost.php";

        var headerLength = getSizeString(0);
        var imgLength = getSizeString(blob.size);
        var body = new Blob(['P', // PaintBBS
                             headerLength,
                             imgLength,
                             '\r\n', 
                             blob], {type: 'blob'});

        if (0) {
            // xhrで直接送信する場合
            var oReq = new XMLHttpRequest();
            oReq.open("POST", url, true);
            oReq.onload = function (e) {
                console.log(oReq.response);
            }
            oReq.send(body);

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
                    openExternal(exitURL);
                });
            };
            fileReader.readAsArrayBuffer(body);
        }
    };

	this.init = function() {
		var context = canvas.getContext("2d");
		context.fillStyle = "#f0e0d6";
		context.fillRect(0, 0, 300, 300);

		if (o$('baseform')) {
			o$('baseform').value = null;
		}
		history = [];
        activate();
	};

	this.setColor = function(value) { color = value; };
	this.getColor = function() { return color; };

	this.setPenWidth = function(value) { penWidth = value; }
	this.getPenWidth = function() { return penWidth; }

	var undo = function() {
		var data = history.pop();
		if (data)	{
			var context = canvas.getContext("2d");
			context.putImageData(data, 0, 0);
		}
	};

	this.touchStart = function() {
        if (active == false) return;
		event.preventDefault();
		if (event.target.id == "undo") return undo();
		if (event.target.id == "color") return color_touch();

		dragging = true;
		moving = false;
        var e = (event.touches) ? event.touches[0] : event;
		prevX = e.clientX - 10;
		prevY = e.clientY - 25;
		push_history();
	};

	this.touchMove = function() {
        if (active == false) return;
		event.preventDefault();
		if (dragging) {
            var e = (event.touches) ? event.touches[0] : event;
			var x = e.clientX - 10;
			var y = e.clientY - 25;
			line(prevX, prevY, x, y);

			moving = true;
			prevX = x;
			prevY = y;
		}
	};

	this.touchEnd = function() {
        if (active == false) return;
		event.preventDefault();
		if (event.target.id == "undo") return;
		if (event.target.id == "color") return;

		if (!moving) {
			line(prevX, prevY, prevX, prevY);
		}
		moving = false;
		dragging = false;
	};
};

var slider_dragging = false;
var slider_touch = function() {
    if (active == false) return;
    if (!event.touches && !slider_dragging) return;
    var e = (event.touches) ? event.touches[0] : event;
	var x = e.clientX;
	var width = Math.ceil((x - 112) / 6);
	if (width < 1) width = 1;
	if (width > 24) width = 24;
	oe.setPenWidth(width);

	var slider_value = document.getElementById('slider_value');
	if (slider_value) slider_value.innerHTML = width;
	var handle = document.getElementById('handle');
	if (handle) handle.style.left = (width * 6 + 54) + 'px';
};

var color_touch = function() {
	var color = (oe.getColor() == "800000") ? "F0E0D6" : "800000";
	oe.setColor(color);

	var color_thumb = document.getElementById('color');
	if (color_thumb) color_thumb.style.backgroundColor = "#" + color;
	var color_value = document.getElementById('color_value');
	if (color_value) color_value.innerHTML = color;
};

var activate = function() {
    document.getElementById('submit').disabled = false;
    document.getElementById('target').disabled = false;
    document.getElementById('undo').disabled = false;
    document.getElementById('canvas').style.opacity = 1.0;
    active = true;
};

var deactivate = function() {
    document.getElementById('submit').disabled = true;
    document.getElementById('target').disabled = true;
    document.getElementById('undo').disabled = true;
    document.getElementById('canvas').style.opacity = 0.5;
    active = false;
};