!console && (console = {log:function(){}});
var c = {
    log: function(exp){
        if(window.console && console.log){
            console.log(exp);
        }
    }
}
$.mobile.loadingMessage = ""; //clearing the loading message for mobile devices as we do not really load pages or other content.

// fix explorer 9 bug - clashes with divx. recheck this with later versions of divx\jquery
jQuery.fn.append = function(){return this.domManip(arguments, true, function( elem ) {if ( this.nodeType === 1 ) {var ob = this; if (jQuery.nodeName(this, "body")) ob = $(this).find(">div").get(0);ob.appendChild( elem );}});}

// assigning some global variables
var d; //json object holding the data collection
var p; //global variables from the properties file

var left = new Array(); //array of stimulus that belongs to the category/ies on the left
var right = new Array();//array of stimulus that belongs to the category/ies on the right


var all_stimuli = new Array(); 			//an array of all the stimuli in the study
var globalAllCategories = new Array();  // an array of all the categories in this study
var currentCats = new Array(); //current categories set
var sequence = new Array(); //sequence of stimulus to show for current block

var block;
var catsArray;
var pairFlags;
var pairFlag;
var pairSwitch = 0;
var limitSequence = false;

//Display areas objects
var left_da; //left display area
var right_da; //right display area
var mid_da; // middle display area
var stimul_da; //stimulus display area
var feedback_da; //wrong answer display
var instructions_da; //display area for the global instructions (in the bottom outside the canvas white border)
var leftTouchArea;
var swipeTouchArea;
var rightTouchArea;

var imagesReady; //Images preload state flag
var results; //results collection;

//key hold flags
var trueKeyHeld = false;  //Boolean value, will be TRUE while holding the right answer key
var falseKeyHeld = false; //Boolean value, will be TRUE while holding the wrong answer key

// Configuration
var imgUrl;
var leftKey;
var rightKey;
var erR;
var errCorr;
var sep
var stimDelay;
var font;
var fontSize;
var fontColor;
var endCont;
var tEndWait;
var endWait;
var instruct;
var debug;
var forceKeyboard; // should we force using keyboard even in touch able platforms?
var leftTouchAreaConf;
var swipeTouchAreaConf;
var rightTouchAreaConf;
var canvas;
var blink = false;//introducing touch areas, flag to blink or not to blink
var skip;

//reports variables
var fastResp;
var slowResp;
var nFasts = 0;
var nErrs = 0;
var nSlows = 0;

//counters
var bl_clock = 0; 			//Block counter, always holds the index of the running block
var trial_count; 			//Trial counter, holds the index of the running trial

//timers
var stimTimer; 				//holds the value of the delay, before the stimulus is shown.
var responseTimeoutID 		// holds the Id of the timer for nogo or timeout actions.

var init = {
	practice						: false, 								// should we allow practice trials
	type							: 'iat',								// overall type of this experiment
	get_cat_alternately				: true,									// should we systematicaly alternate between category pairs or pick randomly, cannot be used together with "empty categories" (-1 as used in the stiat)
	get_cat_from_stack				: false,								// should we get categories out of the category stack (stiat)
	response_timeout				: false,								// should we bind the respose timeout? (used both for nogo conditions and plain timeout)
	timeoutLength					: 5000,									// timeout length in ms. by default 5 sec
	display							: {
										one_cat 		: false,			// should we display only the right category?
										in_out_labels 	: false				// should we add in\out labels in the right and left of the display?
	},
	feedback						: {
										show_correct	: false,			// should we show a label for correct answers?
										timout_delay	: -1,				// how long should we display the timeout label (negative means not at all)
										remove_error	: false				// when we allow subjects to correct their errors, should the error label disapear after FBdelay?
	},
	touch_interface					: 'slider',								// controls touch interface, can be slider/swipe/button
	// ***** IAT setters - functions to create default init settings *****
	setup							: function(){
										switch (init.type){
											case 'stiat' 	:
											case 'ST-IAT'	:
												init.setSTIAT(); break;
											case 'biat'		:
											case 'BIAT'		:
												init.setBIAT(); break;
											case 'gnat'		:
											case 'GNAT'		:
												init.setGNAT(); break;
											default	: init.type = "iat"; break;
										}
	},
	setBIAT							: function(){ // set init for BIAT
										init.type = 'biat';
										init.practice = true;
										init.display.one_cat = true;
										init.display.in_out_labels = true;
	},

	setSTIAT						: function(){ // set init for STIAT
										init.type = 'stiat';
										init.get_cat_alternately = false;
										init.get_cat_from_stack = true;
										init.timeoutLength = -1;
										init.response_timeout = true;
										init.feedback.show_timeout = true;
	},

	setGNAT							: function(){ // set init for GNAT
										init.get_cat_alternately = false;
										init.get_cat_from_stack =  true;
										init.type = 'gnat';
										init.response_timeout = true;
										init.display.one_cat = true;
										init.feedback.show_correct = true;
										init.feedback.default_delay = 2000;
										init.feedback.timout_delay = 200;
										init.timeoutLength = 2000;
										// set default keys
										if (!leftKey) leftKey={Text:0};
										if (!rightKey) rightKey={Text:32};
										// cancel error correction
										errCorr = false;
										instructions_da = $('#instructions-gnat');
	},
	setTEST							: function(){
										init.response_timeout = true;
										init.timeoutLength = 1;

										init.feedback.timout_delay = 2;

	}

}


////////////////////////////////////Helpers Section///////////////////////////////////
function htmlCreator(el_type, data){
    var _obj = $(el_type, data);
    return _obj;
}

function adjustCanvas(){
    if(is_touch_device()){

		var proportions = 0.8; // proportions (as height/width)
		var $canvas = $('#app_canvas');
		var height, width;
		var maxHeight = $(window).innerHeight();
		var maxWidth = $(window).innerWidth();

		// calculate the correct sizes for this screen size
		if (maxHeight > proportions * maxWidth) {
			height = maxWidth*proportions;
			width = maxWidth;
		} else {
			height = maxHeight;
			width = maxHeight/proportions;
		}

		// remove border width and top margin from calculated width (can't depend on cool box styles yet...)
		// we compute only margin-top because of a difference calculating margins between chrome + IE and firefox + mobile
		height -= parseInt($canvas.css('border-top-width'),10) + parseInt($canvas.css('border-bottom-width'),10) + parseInt($canvas.css('margin-top'),10);
		width -= parseInt($canvas.css('border-left-width'),10) + parseInt($canvas.css('border-right-width'),10);

		// reset canvas size
		$canvas.width(width);
		$canvas.height(height);

		// refreash all stimuli (we don't want to do this before we have trials)
	    $('#stimul_wrapper').css({
			'left': (width - $('#stimul_wrapper').width())/2,
			'top': (height - $('#stimul_wrapper').height())/2
	    });

		// scroll to top of window (hides some of the mess on the top of mobile devices)
		window.scrollTo(0, 1);

    	/*
    	// check if we're using an ipad here
    	var isIpad = navigator.userAgent.match(/(iPhone|iPod|iPad)/);
    	var orientation = (Math.abs(window.orientation) == 90) ? 'landscape' : 'portrait';

    	// in ipad we need to switch between the width and height if we're in landscape
    	if (isIpad && orientation == 'landscape'){
        	var width = screen.height * 0.9;
        	var height = screen.width * 0.8;
    	} else {
        	var width = screen.width * 0.9;
        	var height = screen.height *0.8;
    	}

		$("#app_canvas").css({
			'width': width,
			'height': height
		});

		// now lets scroll to the top so that we are centered
		window.scrollTo(0,0);

		// in case this adjust is when the stimulus is already presented, we recenter the stimulus.
		// recenter the stimulus
	    $('#stimul_wrapper').css({
			'left': (width - $('#stimul_wrapper').width())/2,
			'top': (height - $('#stimul_wrapper').height())/2
	    });
	    */

    } else {
		var w_measurement = canvas.width.substr(canvas.width.length - 1) == '%' ? '%' : 'px';
		var h_measurement = canvas.height.substr(canvas.height.length - 1) == '%' ? '%' : 'px';

		$("#app_canvas").css({
			'width': w_measurement == '%' ? canvas.width : (canvas.width) + w_measurement,
			'height': h_measurement == '%' ? $(window).height() / 100 * parseInt(canvas.height) : (canvas.height) + h_measurement
		});
    }
}

//Asynchronious request to load the IAT xml file.
function loadIAT(){
    $.ajax({
        type: "GET", //request type
        url: conf.i,  //xml file url
        dataType: "xml", //type of the requested data
        //function that runs when the request is complete
        complete:  function(data) {
            d = $.xmlToJSON(data.responseXML); //converting xml to JSON object to allow faster access to the data
            if(d.error){
                errhandler(d.error, 'force');
            };
            //setting the page direction (added new attribute to IAT tag for right-to-left languages support)
            $('body').css('direction', d.direction);
            fastResp = d.fastResp; //assigning fast response value
            slowResp = d.slowResp; //assigning slow response value
            results = d.Results[0].Result; //results array
            //Asynchronious request to get the properties from configuration file
            $.ajax({
                type: "GET",
                url: conf.p,
                dataType: "xml",
                complete:  function(data) {
                    p = $.xmlToJSON(data.responseXML);
                    if(p.error){ //shows the xml not well-formed errors
                        errhandler(p.error, 'force');
                    };
                    Init();
                },
                error: function(res, status, err){
                    errhandler(res.responseText + ':::' + err, 'force');
                }
            });
        },
        error: function(req, status, err){
            errhandler(req.responseText, 'force');
        }
    });
}

//Displays debugging errors. The first argument is the message string, second is the mode.
//Mode "append" - will append the message to previous message and they all will stay visible.
//Mode "show" - clears previous messages and shows the actual message
//Mode "force" - shows the message even if the debugging is off.
function errhandler(msg, mode){
    switch(mode){
        case 'append':
            if(debug == '@flashDebug@' || debug == 1){
                c.log(msg);
            }
            break;
        case 'show':
            if(debug == '@flashDebug@' || debug == 1){
                c.log(msg);
            }
            break;
        case 'force':
            c.log(msg);
    }
}

