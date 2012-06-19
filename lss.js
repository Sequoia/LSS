$(function(){
	(function setup(){
		"use strict"
		var numRows = 9;
		var numColumns = 14;
		var $shield = $('#shield');
		var $row, i, j;
		var ledRadius = '5'; //in px
		var rowHeight = '14'; //px
		var columnWidth = '14'; //px

		for(i = 1; i <= numRows; i++){
			$shield.append('<div data-row="'+i+'" class="row "></div>');
			$row = $shield.find('div:last-child');
			for(j = 1; j <= numColumns; j++){
				$row.append('<span data-col="'+j+'" class = "led" ></span>');
			}
		}

		for(i = 1; i <= numColumns; i++){
			$('[data-col="'+i+'"]').animate({'left': i*columnWidth},1000);
		}
		for(i = 1; i <= numRows; i++){
			$('[data-row="'+i+'"] .led').animate({'top': i*rowHeight},{queue:false, duration:1000});
		}
	})();
});
