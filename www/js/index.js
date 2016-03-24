document.addEventListener("deviceready", onDeviceReady, false);

var measures = [];
var measuresPerLine = [];
var media = null;
var path = null;

function onDeviceReady()
{
	path = getPhoneGapPath();
	media = new Media(path + 'Songs/Test-Song/Test.mp3', null, mediaError);
	drawNotes();
}

$(window).resize(function()
{
	if(done)
	{
		countMeasures();
	}
});

$('#song').click(function()
{
	alert('under construction');
});

$('#instrument').click(function()
{
	alert('authorized personel only');
});

$(document).ready()
{
	$('#noteScreen').attr('height', $('#playScreen').height() * .95);
	$('#noteScreen').attr('width', $('#playScreen').width());
	
	var menu = $('#menuScreen');
	var playButton = $('#play');
	var stopButton = $('#stop');
	var selector = $('#highlighter');
	var pos = $('#total');
	var seek = $('#seek');
	var display = $('#mainWindow');
	var viewport = $('#viewContainer');
	var done = false;
	var currentMeasure = 0;
	var measuresThisLine = 0;
	var currentLine = 0;
	var measureLength = 5000;
	
	mouseToPhone();
	
	display.draggable(
	{
		axis: 'y',
		stop: function(event, ui)
		{
			if(display.position().top > 8)
			{
				display.stop();
				display.animate({top: '-= ' + (display.position().top - 8) + 'px'}, 50);
			} /*else if(display.position().top < (8 + viewport - display.height()))
			{
				display.animate({top: '+= px'}, 50);
			}*/
		}
	});
}

function countMeasures()
{
	var current = $('#mainWindow_line1');
	var count = 0;
	current = current.next();
	while(current.next().is('a') || current.next().is('canvas'))
	{
		if(current.is('a'))
		{
			count++;
			current = current.next();
		} else if(current.is('canvas'))
		{
			measuresPerLine.push(count);
			count = 0;
			if(current.next().is('a'))
			{
				current = current.next().next();
			}
		}
	}
}

function getPhoneGapPath()
{
	var path = window.location.pathname;
	path = path.substr(path, path.length - 10);
	return path;
}

function mouseToPhone()
{
    var mouseEventTypes = {
        touchstart : "mousedown",
        touchmove : "mousemove",
        touchend : "mouseup"
    };

    for (originalType in mouseEventTypes) {
        document.addEventListener(originalType, function(originalEvent) {
            if(originalEvent.type == 'click')
                return;
            if (originalEvent.type != 'touchstart' && originalEvent.type !='touchend'){
                originalEvent.preventDefault();
            }
            event = document.createEvent("MouseEvents");
            touch = originalEvent.changedTouches[0];
            event.initMouseEvent(mouseEventTypes[originalEvent.type], true, true, window, 0, touch.screenX, touch.screenY, touch.clientX, touch.clientY, touch.ctrlKey, touch.altKey, touch.shiftKey, touch.metaKey, 0, null);
            originalEvent.target.dispatchEvent(event);
            event.preventDefault();         
        });
    }
}

function renderFinished()
{
	for(var i = 0; i < measures.length; ++i)
	{
		measures[i] = measures[i] * .8;
	}
	
	countMeasures();
	
	selector.css({'top': display.offset().top + 35, 'left': display.offset().left + 9, 'width': measures[0], 'height': $('#mainWindow_canvas1').height() * .9});
	done = true;
}

function drawNotes()
{
	var VexDocument = null;
    var VexFormatter = null;

	$.get(path + 'Songs/Test-Song/Test.xml', function(data)
	{
		var start = new Date().getTime(); // time execution

        VexDocument = new Vex.Flow.Document(data);
        //console.log(VexDocument);
        var content = $(".content")[0];
        if (VexDocument)
		{
			VexFormatter = VexDocument.getFormatter();
			VexFormatter.draw(content);
			measures = VexFormatter.measureWidth;
        }
        var elapsed = (new Date().getTime() - start)/1000;
        var debouncedResize = null;
        $(window).resize(function()
		{
			if (! debouncedResize)
				debouncedResize = setTimeout(function()
				{
					VexFormatter.draw(content);
					debouncedResize = null;
				}, 
			500);
        });
		renderFinished();
	});
}