// The function runs through the categories and returns serialized string of the requested categories names
// uses categories in catsArray, formated as a comma delimited integer list.
// mode can be: "left", "right" and "data"
var catsNames = function(mode){
    var orientation = 'left';
    var data = [];
    var _left = [];
    var _right = [];
  $.each(catsArray, function(){
        var num = parseInt(this);
		//Add the category name.
		if (num >= 0){ //But only if the category is not fake.
			if(orientation == 'left') _right.push(d.Categories[0].Category[num].Stimuli[0].CategoryName[0].Text);
			else _left.push(d.Categories[0].Category[num].Stimuli[0].CategoryName[0].Text);
		}
		//The Category array is ordered left,right,left,right.
        if(orientation == 'left'){
            orientation = 'right';
        } else {
            orientation = 'left';
        }
    });
    var serRight = _right.join('/');
    var serLeft = _left.join('/');
    switch(mode)
    {
        case 'right': //mode "right" - returns categories on the right
            return serRight;
          case 'left': //mode "left" - returns categories on the left
            return serLeft;
          case 'data' : //return all the categories serialized and ready to be posted
            data.push(serLeft, serRight);
            var serialized = data.join(',');
            return serialized;
    }
};

//image preloader, accepts image url as argument and loading it into the browsers cache.
function loadImage(src){
    $('#app_canvas').append(htmlCreator('<div>', { //if the images are still not loaded show the "please wait" message
        text: endWait,
        'class': 'preloading'
    }));

    var pbar_brick = htmlCreator('<span>', { //html element indicating the loading state
        css:{
            'width': 5,
            'height': 10,
            'margin': '0px 5px',
            'background': '#cccccc',
            'display': 'block',
            'float': 'left'
        },
        'class': 'preload'
    });
    $('#message').append(pbar_brick);

    var img = new Image();  // create img object
    $(img).on('load',function(){
        $(pbar_brick).css('background', '#00ff00').addClass('loaded'); //indicator turn green
        if($('.loaded').length == $('.preload').length){ //checks if there are more images to preload
            imagesReady = true; //All images preloaded flag!
            ImagesReady(); //When all images are successfully loaded calling a function
        }
    });
    $(img).on('error',function(){
        throw new Error('Image not found: "' + src + '"');
    });
    img.src = src;
}

// gets a category and pushes all its stimuli into "all_stimuli"
function getStimuli(data){
    if(data.Stimuli[0].Stimulus){
        for(j=0;j<data.Stimuli[0].Stimulus.length;j++){
            var _stimulusData = data.Stimuli[0].Stimulus[j];
            var _stimulusCat = {
                'num': data.CategoryNumber[0].Text,
                'name': data.Stimuli[0].CategoryName[0].Text,
				'fontSize' : data.fontSize
            };
            var _stimulus = new Stimulus(_stimulusData, _stimulusCat);
            all_stimuli.push(_stimulus);
        }
    } else {
        errhandler('We need at least one stimuli in each category', 'show');
    }
}

//Function to process the user answer, recieves three arguments: event (event object), stimulus (current stimulus object), answer (the key-code of the answer);
// TODO: should get only event object and stimulus object including answer. maybe even push event into stim?
var processAnswer = {

	// calculate response statistics
    processResponse : function(event, stimulus, answer){
        //Calculate latency
        stimulus.latency = (event.timeStamp - stimulus.tstamp);
    },

    // Add data to the data that will be sent later.
    addValues : function(event, stimulus, answer){
        poster.addResultValue({
            'taskName': d.IATName[0].Text
        });
        poster.addResultValue({
            'trialLatency': stimulus.latency
        });
        poster.addResultValue({
            'trialNum': stimulus.trialNum
        });
        poster.addResultValue({
            'trialName': stimulus.trialName
        });
        if (answer == leftKey.Text){
            poster.addResultValue({
                'trialResp': catsNames('left')
            });
        } else {
            poster.addResultValue({
                'trialResp': catsNames('right')
            });
        }
        poster.addResultValue({
            'trialErr': stimulus.wronganswer
        });
        //adding row to the scorinf data report
        poster.scoringData.push({
            'block': parseInt(block.BlockNumber[0].Text),
            'err': stimulus.wronganswer,
            'lat': stimulus.latency
        });

        // reset stimulus.wronganswer
        stimulus.wronganswer = 0;
    },

    // This is the function that processes a key press
    processPress : function(event, stimulus, answer, obj){
    	// if we are in a touch machine get response value
    	if (is_touch_device()){
    		if ($(obj).attr('id')=="rightTouchArea") event.keyCode = rightKey.Text;
    		if ($(obj).attr('id')=="leftTouchArea") event.keyCode = leftKey.Text;
    		// bug fix for iOS5 “JavaScript execution exceeded timeout” error
    		IATUtil.feedbackTimer = IATUtil.feedbackTimer ? IATUtil.feedbackTimer : 1;
    	}

		//Correct response
        if (event.keyCode == answer) {

			// clear timeout - we got a response that overides the response timer
			clearTimeout(responseTimeoutID);

            // set sticky keys
			trueKeyHeld = true;
			if (event.keyCode == 0 ) trueKeyHeld = false;

			// set error code for "Did not respond in a no-go trial".
			if (event.keyCode == 0) stimulus.wronganswer = 3;

			// unbind interaction events
			if (is_touch_device())$('#rightTouchArea, #leftTouchArea').unbind('touchstart');
			else $(document).unbind(event.type);

            //Do what ever needs done when we have a response
            processAnswer.processResponse(event, stimulus, answer);

            //If we showed the error feedback, remove it.
            if(feedback_da)$(feedback_da).remove();
            feedback_da = null;

            processAnswer.addValues(event, stimulus, answer);//Add the trial's data.

			IATUtil.displayFeedback('correct');
			setTimeout(function(){IATUtil.clearTrial(); IATUtil.nextTrial();},IATUtil.feedbackTimer);

		// Wrong response or timeout
        } else {

			if (event.keyCode == leftKey.Text || event.keyCode == rightKey.Text || event.keyCode == 0){//It is a legitimate key of the task?
				// if this is a timout event
				if (event.keyCode == 0) {
					stimulus.wronganswer = 2;
					falseKeyHeld  = false;
					if (leftKey.Text == 0 || rightKey.Text == 0) var feedbackType = 'wrong';
					else var feedbackType = 'timeout';
				} else { // this is a regular error
					// set sticky keys
					falseKeyHeld = true;
					stimulus.wronganswer = 1;
					var feedbackType = 'wrong';
				}

                //nErrs++;
                processAnswer.processResponse(event, stimulus, answer); //Do what ever needs to be done when we have a response
                IATUtil.displayFeedback(feedbackType);
                if(errCorr == 0 || feedbackType == "timeout"){ //No error correction, so continue
					// clear timeout - we got a responce that overides the rsponse timertimer
					clearTimeout(responseTimeoutID);

					// unbind interaction events
					if (is_touch_device())$('#rightTouchArea, #leftTouchArea').unbind('touchstart');
					else $(document).unbind(event.type);

					processAnswer.addValues(event, stimulus, answer);//Add the trial's data.
					//Continue to the next trial after giving time to see feedback
					setTimeout(function(){IATUtil.clearTrial();IATUtil.nextTrial();},IATUtil.feedbackTimer);
                }
            }
		}

		// skip block on "Enter" key
        if(skip && event.keyCode == 13) {
			// clear timeout - we got a responce that overides the rsponse timertimer
			clearTimeout(responseTimeoutID);

            IATUtil.clearTrial();
            $('#stimul_wrapper').hide();
            poster.sendBlockData();

            // unbind interaction events
			if (is_touch_device())$('#rightTouchArea, #leftTouchArea').unbind('touchstart');
			else $(document).unbind(event.type);

            if(feedback_da) $(feedback_da).remove();
            IATUtil.nextBlock();
        }
    }
}

//Touch devices detection !!!!!!NEED TO CHECK AND UPDATE FROM TIME TO TIME!!!!!!!
// the issue is that touch-events are now only available for touch devices, but the technologies are developing fast,
// and it is possible, that tomorrow new touch screens for desktop computers will have the functionality and browsers will start supporting touch events.
function is_touch_device() {
	if (forceKeyboard) return false;
	return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) ? 1 : 0;
}

////////////////////////////////End of helpers section////////////////////////////////


////////////////////////////////Objects section///////////////////////////////////////
//Category Object
//Instance of that object is created for each Category node in the xml file.
function Category(cat){
    this.name = cat.Stimuli[0].CategoryName[0].Text; //Storing the Category name in an object property
    this.number = cat.CategoryNumber[0].Text; //Storing the Category number in an object property
    this.stimulus = []; //Array of Stimulus objects for current category
    this.impressions = 0; //Counting the impressions of the category in each block.
    this.settings = cat; // keep settings

    for(j=0;j<cat.Stimuli[0].Stimulus.length;j++){  //looping through stimulus collection
        var _stimulusData = cat.Stimuli[0].Stimulus[j]; //getting the date for a stimulus
        var _stimulusCat = {  //temporary variable holding the category name and number to pass to the stimulus object
            'num': this.number,
            'name': this.name,
			'fontSize' : cat.fontSize
        }
        var _stimuli = new Stimulus(_stimulusData, _stimulusCat); //Temporary variable holding the newly initiated Stimulus object
        this.stimulus.push(_stimuli); //Storing the Stimulus object in the stimulus array
    }

    //creating the html element for the label
    if(cat.image){
        this.label = htmlCreator('<img>', {
            'id': 'cat' +this.number,
            'class': 'clearfix cat',
            'alt': this.name,
            'src': imgUrl + cat.image
        });
    } else {
        this.label = htmlCreator('<div>', {
            'id': 'cat' +this.number,
            'class': 'clearfix cat',
            'text': this.name,
            'css': { //Styling the category label (css properties)
                'color': '#'+cat.color,
                'fontSize': !cat.fontSize || cat.fontSize.substr(cat.fontSize.length-2,2)=='px' ? cat.fontSize : cat.fontSize + 'px', // if fontsize is set, but does not have px added, add it.
                'fontFamily': cat.Font
            }
        });
    }

	// create html for startwords\startimage
	if(cat.Stimuli && cat.Stimuli[0].StartImage){
        this.startLabel = htmlCreator('<img>', {
            'class': 'clearfix cat',
            'alt': this.name,
            'src': imgUrl + cat.Stimuli[0].StartImage[0].Text,
			'max-height':'75px',
			'max-width':'230px'

        });
    } else if (cat.Stimuli && cat.Stimuli[0].StartWords){
        this.startLabel = htmlCreator('<div/>', {
            'class': 'clearfix cat',
            'text': cat.Stimuli[0].StartWords[0].Text,
            'css': { //Styling the category label (css properties)
                color: '#'+cat.color,
                fontSize: !cat.fontSize || cat.fontSize.substr(cat.fontSize.length-2,2)=='px' ? cat.fontSize : cat.fontSize + 'px', // if fontsize is set, but does not have px added, add it.
                fontFamily: cat.Font
            }
        });
    }
}

