var version = "0.1";
var util = require("util");

function Jester(){
  var BOT = this;

  BOT.loadModule = function(path){
    try{
      require(path).call(BOT);
    } catch(ex){
      console.log("Error loading bot module '"+path+"': "+ex.current);
      if(ex instanceof SyntaxError) throw ex;
    }
  }

  this.init = function(){
    BOT.version = version;
    BOT.useragent = "Jester "+version;
    BOT.port = BOT.port || 4000;
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
      "chatlog",
      "restart"
    ];

    var plugins = [
      "basic_commands",
      "antikick",
      "nametrigger",
      "mind"
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
    // Load Modules
    //
    modules.forEach(function(mod){
      BOT.loadModule("./modules/"+mod+".js");
    });

    //
    // Load Plugins
    //
    plugins.forEach(function(plugin){
      BOT.loadModule("./plugins/"+plugin);
    });

  }

  BOT.init();

  BOT.run = function(port){
    if(port){
      BOT.port = port;
    }
		BOT.process('run', {start_time: new Date()},function(o,d){
      console.log();
      BOT.log('Running Jester @ '+o.start_time);
      if(BOT.config("auto_connect") == true){
        BOT.connect();
      }
			d(o);
		});
	};

}

module.exports = Jester;
