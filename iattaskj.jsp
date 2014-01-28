<%@page pageEncoding="UTF-8" %>
<%@page import="org.uva.*, java.io.*" %>
<%
StudySession studySession = (StudySession) session.getAttribute("studysession");
String fullUrl = ((PageTask)studySession.getCurrentTask()).getUrl();
String urlPath = fullUrl.substring(0,fullUrl.indexOf("iattaskj"));

String getProtocol=request.getScheme();
String getDomain=request.getServerName();
String getBase = getProtocol+"://"+getDomain;

String props = request.getParameter("p");
if (props == null)
    props = "params.xml";

%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <base href="<%= getBase + "/implicit" + urlPath %>">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></meta>
    <meta HTTP-EQUIV="Expires" CONTENT="0"></meta>
    <meta HTTP-EQUIV="Pragma" CONTENT="no-cache"></meta>
    <meta HTTP-EQUIV="Cache-Control" CONTENT="no-cache"></meta>
    <meta name="viewport" content="user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1" />

	<link type="text/css" rel="Stylesheet" href="styles/style.css"/>
	<link type="text/css" rel="Stylesheet" href="styles/jqtouch.css"/>

	<script type="text/javascript" src="js/TouchTimerWorkaround.js"></script>
	<script type="text/javascript" src="js/task.js" language="javascript" ></script>
    <script type="text/javascript" src="js/jquery.js"></script>
    <script type="text/javascript" src="js/jqtouch.js" charset="utf-8"></script>
	<script type="text/javascript" src="js/jquery-ui-1.8.21.custom.min.js"></script>
	<script type="text/javascript" src="js/jquery.mobile-1.1.1.min.js"></script>
	<script type="text/javascript" src="js/xmlToJson.js"></script>
	<script src='js/jquery.ui.touch-punch.min.js'></script>

    <script type="text/javascript">
        var conf = {
        i: '<%= request.getParameter("i") %>',
        p: '<%= props %>',
        tid: xGetCookie("tid"),
        jid: '<%= session.getId() %>'
        }
    </script>
    <script type="text/javascript" src="js/engine.js"></script>
    <title>JS IAT</title>
</head>
  <body bgcolor="f1f1f1">

    <!-- required html containers. do not change -->
        <div id="app_canvas_wrapper">
            <div id="app_canvas">
                <div class="wrapper clearfix">
					<!-- Category display areas -->
					<div id="left_screen"></div>
					<div id="mid_screen"></div>
					<div id="right_screen"></div>
					<!-- Content display areas -->
                    <div id="content">
                        <div class="inner">
                            <div id="stimul_wrapper" class="clearfix">
								<div id="stimul" class="clearfix"></div>
							</div>
							<div id="output"></div>
                        </div>
                    </div>
                </div>
                <div id="touch-interface-wrapper" style="display:none">
					<div id="slider-wrap" style="display:none">
						<div id="well">
							<h2><img id="slider" src="img/arrow.png"></strong> <span id="slider-text">Slide to Begin</span></h2>
						</div>
					</div>
					<div id="swipeToBegin" style="display:none">Swipe to Begin</div>
					<div id="touch-button" style="display:none">
						<span>Click me twice</span>
					</div>
				</div>
            </div>
        </div>
        <div id="profile-orientation-warning" style="display:none">
        	This application only works in Landscape orientation </br>
        	please rotate your screen
        </div>
        <div id="message"></div>
        <div id="instructions">
			Keep your index fingers on the “E” and “I” keys of your keyboard and follow the instructions. <br/>If the “E” and “I” keys do not work, click the mouse inside the box and try again.<br />If a red <font color=red>X</font> appears, press the other key to make the red <font color=red>X</font> go away.
		</div>

        <!-- End of required containers -->
    </body>
</html>