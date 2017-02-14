var EventWrapper = require("event-wrapper");
//bot
//castSpellInfos
//castSpellInfos.targetId
//castSpellInfos.tragetCellId
//castSpellInfos.spellId


exports.processCastSpell = function(bot,castSpellInfos,cb){
	var spellSuccess = false;
	var spellCasting = false;
	var wrap = EventWrapper(bot.connection.dispatcher,function(error){
		cb(error);
	});

	wrap("GameActionFightNoSpellCastMessage",function(m){
		spellSuccess=false;
		wrap.done("No spell message !");
	});

	wrap("GameActionFightSpellCastMessage",function(m){
		if(m.sourceId == bot.data.characterInfos.contextualId){
			bot.data.fightManager.spellCasted(castSpellInfos.spellId);
			spellSuccess=true;
		}
	});

	wrap("BasicNoOperationMessage",function(m){
		if(spellCasting){
			if(spellSuccess){
				wrap.done();
			}
		}
	});

	if(typeof castSpellInfos.spellId == "undefined"){
		wrap.done("unknow spell id !");
	}
	else if(typeof castSpellInfos.trajetId != "undefined"){
		spellCasting=true;
		bot.connection.sendMessage("GameActionFightCastOnTargetRequestMessage",castSpellInfos);
	}
	else if(typeof castSpellInfos.cellId != "undefined"){
		spellCasting=true;
		bot.connection.sendMessage("GameActionFightCastRequestMessage",castSpellInfos);
	}
	else{
		wrap.done("unknow cellId or trajet id !");
	}
}
