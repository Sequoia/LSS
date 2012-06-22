define('lss', ['jquery','underscore'], function($, _){
	"use strict"

	var $eventHolder; //the shield, where we'll hang events
	var numRows = 9;
	var numColumns = 14;
	var ledRadius = '10'; //in px
	var rowHeight = '30.4'; //px
	var columnWidth = '34.3'; //px
	var matrix = []; //cache the jquery elems
	var ledMousedown = false; //to track dragging across multiple leds
	var my = {};

	var initMarkup = function initMarkup(){
		var $shield = $('#shield');
		$eventHolder = $shield;
		var $row, $led, i, j;

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
	};

	//send 'on' or 'off' to go one direction, otherwise toggles
	$.fn.changeLed = function(onoff){
		if(!this.hasClass('led')){ throw "tried to toggleLed on non-led"; }
		var y = this.data('col');
		var x = this.parent().data('row');
		//'on' or 'off' sent
		if(typeof onoff !== 'undefined'){
			if(onoff === 'on'){
				my.turnOn(x,y);
			}else if(onoff ==='off'){
				my.turnOff(x,y)
			} else{
				throw '$.fn.changeLed() only takes "on" or "off" as an argument';
			}
		}else{ //toggle
			if(this.hasClass('on')){
				my.turnOff(x,y);
			}
			else{
				my.turnOn(x,y);
			}
		}
	};

	var initHandlers = function(){
		//bind led click to toggleLed
		$('.led').bind({
			'mousedown' : function(e){
				e.preventDefault();//some browsers try to let you drag the element
				var $that = $(this);
				if($that.hasClass('on')){
					ledMousedown = 'turnOff';
				}else{
					ledMousedown = 'turnOn';
				}
				$that.changeLed();
				$eventHolder.trigger('matrixChange.shield');
				console.log('ledMousedown');
			},
			'mouseenter' : function(){
				//if they clicked and held on an LED, keep turning on/off
				if(ledMousedown ){
					var $that = $(this);
					if(ledMousedown === 'turnOn'){
						$that.changeLed('on');
					}else{
						$that.changeLed('off');
					}
				}
			}
		});

		$(window).bind('mouseup',function(){
				ledMousedown = false;
				console.log('mouseUp');
		});
		//bind
		//update rowcodes on shield change
	};

	my.init = function(){
		initMarkup();
		initHandlers();
	};

	my.turnOn = function(x,y){
		matrix[x][y].addClass('on');
	};

	my.turnOff = function(x,y){
		matrix[x][y].removeClass('on');
	};

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
	};

	return my;
});
