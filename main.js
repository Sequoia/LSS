var lsss; //so I can access it from the console
require.config({
	paths : {
		'Mousetrap' : 'jam/mousetrap/mousetrap'
	},
	shim : {
		'Mousetrap' : {
			exports : 'Mousetrap'
		}
	}
});

require(['jquery','underscore','Mousetrap','lss'],function($,_,Mousetrap,lss){
	$(function(){
		"use strict";
		lsss=lss;
		var $shield = lss.init();
		//bind to shieldchange, send to server to write
		$shield.bind('matrixChange.shield',function(){
			$.ajax( "writefile.php",
			{
				type: 'post',
				data: {
					frame : $('input#matrixCode').attr('value')
				}
			});
		});
	});
});
