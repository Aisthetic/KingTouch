var EventEmitter = require('events').EventEmitter;
var request = require('./staticContentManager.js').sendWebRequestToDataUrl;
exports.JobsManager = function(bot){
	this.bot = bot;
	this.list = {}; //Liste des métiers du bot
	this.dispatcher = new EventEmitter();
	this.addHandlers();
}
exports.JobsManager.prototype.addHandlers = function(){//Todo gérer les autres messages(pour le moment y'a la connexion et le lvlup à check si il en reste d'autres à gerer)
	var self = this;
	try{
	this.bot.connection.dispatcher.on('JobExperienceMultiUpdateMessage', function (msg) {
		for (var i = 0, len = msg.experiencesUpdate.length; i < len; i += 1) {
			self.updateExperience(msg.experiencesUpdate[i]);
			self.dispatcher.emit('jobExperienceUpdate', self.getJobExperience(msg.experiencesUpdate[i].jobId));
		}
	});
	this.bot.connection.dispatcher.on('JobExperienceUpdateMessage', function (msg) {
		self.updateExperience(msg.experiencesUpdate);
		self.dispatcher.emit('jobExperienceUpdate', self.getJobExperience(msg.experiencesUpdate.jobId));
	});
	this.bot.connection.dispatcher.on('JobLevelUpMessage', function (msg) {
		self.list[msg.jobsDescription.jobId].experience.jobLevel = msg.newLevel;
		self.dispatcher.emit('jobLevelUp', self.list[msg.jobsDescription.jobId]);
	});
	this.bot.connection.dispatcher.on('JobDescriptionMessage', function (msg) {
		for (var i = 0; i < msg.jobsDescription.length; i++) {
			self.updateDescription(msg.jobsDescription[i]);
		}
		self.dispatcher.emit('jobListUpdated');
	});
	}catch(e){console.log(e);}
}
exports.JobsManager.prototype.updateDescription = function(jobDescription) {
	if (!this.list[jobDescription.jobId]) {
		this.list[jobDescription.jobId] = {};
	}
	this.list[jobDescription.jobId].jobDescription = jobDescription
}

exports.JobsManager.prototype.updateExperience = function(jobExperience) {
		if (!this.list[jobExperience.jobId]) {
			this.list[jobExperience.jobId] = {};
		}
		this.list[jobExperience.jobId].experience = jobExperience;
};

/**
 * Returns an object defining the current experience status of a
 * given known job.
 *
 * @param {number|string} jobId
 *
 * @return {object|null} xp
 *                  xp.jobId                - Current job id
 *                  xp.currentLevel         - Current job level
 *                  xp.currentExperience    - Current experiences points count
 *                  xp.levelExperienceFloor - Floor of experience points for this level
 *                  xp.levelExperienceCeil  - Ceil of experience points for this level
 *                  xp.percentage           - Current job percentage
 */
exports.JobsManager.prototype.getJobExperience = function (jobId) {
	var job = this.list[jobId];

	// Do we know this job?
	if (!job) {
		return null;
	}

	var jobExp = job.experience || {};

	var xp = {
		jobId: jobId
	};
	xp.currentLevel = jobExp.jobLevel;
	xp.currentExperience = jobExp.jobXP;
	xp.levelExperienceFloor = jobExp.jobXpLevelFloor;
	xp.levelExperienceCeil = jobExp.jobXpNextLevelFloor;

	xp.percentage = 100;
	if (xp.levelExperienceCeil) {
		xp.percentage = Math.floor((xp.currentExperience - xp.levelExperienceFloor) /
			(xp.levelExperienceCeil - xp.levelExperienceFloor) * 100);
	}

	return xp;
};