var mapViewers = {};
function showTab(tab,sender){
	$(".tab-page-header").removeClass("active");
	$(sender).addClass("active");
	$(".page-content").removeClass("tab-page-active");
	$(".tab-page-"+tab).addClass("tab-page-active");
}
function bindClientToServer(clientId,groupeName){
	mapViewers[groupeName+":"+clientId] = new MapViewer(document.getElementById(getBotViewClass(clientId,groupeName)).getElementsByClassName("mapCanvas")[0]);
	$("#"+getBotViewClass(clientId,groupeName)+" .btn-trajet-load").on("click",function(){
		var trajet = "undefined";
		try{
			var trajet = JSON.parse($("#"+getBotViewClass(clientId,groupeName)+" .trajet-text").val());
		}
		catch(e){
			alert("Erreur(s) de syntaxe dans le trajet !");
		}
		if(trajet != "undefined"){
			sendUI(getMessageName(clientId,groupeName,"trajetLoad"),trajet);
		}
	});
	addClientListener(clientId,groupeName,"loaded",function(m){
		showBotTab(clientId,groupeName);
	});
	addClientListener(clientId,groupeName,"log",function(m){
			var d = new Date;
		var addtext = "["+ d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"]";
		$("#"+getBotViewClass(clientId,groupeName)+" "+".console-content").append("<span>"+addtext+m.detail.log+"</span></br>");

	});
	addClientListener(clientId,groupeName,"mapLoaded",function(m){
		window.setTimeout(function(){
			mapViewers[groupeName+":"+clientId].SetMap(m.detail);
		},500);
	});
	addClientListener(clientId,groupeName,"characterSelected",function(m){
		$("#"+getBotHeaderClass(clientId,groupeName)+" a").text(m.detail.character.name);
		loadPileSpells(clientId,groupeName,m.detail.config.fight.spells);
	});
	addClientListener(clientId,groupeName,"spellsLoaded",function(spells){
		loadSpells(clientId,groupeName,spells.detail);
	});
	addClientListener(clientId,groupeName,"packetSend",function(m){
		addPacket(clientId,groupeName,m.detail,false);
	});
	addClientListener(clientId,groupeName,"packetReceive",function(m){
		addPacket(clientId,groupeName,m.detail,true);
	});
}
function savePile(sender){
	var clientId = $(sender).attr("client");
	var groupeName = $(sender).attr("groupe");
	var pile = [];
	$(".pile-item").each(function(index){
		pile.push({index:index,id:$(this).attr("spellId"),type:$(this).attr("castOn"),name:$(this.getElementsByClassName("name-label")).text(),cibleText:$(this.getElementsByClassName("cible-label")).text()});
	});
	sendUI(getMessageName(clientId,groupeName,"savePile"),pile);
}
function addClientListener(clientId,groupeName,callName,callBack){
	window.addEventListener(groupeName+":"+clientId+callName,callBack);
}
function getMessageName(clientId,groupeName,callName){
	return groupeName+":"+clientId+callName;
}
function scroll_to(div){
	if (div.scrollTop < div.scrollHeight - div.clientHeight)
	div.scrollTop += 10; // move down
}
