var Jester = require("./Jester");
var BOT = new Jester();

//
// These can be set using the web control panel: (TODO)
//
BOT.autojoin("sumobot", "Botdom");
BOT.config("owner", "sumopiggy");
BOT.config("trigger", "?");

BOT.DEBUG = false;
BOT.run();
