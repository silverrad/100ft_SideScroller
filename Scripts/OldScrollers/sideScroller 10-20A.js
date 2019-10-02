	var animations = [];
	var songDict = [];
	var loadingDittyType = -1; // Preload -1, Load 0, Ready 1
	var tune;
	var timer;
	var stamp = 0;
	var counter = 0;
	var playBackDelay = 2024; //default

	// Global vars
	var videoPlayer;
	var navigation;
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
	
	$.getJSON("/References/Yama_NorthCack.json", function(json) {
			// Load the first interaction: video files and audio
			loadInteraction(json.videos, json.songSelection);
		});
	
});
	
// Registers the submit button click operation and launches Ditty generation
function registerClickOperations(){
	videoPlayer = new VideoPlayer();
	navigation = new Navigation();
	var environment = navigation.currentEnvironment();
	
	// Play / Pause Button
	document.onkeydown = function(e) {
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
	};

	 $("body").on('swipeleft',function(){
		//
	});	
	
	 $("body").on('swiperight',function(){
		//
	});
	
	$(".fa").on('click', function (){
		videoPlayer.initPlayback();
	});
}

function loadInteraction(videoInput, songInput){
	// Set Audio Input
	var audio = new Audio("Audio/" + songInput);
	audio.play();
	
	// Set Environment
	navigation.setEnvironment(videoInput);
	videoPlayer.initPlayback();	
}



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
	
	var conversion = (time.startTime - videoPlayer.currentTime())*1000 - 200; // From Andrew: -100 to tweak the timing of the animation
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
	videoQueue.push(document.getElementsByClassName('fullDitty')[0]); 
	videoQueue.push(document.getElementsByClassName('nextDitty')[0]); 
	var video = videoQueue.shift();
	videoQueue.push(video);
	
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
		console.log("ANDREW - currentTime: " + video.currentTime);
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
	
	this.stopPlayback = function () {
		// Stop Current Animation
		if(tune !== undefined){
			tune.pause();
		}
		
		video.pause();
		videoPlaybackState = "Play";
		playbackStart = false;
		$(".fullDitty").hide();
		video.currentTime = 0;	
		
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
				
				var currentVideo = video.className;
				if(video.hidden === true){
					$("." + currentVideo).fadeIn(10);
					$("." + currentVideo).siblings().fadeOut(10);
					//video.hidden = false;
					//freeVideoPlayer.hidden = true;
				}
				else{
					//video.hidden = true;
					//freeVideoPlayer.hidden = false;
					$("." + currentVideo).siblings().fadeIn(10);
					$("." + currentVideo).fadeOut(10);
				}
				video = freeVideoPlayer;
			});
		});
		
		freeVideoPlayer.play();
		video.play();
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

// Controls callback timer on bodymovin text animations
function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };
	
	this.clear = function() {
			this.pause();
			clearTimeout(timerId);
	};

    this.resume();
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
