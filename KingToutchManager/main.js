var EventEmitter = require("events").EventEmitter;
var processFrame = require("./mainProcessFrame.js");
var botManager = require("./engine/botManager.js");
var webSocket = require("ws");


botManager.on("reconnect",()=>{
    registerBotConnection();
});
botManager.on("connect",()=>{
    registerBotConnection();
});

processFrame.open(botManager);


function registerBotConnection(){
    botManager.currentBot.data.actorsManager.dispatcher.on("characterUpdated",()=>{
        processFrame.sendUI("state-update",processFrame.getBotInfo());
    });
}