//stimulus object. we can add properties to extend functionality
//receives two arguments: data - data from the xml ,cat - parent category name and number
function Stimulus(data, cat){
	// ***** Stimulus Constructor *****
    this.type = data.type; //Stimulus type (word or image)
    this.cat = cat.num; //Parent category number, represents the relationship
    this.catname = cat.name; //Parent categoy name
    this.status = 'ready'; //Status of the Stimulus, can be "ready" or "exhosted"
    this.trialName = data.Text; //will be sent to the server at the end of the block
    this.tstamp = null; //The timestamp of the last impression
    this.response = null; //User Response timestamp
    this.wronganswer = 0; //Will change to '1' if answered wrong
    this.txt = data.Text; //Text of "word" type stimulus
	this.startLabel = cat.startLabel;
	this.fontSize = data.fontSize || cat.fontSize ||   fontSize  ; // if global font size isn't set, use the category fontsize instead.
	this.fontSize = !this.fontSize || this.fontSize.substr(this.fontSize.length-2,2)=='px' ? this.fontSize : this.fontSize + 'px'; // if fontsize is set, but does not have px added, add it.

    //Conditional behavior of creating the html
    switch (this.type) {
        case 'image':
            //in case of "image"
            this.imgSrc = imgUrl+data.Text,
            this.html = htmlCreator('<img>', {
                src: this.imgSrc,
                alt: this.catname,
                css: {
                    'width': data.width,
                    'height': data.height,
                    'marginLeft': data.x,
                    'marginTop': data.y,
                    'opacity': data.Transparency,
                    'max-height': '30%'
                }
            });
            break;
        case 'word':
            this.html = htmlCreator('<div>', {
                text: this.txt,
                css: {
                    'color': '#'+d.Categories[0].Category[this.cat].color,
                    'width': data.width,
                    'height': data.height,
                    'marginLeft': data.x,
                    'marginTop': data.y,
                    'opacity': data.Transparency,
                     'font-family': d.Categories[0].Category[this.cat].Font,
		          			'font-size': this.fontSize

                }
            });
            break;
    //audio is not supported in this version
    //        case 'audio':
    //            break;
	} // end switch(this.type)

	//Positioning the stimuli in the center of the screen
    this.position = function(){
		var centerStimulus = function(){
		    _tempH = $('#stimul_wrapper').height() / 2;
		    _tempW = $('#stimul_wrapper').width() / 2;
		    var _css;
		    if(is_touch_device()){
			_css = {
			    'top':  ($("#app_canvas").height()/2 - _tempH) + 'px',
			    'left': ($("#app_canvas").width()/2 - _tempW) + 'px'
			}
		    } else {
			_css = {
			    'top': ($("#app_canvas").height()/2 - _tempH) + 'px',
			    'left': ($("#app_canvas").width()/2 - _tempW) + 'px'
			}
		    }
		    $('#stimul_wrapper').css(_css);
		}


        if (!$('#stimul_wrapper').width() || !$('#stimul_wrapper').height()) {
            // Workaround for bug caused by AdBlock plugin for Chrome and Safari:
            // http://code.google.com/p/adblockforchrome/issues/detail?id=3701
            setInterval(function() {
                centerStimulus();
            }, 2);
        } else {
            centerStimulus();
        }
    }


	// ***** set stimulus with specific trial data *****
	// categoryList		: comma delimited string with category numbers
	this.stim_to_trial = function (categoryList){

		// create categoryArr out of comma delimited string
		this.categoryArr = categoryList.split(",");

		// set alignment (even categories are right, odd categories are left)
		if ($.inArray(this.cat,this.categoryArr) % 2 == 1) {this.alignment = 'left';}
		else {this.alignment = 'right';}

		// set correct key for this trial
		this.correctKey = this.alignment == 'left' ? leftKey.Text : rightKey.Text;

		// ***** display trial background (categories and stuff) *****
		// displayType == 'start' means this is the introduction display and we should show introduction special elements
		this.display = function(displayType){
				// helper to show the category labels (adds a single category lable to the display)
				// string side 	: 'left' or 'right'
				// da			: jQuery element
				// cat			: category object
				var addLabel = function(side, da, cat){
					// if we are in display one category mode
					if (init.display.one_cat == true){
						// if this is GAT and side is left, we don't need to do anything here
						if (side == 'left') {return false}
						da = mid_da; // set da to middle
					}

					// ***** set in\out key labels *****
					if (init.display.in_out_labels == true) {
						// *** set instructions in left da ***
						if (d.KeyLabels && d.KeyLabels[0].LeftKey && d.KeyLabels[0].LeftKey[0].type=='image' && d.KeyLabels[0].LeftKey[0].Text){
							$(left_da).html(htmlCreator('<img>', {
								'src' 	: imgUrl + d.KeyLabels[0].LeftKey[0].Text,
								'css'	: {'max-height':'75px','max-width':'120px'}
							}));
						}
						else if (d.KeyLabels && d.KeyLabels[0].LeftKey && d.KeyLabels[0].LeftKey[0].Text) {
							$(left_da).html(d.KeyLabels[0].LeftKey[0].Text);
						}
						else $(left_da).html(is_touch_device() ? 'OUT' : 'OUT:E');

						// *** set instructions in right da ***
						if (d.KeyLabels && d.KeyLabels[0].RightKey && d.KeyLabels[0].RightKey[0].type=='image' && d.KeyLabels[0].RightKey[0].Text){
							$(right_da).html(htmlCreator('<img>', {
								'src' 	: imgUrl + d.KeyLabels[0].RightKey[0].Text,
								'css'	: {'max-height':'75px','max-width':'120px'}
							}));
						}
						else if (d.KeyLabels && d.KeyLabels[0].RightKey && d.KeyLabels[0].RightKey[0].Text) {
							$(right_da).html(d.KeyLabels[0].RightKey[0].Text);
						}
						else $(right_da).html(is_touch_device() ? 'IN' : 'IN:I');

						// set label css
						var csslabel = {};
						if (d.KeyLabels && d.KeyLabels[0].font) csslabel.fontFamily = d.KeyLabels[0].font;
						if (d.KeyLabels && d.KeyLabels[0].fontsize) csslabel.fontSize = d.KeyLabels[0].fontsize + "px";
						if (d.KeyLabels && d.KeyLabels[0].fontcolor) csslabel.color = "#" + d.KeyLabels[0].fontcolor;
						$(right_da).css(csslabel);
						$(left_da).css(csslabel);
					}

					//check if seperator is needed and if so create it
					if($(da).html()) {
						var $sep =  htmlCreator('<div>', {
							'class': 'seperator clearfix',
							'text': seperator
						});
						var sepSettings = p.arg.getNodeByAttribute('name', 'SEP');
						if (sepSettings){
							$sep.css({
								fontFamily : sepSettings.fontFamily,
								fontSize: sepSettings.fontSize,
								color: sepSettings.fontColor
							});
						}

						sepFontSize = p.arg.getNodeByAttribute('name', 'SEP') ? p.arg.getNodeByAttribute('name', 'SEP').fontSize : false;
						$(da).append($sep);
					}

					// set category labels in view
					$(da).append($(cat.label).clone()); // IE fix. g-d knows why this works...
					// if this is the start condition display start labels
					if (displayType == 'start' && cat.startLabel) $(da).append(cat.startLabel);
				}


				//clear the display areas
				$(right_da).html('');
				$(left_da).html('');
				$(mid_da).html('');
				// for each category in this trial
				for(i=0;i<this.categoryArr.length;i++){
					var categoryNum = this.categoryArr[i]; //storing the category number as temporary variable to use in the current loop
					// in case that the category number is -1 it is a fake category and we do not need to display it.
					if (categoryNum == -1) {continue;}
					if(i % 2) { //simple check to decide to wich side a category belongs
						addLabel('left', $(left_da), globalAllCategories[categoryNum]); //showing the labels
					} else {
						addLabel('right', $(right_da), globalAllCategories[categoryNum]);
					}

					/*  I think this is depricated as the category label holds an image option

						if(cats[i].image){ //if the label is image!
						var image = htmlCreator('<img>', {
							src: d.Categories[0].Category[_tmp].image,
							maxWidth: 120,
							css: {
								'float': 'left',
								'maxWidth': '35%'
							}
						});
						$('#cat'+_tmp).append(image);
					} */
				}

				// if this is the first category and we are in gnat add instructions to top
				if (init.type == 'gnat') {
					var gnat_instructions = htmlCreator('<div>', {
						'html': is_touch_device() ? 'TAP if the item belongs to' : 'HIT <b> space bar </b> if the items belong to',
						'css': {
							'font-size' : '12px'
						}
					});

					$(mid_da).prepend($(gnat_instructions).clone()); // IE fix. g-d knows why this works...
				}

		}
	} // end stimulus to trial


    this.loadStimulus = function(){
        if(feedback_da){
            $(feedback_da).remove();
        }
        feedback_da = null;
        $('#stimul').html($(stimulus.html).clone()); //clonning the stimulus object for IE compatibility
        this.position();
    }

	// ***** run trial *****
	this.run = function(){
		// show categories for trial
		this.display();
		var stimObjReference = this; // cache this object reference so that we can refer to it inside the setTimeout function
		// set delaly before stimulus is shown
		stimTimer = setTimeout(function(){
			stimObjReference.loadStimulus(); //Show
			stimObjReference.tstamp = new Date().getTime(); //saving timestamp of stimulus presentation
			// bind controls
			var eventType = is_touch_device() ? 'touchstart' : 'keydown';
			IATUtil.bindControls(stimObjReference.correctKey, stimObjReference, eventType);

		}, stimDelay);
	} // end this.run
}


