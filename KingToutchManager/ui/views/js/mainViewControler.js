$(document).ready(function(){
	initializeMainView();
	$("#add-spell-cible-drop li").click(function(){
		$("#add-spell-cible").text($(this).text());
		$("#add-spell-cible").attr("actionid",$(this).attr("actionid"));
	});
});
var groupes = {};
function initializeMainView(){
	window.addEventListener("globalUpdate",function(m){
		for(var bot in m.detail.bots){
			loadGroupe(m.detail.bots[bot],bot);
		}
	});
	window.addEventListener("clientLoaded",function(m){
		console.log("[mainViewControler]Client loaded !");
		createClient(m.detail.clientId,m.detail.groupeName);
	});

	connectUI();
}
//loading
function loadGroupe(groupe,name){

	for(var i = 0;i<groupe.length;i++){
		var clientToLoad = groupe[i];
		createClient(clientToLoad.id,clientToLoad.groupe,function(){
			rescureBotView(clientToLoad);
		});
	}
}
function rescureBotView(data){
	if(typeof data.characterInfos != "undefined"){
		emitUI(data.groupe+":"+data.id+"characterSelected",{character : data.characterInfos,config: data.config});
		console.log(data.config);
	}
	if(typeof data.map != "undefined"){
		emitUI(data.groupe+":"+data.id+"mapLoaded",data.map);
	}
	if(typeof data.spells != "undefined"){
		emitUI(data.groupe+":"+data.id+"spellsLoaded",data.spells);
	}
}
