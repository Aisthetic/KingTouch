var registeredDelay = {};
var inProcess = {};
init();
function init(){
    registeredDelay["trajet_map_loaded"] = {delay : 200,rnd:200};
    registeredDelay["fight_turn_action_delay"] = {delay : 10,rnd:20};
    registeredDelay["fight_starting_max_delay"] = {delay:6000,rnd:0};
    registeredDelay["regen_begin"] = {delay:2000,rnd:200};
    registeredDelay["free_soul"] = {delay:800,rnd:0}
    registeredDelay["frist_interactive_use"] = {delay:400,rnd:300} 
}
exports.getDelay = function(indicatif){
    if(typeof registeredDelay[indicatif] != "undefined"){
        return registeredDelay[indicatif].delay + Math.floor((Math.random() * registeredDelay[indicatif].rnd));
    }
    else{
        console.log("Undefined delay for indicatif : "+indicatif);
        return 300+ Math.floor((Math.random() * 300));
    }
}
//return canceling method
exports.processDelay = function(indicatif,cb){
    var callBack = function(){
        delete inProcess[indicatif];
        cb();
    }
    var handle = setTimeout(callBack,exports.getDelay(indicatif));
    if(typeof inProcess[indicatif] != "undefined"){
         console.trace(indicatif+" already in use, canceling previous timeout");
         clearTimeout[inProcess[indicatif]];
    }
    inProcess[indicatif] = handle;
    return function(){
        console.log("Action : "+indicatif+" canceled !");
        clearTimeout(handle);
        delete inProcess[indicatif];
    }

}