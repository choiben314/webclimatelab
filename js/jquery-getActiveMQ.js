// Copyright 2014 Aaron Gustafson. Used with permission.
// https://gist.github.com/aarongustafson/a0558c185264355df359

(function($,window){

  window.getActiveMQ = function()
	{
		$('<div id="getActiveMQ-watcher"></div>')
			.appendTo('body')
			.hide();

		var computed = window.getComputedStyle,
			watcher = document.getElementById('getActiveMQ-watcher');
			if ( 'currentStyle' in watcher )
			{
				window.getActiveMQ = function()
				{
					return watcher.currentStyle['fontFamily'].replace(/['"]/g,'');
				};
			}
			else if ( computed )
			{
				window.getActiveMQ = function()
				{
					return computed( watcher, null ).getPropertyValue( 'font-family' ).replace(/['"]/g,'');
				};
			}
			else
			{
				window.getActiveMQ = function()
				{
					return 'unknown';
				};
			}
			return window.getActiveMQ();
	};

}(jQuery, window))