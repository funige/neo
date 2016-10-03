'use strict';

/*
-------------------------------------------------------------------------
	Button
-------------------------------------------------------------------------
*/

Neo.Button = function() {};
Neo.Button.element;
Neo.Button.selected = false;
Neo.Button.disabled = false;
Neo.Button.isMouseDown = false;
Neo.Button.prototype.init = function(element, params) {
    if (!this.params) params = {};
    this.element = document.getElementById(element);

    var ref = this;
	this.element.onmousedown = function(e) { ref._mouseDownHandler(e) }
	this.element.onmouseup = function(e) { ref._mouseUpHandler(e) }
	this.element.onmouseover = function(e) { ref._mouseOverHandler(e) }
	this.element.onmouseout = function(e) { ref._mouseOutHandler(e) }
    this.element['data-ui'] = true;
    this.element.className = "button";

    var className = "button";
    if (params.selected) {
        className = "buttonActive";
        this.selected = true;
    }
    if (params.disabled) {
        className = "buttonDisabled";
        this.disabled = true;
    }
    this.element.className = className;
    return this;
};

Neo.Button.prototype._mouseDownHandler = function(e) {
    this.isMouseDown = true;
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


/*
-------------------------------------------------------------------------
	ColorTip
-------------------------------------------------------------------------
*/

Neo.ColorTip = function() {};
Neo.ColorTip.init = function(element) {
  
};

/*
-------------------------------------------------------------------------
	ToolTip
-------------------------------------------------------------------------
*/

Neo.ToolTip = function() {};
Neo.ToolTip.init = function(element) {
  
};

/*
-------------------------------------------------------------------------
	ColorSlider
-------------------------------------------------------------------------
*/

Neo.ColorSlider = function() {};
Neo.ColorSlider.init = function(element) {
  
};

/*
-------------------------------------------------------------------------
	SizeSlider
-------------------------------------------------------------------------
*/

Neo.SizeSlider = function() {};
Neo.SizeSlider.init = function(element) {
  
};

/*
-------------------------------------------------------------------------
	LayerControl
-------------------------------------------------------------------------
*/

Neo.LayerControl = function() {};
Neo.LayerControl.init = function(element) {

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

