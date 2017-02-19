var INDEX_URI = "./king-touch-src/data/maps/subAreas.json";
var MAPS_URI = "https://ankama.akamaized.net/games/dofus-tablette/assets/2.15.15/maps/";
var staticContentManager = require("./king-touch-src/engine/managers/staticContentManager.js");
var jsonFile = require("jsonfile");
var mkdirp = require('mkdirp');
var request = require('request');

var index = null;

exports.init = function(callBack){
    jsonFile.readFile(INDEX_URI, (err, obj) => {
		if(err == null){
            index = obj;
            console.log("Maps ready !");//todo verifier que toutes les maps sont la et trouver un moyens de mettre a jours les nouvelle maps sans tout re dl :3 
            callBack();
        }
        else{
            console.log("No maps found !");
            exports.update(callBack);
        }
    });
}

exports.update = function(callBack){
    var subAreasIndex = staticContentManager.getSubAreasInfos((result) => {
        index = result;
        jsonFile.writeFile(INDEX_URI, result, (err) => {
            if(err != null){
                return console.error(err);  
            }
            console.log("SubAreas indexes writed !");
            exports.getMaps(callBack);
        });
    });
}

exports.getMaps = function(callBack){
    if(typeof index === "undefined"){
        console.error("Can't get maps, undefined index !");
    }
    console.log("Downloading maps ...");
    var areaPaths = [];
    for(var i in  index){
        areaPaths.push({id:i, path: preCreateSubArea(index[i])});;
    }
    
    getAllSubArea(0,areaPaths,callBack);
}

function getAllSubArea(i,dirs,finalCallBack){
    if(dirs.length < i+1){
    getSubArea(dirs[i], 0, index[dirs[i].id].mapIds,()=>{
        i++;
        getAllSubArea(i,dirs,finalCallBack);
    });
    }
    else{
        finalCallBack();
    }
}

function getSubArea(dir ,i , mapIds, finalCallBack){
		var mapUrl = MAPS_URI+mapIds[i]+".json";
        request({uri: mapUrl,method: "GET"}, function(error, response, body) {
            if(typeof body != "undefined"){  
                var map;
                try{
                    map = JSON.parse(body);
                }
                catch(e){
                    console.log("Error in parsing "+mapIds[i]);
                    i++; 
                    if(mapIds.length <= i){
                        finalCallBack();
                        console.log("Sub area downloaded !");
                        return;
                    }
                    getSubArea(dir,i,mapIds,finalCallBack);
                    return;

                }
                jsonFile.writeFile(dir.path+"/"+mapIds[i]+".json",map,(err)=>{
                    i++;
                    if(mapIds.length <=  i){
                        finalCallBack();
                        console.log("Sub area downloaded !");
                        return;
                    }
                    getSubArea(dir,i,mapIds,finalCallBack);

                });
            }
            else{
                console.error("Can't get map "+mapIds[i]);
            }
        });	
}

function preCreateSubArea(area){
    let dir = './king-touch-src/data/maps/'+area.id;
    return "./king-touch-src/data/maps";
}