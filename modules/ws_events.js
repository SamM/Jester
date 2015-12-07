module.exports = function(){

  var BOT = this;
  if(!BOT.web.socket){
    throw "Web socket not available. Load webserver module first";
  }

  var dAmn_events = [
    "connect",
    "connected",
    "disconnect",
    "disconnected",
    "channel_create",
    "join",
    "part",
    "recv.join",
    "recv.part"
  ];

  var normal_events = [
    "log",
    "chat.log",
    "config"
  ];

  var load_config = [
    "username",
    "trigger",
    "damn_token",
    "access_token",
    "refresh_token",
    "autojoin",
    "user_icon",
    "owner",
    "auto_connect"
  ];

  BOT.logout = function(){
    BOT.config("damn_token", null);
    BOT.config("access_token", null);
    BOT.config("refresh_token", null);
  };

  var event_history = [];

  function queue_event(event){
    event_history.push(event);
  }

  dAmn_events.forEach(function(method){
    BOT.events.on(method, function(data){
      queue_event(["dAmn."+method, data]);
      BOT.web.socket.emit("CP", "dAmn."+method, data);
    });
  })

  normal_events.forEach(function(method){
    BOT.events.on(method, function(data){
      queue_event([method, data]);
      BOT.web.socket.emit("CP", method, data);
    });
  })

  load_config.forEach(function(key){
    BOT.config(key);
  });

  BOT.web.socket.on('connection', function (socket) {
    var data = {};
    var auth_url = BOT.oauth.getAuthorizeUrl({
      redirect_uri: 'http://localhost:4000/auth/provider/deviantart/callback',
      scope: ['user'],
      state: "Hello World",
      response_type: "code"
    });
    data.auth_url = auth_url;

    socket.emit('CP', "reset");
    socket.emit('CP', "connected", data);

    if(event_history.length){
      event_history.forEach(function(args){
        socket.emit.bind(socket, "CP").apply(socket, args);
      });
    }

    socket.on("BOT", function(method){
      var args = [].slice.call(arguments,1);
      var path = method.split(".");

      var scope = self = BOT;
      var step;
      while(step = path.shift()){
        if(typeof scope[step] == "undefined"){
          BOT.events.emit("uncaught_cp_event", method, args);
          return;
        }
        self = scope;
        scope = scope[step];
      }

      if(typeof scope == "function"){
        scope.apply(self, args);
      }else{
        BOT.events.emit("uncaught_cp_event", method, args);
      }
    });
  });
};
