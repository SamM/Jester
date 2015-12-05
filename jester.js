var version = "0.1";

function Jester(){
  var BOT = this;

  BOT.version = version;
  BOT.useragent = "Jester "+version;
  BOT.port = 4000;
  BOT.username = null;

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
    "oauth",
    "webserver",
    "ws_events",
    "chatlog"
  ];

  var plugins = [
    "basic_commands",
    "antikick"
    //"botcheck"
  ];

  var directories = [
    "./plugins",
    "./views",
    "./web",
    "./web/modules",
    "./web/modules/css",
    "./web/modules/js",
    "./web/plugins",
    "./web/plugins/js",
    "./web/plugins/css",
    "./config"
  ];

  //
  // Check that all directories exist, otherwise create them
  //
  var dir_index = 0;
  var fs = require("fs");
  directories.forEach(function(dir){
    if(!fs.existsSync(dir)){
      console.log("*** Making directory: "+dir+" *");
      fs.mkdirSync(dir);
    }
  });

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

  BOT.run = function(port){
    if(port){
      BOT.port = port;
    }
		BOT.process('run', {start_time: new Date()},function(o,d){
      console.log();
      BOT.log('Running Jester @ '+o.start_time);
			d(o);
		});
	};

}

module.exports = Jester;
