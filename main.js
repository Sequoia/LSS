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
		lsss=lss;
		lss.init();
	});
});
