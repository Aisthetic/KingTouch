const HAAPI_SETTINGS = { 
	config_uri : "https://proxyconnection.touch.dofus.com/config.json?appVersion=",
	create_api_uri : "https://haapi.ankama.com/json/Ankama/v2/Api/CreateApiKey",
	token_creation_uri : "https://haapi.ankama.com/json/Ankama/v2/Account/CreateToken",
};

var request = require("request");

exports.HaapiConnection = function(){
	this.loadedConfig;
	this.loadedHaapi;
	this.loadedToken;
}
exports.HaapiConnection.prototype.processHaapi = function(username,password,callback){
	var self = this;
	self.getConfig(function(config){
		self.createApiKey(username,password,function(){
			self.getToken(config,function(){
				callback(config);
			});
		});
	});
}

exports.HaapiConnection.prototype.getConfig = function(callBack){
	var self = this;
	request({
		uri: HAAPI_SETTINGS.config_uri,
		method: "GET"
	}, function(error, response, body) {
		if(error != null){
			setTimeout((callBack) => self.getConfig,1);
			console.log("Error in config loading ! ("+error+")");
			return;
		}
		callBack(JSON.parse(body));
		console.log(body);
		console.log("Config loaded !");
	});  
};

exports.HaapiConnection.prototype.createApiKey = function(username,password,callBack){
	var self = this;
	var r = "login="+username+"&password="+password+"&long_life_token=false";
	request({
		uri: HAAPI_SETTINGS.create_api_uri,
		method: "POST",
		form:r,
		gzip: true,
		headers : {
			"User-agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.113",
			"Content-type" : "text/plain;charset=UTF-8",
			"Accept" : "application/json",
			"Content-Length" : Buffer.byteLength(r),
			"Accept-Language" : "en-GB",
			"Connection" : "keep-alive",
			"Cache-Control" : "no-cache",
			"Host" : "haapi.ankama.com",
			"Accept-Encoding" : "gzip, deflate",
			"Origin" : "null",
			"Pragma" : "no-cache"
		}
	}, function(error, response, body) {
		if(typeof body == "undefined"){
			self.processHaapi(username,password,callBack);
		}
		else{
		self.loadedHaapi=JSON.parse(body);
		console.log(body);
		console.log("Api key : " + self.loadedHaapi.key);
		callBack();
		}
	}); 
}

exports.HaapiConnection.prototype.getToken = function(config,callBack){
	var self = this;
	request({
		uri: HAAPI_SETTINGS.token_creation_uri+"?game="+config.haapi.id,
		method: "GET",
		headers: { "apikey" : self.loadedHaapi.key }
	}, function(error, response, body) {
		if(typeof body == "undefined"){
			console.log("Token loading failed will retry ...")
			self.getToken(config,callBack);
			return;
		}
		self.loadedToken=JSON.parse(body);		
		console.log("Game token : " + self.loadedToken.token);
		callBack();
	});  
}