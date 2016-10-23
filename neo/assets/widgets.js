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
    this.element['data-ui'] = true;

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
                var toolTip = Neo.toolButtons[i]
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
    this.element['data-ui'] = true;

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
    if (this.selected == false) {
        for (var i = 0; i < Neo.colorTips.length; i++) {
            var colorTip = Neo.colorTips[i];
            colorTip.setSelected(this == colorTip) ? true : false;
        }
        Neo.painter.setColor(this.color);
        Neo.updateUIColor(true, false);
    }

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

Neo.ToolTip.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.mode = 0;
    
    this.isMouseDown = false;

    var ref = this;
    this.element.onmousedown = function(e) { ref._mouseDownHandler(e); }
    this.element.onmouseup = function(e) { ref._mouseUpHandler(e); }
    this.element.onmouseover = function(e) { ref._mouseOverHandler(e); }
    this.element.onmouseout = function(e) { ref._mouseOutHandler(e); }

    this.selected = (params.type == "pen") ? true : false;
    this.setSelected(this.selected);

    this.element.innerHTML = "<canvas width=46 height=18></canvas><div class='label'></div>";
    this.canvas = this.element.getElementsByTagName('canvas')[0];
    this.label = this.element.getElementsByTagName('div')[0];
    this.element['data-ui'] = true;
    this.canvas['data-ui'] = true;
    this.label['data-ui'] = true;

    this.update();
    return this;
};

Neo.ToolTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
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
Neo.ToolTip.prototype.draw = function(c) {};


/*
-------------------------------------------------------------------------
	PenTip
-------------------------------------------------------------------------
*/

Neo.penTip;

Neo.PenTip = function() {};
Neo.PenTip.prototype = new Neo.ToolTip();

Neo.PenTip.toolStrings = ["鉛筆"];

Neo.PenTip.prototype.init  = function(name, params) {
    this.toolType = Neo.Painter.TOOLTYPE_PEN;

    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.PenTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    if (this.selected == false) {
        for (var i = 0; i < Neo.toolButtons.length; i++) {
            var toolTip = Neo.toolButtons[i]
            toolTip.setSelected(this == toolTip) ? true : false;
        }

    } else {
        /*
        var length = Neo.PenTip.toolStrings.length;
        if (e.button == 2 || e.ctrlKey || e.altKey) {
            this.mode--;
            if (this.mode < 0) this.mode = length - 1;
        } else {
            this.mode++;
            if (this.mode >= length) this.mode = 0;
        }
        */
    }
    Neo.painter.setToolByType(this.toolType);
    this.update();
    
    if (this.onmousedown) this.onmousedown(this);
};

Neo.PenTip.prototype.update = function() {
    this.draw(Neo.painter.foregroundColor);
    this.label.innerHTML = Neo.PenTip.toolStrings[this.mode];
};

Neo.PenTip.prototype.draw = function(c) {
    if (typeof c != "string") c = Neo.painter.getColorString(c);
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = c;
    ctx.fillRect(2, 3, 33, 1.2);
};

/*
-------------------------------------------------------------------------
	EraserTip
-------------------------------------------------------------------------
*/

Neo.eraserTip;

Neo.EraserTip = function() {};
Neo.EraserTip.prototype = new Neo.ToolTip();

Neo.EraserTip.toolStrings = ["消しペン", "消し四角", "全消し"];
Neo.EraserTip.tools = [Neo.Painter.TOOLTYPE_ERASER, 
                       Neo.Painter.TOOLTYPE_ERASERECT,
                       Neo.Painter.TOOLTYPE_ERASEALL];

Neo.EraserTip.prototype.init  = function(name, params) {
    this.drawOnce = false;

    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.EraserTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
    if (this.selected == false) {
        for (var i = 0; i < Neo.toolButtons.length; i++) {
            var toolTip = Neo.toolButtons[i];
            toolTip.setSelected(this == toolTip) ? true : false;
        }

    } else {
        var length = Neo.EraserTip.toolStrings.length;
        if (e.button == 2 || e.ctrlKey || e.altKey) {
            this.mode--;
            if (this.mode < 0) this.mode = length - 1;
        } else {
            this.mode++;
            if (this.mode >= length) this.mode = 0;
        }
    }
    Neo.painter.setToolByType(Neo.EraserTip.tools[this.mode]);
    this.update();
    
    if (this.onmousedown) this.onmousedown(this);
};

Neo.EraserTip.prototype.update = function() {
    if (this.drawOnce == false) {
        this.draw();
        this.drawOnce = true;
    }
    this.label.innerHTML = Neo.EraserTip.toolStrings[this.mode];
};

