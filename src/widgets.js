'use strict';

Neo.getModifier = function(e) {
    if (e.shiftKey) {
        return 'shift';

    } else if (e.button == 2 || e.ctrlKey || e.altKey || Neo.painter.virtualRight) {
        return 'right';
    }
    return null;
}

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
    this.element.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
        e.preventDefault();
    }, true);
    this.element.addEventListener("touchend", function(e) {
        ref._mouseUpHandler(e);
    }, true);

    
    this.element.className = (!this.params.type == "fill") ? "button" : "buttonOff";

    return this;
};

Neo.Button.prototype._mouseDownHandler = function(e) {
    if (Neo.painter.isUIPaused()) return;
    this.isMouseDown = true;

    if ((this.params.type == "fill") && (this.selected == false)) {
        for (var i = 0; i < Neo.toolButtons.length; i++) {
            var toolTip = Neo.toolButtons[i];
            toolTip.setSelected((this.selected) ? false : true);
        }
        Neo.painter.setToolByType(Neo.Painter.TOOLTYPE_FILL);
    }

    if (this.onmousedown) this.onmousedown(this);
};
Neo.Button.prototype._mouseUpHandler = function(e) {
    if (this.isMouseDown) {
        this.isMouseDown = false;

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
    Right Button
  -------------------------------------------------------------------------
*/

Neo.RightButton;

Neo.RightButton = function() {};
Neo.RightButton.prototype = new Neo.Button();

Neo.RightButton.prototype.init = function(name, params) {
    Neo.Button.prototype.init.call(this, name, params);
    this.params.type = "right";
    return this;
}

Neo.RightButton.prototype._mouseDownHandler = function(e) {
};

Neo.RightButton.prototype._mouseUpHandler = function(e) {
    this.setSelected(!this.selected)
};

Neo.RightButton.prototype._mouseOutHandler = function(e) {
};

Neo.RightButton.prototype.setSelected = function (selected) {
    if (selected) {
        this.element.className = "buttonOn";
        Neo.painter.virtualRight = true;
    } else {
        this.element.className = "buttonOff";
        Neo.painter.virtualRight = false;
    }
    this.selected = selected;
};

Neo.RightButton.clear = function () {
    var right = Neo.rightButton;
    right.setSelected(false);
};

/*
  -------------------------------------------------------------------------
    Fill Button
  -------------------------------------------------------------------------
*/

Neo.FillButton;

Neo.FillButton = function() {};
Neo.FillButton.prototype = new Neo.Button();

Neo.FillButton.prototype.init = function(name, params) {
    Neo.Button.prototype.init.call(this, name, params);
    this.params.type = "fill";
    return this;
}

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
    this.element.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
        e.preventDefault();
    }, true);
    this.element.addEventListener("touchend", function(e) {
        ref._mouseUpHandler(e);
    }, true);

    this.element.className = "colorTipOff";

    var index = parseInt(this.name.slice(5)) - 1;
    this.element.style.left = (index % 2) ? "0px" : "26px";
    this.element.style.top = Math.floor(index / 2) * 21 + "px";

    // base64 ColorTip.png
    this.element.innerHTML = "<img style='max-width:44px;' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAASCAYAAAAg9DzcAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAANklEQVRIx+3OAQkAMADDsO3+Pe8qCj+0Akq6bQFqS2wTCpwE+R4IiyVYsGDBggULfirBgn8HX7BzCRwDx1QeAAAAAElFTkSuQmCC' />"

    this.setColor(Neo.config.colors[params.index - 1]);

    this.setSelected(this.selected);
    Neo.colorTips.push(this);
};

