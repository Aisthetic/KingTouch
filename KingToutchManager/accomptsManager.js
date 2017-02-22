const ACCOMPTS_FILE = "./accompts.json";
const USER_ACCOMPT_FILE = "./user.json";
var jsonfile = require('jsonfile');


exports.accompts = null;

exports.getAccompts = function(){
    var accompts = [];
    for(var i in exports.accompts){
        accompts.push(exports.accompts[i]);
    }
    return accompts;
}
exports.addAccompt = function(accompt){
    console.log(accompt);
    exports.accompts[accompt.username] = accompt;
    exports.saveFile();
}
exports.loadFile = function(){
    jsonfile.readFile(ACCOMPTS_FILE, (err, obj) => {
		if(err == null){
			exports.accompts = obj;
            console.log(JSON.stringify(obj));
		}
		else{
            console.log("No accompt file found !");
			exports.accompts = {};
            exports.saveFile();
		}
	});
}
exports.saveFile = function(){
    jsonfile.writeFile(ACCOMPTS_FILE, exports.accompts,  (err) => {

	});
}

exports.getUserKey = function(callBack){
    jsonfile.readFile(USER_ACCOMPT_FILE,(err,obj)=>{
        if(err == null){
            if(typeof obj.key != "undefined"){
                return callBack(true,obj.key);
            }
        }
        
        return callBack(false);
    });
}

exports.setUserKey = function(key,callBack){
    jsonfile.writeFile(USER_ACCOMPT_FILE,{key:key},(err)=>{
        if(err == null){
            return callBack(true);
        }
        
        return callBack(false);
    });
}

exports.loadFile();