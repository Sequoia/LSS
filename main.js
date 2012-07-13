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
		var fileName = "writefile.php";

		//check if the server is listening for shieldchange updates
		$.ajax( fileName,
		{
			type: 'post',
			data: {
				ping : 'I done seen \'er at the club \'bout fiftyleven times'
			},
			success: function(response){
				if(response === 'pong'){
					bindAjax();
				}
			}
		});

		//bind to shieldchange, send to server to write
		var bindAjax = function(){
			console.log('info: sending data to server for writing to arduino');
			$shield.bind('matrixChange.shield',function(){
				$.ajax( fileName,
				{
					type: 'post',
					data: {
						frame : $('input#matrixCode').attr('value')
					}
				});
			});
		};
	});

});
