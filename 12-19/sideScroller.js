	var animations = [];
	var segmentDict = [];
	var playerDic = [];
	var obstaclesDic = [];
	var masterTime = 0;
	var loadingDittyType = -1; // Preload -1, Load 0, Ready 1
	var tune;
	var timer;
	var stamp = 0;
	var counter = 0;
	var playBackDelay = 2024; //default

	var interactiveIntervalId;
	var timeoutHeaderExitId;
	var timeoutFooterExitId;
	var playerModalExitId;
	var maxTime = Number.MAX_SAFE_INTEGER;

	// Global vars
	var videoPlayer;
	var navigation;
	var roster;
	var interactive;
	var gameEngine;
	var audio;
	var currentSong = "hotlineblingfull";

// Removes unneccesary jquery-ui interaction divs
jQuery(document).on("mobileinit", function() {
    jQuery.mobile.autoInitializePage = false;
});


$(document).ready(function () {	
	// register all click operations
	registerClickOperations();
	$('#overlay').hide();
	// $('.fa').hide();
	
	$.getJSON("/References/Yama_NorthCack.json", function(json) { //Yama_NorthCack.json //DeLaAnimation.json
			// Load the first interaction: video files and audio
			segmentDict = json.interactiveSegments;
			loadInteraction(json.videos, json.songSelection);
			obstaclesDic = json.obstacles;
			playerDic = json.players;
		});
	
	/*timeoutHeaderExitId = setTimeout(function () { $('#header').slideUp('slow'); }, 3000);
    timeoutFooterExitId = setTimeout(function () { $('#footer').slideUp('slow'); }, 3000); */
});
	
// Registers the submit button click operation and launches Ditty generation
function registerClickOperations(){
	videoPlayer = new VideoPlayer();
	navigation = new Navigation();
	interactive = new Interaction();
	gameEngine = new GameEngine();
	roster = new Roster();
	var environment = navigation.currentEnvironment();
	
	// Play / Pause Button
	document.onkeydown = function(e) {
		if(interactive.isInteractable()){
			//clearTimeout(playerModalExitId);
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
			
			//$("#playerModal").slideDown('slow');
		}
	};
	
	/*$("#sections").on('tap',function(){
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
	*/
	
	$(".fa-chevron-left").on('click',function(){
		environment = navigation.decrement(); //changes play parameters
		videoPlayer.setSource(environment);
		$("#playerModal").slideDown('slow');
	});	

	 $("body").on('swipeleft',function(){
		environment = navigation.decrement(); //changes play parameters
		videoPlayer.setSource(environment);
		$("#playerModal").slideDown('slow');
	});
	
	 $(".fa-chevron-right").on('click',function(){
		environment = navigation.increment(); //changes play parameters
		videoPlayer.setSource(environment);
	    $("#playerModal").slideDown('slow');
	});
	
	 $("body").on('swiperight',function(){
		environment = navigation.increment(); //changes play parameters
		videoPlayer.setSource(environment);
	    $("#playerModal").slideDown('slow');
	});
	
	$(".fa").on('click', function (){
		videoPlayer.initPlayback();
	});
	
	/* This section controls exits and enters of the header. 
If mouseleaves, the div slides off (unless you re-enter in less than 1.5 seconds). */
	/*
$('body').mouseleave(function () {
    timeoutHeaderExitId = setTimeout(function () { $('#header').slideUp('slow'); }, 500);
    timeoutFooterExitId = setTimeout(function () { $('#footer').slideUp('slow'); }, 500);
	console.log("exit");
});

$('body').mouseenter(function () {
	clearTimeout(timeoutHeaderExitId);
    clearTimeout(timeoutFooterExitId);
	if($("#header").is(':visible') === false){
		$("#header").slideDown('slow');
    	$("#footer").slideDown('slow');
		console.log("enter");
	}
}); 
*/
	
  // Video Controls
	$( "#play-pause" ).click(function() {
		if (videoPlayer.playbackState() === "Pause") {
    		interactiveIntervalId.resume();
			videoPlayer.play();
			audio.play();
			this.innerHTML = "Pause";
		}
		else{
			videoPlayer.pause();
			audio.pause();
			interactiveIntervalId.pause();
			this.innerHTML = "Play";
		}
	});
	
	$( "#mute" ).click(function() {
		if (audio.muted) { //videoPlayer.isMuted()
			audio.muted = false;
    		//videoPlayer.setMute(false);
    		this.innerHTML = "Mute";
  		} else {
			audio.muted = true;
    		//videoPlayer.setMute(true);
    		this.innerHTML = "UnMute";
  		}
	});
	
	/*$("#volume-bar").change(function() {
		videoPlayer.setVolume(this.value);
	});*/
	
	$( "#playerModal" ).click(function() {
		 gameEngine.decrement();
 	});

	/*$("#seek-bar").change(function() {
		var seekBar = document.getElementById("seek-bar");
		var time =  audio.duration * (seekBar.value / 100);
			//videoPlayer.getDuration() * (seekBar.value / 100);
		// Update the video time
  		videoPlayer.setCurrentTime(time);
		audio.currentTime = time;
	});*/
}

