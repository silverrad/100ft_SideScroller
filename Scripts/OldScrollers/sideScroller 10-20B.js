	var animations = [];
	var segmentDict = [];
	var loadingDittyType = -1; // Preload -1, Load 0, Ready 1
	var tune;
	var timer;
	var stamp = 0;
	var counter = 0;
	var playBackDelay = 2024; //default

	var interactiveIntervalId;

	// Global vars
	var videoPlayer;
	var navigation;
	var interactive;
	var audio;
	var currentSong = "hotlineblingfull";

// Removes unneccesary jquery-ui interaction divs
jQuery(document).on("mobileinit", function() {
    jQuery.mobile.autoInitializePage = false;
});


$(document).ready(function () {	
	// register all click operations
	registerClickOperations();
	$('.fa').hide();
	$('#bodymovin').hide();
	
	$.getJSON("/References/DeLaAnimation.json", function(json) { //Yama_NorthCack.json
			// Load the first interaction: video files and audio
			segmentDict = json.interactiveSegments;
			loadInteraction(json.videos, json.songSelection);
		});
});
	
// Registers the submit button click operation and launches Ditty generation
function registerClickOperations(){
	videoPlayer = new VideoPlayer();
	navigation = new Navigation();
	interactive = new Interaction();
	var environment = navigation.currentEnvironment();
	
	// Play / Pause Button
	document.onkeydown = function(e) {
		if(interactive.isInteractable()){
    		switch (e.keyCode) {
        		case 37:
					environment = navigation.decrement(); //changes play parameters
					videoPlayer.setSource(environment);
					//videoPlayer.initPlayback(); //replace with full function
					//createRandomizedDittyAnimations(environment);
					break;
				case 39:
					environment = navigation.increment(); //changes play parameters
					videoPlayer.setSource(environment);
					//videoPlayer.initPlayback(); //replace with full function
					//createRandomizedDittyAnimations(environment);
					break;
			}			
		}
	};
	
	$("#sections").on('tap',function(){
		if(!audio.paused){
			interactiveIntervalId.pause();
			videoPlayer.pause();
			audio.pause();
		}
		else{
			interactiveIntervalId.resume();
			videoPlayer.play();
			audio.play();
		}
	});	
	

	 $("body").on('swipeleft',function(){
		environment = navigation.decrement(); //changes play parameters
		videoPlayer.setSource(environment);
	});	
	
	 $("body").on('swiperight',function(){
		environment = navigation.increment(); //changes play parameters
		videoPlayer.setSource(environment);
	});
	
	$(".fa").on('click', function (){
		videoPlayer.initPlayback();
	});
}

function loadInteraction(videoInput, songInput){
	//Generate Videos
	//generateVideos(videoInput);
	$('#section0')[0].src = "Videos/" + videoInput[0];
	$('#section1')[0].src = "Videos/" + videoInput[1];
	
	
	// Set Audio Input
	audio = new Audio("Audio/" + songInput);
	audio.play();
	startInteractionTimer();
	
	// Set Environment
	navigation.setEnvironment(videoInput);
	videoPlayer.initPlayback();
}

function startInteractionTimer(){
	interactiveIntervalId = new Timer(function(){
		console.log("timeeventLogged" + videoPlayer.currentTime());
		for(var i=0; i<segmentDict.length; i++){
			var timeStamp = videoPlayer.currentTime();
			if(segmentDict[i].startTime < timeStamp && segmentDict[i].endTime > timeStamp){
				interactive.setInteractive(true);
				return;
			}
		}
		interactive.setInteractive(false);} , 1000);
	
}

function generateVideos(videoInput){
	/*	var videoFrames = "";
	for(var i = 1; i >= 0; i--){
		videoFrames += '<video class="canvas" id="section' + i + '" src="Videos/"' + videoInput[0] + '" playsinline webkit-playsinline> </video>';
	}
	$('#sections')[0].innerHTML = videoFrames;
*/
}

/*
// checks whether the operation is interactable
function isValidTime(){
	for(var i=0; i<segmentDict.length; i++){
		var timeStamp = videoPlayer.currentTime();
		if(segmentDict[i].startTime < timeStamp && segmentDict[i].endTime > timeStamp){
			return true;
		}
	}
	return false;
}
*/