//////////////////////////////End of Objects section//////////////////////////////


$(document).ready(function(){

	if (is_touch_device()){
		//document ready state begin. This function will run after the document is fully loaded.
		//Detect whether device supports orientationchange event, otherwise fall back to the resize event.
		var supportsOrientationChange = "onorientationchange" in window;
	    var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

		$(window).on("orientationchange",function(){
			// it takes time out to make the change, so lets wait for it to be complete
			setTimeout(function(){
				// adjust the canvas
				adjustCanvas();
			}, 500);
		});
	}

    //Display areas selectors, similar to movie clips(_mc)
    left_da = $('#left_screen');
    right_da = $('#right_screen');
	mid_da = $('#mid_screen');
    stimul_da = $('#stimul');
    instructions_da = $('#instructions'); // note that if this is gnat, the init functions will later change this setting to #instructions-gnat
	loadIAT();
});
//document ready state end

/////////////////////////////////////////////////////////////////////////////////////////////

// IAT init function;
// is called after XML are downloaded
function Init(){
    //assigning configuration arguments to variables
    imgUrl = p.arg.getNodeByAttribute('name', 'IMAGE_URL').Text;
    nextUrl = p.arg.getNodeByAttribute('name', 'NEXT_URL').Text + ';jsessionid=' + conf.jid;
    postUrl = p.arg.getNodeByAttribute('name', 'POST_URL').Text;
    seperator = p.arg.getNodeByAttribute('name', 'SEP').Text;
    catPadding = p.arg.getNodeByAttribute('name', 'CAT_PADDING').Text;
    instMargin = p.arg.getNodeByAttribute('name', 'INST_MARGIN').Text;
    instPadding = p.arg.getNodeByAttribute('name', 'INST_PADDING').Text;
    errPadding = p.arg.getNodeByAttribute('name', 'ERROR_PADDING').Text;
    leftKey = p.arg.getNodeByAttribute('name', 'LEFT_KEY');
    rightKey = p.arg.getNodeByAttribute('name', 'RIGHT_KEY');
    forceKeyboard = +p.arg.getNodeByAttribute('name', 'FORCE_KEYBOARD').Text || false; // false by default
    // get touch areas from parameters or set defaults @todo: move to init{}
    leftTouchAreaConf = p.arg.getNodeByAttribute('name', 'LEFT_TOUCH_AREA');
    if (!leftTouchAreaConf) leftTouchAreaConf = {
    	'height' 		: "100%",
    	'width'			: "40%",
    	'x'				: "0",
        'y'				: "0"
    }
    rightTouchAreaConf = p.arg.getNodeByAttribute('name', 'RIGHT_TOUCH_AREA');
    if (!rightTouchAreaConf) rightTouchAreaConf = {
        	'height' 		: "100%",
        	'width'			: "40%",
        	'x'				: "0",
            'y'				: "0"
        }
    swipeTouchAreaConf = p.arg.getNodeByAttribute('name', 'SWIPE_TOUCH_AREA');

    canvas = p.arg.getNodeByAttribute('name', 'CANVAS');
    // if we got no canvas, set it by default
    if (!canvas) canvas = {
    	'height' 		: "400px",
    	'width'			: "500px",
    	'touch_width'	: "90%",
    	'touch_height'	: "90%"
    }
    //  for more information see the createTouchAreas function.

	// feedback
	init.feedback.default_delay = p.arg.getNodeByAttribute('name', 'FBDelay').Text;  			// default delay for feedback
    init.feedback.errorText = p.arg.getNodeByAttribute('name', 'ERR').Text; 					// the text to display for error correction
    init.feedback.show_errors = parseInt(p.arg.getNodeByAttribute('name', 'ERR_FEED').Text);  	// do we display feedback for error correction?

	init.feedback.correctText = p.arg.getNodeByAttribute('name', 'CORR').Text; 					// the text to display for correct answers
	init.feedback.show_correct = parseInt(p.arg.getNodeByAttribute('name', 'CORR_FEED').Text); 	// do we display feedback for correct answers?


	init.feedback.timeoutText  = p.arg.getNodeByAttribute('name', 'TIMEOUT').Text; 					// the text to display for correct answers
	init.feedback.show_timeout = parseInt(p.arg.getNodeByAttribute('name', 'Timeout_FEED').Text); 	// do we display feedback for correct answers?

	errCorr = p.arg.getNodeByAttribute('name', 'ERR_CORR').Text; 								// do we demand a correct answer before moving on?
    stimDelay = p.arg.getNodeByAttribute('name', 'STIM_DELAY').Text || 500;
    font =  p.arg.getNodeByAttribute('name', 'FONT').Text;

	fontSize =  p.arg.getNodeByAttribute('name', 'FONTSIZE').Text;
	fontSize = !fontSize || fontSize.substr(fontSize.length-2,2)=='px' ? fontSize : fontSize + 'px', // if fontsize is set, but does not have px added, add it.

    fontColor = p.arg.getNodeByAttribute('name', 'FONTCOLOR').Text;
	debug = +p.arg.getNodeByAttribute('name', 'DEBUG').Text;
	skip = +p.arg.getNodeByAttribute('name', 'SKIP').Text;

    // set instructions
    jInstructions = p.arg.getNodeByAttribute('name', 'JINSTRUCTIONS').Text;
    touchInstructions = p.arg.getNodeByAttribute('name', 'TOUCH_INSTRUCTIONS').Text;
    if (!touchInstructions) touchInstructions = jInstructions; // if no touch instructions are set, use regular instructions as default
    init.touch_interface = p.arg.getNodeByAttribute('name', 'TOUCH_INTERFACE').Text || init.touch_interface;
    endWait = p.arg.getNodeByAttribute('name', 'END_WAIT').Text;

    endCont = $('<div>', {
        html: is_touch_device() ? p.arg.getNodeByAttribute('name', 'END_CONT_TOUCH').Text : p.arg.getNodeByAttribute('name', 'END_CONT').Text,
        'class': 'end_message'
    });

	// set experiment type (biat, gnat, stiat), and set internal constants
	init.type = d.type;
	init.setup();

	// ***** get first block ready *****
    if(d.Block != undefined && d.Block.length >= 1){
        //assigning body css properties
        $('body').css({
            fontFamily: font,
            color: fontColor,
            fontSize: fontSize
        });

		// set global variables for first block
        block = d.Block[bl_clock]; //assigning the first block to the 'block' variable
		IATUtil.setCatsArray(); // set category array
        // trials = parseInt(block.TrialCount[0].Text); //getting number of trials from the data collection
        trial_count = 0; //starting to count the trials

    	//Adjust canvas size;
    	adjustCanvas();

		// create global variable with all categories
        for(i=0;i<d.Categories[0].Category.length;i++){
			// create category
			var newCat = new Category(d.Categories[0].Category[i]);
			// set it in globalAllCategories
			globalAllCategories[newCat.number] = newCat;
        }

        //loading all the stimuli in the study
        for(i=0;i<d.Categories[0].Category.length;i++){
            getStimuli(d.Categories[0].Category[i]);
        }

        if(is_touch_device()){
    	    createTouchAreas();
    	    switch (init.touch_interface) {
				case 'swipe':
					$('#swipeToBegin').show();
					break;
				case 'button':
					$('#touch-button').show();
					break;
				case 'slider':
				default:
					$('#slider-wrap').show();
					break;
			}

    	    if(touchInstructions && touchInstructions != '') $(instructions_da).html(touchInstructions);

        } else{
            if(jInstructions && jInstructions != '') $(instructions_da).html(jInstructions);
        }

        //Applying the padding and margins to the display areas
    	var _output_css;
    	if(is_touch_device()){
    	    _output_css = {
	    		'padding': parseInt(instPadding),
	    		'width': canvas.touch_width - (parseInt(instPadding) * 2)+'px'
    	    }
    	} else {
    	    _output_css = {
	    		'padding': parseInt(instPadding),
	    		'width': canvas.width - (parseInt(instPadding) * 2)+'px'
    	    }
    	}
    	$("#output").css(_output_css);

        $(left_da).css({
            'padding': parseInt(catPadding)
        });
        $(right_da).css({
            'padding': parseInt(catPadding)
        });


		// *************** image preloading must be the last thing here!! ************************
		// as soon as they're loaded we trigger the begining of the task, and anything not yet activated isn't there yet
        //finding and preloading all image-type stimuli in the study
        //TODO Category labels images preload
		var imagesExist = false; // checks if we have images at all, so that if we don't have images we can emidiately start the task
        $.each(all_stimuli, function(){
            if(this.type == 'image'){
                loadImage(this.imgSrc);
				imagesExist = true;
            }
        });
        $.each(d.Categories[0].Category, function(){
            if(this.image){
                loadImage(imgUrl+this.image);
				imagesExist = true;
            }
        });
        $.each(d.Block, function(){
            instrType = this.Instructions[0].type;

            if(instrType == 'image'){
                loadImage(imgUrl+this.Instructions[0].Text);
				imagesExist = true;
            }
            if(this.Stimulus){
                _stimulus = imgUrl + this.Stimulus[0].Text;
                loadImage(_stimulus);
				imagesExist = true;
            }
        });
        if (!imagesExist) ImagesReady();

    } else {
        errhandler('There are no blocks defined for the task', 'show')
    }
}