Neo.ColorTip.prototype._mouseDownHandler = function(e) {
    if (Neo.painter.isUIPaused()) return;
    this.isMouseDown = true;

    for (var i = 0; i < Neo.colorTips.length; i++) {
        var colorTip = Neo.colorTips[i];
        if (this == colorTip) {
            switch (Neo.getModifier(e)) {
            case 'shift':
                this.setColor(Neo.config.colors[this.params.index - 1]);
                break;
            case 'right':
                this.setColor(Neo.painter.foregroundColor);
                break;
            }

//          if (e.shiftKey) {
//              this.setColor(Neo.config.colors[this.params.index - 1]);
//          } else if (e.button == 2 || e.ctrlKey || e.altKey ||
//                     Neo.painter.virtualRight) {
//              this.setColor(Neo.painter.foregroundColor);
//          }
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
    this.element.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
        e.preventDefault();
    }, true);
    this.element.addEventListener("touchend", function(e) {
        ref._mouseUpHandler(e);
    }, true);

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
            if (Neo.getModifier(e) == "right") {
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
    if (this.fixed) {
        this.element.className = "toolTipFixed";

    } else {
        if (selected) {
            this.element.className = "toolTipOn";
        } else {
            this.element.className = "toolTipOff";
        }
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
            Neo.tintImage(ctx, c);
        }
    }
};

Neo.ToolTip.prototype.drawTintImage = function(ctx, img, c, x, y) {
    ctx.drawImage(img, x, y);
    Neo.tintImage(ctx, c);
};

