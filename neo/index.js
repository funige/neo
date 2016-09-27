'use strict';

const shell = require('electron').shell;

function openExternal(url) {
    shell.openExternal(url);
}

function getSizeString(len) {
    var result = String(len);
    while (result.length < 8) {
        result = "0" + result;
    }
    return result;
}

function submit(board) {
    var blob = oe.getPNG();
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
}