function createTouchAreas(){
    //Creating the object, which will act as left button
    leftTouchArea = $('<div>', {
        'css': {
            'position': 'absolute',
            'top': leftTouchAreaConf.y,
            'left': leftTouchAreaConf.x,
            'width': leftTouchAreaConf.width,
            'height': leftTouchAreaConf.height,
            'zIndex': 9995,
    	    'background': '#ff0000',
    	    'opacity': 0.3
        },
        'id': 'leftTouchArea'
    });

    //Creating the object, which will act as right button
    rightTouchArea = $('<div>', {
        css: {
		    'position': 'absolute',
		    'top': rightTouchAreaConf.y,
		    'right': rightTouchAreaConf.x,
		    'width': rightTouchAreaConf.width,
		    'height': rightTouchAreaConf.height,
		    'z-index': 9995,
		    'background': '#0000ff',
		    'opacity': 0.3
		},
		'id': 'rightTouchArea'
    });

    // gnat touch areas
    if (init.type == 'gnat'){
    	leftTouchArea = $('<div>', {});
        rightTouchArea = $('<div>', {
            css: {
    		    'position': 'absolute',
    		    'top': '60%',
    		    'width': '100%',
    		    'height': '40%',
    		    'z-index': 9995,
    		    'background': '#0000ff',
    		    'opacity': 0.3
    		},
    		'id': 'rightTouchArea'
        });
    }
}

function showTouchControls(){
    $('#app_canvas').append(leftTouchArea, rightTouchArea);
}

function opaqueTouchControls(){
    $('#leftTouchArea, #rightTouchArea').css('opacity', '0.1');
}

function showSwipeArea(){
	$('#touch-interface-wrapper').show();
	// make sure swipe area doesn't run over instructions
	$("#output").css('bottom',$('#touch-interface-wrapper').children().height());
}

function hideSwipeArea(){
	$('#touch-interface-wrapper').hide();
    opaqueTouchControls();
}

//The image preloader calls this function out when uploading all the images is successful
function ImagesReady(){
    // hide the preloading indication and reveal the global instructions
    $('#message').fadeOut('fast', function(){
    	if (!is_touch_device()) $(instructions_da).fadeIn('fast');
    });
    //introduce the first block
    IATUtil.introduce();
}

