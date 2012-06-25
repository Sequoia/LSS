var lsss; //so I can access it from the console
require(['jquery','underscore','lss'],function($,_,lss){
	$(function(){
		lsss=lss;
		lss.init();
	});
});
