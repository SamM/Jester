//
// BOT Connection
//
window.BOT = new (function(){
  var BOT = this;
  BOT.socket = null;

  BOT.connect = function(){
    BOT.emit("connect", {});
  };
  BOT.disconnect = function(){
    BOT.emit("send.disconnect", {});
  };
  BOT.config = function(key, value, safe){
    BOT.emit("config", key, value, safe);
  };
  BOT.logout = function(){
    BOT.emit("logout");
  };
  BOT.emit = function(method){
    var args = [].slice.call(arguments, 1);
    BOT.socket.emit.bind(BOT.socket, "BOT", method).apply(BOT.socket, args);
  }

  BOT.init = function(){
    BOT.socket = io.connect('http://localhost:4000');
    BOT.socket.on("CP", function(method){
      var args = [].slice.call(arguments,1);
      var path = method.split(".");

      var scope = self = CP;
      var step;
      while(step = path.shift()){
        if(typeof scope[step] == "undefined"){
          CP.uncaught_event.call(CP, method, args);
          return;
        }
        self = scope;
        scope = scope[step];
      }

      if(typeof scope == "function"){
        scope.apply(self, args);
      }else{
        CP.uncaught_event.call(CP, method, args);
      }
    });
  }

})();