//////////////////////////////////Utilities section//////////////////////////
//block utility object
var IATUtil = {
    //Function to show the Introduction and run the block features
	// actualy this runs a new block (or ends the experiment)
    introduce: function(){
		//clear the display areas
		$(right_da).html('');
		$(left_da).html('');
		$(mid_da).html('');
		if (feedback_da) $(feedback_da).remove();

        if(bl_clock == d.Block.length){ //checking if this the end of the study
            $('.wrapper').html(endCont); //show the "end" text
            $('#swipeToBegin, #slider-text').html(p.arg.getNodeByAttribute('name', 'END_CONT_TOUCH').Text); // lets set the end content in the swipe elements too

    	    if(is_touch_device()){
    			showSwipeArea();
    			IATUtil.bindSwipe('end'); //Start listening to the start block event as configured in the task xml file.
   		    } else {
    			IATUtil.bindSpace('end');//Start listening to space button press event to end the study
   		    }
        } else {
			// display instructions - if they are an image and if they are text
        	if (is_touch_device()) var block_instructions = block.TInstructions ? block.TInstructions[0] : block.Instructions[0];
        	else var block_instructions = block.Instructions[0];

        	// if instructions are image
            if(block_instructions.type == 'image'){
                $("#output").html(htmlCreator('<img>', {
                    'src': imgUrl+block_instructions.Text,
                    'css':{
                        'width': block_instructions.width,
                        'height': block_instructions.height,
                        'marginLeft': block_instructions.x,
                        'marginTop': block_instructions.y
                    }
                })
                );
            } else { //instructions are text
                $("#output").html(block_instructions.Text); //showing the instructions block as it appears in the CDATA.
            }

            if(block.Stimulus){
                _x = block.Stimulus[0].x ? block.Stimulus[0].x : 'center';
                _y = block.Stimulus[0].y ? block.Stimulus[0].y : 'center';
                bg_position = _x + ' ' + _y;
                $('#content').css({
                    'background': 'url('+_stimulus+') no-repeat '+ bg_position,
                    'z-index': -1
                });
            } else {
                $('#content').css({
                    'background': 'none',
                    'z-index': -1
                });
            }

			limitSequence = block.limitSequence ? true : false;
            IATUtil.sequencer();

			// wait for ok to start trials
			if(is_touch_device()){
				showTouchControls();
				showSwipeArea();
				IATUtil.bindSwipe(); //Start listening to the start block event as configured in the task xml file.
            } else {
                IATUtil.bindSpace(); //Start listening to the start block event as configured in the task xml file.
            }
        }
    },

    sequencer: function(){
        var currentPair; //current pair of categories
        var _pairs_num; //number of pairs
        var catTrialsLimit; //number of times to show stimulus of each category
        var pairs = {}; //pairs array abject
		var catStack = Array(); // array listing a stack of category numbers to push into the sequence

		//sequence utility - set of helper functions
        var seqHelper = {

			// organizing function for seqHelper
			// string categoryList	: comma delimited list of category numbers
			// integer trials		: number of trials from these categories
			addStimuli: function(categoryList, trials) {
				// set categories to currentCats
				seqHelper.getCats(categoryList);

				catTrialsLimit = Math.round(trials / currentCats.length); //number of times to show stimulus of each category

				if (init.get_cat_from_stack){
					// build category stack
					seqHelper.buildCatStack(categoryList, trials);
				} else {
					// set sequencer.pairs with pairs of categories
					seqHelper.breakCatsToPairs();
				}

				// in case these are practice trials we want to set the category list to the general list and not use only the practice categories
				if (block.practiceCats && sequence.length<block.practiceTrials ) {
					categoryList = catsArray.join(",");
				}

				// for each trial add a stimulus to sequence
				for(_i=0;_i<trials;_i++){
					var _cat = seqHelper.pickCat();
					var _stim = seqHelper.pickStimFromCat(_cat);
					_stim.stim_to_trial(categoryList);
					seqHelper.pushStimToSeq(_stim);
				}

			},

			//Clears the previous categories from the "currentCats" array variable and loads the new categories to the array.
			getCats: function(categoryList){
				var categoryArray = categoryList.split(",");
				currentCats = []; // clearing
				if(d.Categories[0].Category.length >= 2){ //check if there are at least two categories in the experiment
					$.each(categoryArray, function(){ //looping through the categories
						var num = parseInt(this);
						if (num == -1) {return true;} // if this is a fake category continue to next iteration (returning true for $.each = continue statement)
						var _tmp = new Category(d.Categories[0].Category[num]);
						_tmp.impressions = 0; //reset
						currentCats.push(_tmp);
					});
				} else {
					errhandler('We need at least two catogories, and we have only '+ d.Categories[0].Category.length, 'show');
				}
			},

			//pick a pair of categories
            getCatsPair: function(){ //returns the pair to choose a category from
                if(pairSwitch == 0){ //will be true for the first time only
                    pairSwitch = $.randomBetween(1, _pairs_num); //picking a random category
                } else if(pairSwitch < _pairs_num){ //picking next pair until the last one
                    pairSwitch++;
                } else { //starting to count from the first pair
                    pairSwitch = 1;
                }
                return pairs[pairSwitch]; //assigning the pair to a variable
            },

			// pick a category
            pickCat: function(){
				 if (init.get_cat_from_stack) {
					var nextCat = catStack.shift();
					return nextCat;
				 } else if (init.get_cat_alternately){ // get categories alternately - requires pairs array to be set in breakCateToPairs()
					currentPair = seqHelper.getCatsPair();
					if(currentPair.length > 1){ //getting a random category from the selected pair
						var randomCatNum = block.getRightOrLeft(); // $.randomBetween(0, 1);
						if(currentPair[randomCatNum].impressions == catTrialsLimit){
							(randomCatNum == 1) ? randomCatNum = 0 : randomCatNum = 1;
						}
					} else {
						randomCatNum = 0;
					}
					currentPair[randomCatNum].impressions++;
					return currentPair[randomCatNum];
				} else { // get random category
					var randomCatNum = $.randomBetween(0, currentCats.length - 1);
					return currentCats[randomCatNum];
				}
            },

            // sets the function that determins if we pick the left or right category in pickCat
            // it is attached to block to make sure that it is used only for this block
            setgetRightOrLeft: function(){
            	if (!limitSequence) block.getRightOrLeft = function(){return $.randomBetween(0, 1);};
            	else { // if we are limiting the sequence
            		// create right/left array (block.limitSequenceLRarr) - this array is specific to this block
            			block.limitSequenceLRarr = new Array();
	            		var chunksConst = [[0,0],[0,1],[1,1],[1,0]];
	            		var chunkBuffer = Array();
	            		var limitSequenceLRstr = '';
	            		// get number of trials
	            		var practiceTrials = block.practiceTrials ? block.practiceTrials : 0;
	            		var trialCount = parseInt(block.TrialCount[0].Text);

	            		// add randomized blocks until we fill the needed overall length
	            		while (block.limitSequenceLRarr.length < practiceTrials + trialCount) {
	            			// if needed reset chunk buffer
	            			if (chunkBuffer.length < 1) chunkBuffer = $.extend(true, [],chunksConst);
	            			// get practice categories randomly and real categories according to sequence chunking
	            			if (block.limitSequenceLRarr.length < practiceTrials) var chunk = [$.randomBetween(0, 1)];
	            			else {var chunk = chunkBuffer.splice(Math.floor(Math.random() * chunkBuffer.length), 1);chunk=chunk[0];}
	            			// add chunk to the sequence array
	            			$.merge(block.limitSequenceLRarr,chunk);
						}
            		// set function
            		block.getRightOrLeft = function(){return block.limitSequenceLRarr.shift();};
            	}
            },

			// get stimuli in the category that have not been exhausted
            getReadyStims: function(cat){
                var ready_stims = new Array();
                for(_s=0;_s<cat.stimulus.length;_s++){
                    if(cat.stimulus[_s].status == 'ready'){
                        ready_stims.push(cat.stimulus[_s]);
                    }
                }

                if(ready_stims.length == 0){
                    for(_s=0;_s<cat.stimulus.length;_s++){
                        cat.stimulus[_s].status = 'ready';
                        ready_stims.push(cat.stimulus[_s]);
                    }
                }
                return ready_stims;
            },

			// randomly pick a stimulus out of the stimuli in the category that were not exhausted
			pickStimFromCat: function(cat){
                var ready_stims = seqHelper.getReadyStims(cat);
                var pick_one = ready_stims[$.randomBetween(0, ready_stims.length-1)];
                return pick_one;
            },

			// add stimulus to sequence and mark it as exhausted
            pushStimToSeq: function(stim){
                sequence.push(stim);
                stim.status = 'exhousted';
            },

            breakCatsToPairs: function(){
                _pairs_num = Math.ceil(currentCats.length / 2); //number of pairs i.e 1, 2, 3...
                for(_p=1;_p<_pairs_num+1;_p++){ //filling the pairs array
                    _tmpval = _p * 2;  //a helper to find the right categories for this pair
                    pairs[_p] = []; //creating an array
                    //pushing the categories to the pair
                    pairs[_p].push(currentCats[_tmpval-2]);
                    pairs[_p].push(currentCats[_tmpval-1]);
                }
            },

			// builds category stack for stiat\gnat - basicly creats a list of categories
			buildCatStack: function(categoryList, trials){

				catStack = new Array();
				if (init.get_cat_from_stack) {
					// set catArr with category list
					var catArr = categoryList.split(",");

					//	set TrialsArr with trials array (array with number of times each corresponding category should appear)
					// if trials is set (STIAT)
					if (block.Trials && block.Trials[0].Text) {
						var TrialsArr = block.Trials[0].Text.split(",");
					// else look for target and distractor counts (GNAT)
					} else if (block.TargetsCount && block.DistractorsCount) {
						// get target and distractor arrays
						var targetsArr = block.TargetsCount[0].Text.split(",");
						var distractorArr = block.DistractorsCount[0].Text.split(",");
						// merge the arrays into a TrialsArr format
						var TrialsArr = Array();
						if (targetsArr.length != distractorArr.length) throw Error('The number of targets and distractors must be equal');

					}
					// if we don't have explicit input regarding the number of trials in each category assign them evenly
					else {

						var TrialsArr = new Array();
						var targetsArr = new Array();
						var distractorArr = new Array();
						for (var i=0; i<catArr.length; i++){
							TrialsArr.push(1);
						}
						for (var i=0; i<catArr.length/2; i++){
							targetsArr.push(1);
							distractorArr.push(1);
						}
					}


					// create the stack from the information we gathered
					while (catStack.length<trials){
						// STIAT
						if (init.type != 'gnat') {
							var tmpCatStack=new Array();
							// for each category add a number of trials according to "trials"
							for (var i=0; i < catArr.length; i++){
								// if category is empty skip it
								if (catArr[i] == -1) continue;
								//add n Trials
								for (var j=0; j<TrialsArr[i]; j++){
									tmpCatStack.push(globalAllCategories[catArr[i]]);
								}
							}

							// randomize tmpCatStack
							while (tmpCatStack.length) {
								var _cat = tmpCatStack.splice(Math.random() * tmpCatStack.length, 1);
								catStack.push(_cat[0]);
							}
							// add tmpCatStack to the main Cat stack
							catStack = catStack.concat(tmpCatStack);
						}

						//GNAT
						if (init.type == 'gnat'){
							var tmpCatStack=new Array(); // holds current string of categories
							var catGroups = new Array();
							// for each category pair
							for (var j=0; j < targetsArr.length; j++){
								catGroups[j]=Array();
								for (var i=0; i<targetsArr[j]; i++){catGroups[j].push(catArr[j*2]);}
								for (var i=0; i<distractorArr[j]; i++){catGroups[j].push(catArr[j*2+1]);}
								// randomize trials in pair and switch them to category objects
								var tmpGroup = Array();
								while (catGroups[j].length > 0) {
									var cat = catGroups[j].splice(Math.random() * catGroups[j].length, 1);
									tmpGroup.push(globalAllCategories[cat[0]]);
								}
								catGroups[j] = tmpGroup;
							}
							// for each group add a category (this will crash if there  aren't an even number of trials in each group
							while(catGroups[catGroups.length-1].length){
								for (i=0;i<catGroups.length;i++){
									tmpCatStack.push(catGroups[i].pop());
								}
							}
							// add tmpCatStack to the main Cat stack
							catStack = catStack.concat(tmpCatStack);
						}
					}

					// cut the array to the needed length
					catStack = catStack.slice(0,trials);
				} else { // not get cat from stack
					// push a random category into the category stack
					for (var i=0; i<trials; i++){
						var randomCat = currentCats[Math.floor(Math.random()*currentCats.length)];
						catStack.push(randomCat);
					}
				}
			}
        }


		// ***** sequencer main code *****
		//sequence reset
		sequence = new Array();
        seqHelper.setgetRightOrLeft(); // set the category picker for iat and bat limitSequence

		// if there are training stimuli add them
		if (init.practice == true) {
			// makes sure that the categories and number of trials are good
			if (block.practiceCats && block.practiceTrials !=0) {
				seqHelper.addStimuli(block.practiceCats, block.practiceTrials);
			}
		}
		// add main stimuli
		seqHelper.addStimuli(catsArray.join(","), parseInt(block.TrialCount[0].Text));

		// display categories (we take the last stimulus and display its categories so that we don't use practice categories by mistake)
		sequence[sequence.length-1].display('start');

		// ***** preparing block data, which will be sent to the server at the end of the block *****
		poster.addResultValue({
			'blockName': 'BLOCK'+block.BlockNumber[0].Text
		});
		poster.addResultValue({
			'blockNum': block.BlockNumber[0].Text
		});
		poster.addResultValue({
			'blockPairingDef': catsNames('data')
		});
		poster.addResultValue({
			'blockTrialCnt': sequence.length
		});
		poster.addResultValue({
			'mode': 'insAppletData'
		});

    }, // end sequencer function

	// set cats array (gets it from BlockPairingDefinition or elsewhere)
	setCatsArray: function() {
		// get BlockPairingDefinition
		if (block.BlockPairingDefinition) {
			var BlockPairingDefinition = block.BlockPairingDefinition[0].Text.split(",");
		}
		else if (block.Targets && block.Distractors){
			// get target and distractor arrays
			var targetsArr = block.Targets[0].Text.split(",");
			var distractorArr = block.Distractors[0].Text.split(",");
			// merge the arrays into a BlockPairingDefinition format
			var BlockPairingDefinition = Array();

			while (targetsArr.length > 0 && distractorArr.length > 0){
				// if we have an item it stands for the number of trials for this category, else we ran out of categories and push 0
				if (targetsArr.length > 0) BlockPairingDefinition.push(targetsArr.shift());
				else BlockPairingDefinition.push(-1);
				if (distractorArr.length > 0) BlockPairingDefinition.push(distractorArr.shift());
				else BlockPairingDefinition.push(-1);
			}
		} else throw new Error("BlockPairingDefinition not defined.");

		// set BlockPairingDefinition to cats array
		catsArray = BlockPairingDefinition;
	},

    clearTrial: function(){
         //clearing the previous trial
        clearTimeout(stimTimer);
        $('#stimul').html('');
		$(feedback_da).remove();
    },


    nextTrial: function(){
        //if there is another trial left get it
        if(trial_count<sequence.length){
            stimulus = sequence[trial_count];
			stimulus.trialNum = trial_count; 	//saving the number of trial
			trial_count++; 						// advance trial counter
			stimulus.run();
        } else {
            //end the block and run next one
            $('#stimul_wrapper').hide();
            poster.sendBlockData(); //send block data
            IATUtil.nextBlock(); //clock to next block
        }
    },

    //running next block
    nextBlock: function(){
        //creating new data array for new block
        poster.dataCollection = new Array();
        bl_clock = bl_clock+1; //setting the block counter
        if(d.Block[bl_clock]){ //checking if such block exists
            block = d.Block[bl_clock]; //assigning the block variable
			IATUtil.setCatsArray(); // set category array
            trial_count = 0; //trial counter
        }
        IATUtil.introduce(); //introduce the block

    },

    //function to add event listeners right after the stimulus is being shown
	//receiving 3 arguments: answer - the keycode for the right answer
    bindControls: function(answer, stimulus, eventype){
    	if (eventype=='touchstart'){
        	$('#rightTouchArea, #leftTouchArea').bind(eventype, function(event){ //binding the event type as was passed in the argument
				event.timeStamp = new Date().getTime(); // we can't use the native timestamp because in firefox it stands for tickCount instead of unix time
        	    event.preventDefault(); //preventing default browser behavior associated with this key pressdown
        	    processAnswer.processPress(event, stimulus, answer, $(this)); //process user input
        	});
    	} else { // if event = keypressed
			// after a key is pressed wait until it is released before binding it to the next stimulus
	        if(trueKeyHeld || falseKeyHeld){ //checking sticky keys
	            $(document).bind('keyup', function(event){ //starting to listen to key release
	                trueKeyHeld = false;
	                falseKeyHeld = false;
	                $(document).unbind('keyup');
	                IATUtil.bindControls(answer, stimulus, eventype); //run again
	            });
	        } else {
	            $(document).bind(eventype, function(event){ //binding the event type as was passed in the argument
					event.timeStamp = new Date().getTime(); // we can't use the native timestamp because in firefox it stands for tickCount instead of unix time
	                $(document).bind('keyup', function(){
	                    trueKeyHeld = false;
	                    falseKeyHeld = false;
	                    $(document).unbind('keyup');
	                });
	                event.preventDefault(); //preventing default browser behavior associated with this key pressdown
	                processAnswer.processPress(event, stimulus, answer); //process user input
	            });
	        }
    	} // end if event = tap else keypressed

		// bind timeout event
        if (init.response_timeout) {
			// set the time for the timeout
			var timeoutLength = init.timeoutLength; // default
			if (block.TargetDuration && stimulus.alignment == 'right') timeoutLength = block.TargetDuration; // gnat target block timeout
			else if (block.DistractorDuration && stimulus.alignment == 'left') timeoutLength = block.DistractorDuration; // gnat distractor block timeout
			else if (block.ResponseWindow) timeoutLength = block.ResponseWindow; // stiat block timeout
			else if (p.arg.getNodeByAttribute('name', 'ResponseWindow').Text) timeoutLength = p.arg.getNodeByAttribute('name', 'ResponseWindow').Text; // stiat block timeout

			if (timeoutLength > 0) {
				// what to do when the time runs out
				responseTimeoutID = setTimeout(function(){
					// create fake event for nogo
					var fakeEvent = {
						keyCode 	: 0,
						timeStamp 	: new Date().getTime(),
						type 		: 'keydown'
					};
					processAnswer.processPress(fakeEvent, stimulus, answer); //process user input
				},timeoutLength);
			}
		}

    },

    //Function creates the event listener and the event handler to start the current block.
    bindSpace: function(mode){
        var continueKey  = block.Instructions[0].continueKey; //current block continueKey
        var continueEvent = 'keydown'; //default event
        if(continueKey == undefined || continueKey == 32){ //check if there is different keycode for keydown event
            continueKey = 32; //if not assign the defaults (enter key)
        } else if(continueKey == 'mouseClick') { //if mouse click, change the event to 'click'
            continueKey  = block.Instructions[0].continueKey;
            continueEvent = 'click';
        } else { //if different key exists
            continueKey  = block.Instructions[0].continueKey; //current block continueKey
        }

        //remove the preloading
        $('.preloading').fadeOut('500', function(){
            $(this).remove()
        });
        //bind the event. Will bind the event if one described in continueKey attribute of the instructions node of each block
        // otherwise will bind the default "enter"(keycode 32) keydown event
        $(document).bind(continueEvent, function(event){
            event.preventDefault();
            switch (continueEvent){
                case 'mouseClick':
                    break;
                case 'keydown':
                    if (event.keyCode != continueKey) {
                        return false;
                    }
                    break;
            }
            $(document).unbind(continueEvent); //unbind the event listener right after it was triggered
            if(mode != 'end'){ //if this is NOT the end of the task show the first stimuli for curerent block
                $('#message').hide();
                $('#stimul_wrapper').show();
                $("#output").html('');
	    		// the setTimeout is a bug fix for iOS5 “JavaScript execution exceeded timeout” error
                setTimeout(function(){IATUtil.nextTrial()},1);
            } else {//if this is the end of the task show the proper message
                //$('.wrapper').html('');Replace Yuri's with a "please wait" message.
                $('.end_message').html(endWait); //show the end message while processing the results
                if(d.results != 'false' || d.results == undefined){
                    poster.sendTaskData();
                }
            }
        });

    },
    bindSwipe: function(mode){
    	//remove the preloading
    	$('.preloading').fadeOut('500', function(){
    	    $(this).remove()
    	});

    	// what to do on an action, actualy this should probably be common to the bind space function...
    	swipe_action = function(){
			if(mode != 'end'){ //if this is NOT the end of the task show the first stimuli for curerent block
	    		$('#message').hide();
	    		$('#stimul_wrapper').show();
	    		$("#output").html('');
	    		hideSwipeArea();
	    		blink = false;
	    		// the setTimeout is a bug fix for iOS5 “JavaScript execution exceeded timeout” error
	    		//if (IATUtil.nextTrial() != undefined)
	    		setTimeout(function(){IATUtil.nextTrial()},1,true);
	    	} else {//if this is the end of the task show the proper message
	    		$('.end_message').html(tEndWait); //show the end message while processing the results
	    		if(d.results != 'false' || d.results == undefined){
	    		    poster.sendTaskData();
	    		}
    	    }
    	};

    	switch (init.touch_interface) {
			case 'swipe': // swap anywhere
				var swipe_text = p.arg.getNodeByAttribute('name', 'SWIPE_TOUCH_AREA').Text || "Swipe to begin";
				$('#swipeToBegin').html(swipe_text);
		    	$("#app_canvas").one('swiperight', function(){swipe_action();});
				break;
			case 'button': // double click button
				var button1_text = p.arg.getNodeByAttribute('name', 'TOUCH_INTERFACE_BUTTON1').Text || "Click twice to continue";
				var button2_text = p.arg.getNodeByAttribute('name', 'TOUCH_INTERFACE_BUTTON2').Text || "Click once to continue";
				$('#touch-button span')
					.html(button1_text).css('background-color','#CBEBFF')				// display first button
					.one("click",function(){											// set action for click
						$(this)
							.html(button2_text).css('background-color','#4682b4')		// display second button
							.one("click",function(){swipe_action();});					// set action for click
					});
				break;
			case 'slider': // slider
			default:
				slider_text = p.arg.getNodeByAttribute('name', 'TOUCH_INTERFACE_SLIDER').Text || "Slide to continue";
				$('#slider-text').html(slider_text);
				$("#slider").draggable({
					axis: 'x',
					containment: 'parent',
					stop: function(event, ui) {
						$(this).animate({
							left: 0
						});
						if (ui.position.left > $('#well h2').width() - $("#slider").width() -5) {
							swipe_action();
						}
					}
				});
				break;
		}
	},

    //helper to show the category labels
    catLabels: function(side, da, cat){
        $(da).append(cat.label); //append the label html stored in the category object
        cat.orientation = side; //assign the category to a side it bolngs to according to the block pairing definition
    },

	// keeps track of the display times for the feedback, is dynamicaly set by IATUtil.displayFeedback
	feedbackTimer: 0,

	// displays feedback for a specific response
	// feedbackType: string, 'wrong'\'correct'\'timeout'
	displayFeedback: function(feedbackType){
		// remove old feedback before moving on
		if (feedback_da) $(feedback_da).remove();

		// set default feedback timer
		IATUtil.feedbackTimer = 250;
		if (init.feedback.default_delay) IATUtil.feedbackTimer = init.feedback.default_delay;
		if (block.FBDelay) IATUtil.feedbackTimer = block.FBDelay; // regular
		if (block.FBDuration) IATUtil.feedbackTimer = block.FBDuration; // for gnat

		switch(feedbackType)
		{
		case 'wrong':
			var errorText = init.feedback.errorText;
			if (block.errorText) errorText = block.errorText;

			if(init.feedback.show_errors == 1){
				feedback_da = htmlCreator('<div>', {
					'class': 'wrong_answer',
					'html': errorText
				});
				$('.inner').append($(feedback_da));
			}
			else IATUtil.feedbackTimer = 0;
			// remove error after a few moments
			if (init.feedback.remove_error) setTimeout(function(){$(feedback_da).remove();},IATUtil.feedbackTimer);
			break;
		case 'correct':
			// create boolean to check if we show the correct tag
			var show_correct = false;
			if (init.feedback.show_correct) show_correct = true;
			if (block.CorrFB) show_correct = true;

			// get correct text
			var	correctText = "O";
			if (init.feedback.correctText) correctText = init.feedback.correctText;
			if (block.CorrLabel) correctText = block.CorrLabel;

			if(show_correct==1 && IATUtil.feedbackTimer > 0){
				feedback_da = htmlCreator('<div>', {
					'class': 'correct_answer',
					'html': correctText
				});
				$('.inner').append($(feedback_da));
			}
			else IATUtil.feedbackTimer = 0;
			break;
		case 'timeout':
			// look for timeout delay information
			if (init.feedback.timout_delay) IATUtil.feedbackTimer = init.feedback.timout_delay;
			if (block.TimeoutDelay) {
				if (block.TimeoutDelay > 0) IATUtil.feedbackTimer = block.TimeoutDelay;
				else IATUtil.feedbackTimer = 0;
			}
			if (block.TimeoutDuration) {
				if (block.TimeoutDuration > 0) IATUtil.feedbackTimer = block.TimeoutDuration;
				else IATUtil.feedbackTimer = 0;
			}

			// get timeout label
			var timeoutText = init.feedback.errorText;
			if (block.errorText) timeoutText = block.errorText;
			if (init.feedback.timeoutText) timeoutText = init.feedback.timeoutText;
			if (block.TimeoutLabel) timeoutText = block.TimeoutLabel;

			if(init.feedback.show_timeout == 1 && IATUtil.feedbackTimer > 0){
				feedback_da = htmlCreator('<div>', {
					'class': 'timeout_answer',
					'html': timeoutText
				});
				$('.inner').append($(feedback_da));
			}
			else IATUtil.feedbackTimer = 0;
			break;
		}
	}
}


