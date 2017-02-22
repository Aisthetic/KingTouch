var listener = require("./IO/clientListener.js");
var IdentificationFrame = require("./frames/identificationFrame.js").IdentificationFrame;

listener.on("client-accepted",(client)=>{
    console.log("Loading identification frame ...");
    var newFrame = new IdentificationFrame(client);
});


listener.listen();

console.log("Waiting for identification requests ...");