Neo.EraserTip.prototype.draw = function() {
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var img = new Image();
    
    /* base64 tooltip-eraser.png*/
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABQElEQVRIx+1WQY7CMAwcI37Cad+yXOgH4Gu8gAt9CtrDirfMHjZJbbcktVSpQnROSeMkY3vsFHhzSG3xfLpz/JVmG0mIqDkIMcc6+7Kejx6fdb0dq7w09rVFkrjejrMOunQ9vg7f/5QEIAd6E1Eo38WF8fF7n8sdALCrLerIzoFI4sI0Vtv1SYZ8CVbeF7tzF7JugIkVkxOauc6CIe8842S+XmMfsq7TN9LRTngZmTmVD4SrnzYaGYhFoxCWgajXuMjYGTuJ3dlwIBIN3U0cUVqLXCs5E7YeVsvAYJul5HWeLUhL3EpstQwooqoOTEHDOebpMn7ngkUsg3RotU8X1MkuVDrYohkIupC0YArX6T+PfX3kcbQLNV/iCKi6EB3xqXdAZ0JKthZ8B0QEl673NIEX/0I/z36Rf6ENGzZ8EP4A8Lp+9e9VWC4AAAAASUVORK5CYII=";

    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
};

/*
-------------------------------------------------------------------------
	CopyTip
-------------------------------------------------------------------------
*/

Neo.copyTip;

Neo.CopyTip = function() {};
Neo.CopyTip.prototype = new Neo.ToolTip();

Neo.CopyTip.toolStrings = ["ﾚｲﾔ結合", "左右反転", "上下反転"];
Neo.CopyTip.tools = [Neo.Painter.TOOLTYPE_MERGE,
                     Neo.Painter.TOOLTYPE_FLIP_H,
                     Neo.Painter.TOOLTYPE_FLIP_V];

Neo.CopyTip.prototype.init = function(name, params) {
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.CopyTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
    if (this.selected == false) {
        for (var i = 0; i < Neo.toolButtons.length; i++) {
            var toolTip = Neo.toolButtons[i];
            toolTip.setSelected(this == toolTip) ? true : false;
        }
    } else {
        var length = Neo.CopyTip.toolStrings.length;
        if (e.button == 2 || e.ctrlKey || e.altKey) {
            this.mode--;
            if (this.mode < 0) this.mode = length - 1;
        } else {
            this.mode++;
            if (this.mode >= length) this.mode = 0;
        }
    }
    Neo.painter.setToolByType(Neo.CopyTip.tools[this.mode]);
    this.update();

    if (this.onmousedown) this.onmousedown(this);
};


Neo.CopyTip.prototype.update = function() {
    this.label.innerHTML = Neo.CopyTip.toolStrings[this.mode];
};

Neo.CopyTip.prototype.draw = function() {
};

/*
-------------------------------------------------------------------------
	MaskTip
-------------------------------------------------------------------------
*/

Neo.maskTip;

Neo.MaskTip = function() {};
Neo.MaskTip.prototype = new Neo.ToolTip();

Neo.MaskTip.toolStrings = ["通常", "マスク", "逆マスク"];

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
        var length = Neo.MaskTip.toolStrings.length;
        this.mode++;
        if (this.mode >= length) this.mode = 0;
        Neo.painter.maskType = this.mode;
    }
    this.update();

    if (this.onmousedown) this.onmousedown(this);
}

Neo.MaskTip.prototype.update = function() {
    this.draw(Neo.painter.maskColor);
    this.label.innerHTML = Neo.MaskTip.toolStrings[this.mode];
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
    this.slide(x, y);
};

Neo.SizeSlider.prototype.moveHandler = function(x, y) {
    this.slide(x, y);
};

Neo.SizeSlider.prototype.upHandler = function(x, y) {
};

Neo.SizeSlider.prototype.slide = function(x, y) {
    var value;
    if (x >= 0 && x <= 49 && y >= 0 && y <= 34) {
        value = (y - 0.5) * 30.0 / 33.0;
        value = Math.round(value);

        this.value0 = value;
        this.y0 = y;

    } else {
        var d = (y - this.y0) / 7.0;
        value = this.value0 + d; 
    }

    this.value = Math.max(Math.min(30, Math.round(value)), 1);

    Neo.painter.lineWidth = this.value;
    this.update();
};

Neo.SizeSlider.prototype.update = function() {
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
    this.element.innerHTML = "<div class='bg' data-ui=true></div><div class='label0' data-ui=true>Layer0</div><div class='label1' data-ui=true>Layer1</div><div class='line1' data-ui=true></div><div class='line0' data-ui=true></div>";

    this.bg = this.element.getElementsByClassName('bg')[0];
    this.label0 = this.element.getElementsByClassName('label0')[0];
    this.label1 = this.element.getElementsByClassName('label1')[0];
    this.line0 = this.element.getElementsByClassName('line0')[0];
    this.line1 = this.element.getElementsByClassName('line1')[0];

    this.bg['data-ui'] = true;
    this.label0['data-ui'] = true;
    this.label1['data-ui'] = true;
    this.line0['data-ui'] = true;
    this.line1['data-ui'] = true;

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

Neo.ReserveControl = function() {};
Neo.ReserveControl.init = function(element) {
  
};

/*
-------------------------------------------------------------------------
	ScrollBarButton
-------------------------------------------------------------------------
*/

Neo.ScrollBarButton = function() {};
Neo.ScrollBarButton.init = function(element) {

};

