/*jshint devel:true */
var lsss; //so I can access it from the console

require(['jquery','underscore','lss'],function($,_,lss){

	$(function(){
		"use strict";
		lsss=lss;
		var $shield = lss.init();
		var serverPath = "writefile.php";

		//check if the server is listening for shieldchange updates
		$.ajax( serverPath,
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
			$shield.bind('matrixChange.shield',_.debounce(function(){
				console.log('sending to server...');
				$.ajax( serverPath,
				{
					type: 'post',
					data: {
						frame : $('input#matrixCode').attr('value')
					}
				});
			},100));
		};
	});

});