Neo.ToolTip.bezier = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAT0lEQVRIx+3SQQoAIAhE0en+h7ZVEEKBZrX5b5sjKknAkRYpNslaMLPq44ZI9wwHs0vMQ/v87u0Kk8xfsaI242jbMdjPi5Y0r/zTAAAAD3UOjRf9jcO4sgAAAABJRU5ErkJggg==";
Neo.ToolTip.blur = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAASUlEQVRIx+3VMQ4AIAgEQeD/f8bWWBnJYUh2SgtgK82G8/MhzVKwxOtTLgIUx6tDout4laiPIICA0Qj4bXxAy0+8LZP9yACAJwsqkggS55eiZgAAAABJRU5ErkJggg==";
Neo.ToolTip.blurrect = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAX0lEQVRIx+2XQQ4AEAwEt+I7/v+8Org6lJKt6NzLjjYE8DAKtLpYoDeCCCC7tYUd3ru2qQOzDTyndhJzB6KSAmxSgM0fAlGuzBnmlziqxB8jFJkUYJMCbAQYPxt2kF06fvYKgjPBO/IAAAAASUVORK5CYII=";
Neo.ToolTip.brush = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAQUlEQVRIx2NgGOKAEcb4z8CweRA4xpdUPSxofJ8BdP8WcjQxDaCDqQLQY4CsUBgFo2AUjIJRMApGwSgYBaNgZAIA0CoDwDbZu8oAAAAASUVORK5CYII=";
Neo.ToolTip.burn = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAPklEQVRIx+3PMRIAMAQAQbzM0/0sKZPeiDG57TQ4keH0Htx9VR+MCM1vOezl8xUsv4IAAkYjoBsB3QgAgL9tYXgF19rh9yoAAAAASUVORK5CYII=";
Neo.ToolTip.copy = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAW0lEQVRIx+2XMQoAIAwDU/E7/v95Orh2KMUSC7m5Qs6AUqAxG1gzOLirwxhgmXOjOlg1oQY8sjf2mvYNSICNBNhIgE3oH/jlzfdo34AE2EiATXsBA+5mww6S5QASDwSGMt8ouwAAAABJRU5ErkJggg==";
Neo.ToolTip.copy2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAN0lEQVRIx+3PwQkAIBADwdPKt3MtQVCOPNz5B7JV0pNxOwRW9zng+G92n+hmQJoBaQakGSBJf9tyBgQUV/fKCAAAAABJRU5ErkJggg==";
Neo.ToolTip.ellipse = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAATklEQVRIx+2VMQ4AIAgD6/8fjbOJi1LFmt4OPQ0KIE7LNgggCBLbHkuFM9lM+Om+QwDjpksyb4tT86vlvzgEbYxefQPyv5D8HjDGGGOk6b3jJ+lYubd8AAAAAElFTkSuQmCC";
Neo.ToolTip.ellipsefill = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAVUlEQVRIx+2VURIAEAgFc/9D5waSHpV5+43ZHRMizRnRA1REARLHHq6NCFl01Nail+LeEDMgU34nYhlQQd6K+PsGKkSEZyArBPoK3Y6K/AOEEEJIayZHbhIKjkZrFwAAAABJRU5ErkJggg==";
Neo.ToolTip.eraser = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABQElEQVRIx+1WQY7CMAwcI37Cad+yXOgH4Gu8gAt9CtrDirfMHjZJbbcktVSpQnROSeMkY3vsFHhzSG3xfLpz/JVmG0mIqDkIMcc6+7Kejx6fdb0dq7w09rVFkrjejrMOunQ9vg7f/5QEIAd6E1Eo38WF8fF7n8sdALCrLerIzoFI4sI0Vtv1SYZ8CVbeF7tzF7JugIkVkxOauc6CIe8842S+XmMfsq7TN9LRTngZmTmVD4SrnzYaGYhFoxCWgajXuMjYGTuJ3dlwIBIN3U0cUVqLXCs5E7YeVsvAYJul5HWeLUhL3EpstQwooqoOTEHDOebpMn7ngkUsg3RotU8X1MkuVDrYohkIupC0YArX6T+PfX3kcbQLNV/iCKi6EB3xqXdAZ0JKthZ8B0QEl673NIEX/0I/z36Rf6ENGzZ8EP4A8Lp+9e9VWC4AAAAASUVORK5CYII=";
Neo.ToolTip.flip = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAZklEQVRIx+2XQQoAIAgE1+g7/f95degWHSyTTXDOhTsSiUBgOtCq8mD3DiOA3NxTCVgKaLA0qHiFOsHSnC8ELKQAmxRgE15APQfWv9pzLjwX+CXsjvBPKAXYpACb8AICzM2GHeSWAfVOCIiJuQ9tAAAAAElFTkSuQmCC";
Neo.ToolTip.freehand = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAdUlEQVRIx+2WUQrAMAhD3dj9r+y+VoSyLhYDynzQv1qiJlCR4hzeAhVRsiC3Jkj0c5hN7Lx7IQ9SphLE1ICdwko420purEWQuywN3pqxgcw2+WwAtU1GzoqiLZNwZBvMAIcO8y3YKUO8mkbmjPzjK9E0TUPjBoeyLAS0usjLAAAAAElFTkSuQmCC";
Neo.ToolTip.line = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAU0lEQVRIx+2UQQ4AIAjD8P+PxivRGDQC47C+oN1hIgTLQAt4qIga2c23XYAVPkm3CVhlb4ShAa/rQgMi1i0NyFg3LaBq3bAA1LpfAd7/EkIIIR2YXFYSCpWS8w8AAAAASUVORK5CYII=";
Neo.ToolTip.merge = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAW0lEQVRIx+2XQQrAQAgDx9Lv9JF9+e6h54IINlgyZ4UMOYgwmAXXmRxc3WECorJ3dAfrJtXAC7c6PPygAQuosYAaC6hJ3YHqlfyC8Q1YQI0F1IwXCHg+G3WQKhvwgwUFmFyYbwAAAABJRU5ErkJggg==";
Neo.ToolTip.pen = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAK0lEQVRIx+3OsQkAMAwDQXn/oe3WfSAEctd9I5TA32pHJ/3AoTpfAQCAGwaa5AICJLKWSQAAAABJRU5ErkJggg==";
Neo.ToolTip.rect = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAQElEQVRIx+3TMQ4AIAhD0WK8/5VxdcIYY8rw3wok7YAEr6iGKaU74BY0ro+6FKhyDHe4VxRwm6eFLn8AAADwwQIwTQgGo9ZMywAAAABJRU5ErkJggg==";
Neo.ToolTip.rectfill = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAANElEQVRIx+3PIQ4AIBADwcL//3xYBMEgLiQztmab0GvcxkqqO3ALPbbO7rBXDnRzAADgYwvqDwIMJlGb5QAAAABJRU5ErkJggg==";
Neo.ToolTip.text = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAcUlEQVRIx+2VwQ7AIAhDy7L//2V2WmIYg+ky2KEv8aCCqYQqQMgrJNpUQMXEKKDmAPHyspgSrBBvLZu3cQqZEdwhfusq0KdkVR5HlFfBvpI0mtIzeusFot7vFPqYuzZYMXUFlzc+qrIn7tf/ACGEkIwDlEQ94YZjzcgAAAAASUVORK5CYII=";
Neo.ToolTip.tone = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAATCAYAAADWOo4fAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAO0lEQVRIx+3PIQ4AMAgEwaP//zNVVZUELiQ7CgWstFy8IaVsPhT1Lb/T+fQEAtwIcCPAjQC39QEAgJIL6DQCFhAqsRkAAAAASUVORK5CYII=";

