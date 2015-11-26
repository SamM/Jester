var socket = io.connect('http://localhost:4000');

socket.on('connected', function (data) {
  console.log("Websocket Connected");
});

var Jester = new (function(){
  var BOT = this;

  BOT.run = function(){
    socket.emit("run", {});
  };
  BOT.on_event = function(data){
    console.log(data.event+": "+JSON.stringify(data.data));
  };

  socket.on("bot event", BOT.on_event);
})();
