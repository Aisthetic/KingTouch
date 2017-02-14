var EventWrapper = require('event-wrapper');

exports.processGameContext = function(bot){
	var sequenceNumber = 0;
	var wrap = EventWrapper(bot.connection.dispatcher,function(error){
		bot.logger.log("[processGameContext]Has crashed, error : "+error);
	});
	wrap("CharacterSelectedSuccessMessage",processCharacterRequests);

	var characterRequested = false;
	function processCharacterRequests(){
		bot.data.context ="ROLEPLAY";
		if(characterRequested == true){return}
		characterRequested=true;
		setTimeout(function(){
			bot.connection.sendMessage("moneyGoultinesAmountRequest");
			bot.connection.sendMessage("QuestListRequestMessage");
			bot.connection.sendMessage("FriendsGetListMessage");
			bot.connection.sendMessage("IgnoredGetListMessage");
			bot.connection.sendMessage("SpouseGetInformationsMessage");
			bot.connection.sendMessage("moneyGoultinesAmountRequest");
			bot.connection.sendMessage("moneyGoultinesAmountRequest");
			bot.connection.sendMessage("moneyGoultinesAmountRequest");
			bot.connection.send("bakSoftToHardCurrentRateRequest");
			bot.connection.send("bakHardToSoftCurrentRateRequest");
			bot.connection.send("kpiStartSession",{accountSessionId: bot.login, isSubscriber: false});//todo
			bot.connection.sendMessage("ClientKeyMessage",{ key:getRandomFlashKey() });
			bot.connection.sendMessage("GameContextCreateRequestMessage");
		},320);
	}

	wrap("moneyGoultinesAmountSuccess",function(){
		bot.connection.sendMessage("ObjectAveragePricesGetMessage");
	});
	wrap("CurrentMapMessage",function(m){
		bot.player.blackList = [];
		bot.connection.sendMessage("MapInformationsRequestMessage",{mapId:m.mapId});
	});
	wrap('BasicLatencyStatsRequestMessage',function(){
		bot.connection.sendMessage('BasicLatencyStatsMessage', { latency: 262, sampleCount: 12, max: 50 });//les values sonts comme sa dans le client ....
	});
	wrap('send:login', function () {
		sequenceNumber = 0;
	});
	wrap("CharacterSelectedForceMessage",function(m){
		self.logger.log("Reconnecion en combat ...");
		setTimeout(function(){
			self.connection.sendMessage("CharacterSelectedForceReadyMessage");
		},5);
	});
	wrap('SequenceNumberRequestMessage',function(){
		sequenceNumber += 1;
		bot.connection.sendMessage('SequenceNumberMessage', { number: sequenceNumber });
		console.log("Sequence ready !");
	});
	wrap("TextInformationMessage",function(m){
		bot.logger.log("[Infos]"+m.text);
	});
}

function checksum(s) {
	var r = 0;
	for (var i = 0; i < s.length; i++) {
		r += s.charCodeAt(i) % 16;
	}
	return (r % 16).toString(16).toUpperCase();
}
function getRandomChar() {
	var n = Math.ceil(Math.random() * 100);
	if (n <= 40) {
		return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
	}
	if (n <= 80) {
		return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
	}
	return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
}

function getRandomFlashKey() {
	var key = '';
	for (var i = 0; i < 20; i++) {
		key += getRandomChar();
	}
	return key + checksum(key);
}
