var version = "0.1";
var EventEmitter = require('events');

function Jester(){
  var BOT = this;
  var modules = [
    "ns",
    "utils",
    "logging",
    "config",
    "processing",
    "plugins",
    "connection",
    "users",
    "commands",
    "send",
    "autojoin"
  ];

  //
  // Add Event Handling
  //
  BOT.events = new EventEmitter();

  //
  // Load Modules
  //
  modules.forEach(function(mod){
    try{
      require("./modules/"+mod).call(BOT);
      BOT.events.emit("load_module", mod);
    } catch(ex){ console.log("Error loading bot module '"+mod+"': "+ex); }
  });

  //
  // Set Config Defaults
  //
  BOT.set("version", version);
  BOT.set("useragent", "Jester "+version);
  BOT.set("trigger", "``");
  BOT.set("owner", "sumopiggy")
  BOT.set("username", "UNKNOWN");

  this.run = function(){
		BOT.process('run', {start_time: Date.now()},function(o,d){
			BOT.set("start_time", o.start_time);
			BOT.log('Running Jester @ '+o.start_time);
			BOT.connect();
			d(o);
		});
	};

}

module.exports = Jester;
