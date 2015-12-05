module.exports = function(){
  var BOT = this;
  BOT.config = function(key, value, safe){
    BOT.config.load();
    if(typeof value == "undefined"){
      BOT.events.emit("config", {key: key, value: BOT.config.data[key]});
      BOT.events.emit("config_get", {key: key, value: BOT.config.data[key]});
      return BOT.config.data[key];
    }
    if(BOT.config.data.hasOwnProperty(key) && safe) return;
    BOT.events.emit("config_set", {key: key, value: value});
    BOT.events.emit("config", {key: key, value: value});
    BOT.config.data[key] = value;
    BOT.config.save();
  }
  BOT.config.filename = __dirname+"/../config/bot.js";
  BOT.config.data = {};
  BOT.config.unset = function(key){
    BOT.config.load();
    if(BOT.config.data.hasOwnProperty(key)){
      delete BOT.config.data[key];
      BOT.config.save();
    }
  };
  BOT.config.get = function(key){
    BOT.config.load();
    return BOT.config.data[key];
  };
  BOT.config.set = function(key, value, safe){
    BOT.config.load();
    if(BOT.config.data.hasOwnProperty(key) && safe) return;
    BOT.config.data[key] = value;
    BOT.config.save();
  };
  BOT.config.load = function(){
    BOT.process("config_load", {
      filename: BOT.config.filename
    }, function(o,d){
      try{
        BOT.config.data = require(o.filename);
      }catch(e){
        BOT.log("*** Creating Empty Config File *");
        BOT.config.data = {};
        BOT.config.save();
      }
      d(o);
    })
  }
  BOT.config.save = function(){
    BOT.process("config_save", {
      filename: BOT.config.filename,
      data: BOT.config.data
    }, function(o, d){
      var file = "module.exports="+JSON.stringify(o.data)+";";
      require("fs").writeFile(o.filename, file, function(err){
        if(err) BOT.log("ERROR> Saving config file `"+o.filename+"`");
        d(o);
      });
    });
  }
}
