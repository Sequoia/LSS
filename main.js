var lsss; //so I can access it from the console
require.config({
	paths : {
		'Mousetrap' : 'jam/mousetrap/mousetrap'
	},
	shim : {
		'Mousetrap' : {
			exports : function(){
				return this.Mousetrap;
			}
		}
	}
});

require(['jquery','underscore','Mousetrap','lss'],function($,_,Mousetrap,lss){
	$(function(){
		console.log(Mousetrap);
		console.log(this.Mousetrap);
		lsss=lss;
		lss.init();
	});
});