//objsect that stores and sends data to the server
var poster = {
    dataCollection: [], //array of serialized values to send to the server
    scoringData: [],

    addResultValue: function(value){
        poster.dataCollection.push(value);
    },
    sendBlockData: function(){ //function runs at the end of each block to send the data to the server
        poster.addResultValue({
            'trialsSent': trial_count
        });
        var _tmp = poster.dataCollection;

		// make sure we don't send any data in case this is a block skip
		var blockTrialCnt, trialsSent;
		$.each(_tmp,function(){
			if (this.trialsSent) trialsSent = this.trialsSent;
			if (this.blockTrialCnt) blockTrialCnt = this.blockTrialCnt;
		});
		if (blockTrialCnt != trialsSent) return false;

        var a = [];
        var serialized;

        $.each(_tmp, function(){
            for (key in this) {
                a.push(key+"="+this[key]);
            }
            serialized = encodeURI(a.join("&"));
        });

        $.ajax({
            type: 'POST',
            url: postUrl + ';jsessionid=' + conf.jid,
            data: serialized,
            processData: true,
            complete: function(res){
                //    c.log(response);
                errhandler('Sent the following data: ' + serialized + '</br>with the following response: ' + res.responseText, 'show');
            },
            success: function(res){
            //    c.log(response);
            },

            error: function(res, status, err){
                errhandler(res.responseText + ':::' + err, 'show');
            }
        });
    },

    sendTaskData: function(){
    	function getCutoff(n){
    		var cutoff = parseFloat(results[n].cutoff);
    		if (isNaN(cutoff)) cutoff = parseFloat(n.replace(".","0.")); // probably not needed
    		return cutoff;
    	}

    	// put message together
        var mess;
        var repBlocks = d.ReportBlocks[0].Text.split(',');
        var rl = results.length;
        var scoreString = scorer.scoreTask(poster.scoringData, repBlocks);
        if (scoreString == "FAST"){
            mess = p.arg.getNodeByAttribute('name', 'FAST_TXT').Text;
        } else if (scoreString=="ERROR") {
            mess = p.arg.getNodeByAttribute('name', 'ERR_TXT').Text;
		} else if (scoreString=="MULTICONDITIONS") {
			mess = scorer.multiConditionScore(poster.scoringData);
        } else if (scoreString == undefined || scoreString == null || !scoreString){
            mess = p.arg.getNodeByAttribute('name', 'SCORE_ERR').Text;
        } else if (scoreString > getCutoff(rl-1)){// score  greater than highest range
            mess = results[rl-1].Text;
        } else {
        	// go through possible results and when you hit the right cutoff point return its message
            for (i=0; i<rl; i++)   {
                // negative cutoff
                if (getCutoff(i) < 0 && scoreString <= getCutoff(i)) {
                    mess = results[i].Text;
                    break;
                }
                //zero cutoff
                if (getCutoff(i) == 0 && scoreString > getCutoff(i-1) && scoreString <= getCutoff(i+1)) {
                    mess = results[i].Text;
                    break;
                }
                // non-negative cutoff
                if (getCutoff(i) >= 0 && scoreString <= getCutoff(i)) {
                    mess = results[i-1].Text;
                    break;
                }
            }
        }

        poster.dataCollection.push({
            'dummy': 'dummy',
            'mode': 'iatSummary',
            'iatScore': scoreString,
            'resultMessage': mess,
            'tid': conf.tid
        });


        var _tmp = poster.dataCollection;
        var a = [];

		// we want to send a regular post here, not ajax, because thats what the flash does...
		// the only way to do this in jquery is using a fake form
		// var fakeForm = $('<form id="fakeform" action="'+nextUrl+'" method="post">').appendTo('body');
		var fakeForm = $('<form>',{id:'fakeform',action:nextUrl, method:'post'}).appendTo('body');
		$.each(_tmp, function(key,value){
			for (key in this) {
				$(fakeForm).append(
					$('<input type="hidden" name="'+ key +'" value="' + this[key] + '">')
				);
			}
		});
		// for some reason, the jquery submit was sending this as ajax?
		document.forms["fakeform"].submit();

		/*
        var serialized;
        $.each(_tmp, function(){
            for (key in this) {
                a.push(key+"="+this[key]);
            }
            serialized = encodeURI(a.join("&"));
        });
        //Posting the data collection to the server
        //c.log(serialized);

        $.ajax({
            type: 'POST',
            url: nextUrl,
            data: serialized,
            processData: true,
            complete: function(response){
                //window.location.href = nextUrl+'?tid=2';
                //location.reload();
                c.log(mess);
            },
            success: function(response){
                //window.location.href = window.location.href;
                //location.reload();
                c.log(mess);
            },
            error: function(res, status, err){
                errhandler(res.responseText + ':::' + err, 'show');
            }
        });
		*/
    }
}