function loadInteraction(videoInput, songInput){
	//Validate videos and set master time
	validateVideos(videoInput);
	
	//Generate Videos
	//generateVideos(videoInput);
	$('#section0')[0].src = "Videos/" + videoInput[0];
	$('#section1')[0].src = "Videos/" + videoInput[1];
	$('#section0')[0].load();
	$('#section1')[0].load();
	
	// Set Audio Input
	audio = new Audio("Audio/" + songInput);
	audio.play();
	startInteractionTimer();
	//playerModalExitId = setTimeout(function () { $('#playerModal').slideUp('slow'); }, 5000);
	
	// Set Environment
	navigation.setEnvironment(videoInput);
	videoPlayer.initPlayback();
	
	audio.addEventListener("loadedmetadata", function() {
		setObstacles(obstaclesDic);
	});
	
	audio.addEventListener("timeupdate", function() {
  		// Calculate the slider value
  		var value = (100 / audio.duration) * audio.currentTime;
	//	var seekBar = document.getElementById("seek-bar");
  	//	seekBar.value = value;
		increaseTime(value);	
	});
}

function setObstacles(obstacles){
	var fullAudioLength = audio.duration;
	var tickmarkHtml = "";
	for(var i = 0; i < obstacles.length; i++){
		var tempTime = obstacles[i].timestamp;
		tickmarkHtml += '<div class="time-tick" id="' + tempTime + '" style="left:' + Math.floor((tempTime/fullAudioLength)*100) + '%"></div>';
	}
	
	$(tickmarkHtml).insertBefore( ".time-bar" );
}

function startInteractionTimer(){
	interactiveIntervalId = new Timer(function(){
		console.log("timeeventLogged" + videoPlayer.currentTime());
		// Set obstacle interaction check
		checkObstacleInteraction(videoPlayer.currentTime());		
		
		
		// Set segment interaction times
		for(var i=0; i<segmentDict.length; i++){
			var timeStamp = videoPlayer.currentTime();
			if(segmentDict[i].startTime < timeStamp && segmentDict[i].endTime > timeStamp){
				interactive.setInteractive(true);
				return;
			}
		}
		interactive.setInteractive(false);
	} , 1000);	
}

function checkObstacleInteraction(time){
	var remove = false;
		for( var j= 0; j<obstaclesDic.length; j++){
			if(time >= obstaclesDic[j].timestamp){
				remove = true;
				break;
			}
		}
	
	if(remove){
		// fetch timemark based on timing, slowly clear out array
		var interactionTimestamp = obstaclesDic.shift();
		var timeTickLeft = interactionTimestamp.timestamp;
		var selectedElement = $("#" + timeTickLeft);
		
		var vote = Math.random() * 10;
		if(vote > 5){
			// if the obstacle fails - kill life
			selectedElement[0].style.backgroundColor = "red";
			gameEngine.decrement();
		}
		else{
			// if the obstacle succeeds, increase score
			gameEngine.increaseScore(100);
			selectedElement[0].style.backgroundColor = "black";
		}
	}
	
}

function validateVideos(videoInput){
	//set Master Time
	//iterator(0, videoInput);
}