// Process the next animation in the sequence upon completion of the first
function processNextAnimation(){
	// navigator.platform = 'Iphone'
	if(animations.length < 1 || songDict.length < 1){
		if(tune !== undefined){
			tune.destroy();
		}
		return;
	}
	
	// Set The Timing
	var time = songDict[counter];
	counter++;
	if(stamp !== 0){
		stamp = Date.now() - stamp;
	}
	
	var conversion = (time.startTime - videoPlayer.currentTime())*1000 - 200;
	//console.log("wordtime:" + time.startTime + " | audiotime:" + audio.currentTime);
	var timeIndex = (time.length*1000) + (conversion) - (stamp*2);
	if(timeIndex < 0){
		timeIndex = 0;
	}
	
	timer = new Timer(function(){
		stamp = Date.now();
		var child = document.getElementById("bodymovin").firstElementChild;
		if(child !== null){
			child.remove();
		}
		
		processNextAnimation();
	}, timeIndex);
	
	$('#bodymovin svg').eq(0).show();
	tune = animations.shift();
	tune.play();
}


// Video Player controls all video playback information. 
function VideoPlayer() {
	var videoPlaybackState = "Pause";
	var playbackStart = false;
	
	//Establish Video Queue
	var videoQueue = [];
	videoQueue.push(document.getElementById('section0'));
	videoQueue.push(document.getElementById('section1'));  
	var video = videoQueue.shift();
	videoQueue.push(video);
	
	//add event listener for video end
	video.addEventListener('ended', function() {
		interactiveIntervalId.pause();
        clearInterval(interactiveIntervalId);
		interactive.setInteractive(false);
		//audio.pause();
    });
	
	this.setSource = function(dittyType) {
		if(video.src.indexOf(dittyType) === -1){	
			//update new video
			var freeVideoPlayer = videoQueue.shift();
			/// $('.nextDitty').siblings().attr('class');
			videoQueue.push(freeVideoPlayer);
			freeVideoPlayer.src = "Videos/" + dittyType;
			freeVideoPlayer.load();
			
			freeVideoPlayer.addEventListener('loadedmetadata', function () {
					freeVideoPlayer.currentTime = video.currentTime;
    				}, false);
			
			// start new video
			this.switchPlayback(freeVideoPlayer);
		}
	};

	this.hardToggle = function () {
		currentlyPlayingTime = video.currentTime;
		if (currentlyPlaying === 1) {
        	video.src = src2;
        	currentlyPlaying = 2;
    	} else {
        	video.src = src1;
        	currentlyPlaying = 1;
    	}
    	video.load();
    	video.addEventListener('loadedmetadata', function () {
			video.currentTime = currentlPlayingTime;
    	}, false);
	}
	
	this.currentTime = function() {
		return video.currentTime;
	};
	
	this.playbackState = function () {
		return videoPlaybackState;
	};
	
	this.hasStarted = function () {
		if(video.currentTime > 0){
			return true;
		}
		
		return false;
	};
	
	this.togglePlayback = function () {
		if(videoPlaybackState === "Pause"){
			video.pause();
			tune.pause();
			timer.pause();
			videoPlaybackState = "Play";
		}
		else{
			// Start video playback a beat before (the word before)
			timer.resume();
			tune.play();
			video.play();
			videoPlaybackState = "Pause";
		}
	};
	
	this.pause = function () {
		// if paused, can you click over? No or yes...
		interactive.setInteractive(false);
		
		var videos = $('#sections').children();
		for(var i = 0; i < videos.length; i++){
			videos[i].pause();
		}
	};
	
	this.play = function () {
		var videos = $('#sections').children();
		var newTime = videos[0].currentTime;
		for(var i = 0; i < videos.length; i++){
			//videos[i].currentTime = newTime;
			videos[i].play();
		}
	};
	
	this.initPlayback = function () {
		videoPlaybackState = "Pause";
		$('.fa').hide();
		video.play();
	};
	
	this.switchPlayback = function(freeVideoPlayer){	
		// Wait for video to load		
		addEventListenerOnce(freeVideoPlayer, "playing", function(){ //start playback
			console.log("video playing");
			addEventListenerUntilTrue(freeVideoPlayer,"timeupdate", function(){
				var currentPlayingTime = video.currentTime; 
				freeVideoPlayer.currentTime = currentPlayingTime;
				console.log("video was updated:" + video.currentTime );
				console.log("freevideo was updated:" + freeVideoPlayer.currentTime );
				
				var currentVideo = video.id;
				if(video.hidden === true){
					$("#" + currentVideo).fadeIn(10);
					$("#" + currentVideo).siblings().fadeOut(10);
					//video.hidden = false;
					//freeVideoPlayer.hidden = true;
				}
				else{
					//video.hidden = true;
					//freeVideoPlayer.hidden = false;
					$("#" + currentVideo).siblings().fadeIn(10);
					$("#" + currentVideo).fadeOut(10);
				}
				video = freeVideoPlayer;
			});
		});
		
		freeVideoPlayer.play();
		video.play();
	};
}

