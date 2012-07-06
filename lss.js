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
	var playSpeed= 200; //playback speed
	var playStack = []; //holds states to be played thru
	var playIntervalID; //where the playback "setInterval" is stored for pausing
	var exports; //retuns/exports

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

	var updateRowcodes = function(){
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


	//get and cleanup sequence data
	//@param selector: sizzle/css selector for sequence container
	//       default: #sequence
	var getSequenceFromHtml = function(selector){
		selector = selector || "#sequence";
		var sequence = $(selector).text();
		var matrixArrayDirty = sequence.split("},");
		matrixArrayDirty = _.filter(matrixArrayDirty,function(str){
			return str.trim().length;//remove ""
		});
		var matrixArray = _.map(matrixArrayDirty, function(str){
			var newStr = str.match(/[0-9].*$/)[0];
			var ray = newStr.split(',');
			return ray;
		});
		return matrixArray;
	}

	//sequence: array of matrixCodes
	var playThru = function(sequence){
		playStack = sequence;
		playIntervalID = window.setInterval(playNextState,playSpeed);
	};

	var play = function(){
		var sequence = getSequenceFromHtml();
		playThru(sequence);
	}

	var pause = function(){
		clearInterval(playIntervalID); //stop
	}

	var unpause = function(){
		if(playStack.length){
			playIntervalID = window.setInterval(playNextState,playSpeed);
		}
	}

	var playNextState = function(){
		var nextState = playStack.shift();
		if(typeof nextState !== 'undefined'){
			draw(nextState);
		}else{
			clearInterval(playIntervalID); //stop
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
				turnOn(x,y);
			}else if(onoff ==='off'){
				turnOff(x,y);
			} else{
				throw '$.fn.changeLed() only takes "on" or "off" as an argument';
			}
		}else{ //toggle
			if(this.hasClass('on')){
				turnOff(x,y);
			}
			else{
				turnOn(x,y);
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
				updateRowcodes();
				updateMatrixcode();
				console.log('matrixChange.shield triggered');
			}
		});

		//update row when rowcode changes
		$('.rowcode').bind('change.shield', function(e){
			var $that = $(this);
			var rowcode = $that.attr('value');
			var rowNum = $that.parent().data('row');
			drawRow( rowNum , rowcode );
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
			draw(matrixCodeArray);
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
		$('button#play').bind('click',play);

	};

	var init = function(){
		initMarkup();
		initHandlers();
		initControls();
		$eventHolder.trigger('matrixChange.shield');
	};

	var turnOn = function(x,y){
		matrix[x].leds[y].addClass('on');
	};

	var turnOff = function(x,y){
		matrix[x].leds[y].removeClass('on');
	};

	var drawRow = function(rowNum,colData){
		//left to right
		var i;
		for(i=0;i<numColumns;i++){
			if(colData & Math.pow(2,i)){
				turnOn(rowNum,i);
			}else{
				turnOff(rowNum,i);
			}
		}
	};

	var draw = function(matrixData){
		console.log('drawing ' + matrixData);
		var i;
		for( i=0 ; i < numRows ; i++){
			drawRow( i , matrixData[i]);
		}
	};

	exports ={
		init			: init,
		turnOn		: turnOn,
		turnOff		: turnOff,
		drawRow		: drawRow,
		draw			: draw,
		play			: play,
		pause			: pause,
		unpause		: unpause
	}
	return exports;
});
