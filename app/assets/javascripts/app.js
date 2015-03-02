/* 
 *	TEMPLATE IMPORTS
 */
var link = document.querySelector('link[rel="import"]');
var content = link.import;

// import nav
var el = content.querySelector('nav');
document.body.appendChild(el.cloneNode(true));

// import footer
var el = content.querySelector('footer');
$('body').append(el.cloneNode(true));

/* 
 *	CANVAS CIRCLES
 */
makeCanvasCircle(document.getElementById("supportCircle"), "#BE6747");
makeCanvasCircle(document.getElementById("locationCircle"), "#BE6747");
makeCanvasCircle(document.getElementById("socialCircle"), "#BE6747");
makeCanvasCircle(document.getElementById("findCircle"), "#FFFFFF");
makeCanvasCircle(document.getElementById("watchCircle"), "#FFFFFF");
makeCanvasCircle(document.getElementById("friendsCircle"), "#FFFFFF");

function makeCanvasCircle(canvas, circleColor){
	var context = canvas.getContext('2d');
	var centerX = canvas.width / 2;
	var centerY = canvas.height / 2;
	var radius = 70;

	context.beginPath();
	context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	context.fillStyle = circleColor;
	context.fill();
}


/* 
 *	MOBILE CONNECT
 */
window.localStorage.clear();

var discoveryServiceUriDefault="https://stage-exchange-test.apigee.net/gsma/v2/discovery"; //NOT GOING TO CHANGE 
// KONG DISCOVERY bAGDtUyghGlOMoml7mTD2SCypkjvXFfc eLnuTIpTZebOM1oB
var discoveryServiceUri="https://stage-exchange-test.apigee.net/gsma/v2/discovery"; 
var discoveryClientID="bAGDtUyghGlOMoml7mTD2SCypkjvXFfc"; 
var discoveryClientSecret="Z9hy5sz8DALmBpn6MR7Nvd04"; 
var logoServiceUri="https://sb2.exchange.gsma.com/v1/logo"; 

var apiClientID=null;
var apiClientSecret=null;

var operatorIdentified=false; //SHOULD BE USING THIS SOMEWHERE!
var operatorName = null;
var mcc=null;
var mnc=null;
var discRespApiClientID = null;
var discRespSubscriberId = null;
var authorizationEndpoint = null;

var authorizationEndpoint=null;

function atStartup() {
    if (sessionStorage.getItem("loggedin")) {
        console.log("LOGGED IN WITH TOKEN: " + sessionStorage.getItem("loggedin"));
        getAppContent();
    }

    // $("#cannotFindOperator").show();
    // $("#foundOperator").hide();
    getLogos();
}

function getLogos() {
    var sourceIP=null;
    var logosize="medium";
    var colormode="normal";
    var aspect="landscape";
    var mcc=null;
    var mnc=null;
    getLogo(logoServiceUri, mcc, mnc, sourceIP, 'operatorid', logosize, colormode, aspect, logoComplete);
}
  
function logoComplete(logoResult) {
    if (logoResult && logoResult.logos && logoResult.logos.length>=1) {
        var url = getCacheApiLogo('exchange', 'operatorid', 'medium', 'normal', 'landscape');
        if (!!url) {
            var first = logoResult.logos[0];
            url = first.url;
        }
        if (!!url) {
            $('#loginlogo').html('<img src=\''+url+'\'alt=\'Login with Mobile Connect\'/>');
        }
    }
}

function startDemo(){
    // steve's demo parsed mnc mcc here
    startActiveDiscovery();
}

function startActiveDiscovery() {
    var encrypt="basic";
    var sourceIP=null;
    var msisdn=null;
    var redirectUri="http://thisnatasha.com/mobileconnectdemo/app/discovered.html"; 
    var mcc=null;
    var mnc=null;

    getDiscoveryActive(discoveryServiceUri, discoveryClientID, discoveryClientSecret, encrypt, mcc, mnc, msisdn, sourceIP, redirectUri, activeDiscoveryComplete);
}

function activeDiscoveryComplete(discoveryResult, status) {
    console.log("SUCCESS: Active Discovery Complete");

    if (status==200) {
        $('#status').val('Discovery complete');
        if (discoveryResult && !!discoveryResult.getResponse()) {
            if (discoveryResult.getResponse().
                getApiFunction('operatorid', 'authorization')) {
                parseDiscoveryResult(discoveryResult)
            }
        }
    }
}

function parseDiscoveryResult(discoveryResult){
    // console.log("\nIN FUNCTION: parseDiscoveryResult");
    // console.log(discoveryResult);

    operatorName = discoveryResult.getResponse().getServing_operator();
    discRespApiClientID = discoveryResult.getResponse().getClient_id();
    discRespSubscriberId = discoveryResult.getResponse().getSubscriber_id();
    authorizationEndpoint = discoveryResult.getResponse().getApiFunction('operatorid', 'authorization');

    runAuthorization();

    $("#cannotFindOperator").hide();
    $("#foundOperator").show();
    $("#foundOperator #foundOperatorName").text(operatorName);
}

