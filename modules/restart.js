module.exports=function(){
  var BOT = this;
  this.restart = function(){
    BOT.process("restart", {keep: ["run", "init", "loadModule", "port"] }, function(o,d){
      var keys = Object.keys(BOT),
          keep = o.keep;

      BOT.send.disconnect();
      BOT.after("connection_closed", function(o,d){
        BOT.web.server.destroy(function(){
          console.log("Server closed")
          keys.forEach(function(key){
            if(keep.indexOf(key) == -1)
              delete BOT[key];
          });

          BOT.init();
          BOT.run();
        });
      });

    });
  }
};
