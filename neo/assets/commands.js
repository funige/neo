var CommandBase = function(){
};
CommandBase.prototype.data;
CommandBase.prototype.execute = function(){}

/*
---------------------------------------------------
	ZOOM
---------------------------------------------------
*/
var ZoomPlusCommand = function(data){this.data=data};
ZoomPlusCommand.prototype = new CommandBase();
ZoomPlusCommand.prototype.execute = function(){
	var val = (this.data.zoom<16)? this.data.zoom*=2 : this.data.zoom;
	this.data.setZoom( val );
}

var ZoomMinusCommand = function(data){this.data=data};
ZoomMinusCommand.prototype = new CommandBase();
ZoomMinusCommand.prototype.execute = function(){
	var val = (this.data.zoom>2)? this.data.zoom*=0.5 : 1;
	this.data.setZoom( val );
}

