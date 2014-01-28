var myGlobalVar = null; // scope hack
var pending = false;
var waittxt = "Please Wait";
var timeouttxt = "Timed Out. Try Again";
var time = 10000;
var studyWindow=null;
function xGetCookie(name)
{
	var value=null, search=name+"=";
	if (document.cookie.length > 0) {
		var offset = document.cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			var end = document.cookie.indexOf(";", offset);
			if (end == -1) end = document.cookie.length;
			value = unescape(document.cookie.substring(offset, end));
		}
	}
	return value;
}
function getStyleObject(objectId) {
	// cross-browser function to get an object's style object given its id
	if(document.getElementById && document.getElementById(objectId)) {
		// W3C DOM
		return document.getElementById(objectId).style;
	} 
	else if (document.all && document.all(objectId)) {
		// MSIE 4 DOM
		return document.all(objectId).style;
	} else if (document.layers && document.layers[objectId]) {
		// NN 4 DOM.. note: this won't find nested layers
		return document.layers[objectId];
	} else {
		return false;
	}
} // getStyleObject

function changeObjectVisibility(objectId, newVisibility) {
	// get a reference to the cross-browser style object and make sure the object exists
	var styleObject = getStyleObject(objectId);
	if(styleObject) {
	styleObject.display = newVisibility;
	return true;
	} else {
	// we couldn't find the object, so we can't change its visibility
	return false;
	}
} // changeObjectVisibility

function showTimeout(){
	pending = false;
	changeObjectVisibility("Wait","none");
	changeObjectVisibility("Timeout","block");
}
function linkClicked(){
	if (!pending){
	pending = true;
	changeObjectVisibility("NextTask","none");
	changeObjectVisibility("Timeout","none");
	changeObjectVisibility("Wait","block");
	myGlobalVar = this;
	setTimeout(this.showTimeout, time);
	var loc = "/implicit/Study?tid="+xGetCookie("tid");
	if(studyWindow!=null)
	{
	studyWindow.close();
	}
	location.href = loc;
	}
}

function withdrawPopup()
{
	var loc = "/implicit/common/en-us/html/withdrawPopup.jsp";
	studyWindow =window.open(loc,"withdrawWindow","width=400,height=300,resizable,scrollbars,status") ;
	studyWindow.focus() ;
}

function pauseStudy()
{
	var loc = "/implicit/Study?tid="+xGetCookie("tid")+"&withdraw=P";
	if (opener != null) {
	opener.closeStudyWindow();
	opener.location.replace(loc);
	}else{
	location.href = loc;}
}

function withdrawStudy()
{
	var loc = "/implicit/Study?tid="+xGetCookie("tid")+"&withdraw=W";
	if (opener != null) {
	opener.closeStudyWindow();
	opener.location.replace(loc);
	} else{
	//location.href = loc;
	}
}

function buttonClicked(){
	if (!pending){
	pending = true;
	changeObjectVisibility("submit_system","none");
	changeObjectVisibility("Timeout","none");
	changeObjectVisibility("Wait","block");
	myGlobalVar = this;
	setTimeout(this.showTimeout, time);
	}
}

function writeButton(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<input value="'+xGetCookie("tid")+'" name="tid" type="hidden"/>');
	document.write('<input value="'+txt+'" name="submit_system" id="submit_system" type="submit" onClick="buttonClicked()"/>');
	document.write('<div name="Wait" id="Wait" style="display:none"><input value="'+ waittxt + '" type="submit" disabled="true" name="IMPTASKWA"/></div>');
	document.write('<div name="Timeout" id="Timeout" style="display:none"><input value="'+ timeouttxt + '" type="submit" onClick="buttonClicked()" name="IMPTASKTO"/></div>');
}

function writeLink(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<div name="NextTask" id="NextTask"><a href="javascript:linkClicked()">' + txt + '</a></div>');
	document.write('<div name="Wait" id="Wait" style="display:none">'+waittxt+'</div>');
	document.write('<div name="Timeout" id="Timeout" style="display:none"><a href="javascript:linkClicked()">' + timeouttxt + '</a></div>');
	document.write('<br/> <font size="2" color="red">Dev2 Warning: This page will not save data. This may be desired behavior.</font>');
}

// This function writes a button but treats it as a link.
function writeButtonLink(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<input value="'+txt+'" name="NextTask" id="NextTask" type="submit" onClick="linkClicked()"/>');
	document.write('<div name="Wait" id="Wait" style="display:none"><input value="'+ waittxt + '" type="submit" disabled="true" name="IMPTASKWA"/></div>');
	document.write('<div name="Timeout" id="Timeout" style="display:none"><input value="'+ timeouttxt + '" type="submit" onClick="linkClicked()" name="IMPTASKTO"/></div>');
	document.write('<br/> <font size="2" color="red">Dev2 Warning: This page will not save data. This may be desired behavior.</font>');
}

function withdrawButtonLink(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<input value="'+txt+'" name="withdrawTask" id="withdrawTask" type="submit" onClick="withdrawPopup()"/>');
	document.write('<div name="Wait" id="Wait" style="display:none"><input value="'+ waittxt + '" type="submit" disabled="true" name="IMPTASKWA"/></div>');
	document.write('<div name="Timeouta" id="Timeouta" style="display:none"><input value="'+ timeouttxt + '" type="submit" onClick="withdrawPopup()" name="IMPTASKTO"/></div>');
}

function noDataButton(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<input value="'+txt+'" name="NextTask" id="NextTask" type="submit" onClick="linkClicked()"/>');
	document.write('<div name="Wait" id="Wait" style="display:none"><input value="'+ waittxt + '" type="submit" disabled="true" name="IMPTASKWA"/></div>');
	document.write('<div name="Timeout" id="Timeout" style="display:none"><input value="'+ timeouttxt + '" type="submit" onClick="linkClicked()" name="IMPTASKTO"/></div>');
	document.write('<br/> <font size="2" color="red">Dev2 Warning: This page will not save data. This may be desired behavior.</font>');
}

function noDataLink(txt,time){
	if(time != undefined)
	this.time = time;
	document.write('<div name="NextTask" id="NextTask"><a href="javascript:linkClicked()">' + txt + '</a></div>');
	document.write('<div name="Wait" id="Wait" style="display:none">'+waittxt+'</div>');
	document.write('<div name="Timeout" id="Timeout" style="display:none"><a href="javascript:linkClicked()">' + timeouttxt + '</a></div>');
	document.write('<br/> <font size="2" color="red">Dev2 Warning: This page will not save data. This may be desired behavior.</font>');
}
