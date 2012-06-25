define('lss', ['jquery','underscore'], function($, _){
	"use strict"

	var $eventHolder; //the shield, where we'll hang events
	var numRows = 9;
	var numColumns = 14;
	var ledRadius = '10'; //in px
	var rowHeight = '30.4'; //px
	var columnWidth = '34.3'; //px
	var matrix = {}; //cache the rows' jquery elems
	var ledMousedown = false; //to track dragging across multiple leds
	var my = {};

	var initMarkup = function initMarkup(){
		var $shield = $('#shield');
		$eventHolder = $shield;
		var $row, $led, i, j;

		for(i = 0; i < numRows; i++){
			$row = $('<div data-row="'+i+'" class="row "></div>').appendTo($shield);
			matrix[i] = { leds : [] };
			//create dots
			for(j = 0; j < numColumns; j++){
				$led = $('<span data-col="'+j+'" class = "led" ></span>').appendTo($row);
				matrix[i].leds.push($led);
			}
			//create text input for rowcode
			matrix[i].rowcodeInput = $('<input type="text" class="rowcode" name="rowcode'+i+'" />')
				.appendTo($row);
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

	my.updateRowcodes = function(){
		var rowcode, i, j;
		for(i = 0; i < numRows; i++){
			rowcode = 0;
			//calculate the rowcode
			for(j = 0; j < numColumns; j++){
				if(matrix[i].leds[j].hasClass('on')){
					rowcode += Math.pow(2,j);
				}
			}
			//apply it to the input
			matrix[i].rowcodeInput.attr('value',rowcode);
		}
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
					$eventHolder.trigger('matrixChange.shield');
				}
			}
		});

		//bind
		$(window).bind('mouseup',function(){
				ledMousedown = false;
				console.log('mouseUp');
		});

		//update the rowcodes when led(s) change
		$eventHolder.bind({
			'matrixChange.shield' : function(){
				my.updateRowcodes();
			}
		});

		//update row when rowcode changes
		$('.rowcode').bind('change.shield', function(e){
			var $that = $(this);
			var rowcode = $that.attr('value');
			var rowNum = $that.parent().data('row');
			my.drawRow( rowNum , rowcode );
		});

	};

	my.init = function(){
		initMarkup();
		initHandlers();
	};

	my.turnOn = function(x,y){
		matrix[x].leds[y].addClass('on');
	};

	my.turnOff = function(x,y){
		matrix[x].leds[y].removeClass('on');
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
