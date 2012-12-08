/*jshint browser:true */
/*global console, */
//@TODO remove dom stuff from this script, make it an "output driver"

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
	var UIelems = []; //buttons TODO: move this out to i/o driver
	var LScache = {}; //local storage sketches in an object

	//create the dom elements
	var initMarkup = function initMarkup(){
		$eventHolder = UIelems.shield = $('#shield');  
		var $row, $led, i, j;

		for(i = 0; i < numRows; i++){
			$row = $('<div data-row="'+i+'" class="row "></div>').appendTo(UIelems.shield);
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

		//other elems
		UIelems.play = $('button#play');
		UIelems.pause = $('button#pause');
		UIelems.add = $('button#pushMatrixCode');
		UIelems.contrast = $('input#highContrast');
		UIelems.matrixCode = $('input#matrixCode');
		UIelems.sequence = $('#sequence');

		UIelems.shiftRight = $('button#shiftRight');
		UIelems.shiftLeft = $('button#shiftLeft');
		UIelems.shiftUp = $('button#shiftUp');
		UIelems.shiftDown = $('button#shiftDown');
	};

	var updateMatrixcode = function(){
		var codeArray = [];
		_.each(matrix,function(val,key){
			codeArray.push(val.rowcodeInput.attr('value'));
		});
		UIelems.matrixCode.attr('value',codeArray.join(','));
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


	/**
	 * get and cleanup sequence data
	 * @return Array matrixArray
	 */
	var getSequenceFromHtml = function(){
		var sequence = UIelems.sequence.text();
		var matrixArrayDirty = sequence.split("},");
		var matrixArray = _.chain(matrixArrayDirty)
			.filter(function(str){
				return str.trim().length;//remove ""
			})
			.map(function(str){
				var newStr = str.match(/[0-9].*$/)[0];
				var ray = _(newStr.split(',')).map(function(str){
					return parseInt(str,10);
				});
				return ray;
			})
			.value();
		return matrixArray;
	};

	var play = function(){
		var sequence = getSequenceFromHtml();
		playThru(sequence);
	};

	/**
	 * sets playStack and starts playback
	 * @param sequence Array of matrixCodes
	 */
	var playThru = function(sequence){
		playStack = sequence;
		playIntervalID = window.setInterval(playNextState,playSpeed);
	};

	/**
	 * shift next state off of playStack and play apply it to the board
	 */
	var playNextState = function(){
		var nextState = playStack.shift();
		if(typeof nextState !== 'undefined'){
			draw(nextState);
			$eventHolder.trigger('matrixChange.shield');
		}else{
			clearInterval(playIntervalID); //stop
			playIntervalID = false;
		}
	};

	var pause = function(){
		if(playIntervalID){
			clearInterval(playIntervalID); //stop
			playIntervalID = false;
		}else if(playStack.length){
			playIntervalID = window.setInterval(playNextState,playSpeed);
		}
		console.log(playStack.length);
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
		return this;
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
		UIelems.matrixCode.bind('change.shield', function(e){
			var matrixCodeArray = getMatrixCode();
			if(!matrixCodeArray){ return false; }
			draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});
	};

	/**
	 * @return Array matrixCode
	 */
	var getMatrixCode = function(){
		var matrixCode = UIelems.matrixCode.attr('value');
		var matrixCodeArray = _(matrixCode.split(',')).map(function(str){
			return parseInt(str,10);
		});
		if(matrixCodeArray.length !== numRows || !/^[0-9,]+$/.test(matrixCode)){ 
			console.log('bad matrixCodeArray:(');
			return false; //make sure the string is legit
		}
		return matrixCodeArray;
	};

	var initControls = function(){
		UIelems.contrast.bind('change',function(e){
			if($(this).is(':checked')){
				$('body').addClass('highContrast');
			}else{
				$('body').removeClass('highContrast');
			}
		});

		//push matrixCode to sequence
		UIelems.add.bind('click',function(e){
			var matrixCode = $('#matrixCode').attr('value');
			var sequence = UIelems.sequence.html();
			sequence += "{" + matrixCode + "},<br>\n";
			UIelems.sequence.html(sequence);
			console.log(sequence);
		});

		//play
		UIelems.play.bind('click',function(e){
			UIelems.pause.attr('disabled',false);
			play();
		});

		UIelems.pause.bind('click',function(e){
			var $that = $(this);
			if($that.is(':disabled')){
				$that.attr('disabled',true);
			}else{
				$that.attr('disabled',false);
			}
			pause();
		});

		//shiftRight
		UIelems.shiftRight.bind('click',function(e){
			var matrixCodeArray = getMatrixCode();
			matrixCodeArray = shiftRight(matrixCodeArray);
			//draw to shield
			if(!matrixCodeArray){ return false; }
			draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});
		
		//shiftLeft
		UIelems.shiftLeft.bind('click',function(e){
			var matrixCodeArray = getMatrixCode();
			matrixCodeArray = shiftLeft(matrixCodeArray);
			//draw to shield
			if(!matrixCodeArray){ return false; }
			draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});

		//shiftUp
		UIelems.shiftUp.bind('click',function(e){
			var matrixCodeArray = getMatrixCode();
			matrixCodeArray = shiftUp(matrixCodeArray);
			//draw to shield
			if(!matrixCodeArray){ return false; }
			draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});

		//shiftDown
		UIelems.shiftDown.bind('click',function(e){
			var matrixCodeArray = getMatrixCode();
			matrixCodeArray = shiftDown(matrixCodeArray);
			//draw to shield
			if(!matrixCodeArray){ return false; }
			draw(matrixCodeArray);
			$eventHolder.trigger('matrixChange.shield');
		});
	};

	var initLocalStorage = function(){
		var k = 0; //counter
		//get the stuff that is there now & deserialize
		try{
			LScache = JSON.parse(localStorage.sketches);
		}catch(e){
			LScache = {};
		}
		//create links for it and append to container
		_.each( LScache, function(sText,sName){
			$('<a></a>')
				.text(sName)
				.addClass('savedSketch')
				.data('name', sName)
				.data('sequence', sText)
				.appendTo('#savedSketches');
		});

		//////////bind the events
		//save
		$('button#save').bind('click.shield',function(e){
			var $that = $(this);
			var sName = window.prompt('What is your sequence called?');
			var sText = UIelems.sequence.html();
			if(sName.length < 2){
				window.alert('too short');
				return;
			}
			writeToLS(sName , sText);
		});

		//load
		$('a.savedSketch').on('click',function(e){
			var $that = $(this);
			UIelems.sequence.html($that.data('sequence'));
		});
	};

	//write sequence to local storage
	var writeToLS = function(sName,sText){
		console.log(sText);
		console.log(LScache);
		//append sketch link to sketches on page
		$('<a></a>')
				.text(sName)
				.addClass('savedSketch')
				.data('name', sName)
				.data('sequence', sText)
				.appendTo('#savedSketches')
				.on('click',function(e){
					var $that = $(this);
					UIelems.sequence.html($that.data('sequence'));
				});
		//append new sketch to LScache
		LScache[sName] = sText;
		//serialize & write to localstorage
		localStorage.sketches = JSON.stringify(LScache);
		console.log(LScache);
	};

	var init = function(){
		initMarkup();
		initHandlers();
		initControls();
		initLocalStorage();
		$eventHolder.trigger('matrixChange.shield');
		return $eventHolder; //return shield for attaching more events
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
		//console.log('drawing ' + typeof matrixData);
		var i;
		for( i=0 ; i < numRows ; i++){
			drawRow( i , matrixData[i]);
		}
	};

	/**
	 * move all leds right; wrap far right onto left
	 * @param Array matrixData matrix of led values
	 * @return Array matrixData matrix, shifted
	 */
	var shiftRight = function(matrixData){
		var i;
		var wrapMask = Math.pow(2,numColumns); //far right bit to go left
		for( i=0 ; i < numRows ; i++){
			//shift off one bit
			matrixData[i] = matrixData[i] << 1;
			//stick it on the other end
			if(matrixData[i] & wrapMask ){
				matrixData[i] += 1 - wrapMask;
			}
		}
		return matrixData;
	};

	/**
	 * move all leds left; wrap far left onto right
	 * @param Array matrixData matrix of led values
	 * @return Array matrixData matrix, shifted
 */
	var shiftLeft = function(matrixData){
		var i;
		var wrapMask = Math.pow(2,numColumns); //far right bit to go left
		console.log(wrapMask);
		for( i=0 ; i < numRows ; i++){
		console.log("===");
			console.log(matrixData[i]);
			//does the first light on? if so add wrap bit to matrixData
			if(matrixData[i] & 1){
				matrixData[i] = matrixData[i] + wrapMask;
			console.log(matrixData[i]);
			}
			//shift off one bit
			matrixData[i] = matrixData[i] >> 1;
		console.log(matrixData[i]);
		}
		return matrixData;
	};

	/**
	 * move all leds up; wrap top to bottom
	 * @param Array matrixData
	 * @param Array shifted matrixData
	 */
	var shiftUp = function(matrixData){
		var topRow = matrixData.shift();
		matrixData.push(topRow);
		return matrixData;
	};

	/**
	 * move all leds up; wrap top to bottom
	 * @param Array matrixData
	 * @param Array shifted matrixData
	 */
	var shiftDown = function(matrixData){
		var bottomRow = matrixData.pop();
		matrixData.unshift(bottomRow);
		return matrixData;
	};

	//var shiftUp = function(matrixData

	return {
		init			: init,
		turnOn		: turnOn,
		turnOff		: turnOff,
		drawRow		: drawRow,
		draw			: draw,
		play			: play,
		pause			: pause,
		
		shiftRight: shiftRight,
		shiftLeft: shiftLeft,
		shiftUp: shiftUp
	};
});
