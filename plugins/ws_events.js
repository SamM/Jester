module.exports = function(){

  var BOT = this;
  if(!BOT.web.socket){
    throw "Web socket not available. Load webserver plugin first";
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
  bot_events.forEach(function(event){
    BOT.events.on(event, function(data){
      BOT.web.socket.emit(event, data);
      BOT.web.socket.emit("bot event", { event: event, data: data });
    });
  });

  BOT.web.socket.on('connection', function (socket) {
    socket.emit('connected', {});
    socket.on("bot connect", function(){
      BOT.connect();
    });
  });
};
