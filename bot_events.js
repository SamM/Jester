module.exports = function(socket){

  if(!socket) return;

  var BOT = this;

  socket.emit('connected', {});

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
    "set",
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
      socket.emit(event, data);
      socket.emit("bot event", { event: event, data: data });
    });
  });

  socket.on("run", function(){
    BOT.run();
  });
};
