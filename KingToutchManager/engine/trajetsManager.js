var fs = require('fs');
var jsonfile = require('jsonfile')
var trajets;

exports.reload();
exports.reload = function(){
    trajets = {};
    fs.readdir("./trajets", (err, files) => {
        if(typeof err != "undefined"){console.log("Trajets directory not found !"); return}
        var count = 0;
        files.forEach(file => {
            trajets[count] = new TrajetFile(file);
            count++;
        });
    });
}
var TrajetFile = function(path){
    this.path = path;
    this.trajet;
}
TrajetFile.prototype.Get = function(cb){
    if(typeof this.trajet == "undefined"){
        jsonfile.readFile(getConfigPath(name), function(err, obj) {
            if(typeof err != "undefined"){
                this.trajet = {};
                this.error = err;
            }
            else{
                this.trajet=obj;
            }
        });
    }
    return this.trajet;
}