// Controls the interaction on the page
function Interaction(){
	var isInteractive = false;
	
	
	this.isInteractable = function(){
		return isInteractive;
	};
	
	// allows me to fire event, hide show, based on interactive
	this.setInteractive = function(value){
		isInteractive = value;
		// fire updateEvent
	};
}

// Controls navigation between pages 
function Navigation(){
	var environment = [];
	var pagination = 1;
	
	this.getIndex = function(){
		return pagination;
	};
	
	this.setEnvironment = function(userEnvironments){
		environment = userEnvironments;
	};
	
	this.currentEnvironment = function(index){
		return environment[index];
	};
	
	// increase the page
	this.increment = function(){
		pagination++;
		if(pagination >= environment.length){
			pagination -= environment.length;
		}

		return environment[pagination];
	};
	
	// decrement the page
	this.decrement = function(){
		pagination--;
		if(pagination < 0){
			pagination += environment.length;
		}
		
		return environment[pagination];
	};
}

// Controls callback timer on for time interval
function Timer(callback, interval){
        var timerId, startTime, remaining = 0;
        var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

        this.pause = function () {
            if (state != 1) return;
            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        this.resume = function () {
            if (state != 2) return;
            state = 3;
            window.setTimeout(this.timeoutCallback, remaining);
        };

        this.timeoutCallback = function () {
            if (state != 3) return;
            callback();
            startTime = new Date();
            timerId = window.setInterval(callback, interval);
            state = 1;
        };

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
}

function millisToSeconds(millis) {
  var seconds =  (Math.floor(millis / 60000)*60) + ((millis % 60000) / 1000);
  return seconds;
}

function addEventListenerOnce(target, type, listener) {
    target.addEventListener(type, function fn(event) {
        target.removeEventListener(type, fn);
        listener(event);
    });
}

function addEventListenerUntilTrue(target, type, listener) {
    target.addEventListener(type, function fn(event) {
		console.log("hasnt updated:" + videoPlayer.currentTime());
		if(videoPlayer.currentTime() > 0){
			target.removeEventListener(type, fn);
			listener(event);
		}
    });
}

///// AJAX /////
// Fetches songs from the api
function getSongEndpoint(){		
} 

// Calculate proper end and start times for text animations 
function calculateInteractionLength(){
	// recalculate videos for inappropriate length, or song length
}

function loadAnimationEvents(){
	$.getScript('/Scripts/bodymovin.js', function () {
		for(var i = 0; i < animationSequence.length; i++){
			var preAnimation = bodymovin.loadAnimation(animationSequence[i]);
			var timing = songDict[i].length;
			
			var newSpeed = (60.0 / timing) / 30.0;
			preAnimation.setSpeed(newSpeed);
			animations.push(preAnimation);
		}
		
		// Destroy Animation Sequence Object;
		animationSequence = [];
		
				// Once animations are loaded, turn button.
				setTimeout(function(){
					$('#bodymovin').children().hide();
					loadingDittyType = 1;
					$('.loader').hide();
					$('.fa').show();
					if(navigator.platform !== 'iPhone'){
						// mobile doesn't allow non-click initiated auto-play
						videoPlayer.initPlayback();
					}
				}, 2000);
		});
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