function formatTime(seconds)
{
	var secs = seconds % 60;
	var mins = seconds / 60;
	var res = '';
	if(mins < 10)
	{
		res += '0';
	}
	res += Math.floor(mins) + ':';
	if(secs < 10)
	{
		res += '0';
	}
	res += Math.floor(secs);
	return res;
}

$('body').swipe(
{
	//Single swipe handler for left swipes
	swipeLeft: function ()
	{
		if(menu.hasClass('open'))
		{
			menu.animate({left: '-=250px'}, 500);
			menu.removeClass('open');
		}
	},
	swipeRight: function ()
	{
		if(!menu.hasClass('open'))
		{
			menu.animate({left: '+=250px'}, 500);
			menu.addClass('open');
		}
	},
	threshold: 75
});

function updateSliderPosition(seconds) {
    if (seconds < seek.attr('min'))
        seek.val(seek.attr('min'));
    else if (seconds > seek.attr('max'))
        seek.val(seek.attr('max'));
    else
		seek.val(Math.round(seconds));
 
    seek.slider('refresh');
   }
   
function seekPosition(seconds) {
	if (media === null)
		return;
 
	media.seekTo(seconds * 1000);
	updateSliderPosition(seconds);
}

playButton.click(function()
{
	if(!playButton.hasClass('playing'))
	{
		media.play();
		playButton.addClass('playing');
		mediaTimer = setInterval(
			function()
			{
				media.getCurrentPosition(
					function(position)
					{
						if (position > -1)
						{
							pos.text(formatTime(position));
							updateSliderPosition(position);
						}
					},
					function(error) {
						console.log('Unable to retrieve media position: ' + error.code);
						pos.text(formatTime(0));
					}
				);
            },
            1000
		);
        var counter = 0;
        timerDuration = setInterval(
            function()
			{
				counter++;
				if (counter > 20)
					clearInterval(timerDuration);
				
				var duration = media.getDuration();
				if (duration > -1)
				{
					measureLength = (duration / measuresPerLine.length) * 1000;
					clearInterval(timerDuration);
					seek.attr('max', Math.round(duration));
					seek.slider('refresh');
				}
            },
            100
        );
		highlightTimer = setInterval(
			function()
			{
				if(measuresThisLine < measuresPerLine[currentLine] - 1)
				{
					measuresThisLine++;
					selector.css({'left': selector.offset().left + selector.width()});
				} else
				{
					measuresThisLine = 0;
					currentLine++;
					selector.css({'left': display.offset().left + 9});
					display.css({'top': display.position().top - ($('#mainWindow_canvas1').height()) - 5});
				}
				currentMeasure++;
				selector.css({'width': measures[currentMeasure]});
			},
			measureLength
		);
		playButton.text('pause');
	} else
	{
		media.pause();
		playButton.removeClass('playing');
		clearInterval(highlightTimer);
		clearInterval(timerDuration);
		playButton.text('play');
	}
});

stopButton.click(function()
{
	display.css({'top': '8px'});
	selector.css({'top': display.offset().top + 35, 'left': display.offset().left + 9, 'width': measures[0], 'height': $('#mainWindow_canvas1').height() * .9});
	measuresThisLine = 0;
	currentLine = 0;
	currentMeasure = 0;
	playButton.removeClass('playing');
	clearInterval(highlightTimer);
	clearInterval(timerDuration);
	playButton.text('play');
	media.stop();
	media.release();
});

function mediaError(error)
{
	alert('code: ' + error.code + '\n' + 'message: ' + error.message);
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};