// SCORER Utility object - very similar to Scorer.as
var scorer = {
    scoreTask: function(results,rb) {        
        var b = new Array();
        b[0] = new Array();
        b[1] = new Array();
        b[2] = new Array();
        b[3] = new Array();

        var pool36;
        var pool47;
        var ave3;
        var ave4;
        var ave6;
        var ave7;
        var diff36;
        var diff47;
        var score;
        var iat1;
        var iat2;

        var rberr = new Array();
        rberr[0] = 0;
        rberr[1] = 0;
        rberr[2] = 0;
        rberr[3] = 0;
        var block_trial_count = [0,0,0,0]; // counts the number of trials per each block so we can compute error ratio
        var trialsUnder = 0;
        var totalScoredTrials = 0;

        var errorString;
        var trial;
        // BNG Steps 1-5
        for(i=0;i < results.length; i++){  //  Loop through all trials
            trial = results[i];
            for (j=0;j< rb.length; j++){  //  check if trial is in a report block and < 10000
                if ((trial.block == rb[j]) && (trial.lat < 10000)){
                	if (init.type != 'gnat') {
	                    b[j].push([trial.lat,trial.err]);    //  add to scoring array
	                    if (trial.lat < 300) trialsUnder++;
	                    if (trial.err) rberr[j]++;
	                    totalScoredTrials++;
                	} else { // we are scoring the gnat
                		// this is a go trial - we want to investigate the latencies
                		if (trial.err == 0 || trial.err == 2){
                			b[j].push([trial.lat,trial.err]);    	//  add to scoring array
    	                    if (trial.lat < 300) trialsUnder++;		// mark if the trial was fast
    	                    totalScoredTrials++;
                		}
	                    if (trial.err == 1 || trial.err == 2) rberr[j]++; // count errors
                	}
                	block_trial_count[j]++;
                    break;
                }
            }
        }

		for (i=0;i< b.length; i++){
            if ((rberr[i]/block_trial_count[i]) > 0.4)
                return("ERROR");
        }

        if ((trialsUnder/totalScoredTrials)>0.1)
        	return("FAST");

		// in case multiconditions is true escape this function and report MULTICONDITIONS
		if (d.Results[0].multiConditions=="true")
			return("MULTICONDITIONS");

        if (rb.length == 2) {
            pool36 = scorer.poolSD(b[0],b[1]);
            ave3 = scorer.ave(b[0]);
            ave6 = scorer.ave(b[1]);
            diff36 =  ave3 - ave6;
            score = diff36/pool36;
            score = ((score)*1000)/1000;
        }
        else if (rb.length == 4) {
            //  pool sd BNG Step 6
            pool36 = scorer.poolSD(b[0],b[2]);
            pool47 = scorer.poolSD(b[1],b[3]);
            //            c.log("Pool SDS:"+pool36+","+pool47);

            // average	BNG 9
            ave3 = scorer.ave(b[0]);
            ave4 = scorer.ave(b[1]);
            ave6 = scorer.ave(b[2]);
            ave7 = scorer.ave(b[3]);
            //            c.log("ave3:"+ave3+",ave4:"+ave4+",ave6:"+ave6+",ave7:"+ave7);

            // difference  BNG 10
            diff36 = ave3 - ave6;
            diff47 = ave4 - ave7;
            //            c.log("Diffs "+diff36+","+diff47);

            //  Divide  BNG11
            iat1 = (diff36/pool36);
            iat2 = (diff47/pool47);
            //            c.log("IATs:"+iat1+","+iat2);

            // Average quotients BNG 12
            score = ((iat1+iat2)/2);
        // Round to thousandths
        // score = int((score)*1000)/1000;
        }
        //        c.log(score);
        return score;
    },

	// creates the messages string for multiConditions
	// ScoringData is an array of objects holding {block, err, lat}
	multiConditionScore: function(scoringData){
		// condition object, accepts a list of coma delimited integers
		var condition = function(blockList){
			var blockArr = blockList.split(",").unique();
			var sum = 0;
			var trials = 0;
			var errors = 0;
			var latArr = Array();

			// for each trial result
			$.each(scoringData,function(index,value){
				// if the value is in this block array
				if ($.inArray(value.block.toString(),blockArr)>=0){
					sum+=value.lat;
					trials++;
					latArr.push(value.lat);
					if (value.err==1 || value.err==2) errors++;
				}
			});

			this.trials=trials;
			this.sum= sum;
			this.mean=sum/trials;
			this.errors = errors;
			// calculated variance and sd
			var tmp=0;
			for (var i=0;i<latArr.length;i++){tmp+=Math.pow(latArr[i]-this.mean,2);}
			this.variance = tmp/this.mean;
			this.sd = Math.sqrt(this.variance);
		}

		conditionArr = d.Results[0].Result;

		var blockStr="";
		for (var i=0;i<conditionArr.length;i++){
			blockStr+=conditionArr[i].blocks + ",";
		}
		allBlocks = new condition(blockStr);

		var message = "";// holds the final message that we will return
		// for each condition calculate scores and add the to the message variable
		$.each(conditionArr,function(index,value){
			var currentCondition = new condition(value.blocks);
			var Dscore = (allBlocks.mean - currentCondition.mean)/ allBlocks.sd;
			var errorRate = currentCondition.errors / currentCondition.trials;
			message+=value.Text;
			message+=" = ";
			if (d.Results[0].D 		== "true") 	message+= Dscore 				+ ", "; // D score
			if (d.Results[0].mean 	== "true") message+= currentCondition.mean + ", "; // Mean
			if (d.Results[0].SD 	== "true") message+= currentCondition.sd 	+ ", "; // SD
			if (d.Results[0].error 	== "true") message+= errorRate				+ ", "; // Error rate
			message+="</br> ";
		});
		return message;
	},

    //  IAT Math Functions
    poolSD: function(arr1,arr2){
        var temp = new Array();
        for(var i=0;i<arr1.length;i++){
            temp.push(arr1[i][0]);
        }
        for(i=0;i<arr2.length;i++){
            temp.push(arr2[i][0]);
        }
        return(scorer.sd(temp));
    },

    ave: function(a){
        var result=0,i=0,num=0;
        while(i<a.length){
            result+=a[i][0];
            num++;
            i++;
        }
        return(result/num);
    },

    //  Standard Math Functions
    meanf: function(arr){
        var l = arr.length, s=0;
        while (l--) s += arr[l];
        return s/arr.length;
    },

    variance: function(arr) {
        var l = arr.length, x2=0,d=0, m = scorer.meanf(arr);
        while (l--) {
            d = arr[l]-m;
            x2 += d*d;
        }
        return (x2/(arr.length-1));
    },

    sd: function(arr){
        return Math.sqrt(scorer.variance(arr));
    }
}


jQuery.extend({
    random: function(X) {
        return Math.floor(X * (Math.random() % 1));
    },
    randomBetween: function(MinV, MaxV) {
        return MinV + jQuery.random(MaxV - MinV + 1);
    }
});

$.fn.blink = function(){
    $(this).animate(
    	{opacity: 0.3},
    	'slow',
    	function(){$(this).animate(
    		{opacity: 0},
    		'slow',
    		function(){if(blink){$(this).blink();}
		});
    });
}

// extend "Array" with a unique function that makes sure all elements are unique.
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=a.length; j>i; j--) {
            if(a[i] === a[j]) a.splice(j, 1);
        }
    }
    return a;
};