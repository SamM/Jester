var version = "0.1";

function Jester(){
  var BOT = this;
  var modules = [
    "ns",
    "utils",
    "events",
    "logging",
    "config",
    "ns",
    "plugins",
    "connection",
    "users",
    "commands",
    "send",
    "autojoin",
    "webserver",
    "ws_events"
  ];

  var plugins = [
    "basic_commands",
    "antikick"
    //"botcheck"
  ];

  //
  // Add Event Handling
  //

  BOT.loadModule = function(path){
    try{
      require(path).call(BOT);
    } catch(ex){ console.log("Error loading bot module '"+path+"': ",ex.stack.split("\n")); }
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
  BOT.config("version", version);
  BOT.config("useragent", "Jester "+version);
  BOT.config("trigger", "?");
  BOT.config("owner", "UNKNOWN");
  BOT.config("username", "UNKNOWN");

  BOT.run = function(){
		BOT.process('run', {start_time: Date.now()},function(o,d){
			BOT.config("start_time", o.start_time);
			BOT.log('Running Jester @ '+o.start_time);
			d(o);
		});
	};

}

module.exports = Jester;
