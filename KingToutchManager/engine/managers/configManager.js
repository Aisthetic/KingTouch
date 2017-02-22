//si CONFIG_VER est different dans les fihchier de configuration alors toutes les configurations seront ecrasé 
const CONFIG_VER = 1.2
var jsonfile = require('jsonfile')

exports.getConfig = function(name,loadedCb){
	jsonfile.readFile(getConfigPath(name), function(err, obj) {
		if(err == null && obj.version == CONFIG_VER){
			loadedCb(obj);
		}
		else{
			console.log("Set default config for "+name);
			var config=getDefault();
			writeConfig(name,config);
			loadedCb(config);
		}
	});
}
exports.saveConfig = function(name,config){
	config.version = CONFIG_VER;
	writeConfig(name,config);
}

function writeConfig(name,obj){
	jsonfile.writeFile(getConfigPath(name), obj, function (err) {
	  console.error(err)
	});
}
function getConfigPath(name){
	return "./config/"+name+".json";
}
function getDefault(){
	return {
		fight: {
			maxFighter:8,
			minFighter:1,
			monstersBlackList:["undefined"],//nameId des monstres qu´on veut eviter
			minLevel:1,
			maxLevel:300,
			checkLevel:false,
			spells:[],
			type:"default",
			mode:0,
		},
		regen: {
			regenBegin:80,
			regenEnd:100,
			useObject:true,
			maxObjectUse:10
		},
        tasks: {
            selectedCharacteristic: 0,
            executed: false
        },
        inventory: {
            destroyObjectsOnOverload: true,
            objectsBlackList: [],
            sellList: []
        }
	};
}
