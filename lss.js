var lss = (function($, _){
	"use strict"

	var numRows = 9;
	var numColumns = 14;
	var matrix = []; //cache the jquery elems
	var my = {};

	my.turnOn = function(x,y){
		matrix[x][y].addClass('on');
	}

	my.turnOff = function(x,y){
		matrix[x][y].removeClass('on');
	}

	my.drawRow = function(rowNum,colData){
		//left to right
		var i;
		for(i=0;i<numColumns;i++){
			if(colData & Math.pow(2,i)){
				my.turnOn(rowNum,i);
			}else{
				my.turnOff(rowNum,i);
			}
		}
	};

	my.draw = function(matrixData){
		var i;
		for( i=0 ; i < numRows ; i++){
			my.drawRow( i , matrixData[i]);
		};
	}

	my.initMarkup = function initMarkup(){
		var $shield = $('#shield');
		var $row,$led, i, j;
		var ledRadius = '5'; //in px
		var rowHeight = '14'; //px
		var columnWidth = '14'; //px

		for(i = 0; i < numRows; i++){
			$row = $('<div data-row="'+i+'" class="row "></div>').appendTo($shield);
			matrix[i] = [];
			for(j = 0; j < numColumns; j++){
				$led = $('<span data-col="'+j+'" class = "led" ></span>').appendTo($row);
				matrix[i].push($led);
			}
		}

		for(i = 0; i < numColumns; i++){
			$('[data-col='+i+']').animate({'left': (i+1)*columnWidth},1000);
		}
		for(i = 0; i < numRows; i++){
			$('[data-row='+i+'] .led').animate({'top': (i+1)*rowHeight},{queue:false, duration:1000});
		}
	}

	return my;
})($, _);

if (typeof define === 'function' && define.amd) {
	define('lss', function() {
		return lss;
	});
}
