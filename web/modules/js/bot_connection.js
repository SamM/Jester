//
// BOT Connection
//
window.BOT = new (function(){
  var BOT = this;
  BOT.socket = null;
  BOT.send = {};

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

  BOT.send.disconnect = BOT.disconnect;

  BOT.send.parse = function(ns, text){
    if(text[0]!="/"){
      BOT.send.msg(ns, text);
    }else{
      var params = text.split(" "),
          cmd = params.shift().slice(1);
      BOT.command(ns, cmd, params);
    }
  };

  BOT.command = function(ns, cmd, params){
    BOT.emit("command", cmd, ns, "*WEB*", params);
    return;

    switch(cmd){
      case "say":
      BOT.send.msg(ns, params.join(" "));
      break;
      case "npmsg":
      BOT.send.npmsg(ns, params.join(" "));
      break;
      case "me":
      case "action":
      BOT.send.action(ns, params.join(" "));
      break;
      case "join":
      params.forEach(function(chan){
        if(chan.length){
          BOT.send.join(chan);
        }
      });
      break;
      case "chat":
      params.forEach(function(user){
        if(user.length){
          BOT.send.chat(user);
        }
      });
      break;
      case "part":
      if(params.length == 1 && params[0]==""){
        BOT.send.part(ns);
        break;
      }
      params.forEach(function(chan){
        if(chan.length){
          BOT.send.part(chan);
        }
      });
      break;
      case "ban":
      BOT.send.ban(ns, params[0]);
      break;
      case "unban":
      BOT.send.unban(ns, params[0]);
      break;
      case "promote":
      BOT.send.promote(ns, params[0], params[1]);
      break;
      case "demote":
      BOT.send.demote(ns, params[0], params[1]);
      break;
      case "kick":
      BOT.send.kick(ns, params[0], params.slice(1).join(" "));
      break;
    }
  }

  //"cmd"         param1, param2, param3
  var send_1 = [
    "join",     // ns
    "chat",     // ns
    "part"      // ns
  ];
  var send_2 = [
    "msg",      // ns, msg
    "npmsg",    // ns, msg
    "action",   // ns, msg
    "ban",      // ns, user
    "unban"     // ns, user
  ];
  var send_3 = [
    "promote",  // ns, user, pc
    "demote",   // ns, user, pc
    "kick"      // ns, user, reason
  ];
  send_1.forEach(function(cmd){
    BOT.send[cmd] = function(param1){
      BOT.emit("send."+cmd, param1);
    };
  })
  send_2.forEach(function(cmd){
    BOT.send[cmd] = function(param1, param2){
      BOT.emit("send."+cmd, param1, param2);
    };
  })
  send_3.forEach(function(cmd){
    BOT.send[cmd] = function(param1, param2, param3){
      BOT.emit("send."+cmd, param1, param2, param3);
    };
  })

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
