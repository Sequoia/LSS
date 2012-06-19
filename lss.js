define('lss', ['jquery','underscore'], function($, _){
	"use strict"

	var numRows = 9;
	var numColumns = 14;
	var ledRadius = '10'; //in px
	var rowHeight = '30.4'; //px
	var columnWidth = '34.3'; //px
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

		for(i = 0; i < numRows; i++){
			$row = $('<div data-row="'+i+'" class="row "></div>').appendTo($shield);
			matrix[i] = [];
			for(j = 0; j < numColumns; j++){
				$led = $('<span data-col="'+j+'" class = "led" ></span>').appendTo($row);
				matrix[i].push($led);
			}
		}

		for(i = 0; i < numColumns; i++){
			$('[data-col='+i+']').animate({'left': (i)*columnWidth},1000);
		}
		for(i = 0; i < numRows; i++){
			$('[data-row='+i+']').animate({'top': (i)*rowHeight},{queue:false, duration:1000});
		}

		//size
		$('.led').css({
			height: ledRadius*2,
			width: ledRadius*2
		});
	}

	return my;
});
