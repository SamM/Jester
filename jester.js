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

  var plugins = [
    "basic_commands"
    , "antikick"
    //, "botcheck"
  ];

  //
  // Add Event Handling
  //
  BOT.events = new EventEmitter();

  BOT.loadModule = function(path){
    try{
      BOT.events.emit("load_module", {path: path});
      require(path).call(BOT);
    } catch(ex){ console.log("Error loading bot module '"+mod+"': "+ex); }
  }

  //
  // Load Modules
  //
  modules.forEach(function(mod){
    BOT.loadModule("./modules/"+mod);
  });

  //
  // Load Plugins
  //
  plugins.forEach(function(plugin){
    BOT.loadModule("./plugins/"+plugin);
  });

  //
  // Set Config Defaults
  //
  BOT.set("version", version);
  BOT.set("useragent", "Jester "+version);
  BOT.set("trigger", "?");
  BOT.set("owner", "UNKNOWN");
  BOT.set("username", "UNKNOWN");

  BOT.run = function(){
		BOT.process('run', {start_time: Date.now()},function(o,d){
			BOT.set("start_time", o.start_time);
			BOT.log('Running Jester @ '+o.start_time);
			BOT.connect();
			d(o);
		});
	};

}

module.exports = Jester;