function  runAuthorization(){
    var prompt='login';
    var max_age=3600;
    var acr_values='2';
    var login_hint=null;
    // if (!!discoveryResult.subscriberId) {
    //     login_hint="ENCR_MSISDN:"+subscriberId;
    // }

    var authorizationOptions = new AuthorizationOptions('page', 'en', 'en', 'Enter MSISDN', login_hint, null);
    var state='State'+Math.random().toString(36);
    var nonce='Nonce'+Math.random().toString(36);
    var redirect_uri='http://thisnatasha.com/mobileconnectdemo/app/authorization.html';

    //REWRITING THE AUTHORISATION ENDPOINT HERE TO REFLECT DIALOG PLATFORM
    // authorizationEndpoint = "https://identity.mifetest.com:9443/oauth2/authorize";
    // discRespApiClientID = "gn_4etsUykydKQ7KmluCfuOHZFka";
    // apiClientSecret = "XMulJazG3Y3nKjoWrcgKKYsYDHga";
    //END
    // console.log("    authorizationEndpoint: " + authorizationEndpoint); 
    // console.log("    discRespApiClientID: " + discRespApiClientID);
    // console.log("    apiClientSecret: " + apiClientSecret);

    //authorize(authorizationEndpoint, discRespApiClientID, 'openid profile email userinfo', redirect_uri, 'code', state, nonce, prompt, max_age, acr_values, authorizationOptions, authorizationCallbackFunction);
    authorize(authorizationEndpoint, discRespApiClientID, 'openid profile email', redirect_uri, 'code', state, nonce, prompt, max_age, acr_values, authorizationOptions, authorizationCallbackFunction);
}

function authorizationCallbackFunction(data) {
	var code=data['code'];
    var state=data['state'];
    var error=data['error'];

    var discoveryDetails=getCacheDiscoveryItem();
    var tokenEndpoint=discoveryDetails.getResponse().getApiFunction('operatorid', 'token');
    var apiClientID=discoveryDetails.getResponse().getClient_id();
    var apiClientSecret=discoveryDetails.getResponse().getClient_secret();

    // REWRITING THE TOKEN ENDPOINT HERE TO REFLECT DIALOG PLATFORM, CLIENT ID, CLIENT SECRET
    // tokenEndpoint = "https://identity.mifetest.com:9443/oauth2/token";
    // apiClientID = "gn_4  etsUykydKQ7KmluCfuOHZFka";
    // apiClientSecret = "XMulJazG3Y3nKjoWrcgKKYsYDHga";
    apiClientID = "bAGDtUyghGlOMoml7mTD2SCypkjvXFfc";
    apiClientSecret = "eLnuTIpTZebOM1oB";
    // END

    console.log("GET TOKEN");
    // console.log("   tokenEndpoint: " + tokenEndpoint);
    // console.log("   apiClientID: " + apiClientID);
    // console.log("   apiClientSecret: " + apiClientSecret);

    if (code && code!=null && (code.trim().length)>0) {
        $('#status').val('Authorized');
        $('#code').val(code);

        tokenFromAuthorizationCode(tokenEndpoint, code, apiClientID, apiClientSecret,'http://thisnatasha.com/mobileconnectdemo/app/authorization.html', tokenReceived);
    } else {
        console.log("error");
        $('#status').val('Error');
    }
}

function tokenReceived(token) {
    console.log(token);

    if (!!token.refresh_token) $('#refresh_token').val(token.refresh_token);
    if (!!token.expires_in) $('#expires_in').val(token.expires_in);
    if (!!token.token_type) $('#token_type').val(token.token_type);
    if (!!token.access_token) {
        $('#access_token').val(token.access_token);
        var discoveryDetails = getCacheDiscoveryItem();
        //var userinfoEndpoint = discoveryDetails.getResponse().getApiFunction('operatorid', 'userinfo');
        $('#status').val('Authorized + access token retrieved');
        // if (userinfoEndpoint && userinfoEndpoint.trim().length>0) {
        //     userinfo(userinfoEndpoint, token.access_token, userinfoCallbackFunction);
        // }

        // store unsafely in js session storage
        if (sessionStorage) {
            sessionStorage.setItem("loggedin", token.access_token);
            sessionStorage.setItem("refresh", token.refresh_token);
            console.log("STORAGE SET");
            
            getAppContent();
         }

    }
}

function getAppContent(){
	$('#loginnav').css("display", "none");
    $('#logoutnav').css("display", "block");

	var el = content.querySelector('#yourein');
	$('#page').replaceWith(el.cloneNode(true));

	$(".friend a").click(function(e) {
 		e.preventDefault();

	  	var friendid = $(this).attr("id");
	  
	  	var video = "#videos ." + friendid;
	  	console.log(video);
	  	$("#videos .video").hide();
	  	$(video).show();
	});
}

function logout(){
	revokeToken(url, access_token, client_id, client_secret);
	sessionStorage.clear();
	location.reload();
}
