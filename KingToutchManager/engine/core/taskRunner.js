exports.TaskRunner = function(bot,running){
	if(typeof running == "undefined"){ running=true }
	this.bot=bot;
	this.running = running;
	this.tasks = {};
}
exports.TaskRunner.prototype.processTasks = function(){
	for(var i in tasks){
		tasks[i].running = true;
	}
}

function registerTask = function(task, bot){
	
}