function iterator(i, videoInput){
	// base case
	if(i >= videoInput.length){
		return;
	}
	
	// iterative
	var video = document.getElementById('section0');
	video.src = "Videos/" + videoInput[i];
	video.load();
	video.addEventListener('loadedmetadata', function() {
    	console.log(video.duration + " " + video.src);
		if(video.duration < maxTime){
			maxTime = video.duration;
		}
		i++;
		iterator(i, videoInput);
	});
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

function Roster(){
	var playerIndex = 1;
	var playerIcon = $('#playerIcon')[0];
	var playerName = $('#playerName')[0];
	
	this.switch = function(index){
		var currentPlayer = playerDic[index];
		playerIcon.src = "Images/Players/" +currentPlayer.image;
		playerName.innerHTML = "<h2>" + currentPlayer.name + "</h2>";		
	};
}

// Video Player controls all video playback information. 
function VideoPlayer() {
	var videoPlaybackState = "Pause";
	var playbackStart = false;
	
	//Establish Video Queue
	var videoQueue = [];
	videoQueue.push(document.getElementById('section1')); 
	videoQueue.push(document.getElementById('section0'));
	var video = document.getElementById('section0');
	
	//add event listener for video end
	video.addEventListener('ended', function() {
		interactiveIntervalId.pause();
        clearInterval(interactiveIntervalId);
		interactive.setInteractive(false);
		//audio.pause();
    });
	
	this.setSource = function(dittyType) {	
			//update new video with proper commands
			var nextVideo = $("#" + videoQueue[1].id)[0];
		
			console.log("video playing");
			addEventListenerUntilTrue(nextVideo,"timeupdate", function(){
				roster.switch(navigation.getIndex());
				var currentVideo = videoQueue[0].id; //what weve changed
				if(currentVideo === "section1"){
					$("#" + currentVideo).fadeTo(0, 0);
				}
				else{
					$("#" + currentVideo).siblings(".canvas").fadeTo(0, 1);
					//$("#" + currentVideo).fadeTo(0, 0);
				}
				
				// Now change
				var freeVideoPlayer = videoQueue.shift();
				freeVideoPlayer.src = "Videos/" + dittyType;
				freeVideoPlayer.load();
				freeVideoPlayer.play();
				videoQueue.push(freeVideoPlayer);
			
				freeVideoPlayer.addEventListener('loadedmetadata', function () {
					$("#" + videoQueue[1].id)[0].currentTime = $("#" + videoQueue[0].id)[0].currentTime;
					if(maxTime > freeVideoPlayer.duration){
						maxTime = freeVideoPlayer.duration;
					}
    					}, false);
				
				// hide player Modal
				//playerModalExitId = setTimeout(function () { $('#playerModal').slideUp('slow'); }, 5000);
			});
	};
	
	this.setCurrentTime = function (value) {
		video.currentTime = value;
	}

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
	
	this.isMuted = function () {
		return video.muted;
	}
	
	this.setMute = function (value) {
		return video.muted = value;
	}
	
	this.setVolume = function (value){
		video.volume = value;
		audio.volume = value;
	}
	
	this.getDuration = function (){
		return maxTime;
	}
	
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
		videoPlaybackState = "Pause";
		var videos = $('#sections').find('.canvas'); //$(parentSelector).find(childSelector)
		for(var i = 0; i < videos.length; i++){
			videos[i].pause();
		}
	};
	
	this.play = function () {
		videoPlaybackState = "Play";
		var videos = $('#sections').find('.canvas');
		var newTime = videos[0].currentTime;
		for(var i = 0; i < videos.length; i++){
			//videos[i].currentTime = newTime;
			videos[i].play();
		}
	};
	
	this.initPlayback = function () {
		videoPlaybackState = "Play";
		//$('.fa').hide();
		$("#" + videoQueue[1].id)[0].play();
		$("#" + videoQueue[0].id)[0].play();
		$("#" + videoQueue[1].id)[0].currentTime = $("#" + videoQueue[0].id)[0].currentTime;	
		//$("#" + videoQueue[0].id)[0].hidden = true;
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
		if(isInteractive != value){
			$('#overlay').toggle();
		}
		
		isInteractive = value;
		// fire updateEvent
	};
}

function increaseTime(time){
	var scrollBar = $('#scrollBar');
	var timeBar = $('.time-bar');
	var total = scrollBar.data('total');
    var value = scrollBar.data('value');
	var newValue = time;
	var barWidth = (newValue / total) * 100;
	scrollBar.data('value', newValue);
	setTimeout(function(){
      		timeBar.css('width', barWidth + "%");
    	}, 500);
}

// Controls player health, game controls 
function GameEngine(){
	  hBar = $('.health-bar'),
      gameScore = $('#score'),
	  bar = hBar.find('.bar'),
      hit = hBar.find('.hit');
	
	this.decrement = function(){
		var total = hBar.data('total'),
        value = hBar.data('value');
    	if (value < 0) {
			// launch GameOver
      		return;
    	}
	  
    	// max damage is essentially quarter of max life
    	var damage = Math.floor(Math.random()*total);
    	// damage = 100;
    	var newValue = value - damage;
    	// calculate the percentage of the total width
    	var barWidth = (newValue / total) * 100;
		
		// Calculated to eliminate overlap with image :)
		var tempHitWidth = ((damage / value) * 100) + 8;
		if(tempHitWidth > 100){tempHitWidth = 100;}
		
    	var hitWidth = tempHitWidth + "%"; //adding 8 for the curve
		console.log("newVAL: " + newValue + " barWidth:" + barWidth + " hitWidth:" + hitWidth);
		
		// bar width / 100 is life force set color accordingly
		if(barWidth < 20){
			bar.css({'background' : "#D0021B"});
		}
		else if( barWidth < 60){
			bar.css({'background' : "#F8E71C"});
		}
		else{
			// Nothing
		}
    
    	// show hit bar and set the width
    	hit.css('width', hitWidth);
    	hBar.data('value', newValue);
    
		//animate
    	setTimeout(function(){
			hit.css({'width': '0'});
      		bar.css('width', barWidth + "%");
    	}, 500); 
    
		//death check
    	if( value < 0){
			log("DEAD");
		}
	};

	this.resetGame = function(){
	 	hBar.data('value', hBar.data('total'));
		hit.css({'width': '0'});
		bar.css('width', '100%');
		bar.css({'background' : "#417505"});
	};
	
	this.increaseScore = function(value){
		var currentScore = gameScore[0].innerHTML;
		currentScore = currentScore.replace( /[^\d.]/g, '' );
		var newScore = parseInt(currentScore) + value;
		gameScore[0].innerHTML = newScore + "pts";
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
					//$('.fa').show();
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
