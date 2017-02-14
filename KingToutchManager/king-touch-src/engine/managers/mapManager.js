const CHANGE_MAP_MASK_RIGHT  =  1 |  2 | 128;
const CHANGE_MAP_MASK_BOTTOM =  2 |  4 | 8;
const CHANGE_MAP_MASK_LEFT   =  8 | 16 | 32;
const CHANGE_MAP_MASK_TOP    = 32 | 64 | 128;
var getMapPointFromCellId = require("./../core/utils/pathfinding.js").getMapPoint;
var EventEmitter = require("events").EventEmitter;
var request = require("request");

exports.MapManager = function(bot){
	var self=this;
	this.bot = bot;
	this.dispatcher = new EventEmitter();
	this.map = null;
	this.mapId = null;
	this.hasMap = false;
	this.interactives = {};
	this.statedes = {};

	this.bot.connection.dispatcher.on("CurrentMapMessage",function(m){
		self.mapId=m.mapId;
		var mapUrl = global.config.assetsUrl+"/maps/"+m.mapId+".json";
		doRequest(mapUrl,m,(m,id)=>{self.update(m,id)});
		
		function doRequest(uri,m,u){
			request({uri: uri,method: "GET"}, function(error, response, body) {
				if(typeof body != "undefined"){
					var updatedMap = JSON.parse(body);
					u(updatedMap,m.mapId);
				}
				else{
					doRequest(uri,m,u);
				}
			});	
		}
	});
	this.bot.connection.dispatcher.on("MapComplementaryInformationsDataMessage",(m)=>{
		this.interactives = {};
		this.statedes = {};
		for(var i =0;i< m.interactiveElements.length;i++){
			this.interactives[m.interactiveElements[i].elementId] = m.interactiveElements[i];
		}
		for(var i=0;i< m.statedElements.length;i++){
			this.statedes[m.statedElements[i].elementId] = m.statedElements[i];
		}
	});

};
exports.MapManager.prototype.update = function(map,mapId){
	this.map=map;
	this.mapId=mapId;
	this.hasMap = true;
	this.path
	this.dispatcher.emit("loaded",map);
};
exports.MapManager.prototype.isWalkable = function (cellId, isFightMode) {
	var mask = isFightMode ? 5 : 1;
	return (this.map.cells[cellId].l & mask) === 1;
};
exports.MapManager.prototype.getChangeMapFlag = function (cellId) {
	var mapChangeData = this.map.cells[cellId].c || 0;
	if (mapChangeData === 0) { return {}; }
	var flags = {
		left:   mapChangeData & CHANGE_MAP_MASK_LEFT   && (cellId % 14 === 0),
		right:  mapChangeData & CHANGE_MAP_MASK_RIGHT  && (cellId % 14 === 13),
		top:    mapChangeData & CHANGE_MAP_MASK_TOP    && (cellId < 28),
		bottom: mapChangeData & CHANGE_MAP_MASK_BOTTOM && (cellId > 531)
	};
	if (flags.left)   { return 'left';   } else
	if (flags.right)  { return 'right';  } else
	if (flags.top)    { return 'top';    } else
	if (flags.bottom) { return 'bottom'; }
	return null;
};
exports.MapManager.prototype.getNeighbourId = function(flag){
	if (flag == "top"){
		return this.map.topNeighbourId;
	}
	else if(flag == "left"){
		return this.map.leftNeighbourId;
	}
	else if(flag =="right"){
		return this.map.rightNeighbourId;
	}
	else if(flag =="bottom"){
		return this.map.bottomNeighbourId;
	}
}
exports.MapManager.prototype.getDistance = function(source, target) {
	source = getMapPointFromCellId(source);
	target = getMapPointFromCellId(target);
	return Math.abs(source.x - target.x) + Math.abs(source.y - target.y);
}

exports.MapManager.prototype.checkChangeMapCell = function(cellId,direction){//todo j´ais remarquer que sur le client offi certaine change map cell ne fonctionnais pas il faudrais ajouter une blacklist comme sur le mitm pour etre 100%sur
	if (cellId >= 0 && cellId <= 559 && cellId != 13){//si la cellid est dansle coin a droite alors 1/2 le change map flag est faux donc on oublie 13 ok
		return (this.getChangeMapFlag(cellId) == direction && this.isWalkable(cellId));
	}
	else{
		return false;
	}
}
exports.MapManager.prototype.getRandomCellId = function(direction,source)
{
	source =this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id].disposition.cellId;
	var selected;
	var minDist=0;
	for(var i = 0; i<559;i++){
		if(this.checkChangeMapCell(i,direction))
		{
			if(minDist==0 && this.getDistance(i,source) > 1){
				minDist=this.getDistance(source,i);
				selected=i;
			}
			else{
				var newDist=this.getDistance(source,i);
				if(newDist<minDist && this.getDistance(i,source) > 1){
					minDist=newDist;
					selected=i;
				}
			}
		}
	}

	return selected;
}
