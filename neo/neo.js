'use strict';

var Neo = function() {
};

Neo.version = "0.3";

Neo.openURL = function(url) {
    require('electron').shell.openExternal(url);
};

Neo.submit = function(board, blob) {
    var url = "http://" + board + "/paintpost.php";

    var headerLength = this.getSizeString(0);
    var imgLength = this.getSizeString(blob.size);
    var body = new Blob(['P', // PaintBBS
                         headerLength,
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

