/*global console, window */

define('lss', ['jquery','underscore'], function($, _){
	"use strict";

	var $eventHolder, $shield; //the shield, where we'll hang events
	var numRows = 9;
	var numColumns = 14;
	var ledRadius = '10'; //in px
	var rowHeight = '30.4'; //px
	var columnWidth = '34.3'; //px
	var matrix = {}; //cache the rows' jquery elems
	var ledMousedown = false; //to track dragging across multiple leds
	var my = {};

	//create the dom elements
	var initMarkup = function initMarkup(){
		$eventHolder = $shield = $('#shield');  
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

	var updateMatrixcode = function(){
		var $matrixCode = $('input#matrixCode');
		var codeArray = [];
		_.each(matrix,function(val,key){
			codeArray.push(val.rowcodeInput.attr('value'));
		});
		$matrixCode.attr('value',codeArray.join(','));
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

	//sequence: array of matrixCodes
	var playThru = function(sequence){
		var i=0;
		while(sequence.length){
			window.setTimeout(my.draw,i,sequence.shift());
			i+=1000;
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
				my.turnOff(x,y);
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

	//event bindings and stuff
	//JUST for the shield & input/outputs.  extra controls (high contrast etc.) in controls
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
				$('#shieldBG').addClass('drawing');
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
				$('#shieldBG').removeClass('drawing');
				console.log('mouseUp');
		});

		//update the rowcodes when led(s) change
		$eventHolder.bind({
			'matrixChange.shield' : function(){
				my.updateRowcodes();
				updateMatrixcode();
				console.log('matrixChange.shield triggered');
			}
		});

		//update row when rowcode changes
		$('.rowcode').bind('change.shield', function(e){
			var $that = $(this);
			var rowcode = $that.attr('value');
			var rowNum = $that.parent().data('row');
			my.drawRow( rowNum , rowcode );
			$eventHolder.trigger('matrixChange.shield');
		});

		//update row when matrixCode changes
		$('input#matrixCode').bind('change.shield', function(e){
			var $that = $(this);
			var matrixCode = $that.attr('value');
			var matrixCodeArray = matrixCode.split(',');
			if(matrixCodeArray.length !== numRows || !/^[0-9,]+$/.test(matrixCode)){ 
				console.log(':(');
				return false; //make sure the string is legit
			}
			my.draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});
	};

	var initControls = function(){
		var $controls = $('#controls');
		var $hC = $controls.find('#highContrast');

		$hC.bind('change',function(e){
			if($(this).is(':checked')){
				$('body').addClass('highContrast');
			}else{
				$('body').removeClass('highContrast');
			}
		});

		//push matrixCode to sequence
		$('button#pushMatrixCode').bind('click',function(e){
			var matrixCode = $('#matrixCode').attr('value');
			var sequence = $('#sequence').html();
			sequence += "{" + matrixCode + "},<br>\n";
			$('#sequence').html(sequence);
			console.log(sequence);
		});

		//playThru
		$('button#play').bind('click',function(e){
			//get and cleanup sequence data
			var sequence = $('#sequence').text();
			var matrixArrayDirty = sequence.split("},");
			matrixArrayDirty = _.filter(matrixArrayDirty,function(str){
				return str.trim().length;//remove ""
			});
			var matrixArray = _.map(matrixArrayDirty, function(str){
				var newStr = str.match(/[0-9].*$/)[0];
				var ray = newStr.split(',');
				return ray;
			});
			playThru(matrixArray);
		});

	};

	my.init = function(){
		initMarkup();
		initHandlers();
		initControls();
		$eventHolder.trigger('matrixChange.shield');
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
		console.log('drawing ' + matrixData);
		var i;
		for( i=0 ; i < numRows ; i++){
			my.drawRow( i , matrixData[i]);
		}
	};

	return my;
});
