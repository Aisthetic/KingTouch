var spells={};
function createClient(clientId,groupeName,cb){
	if(typeof groupes[groupeName] =="undefined"){
		groupes[groupeName] = [];
		$(".bot-header-sidebar").append('<ul id="groupe-sidebar-'+makeSafeForCSS(groupeName)+'" class="nav nav-sidebar"><li><h4 class="nav-groupe-header">'+groupeName+'</h4></li></ul>');
	}
	$("#groupe-sidebar-"+makeSafeForCSS(groupeName)).append('<li class="bot-header" onClick="showBotTab(\''+clientId+'\',\''+groupeName+'\')" id="'+getBotHeaderClass(clientId,groupeName)+'"><a>Déconnecté</a></li>');
	groupes[groupeName].push(clientId);
	$("#no-client-header").css("display","none");
	$.get( "botView.html", function( data ) {
		var viewClass = getBotViewClass(clientId,groupeName);
		$(".main").append('<div class="bot-view" id="'+getBotViewClass(clientId,groupeName)+'">'+data+'</div>');
		bindClientToServer(clientId,groupeName);
		if(typeof cb != "undefined"){
			cb();
		}
		showBotTab(clientId,groupeName);
	});
}
function loadSpells(clientId,groupeName,spellsLoad){
	spells[groupeName+clientId] = spellsLoad;
	var spellsListItem = "#"+getBotViewClass(clientId,groupeName)+" .spells-list";
	$(spellsListItem).html("");
	for(var i in spellsLoad){
		var s = spellsLoad[i];
		$(spellsListItem).append('<li class="list-group-item"><span>'+s.nameId+'</span><button type="button" onclick="addSpellToPile('+s.id+','+clientId+',\''+groupeName+'\');" class="btn btn-primary btn-add-spell"><span class="glyphicon glyphicon-plus"></span></button></li>');
	}
}
function loadPileSpells(clientId,groupeName,spellsLoad){
	var spellsListItem = "#"+getBotViewClass(clientId,groupeName)+" .spells-pile-list";
	$(spellsListItem).html();
	for(var i = 0; i<spellsLoad.length;i++){
		var s = spellsLoad[i];
		$(spellsListItem).append('<li spellId="'+s.id+'" castOn="'+s.type+'" class="pile-item list-group-item"><span class="name-label">'+s.name+'</span><span class="cible-label"> '+s.cibleText+'</span><button type="button" class="btn btn-primary btn-add-spell"><span class="glyphicon glyphicon-pencil"></span></button></li>');
	}
	$("#"+getBotViewClass(clientId,groupeName)+" .btn-save-pile").attr("client",clientId);
	$("#"+getBotViewClass(clientId,groupeName)+" .btn-save-pile").attr("groupe",groupeName);
	$("#"+getBotViewClass(clientId,groupeName)+" .btn-clear-pile").attr("client",clientId);
	$("#"+getBotViewClass(clientId,groupeName)+" .btn-clear-pile").attr("groupe",groupeName);
}
var addingSpellInfo = {};
function addSpellToPile(spellId,clientId,groupeName){
	addingSpellInfo={key:groupeName+clientId,keyValue:spellId,id:clientId,groupe:groupeName};
	showWin(".add-spell-win");
}
function addSpellConfirm(){
	hideWin(".add-spell-win");
	var s = spells[addingSpellInfo.key][addingSpellInfo.keyValue];
	$("#"+getBotViewClass(addingSpellInfo.id,addingSpellInfo.groupe)+" .spells-pile-list").append('<li spellId="'+addingSpellInfo.keyValue+'" castOn="'+$("#add-spell-cible").attr("actionId")+'" class="pile-item list-group-item"><span class="name-label">'+s.nameId+'</span><span class="cible-label"> '+$("#add-spell-cible").text()+'</span><button type="button" class="btn btn-primary btn-add-spell"><span class="glyphicon glyphicon-pencil"></span></button></li>');
}
function clearPile(s){
		$("#"+getBotViewClass($(s).attr("client"),$(s).attr("groupe")) +" .spells-pile-list").html("");
}
function addPacket(clientId,groupeName,packet,received){
	var addtext;
	var text=packet;
	if(received){
		addtext="receive : ";
	}
	else{
		addtext="send : ";
		text=JSON.stringify(packet);
	}
	var d = new Date;
	addtext = "["+ d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"]" + addtext;
	$("#"+getBotViewClass(clientId,groupeName) +" .packet-content").append('<li class="packet-item">'+addtext+text+'</li>');
}
function getBotHeaderClass(clientId,groupeName){
	return 'bot-header-'+makeSafeForCSS(groupeName)+'-'+clientId;
}
function getBotViewClass(clientId,groupeName){
	return 'bot-view-'+makeSafeForCSS(groupeName)+'-'+clientId;
}
function getClient(clientId,groupeName){
	return document.getElementById(getBotViewClass(clientId,groupeName));
}

//View handler
function mainVieLoadClient(){
	showWin(".win-load-client");
}
function mainViewLoadClientCancel(){
	hideWin(".win-load-client");
}
function showWin(className){
	$(".win").fadeOut();
	$("#dark-mask").fadeIn();
	$(className).fadeIn();
}
function saveSpells(){

}
function hideWin(className){
	$("#dark-mask").fadeOut();
	$(className).fadeOut();
}
function showLoading(){
	$("#dark-mask").fadeIn();
	$(".sk-cube-grid").fadeIn();
}
function hideLoading(){
	$(".sk-cube-grid").fadeOut();
	$("#dark-mask").fadeOut();
}
function mainViewLoadClientConfirm(){
	var user = $("#username-input").val();
	var pass = $("#password-input").val();
	console.log(user+pass);
	//todo check infos before send it to server
	sendUI("connectClient",{username:user,password:pass});
	hideWin(".win-load-client");
}

function changeAddSpellCibleOption(sender){

}
function changeAddSpellCountOption(sender){

}
//utils

function showBotTab(clientId,groupeName){
	$(".bot-header").removeClass("active");
	$("#"+getBotHeaderClass(clientId,groupeName)).addClass("active");
	$(".bot-view").css("display","none");
	$("#"+getBotViewClass(clientId,groupeName)).fadeIn();
}
function makeSafeForCSS(name) {
    return name.replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c == 32) return '-';
        if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
}