/*
  -------------------------------------------------------------------------
    PenTip
  -------------------------------------------------------------------------
*/

Neo.penTip;

Neo.PenTip = function() {};
Neo.PenTip.prototype = new Neo.ToolTip();

Neo.PenTip.prototype.tools = [Neo.Painter.TOOLTYPE_PEN,
                              Neo.Painter.TOOLTYPE_BRUSH,
                              Neo.Painter.TOOLTYPE_TEXT];

Neo.PenTip.prototype.hasTintImage = true;
Neo.PenTip.prototype.toolIcons = [Neo.ToolTip.pen,
                                  Neo.ToolTip.brush,
                                  Neo.ToolTip.text];

Neo.PenTip.prototype.init  = function(name, params) {
    this.toolStrings = [Neo.translate("鉛筆"),
                        Neo.translate("水彩"),
                        Neo.translate("ﾃｷｽﾄ")]; 
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

/*
  -------------------------------------------------------------------------
    Pen2Tip
  -------------------------------------------------------------------------
*/

Neo.pen2Tip;

Neo.Pen2Tip = function() {};
Neo.Pen2Tip.prototype = new Neo.ToolTip();

Neo.Pen2Tip.prototype.tools = [Neo.Painter.TOOLTYPE_TONE, 
                               Neo.Painter.TOOLTYPE_BLUR,
                               Neo.Painter.TOOLTYPE_DODGE,
                               Neo.Painter.TOOLTYPE_BURN];

Neo.Pen2Tip.prototype.hasTintImage = true;
Neo.Pen2Tip.prototype.toolIcons = [Neo.ToolTip.tone,
                                   Neo.ToolTip.blur,
                                   Neo.ToolTip.burn,
                                   Neo.ToolTip.burn];

Neo.Pen2Tip.prototype.init  = function(name, params) {
    this.toolStrings = [Neo.translate("トーン"),
                        Neo.translate("ぼかし"),
                        Neo.translate("覆い焼き"),
                        Neo.translate("焼き込み")]; 

    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.Pen2Tip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    switch (this.tools[this.mode]) {
    case Neo.Painter.TOOLTYPE_TONE:
        this.drawTone(Neo.painter.foregroundColor);
        break;

    case Neo.Painter.TOOLTYPE_DODGE:
        this.draw(0xffc0c0c0);
        break;

    case Neo.Painter.TOOLTYPE_BURN:
        this.draw(0xff404040);
        break;

    default:
        this.draw(Neo.painter.foregroundColor);
        break;
    }
    this.label.innerHTML = this.toolStrings[this.mode];
};

Neo.Pen2Tip.prototype.drawTone = function() {
    var ctx = this.canvas.getContext("2d");
    
    var imageData = ctx.getImageData(0, 0, 46, 18);
    var buf32 = new Uint32Array(imageData.data.buffer);
    var buf8 = new Uint8ClampedArray(imageData.data.buffer);
    var c = Neo.painter.getColor() | 0xff000000;
    var a = Math.floor(Neo.painter.alpha * 255);
    var toneData = Neo.painter.getToneData(a);

    for (var j = 0; j < 18; j++) {
        for (var i = 0; i < 46; i++) {
            if (j >= 1 && j < 12 && 
                i >= 2 && i < 26 &&
                toneData[(i%4) + (j%4) * 4]) {
                buf32[j * 46 + i] =  c;

            } else {
                buf32[j * 46 + i] =  0;
            }
        }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);

    this.prevMode = this.mode;
};


/*
  -------------------------------------------------------------------------
    EraserTip
  -------------------------------------------------------------------------
*/

Neo.eraserTip;

Neo.EraserTip = function() {};
Neo.EraserTip.prototype = new Neo.ToolTip();

Neo.EraserTip.prototype.tools = [Neo.Painter.TOOLTYPE_ERASER, 
                                 Neo.Painter.TOOLTYPE_ERASERECT,
                                 Neo.Painter.TOOLTYPE_ERASEALL];

Neo.EraserTip.prototype.init  = function(name, params) {
    this.toolStrings = [Neo.translate("消しペン"),
                        Neo.translate("消し四角"),
                        Neo.translate("全消し")];
    
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
    this.toolStrings = [Neo.translate("四角"),
                        Neo.translate("線四角"),
                        Neo.translate("楕円"),
                        Neo.translate("線楕円")];

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

Neo.Effect2Tip.prototype.tools = [Neo.Painter.TOOLTYPE_COPY,
                                  Neo.Painter.TOOLTYPE_MERGE,
                                  Neo.Painter.TOOLTYPE_BLURRECT,
                                  Neo.Painter.TOOLTYPE_FLIP_H,
                                  Neo.Painter.TOOLTYPE_FLIP_V,
                                  Neo.Painter.TOOLTYPE_TURN];

Neo.Effect2Tip.prototype.hasTintImage = true;
Neo.Effect2Tip.prototype.toolIcons = [Neo.ToolTip.copy,
                                      Neo.ToolTip.merge,
                                      Neo.ToolTip.blurrect,
                                      Neo.ToolTip.flip,
                                      Neo.ToolTip.flip,
                                      Neo.ToolTip.flip];

Neo.Effect2Tip.prototype.init = function(name, params) {
    this.toolStrings = [Neo.translate("コピー"),
                        Neo.translate("ﾚｲﾔ結合"),
                        Neo.translate("角取り"),
                        Neo.translate("左右反転"),
                        Neo.translate("上下反転"),
                        Neo.translate("傾け")];

    this.isTool = true;
    Neo.ToolTip.prototype.init.call(this, name, params);

    this.img = document.createElement("img");
    this.img.src = Neo.ToolTip.copy2;
    this.element.appendChild(this.img);
    return this;
};

Neo.Effect2Tip.prototype.update = function() {
    for (var i = 0; i < this.tools.length; i++) {
        if (Neo.painter.tool.type == this.tools[i]) this.mode = i;
    }

    this.draw(Neo.painter.foregroundColor);
    this.label.innerHTML = this.toolStrings[this.mode];
};

/*
  -------------------------------------------------------------------------
    MaskTip
  -------------------------------------------------------------------------
*/

Neo.maskTip;

Neo.MaskTip = function() {};
Neo.MaskTip.prototype = new Neo.ToolTip();

Neo.MaskTip.prototype.init = function(name, params) {
    this.toolStrings = [Neo.translate("通常"),
                        Neo.translate("マスク"),
                        Neo.translate("逆ﾏｽｸ"),
                        Neo.translate("加算"),
                        Neo.translate("逆加算")];

    this.fixed = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.MaskTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    if (Neo.getModifier(e) == "right") {
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

Neo.DrawTip.prototype.hasTintImage = true;
Neo.DrawTip.prototype.toolIcons = [Neo.ToolTip.freehand, 
                                   Neo.ToolTip.line,
                                   Neo.ToolTip.bezier];

Neo.DrawTip.prototype.init = function(name, params) {
    this.toolStrings = [Neo.translate("手書き"),
                        Neo.translate("直線"),
                        Neo.translate("BZ曲線")];
    
    this.fixed = true;
    Neo.ToolTip.prototype.init.call(this, name, params);
    return this;
};

Neo.DrawTip.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;

    var length = this.toolStrings.length;

    if (Neo.getModifier(e) == "right") {
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
    this.mode = Neo.painter.drawType;
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
    this.element.innerHTML += "<div class='hit'></div>";

    this.slider = this.element.getElementsByClassName('slider')[0];
    this.label = this.element.getElementsByClassName('label')[0];
    this.hit = this.element.getElementsByClassName('hit')[0];
    this.hit['data-slider'] = params.type;

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

    this.update();
    return this;
};

Neo.ColorSlider.prototype.downHandler = function(x, y) {
    if (Neo.painter.isShiftDown) {
        this.shift(x, y);

    } else {
        this.slide(x, y);
    }
};

Neo.ColorSlider.prototype.moveHandler = function(x, y) {
    this.slide(x, y);
    //event.preventDefault();
};

Neo.ColorSlider.prototype.upHandler = function(x, y) {
};

Neo.ColorSlider.prototype.shift = function(x, y) {
    var value;
    if (x >= 0 && x < 60 && y >= 0 && y <= 15) {
        var v = Math.floor((x - 5) * 5.0);
        var min = (this.type == Neo.SLIDERTYPE_ALPHA) ? 1 : 0;

        value = Math.max(Math.min(v, 255), min);
        if (this.value > value || this.value == 255) {
            this.value--;
        } else {
            this.value++;
        }
        this.value = Math.max(Math.min(this.value, 255), min);
        this.value0 = this.value;
        this.x0 = x;
    }

    if (this.type == Neo.SLIDERTYPE_ALPHA) {
        Neo.painter.alpha = this.value / 255.0;
        this.update();
        Neo.updateUIColor(false, false);

    } else {
        var r = Neo.sliders[Neo.SLIDERTYPE_RED].value;
        var g = Neo.sliders[Neo.SLIDERTYPE_GREEN].value;
        var b = Neo.sliders[Neo.SLIDERTYPE_BLUE].value;

        Neo.painter.setColor(r<<16 | g<<8 | b);
        Neo.updateUIColor(true, true);
    }
};

Neo.ColorSlider.prototype.slide = function(x, y) {
    var value;
    if (x >= 0 && x < 60 && y >= 0 && y <= 15) {
        var v = Math.floor((x - 5) * 5.0);
        value = Math.round(v / 5) * 5;

        this.value0 = value;
        this.x0 = x;

    } else {
        var d = (x - this.x0) / 3.0;
        value = this.value0 + d; 
    }
    
    var min = (this.type == Neo.SLIDERTYPE_ALPHA) ? 1 : 0;
    this.value = Math.max(Math.min(value, 255), min);

    if (this.type == Neo.SLIDERTYPE_ALPHA) {
        Neo.painter.alpha = this.value / 255.0;
        this.update();
        Neo.updateUIColor(false, false);

    } else {
        var r = Neo.sliders[Neo.SLIDERTYPE_RED].value;
        var g = Neo.sliders[Neo.SLIDERTYPE_GREEN].value;
        var b = Neo.sliders[Neo.SLIDERTYPE_BLUE].value;
        var color = (r<<16 | g<<8 | b);

        var colorTip = Neo.ColorTip.getCurrent()
        if (colorTip) {
            colorTip.setColor(Neo.painter.getColorString(color))
        }

        Neo.painter.setColor(color);
        //      Neo.updateUIColor(true, true);
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
    this.value = this.value0 = 1;

    this.element.className = "sizeSlider";
    this.element.innerHTML = "<div class='slider'></div><div class='label'></div>";
    this.element.innerHTML += "<div class='hit'></div>"

    this.slider = this.element.getElementsByClassName('slider')[0];
    this.label = this.element.getElementsByClassName('label')[0];
    this.hit = this.element.getElementsByClassName('hit')[0];
    this.hit['data-slider'] = params.type;

    this.slider.style.backgroundColor = Neo.painter.foregroundColor;
    this.update();
    return this;
};

Neo.SizeSlider.prototype.downHandler = function(x, y) {
    if (Neo.painter.isShiftDown) {
        this.shift(x, y);

    } else {
        this.value0 = this.value;
        this.y0 = y;
        this.slide(x, y);
    }
};

Neo.SizeSlider.prototype.moveHandler = function(x, y) {
    this.slide(x, y);
    //event.preventDefault();
};

Neo.SizeSlider.prototype.upHandler = function(x, y) {
};

Neo.SizeSlider.prototype.shift = function(x, y) {
    var value0 = Neo.painter.lineWidth;
    var value;
    
    if (!Neo.painter.tool.alt) {
        var v = Math.floor((y - 4) * 30.0 / 33.0);

        value = Math.max(Math.min(v, 30), 1);
        if (value0 > value || value0 == 30) {
            value0--;
        } else {
            value0++;
        }
        this.setSize(value0);
    }
};

Neo.SizeSlider.prototype.slide = function(x, y) {
    var value;
    if (!Neo.painter.tool.alt) {
        if (x >= 0 && x < 48 && y >= 0 && y < 41) {
            var v = Math.floor((y - 4) * 30.0 / 33.0);
            value = v;

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

    value = Math.max(Math.min(value, 30), 1);
    this.setSize(value);
};

Neo.SizeSlider.prototype.setSize = function(value) {
    value = Math.round(value);
    Neo.painter.lineWidth = Math.max(Math.min(30, value), 1);

    var tool = Neo.painter.getCurrentTool();
    if (tool) {
        if (tool.type == Neo.Painter.TOOLTYPE_BRUSH) {
            Neo.painter.alpha = tool.getAlpha();
            Neo.sliders[Neo.SLIDERTYPE_ALPHA].update();

        } else if (tool.type == Neo.Painter.TOOLTYPE_TEXT) {
            Neo.painter.updateInputText();
        }
    }
    this.update();
};

Neo.SizeSlider.prototype.update = function() {
    this.value = Neo.painter.lineWidth;

    var height = this.value * 33.0 / 30.0;
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
    this.element.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
        e.preventDefault();
    }, true);

    this.element.className = "layerControl";

    var layerStrings = [Neo.translate("Layer0"),
                        Neo.translate("Layer1")];
    
    this.element.innerHTML =
        "<div class='bg'></div><div class='label0'>" + layerStrings[0] +
        "</div><div class='label1'>" + layerStrings[1] +
        "</div><div class='line1'></div><div class='line0'></div>";

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
    if (Neo.getModifier(e) == "right") {
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
    this.element.addEventListener("touchstart", function(e) {
        ref._mouseDownHandler(e);
        e.preventDefault();
    }, true);

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
    if (Neo.getModifier(e) == 'right') {
        this.save();
    } else {
        this.load();
    }
    this.update();
};

Neo.ReserveControl.prototype.load = function() {
    Neo.painter.setToolByType(this.reserve.tool)
    Neo.painter.foregroundColor = this.reserve.color;
    Neo.painter.lineWidth = this.reserve.size;
    Neo.painter.alpha = this.reserve.alpha;

    switch (this.reserve.tool) {
    case Neo.Painter.TOOLTYPE_PEN:
    case Neo.Painter.TOOLTYPE_BRUSH:
    case Neo.Painter.TOOLTYPE_TONE:
        Neo.painter.drawType = this.reserve.drawType;
    };
    Neo.updateUI();
};

Neo.ReserveControl.prototype.save = function() {
    this.reserve.color = Neo.painter.foregroundColor;
    this.reserve.size = Neo.painter.lineWidth;
    this.reserve.drawType = Neo.painter.drawType;
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
        var barWidth = Math.ceil(oe.destCanvas.width * a);
        var barX = (oe.scrollBarX) * (oe.destCanvas.width - barWidth);
        this.barButton.style.width = (Math.ceil(barWidth) - 4) + "px";
        this.barButton.style.left = Math.floor(barX) + "px";

    } else {
        var a = oe.destCanvas.height / (oe.canvasHeight * oe.zoom);
        var barHeight = Math.ceil(oe.destCanvas.height * a);
        var barY = (oe.scrollBarY) * (oe.destCanvas.height - barHeight);
        this.barButton.style.height = (Math.ceil(barHeight) - 4) + "px";
        this.barButton.style.top = Math.floor(barY) + "px";
    }
};

/*
  -------------------------------------------------------------------------
    ViewerButton
  -------------------------------------------------------------------------
*/

Neo.ViewerButton = function() {};
Neo.ViewerButton.prototype = new Neo.Button();

Neo.ViewerButton.speedStrings = ["最", "早", "既", "鈍"];

Neo.ViewerButton.prototype.init = function(name, params) {
    Neo.Button.prototype.init.call(this, name, params);

    if (name != "viewerSpeed") {
        this.element.innerHTML = "<canvas width=24 height=24></canvas>"
        this.canvas = this.element.getElementsByTagName('canvas')[0];
        var ctx = this.canvas.getContext("2d");
        
        var img = new Image();
        img.src = Neo.ViewerButton[name.toLowerCase().replace(/viewer/, '')];
        img.onload = function() {
            var ref = this;
            ctx.clearRect(0, 0, 24, 24);
            ctx.drawImage(img, 0, 0);
            Neo.tintImage(ctx, Neo.config.color_text)
        }.bind(this);

    } else {
        this.element.innerHTML = "<div></div><canvas width=24 height=24></canvas>"
        this.update();
    }
    return this;
};

Neo.ViewerButton.prototype.update = function() {
    if (this.name == "viewerSpeed") {
        var mode = Neo.painter._actionMgr._speedMode;
        var speedString = Neo.translate(Neo.ViewerButton.speedStrings[mode]);
        this.element.children[0].innerHTML = "<div>" + speedString + "</div>";
    }
};

Neo.ViewerButton.minus = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEX/////HgA/G9hMAAAAAXRSTlMAQObYZgAAABFJREFUCNdjYMAG5H+AEDYAADOnAi81ABEKAAAAAElFTkSuQmCC";

Neo.ViewerButton.plus = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEX/////HgD/HgAvnCBAAAAAAnRSTlMAAHaTzTgAAAAfSURBVAjXY2BAA0wTMAimVasaIARj2FQHCIGkBAUAAGm3CXHeKF1tAAAAAElFTkSuQmCC";

Neo.ViewerButton.play = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEX/////HgD/HgAvnCBAAAAAAnRSTlMAAHaTzTgAAAAuSURBVAjXY2BAABUQoQkitBxAxAQQsQRErAQRq+CspSBiKogIAekIABKqDhAzAAuwB6SsnxQ6AAAAAElFTkSuQmCC";

Neo.ViewerButton.stop = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEX/////HgA/G9hMAAAAAXRSTlMAQObYZgAAABFJREFUCNdjYIAB+x8EEBgAACjyDV75Mi9xAAAAAElFTkSuQmCC";

Neo.ViewerButton.rewind = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEX/////HgA/G9hMAAAAAXRSTlMAQObYZgAAACxJREFUCNdjYAADJiYGNjYGPj4GOTkGOzuGujqGf/9AJJANFAGKA2WBahgYAIE2Bb0RIYJRAAAAAElFTkSuQmCC";

/*
  -------------------------------------------------------------------------
    ViewerBar
  -------------------------------------------------------------------------
*/

// length/mark/count
// update

Neo.ViewerBar = function() {};
Neo.ViewerBar.prototype.init = function(name, params) {
    this.element = document.getElementById(name);
    this.params = params || {};
    this.name = name;
    this.isMouseDown = false;

    this.element.style.display = "inline-block";
    this.element.innerHTML =
        "<div id='viewerBarLeft'></div>" +
        "<div id='viewerBarMark'></div>" +
        "<div id='viewerBarText'>hoge</div>";
    this.seekElement = this.element.children[0];
    this.markElement = this.element.children[1];
    this.textElement = this.element.children[2];

    this.width = this.seekElement.offsetWidth;

    this.length = this.params.length || 100;
    this.mark = this.length;
    this.seek = 0;

    var ref = this;
    this.element.onmousedown = function(e) {
        ref.isMouseDown = true;
        ref._touchHandler(e);
    }
    this.element.onmousemove = function(e) {
        if (ref.isMouseDown) {
            ref._touchHandler(e);
        }
    }
//  this.element.onmouseup = function(e) { this.isMouseDown = false; }
//  this.element.onmouseout = function(e) { this.isMouseDown = false; }
    this.element.addEventListener("touchstart", function(e) {
        ref._touchHandler(e);
        e.preventDefault();
    }, true);

    this.update();
    return this;
};

Neo.ViewerBar.prototype.update = function() {
    this.mark = Neo.painter._actionMgr._mark;
    this.seek = Neo.painter._actionMgr._head;
    
    var markX = (this.mark / this.length) * this.width;
    this.markElement.style.left = markX + "px";

    var seekX = (this.seek / this.length) * this.width;
    this.seekElement.style.width = seekX + "px";
    this.textElement.innerHTML = this.seek + '/' + this.length;
};

Neo.ViewerBar.prototype._touchHandler = function(e) {
    var x = e.offsetX / this.width;
    x = Math.max(Math.min(x, 1), 0);

    Neo.painter._actionMgr._mark = Math.round(x * this.length);
    //this.update();
    //  console.log('mark=', this.mark, 'head=', Neo.painter._actionMgr._head);

    Neo.painter.onmark();
};
