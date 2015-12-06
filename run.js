var Jester = require("./Jester");
var BOT = new Jester();

var aj = BOT.config("autojoin");
if(!aj || Array.isArray(aj) && !aj.length){
  BOT.autojoin("Botdom");
}

BOT.DEBUG = false;
BOT.run();
