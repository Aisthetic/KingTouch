const ACCOMPTS_PATH = "./accompts/";
const KEYS_PATH = "./accompts/keys.json";
var jsonfile = require("jsonfile");
var keys;

exports.IdentificationFrame = function(client){
    
    this.client = client;
    client.on("register-request",(m)=>{
        console.log("Bot request for registering ...");
        keyExist(m.key,(result,expiration)=>{
            if(result === false){
                console.log("Bad key for "+m.username);
                client.send("register-failed",{reason:"La clef d'activation n'existe pas !"});
                return client.close();
            }
            else{
                console.log("Correcte key for "+m.username);
                console.log("Looking for accompt "+getAccomptFilePath(m));
                jsonfile.readFile(getAccomptFilePath(m),(err,obj) => {
                    if(err == null){
                        console.log("Requested accompt already exists !"+err)
                        client.send("register-failed",{reason: "Ce nom de compte n'est pas disponible !"});
                        return client.close();
                    }
                    m.expiration = keys[m.key];
                    jsonfile.writeFile(getAccomptFilePath(m),m,(err)=> {
                        console.log("Accompte file created !");
                        if(err != null){
                            client.send("register-failed",{reason: "Une erreur est survenue l'ors de votre inscriptions, veuillez contacter l'equipe (la clef d'activation est bonne)"});
                            return client.close();
                        }
                    
                        client.send("register-success",{expiration: expiration,key: m.key});

                        delete keys[m.key];
                        saveKeys();

                        return client.close();
                    });

                });
            }
        });
    });
    
    client.on("identification-request",(m)=>{

        getClientInformations(m, (info) => {
            if(typeof info == "undefined"){
                console.log(m.username+" refused !");
                client.send("identification-failed",{reason:"Le compte n'existe pas !"});
            }
            else if(info.canLogin === false){
                console.log(m.username+" refused !");
                client.send("identification-failed",{reason:"Mot de passe incorecte !"});
            }
            else if(info.expiration < new Date().getTime()){
                console.log(m.username+" doit payer sons du !");
                client.send("identification-failed",{reason:"Abonnement expirer !"})
            }
            else{
                console.log(m.username+" accepted !");
                info.password = "";
                delete info.password;
                client.send("identification-success",info);
            }
            client.close();
        });
    });
    
    client.send("ready");
}

function getClientInformations(accompt,callBack){
    jsonfile.readFile(getAccomptFilePath(accompt), function(err, obj) {
		if(err == null){
			if(obj.password === accompt.password){
                callBack(obj);
            }
            else{
                console.log("Bad password for "+accompt.username);
                obj.canLogin = false;
                callBack(obj);
            }
		}
		else{
            callBack();
			console.log("Undefined accompt "+accompt.username);
		}
	});
}

function getAccomptFilePath(accompt){
    return ACCOMPTS_PATH + accompt.username + ".json";
}

function keyExist(key,callBack){
    initializeKeys(()=>{
        if(typeof keys[key] != "undefined"){
            callBack(true,keys[key].expiration);
        }
        else{
            callBack(false);
        }
    });
}

function saveKeys(){
    if(typeof keys == "undefined"){
        console.log("Can't save undefined keys !");
        return;
    }
    jsonfile.writeFile(KEYS_PATH,keys,(err)=>{
        console.log("Keys saved ! ");
    });
}

function initializeKeys(callBack){
    jsonfile.readFile(KEYS_PATH,(err,obj)=>{
        if(err == null){
            keys = obj;
            callBack();
        }
        else{
            console.log("Can't read keys file !");
            console.log(err);
            keys = {};
            saveKeys();
            callBack();
        }
    });
}