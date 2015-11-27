module.exports = function(){

  var BOT = this;
  if(!BOT.web.socket){
    throw "Web socket not available. Load webserver module first";
  }

  var bot_events = [
    "load_module",
    "run",
    "connect",
    "disconnected",
    "connected",
    "login",
    "handshake",
    "join",
    "part",
    "config",
    "channel_create",
    "recv:msg",
    "command",
    "recv:join",
    "recv:part"
  ];

  //
  // Broadcast these bot events as-is to the web client
  BOT.events.on("event", function(event_id, data){
    //if(bot_events.indexOf(event_id)<0) return;
    BOT.web.socket.emit(event_id, data);
    BOT.web.socket.emit("bot event", { event: event_id, data: data });
  });

  BOT.web.socket.on('connection', function (socket) {
    socket.emit('connected', {});
    socket.on("bot connect", function(){
      BOT.connect();
    });
  });
};
