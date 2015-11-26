module.exports = function(){
  var BOT = this;
  this.command = function(command, channel, from, params){
    BOT.process('command', {'command': command, 'channel': channel, 'from': from, 'params': params, 'handled': 0}, function(o, d){
      if(!o.handled){
        BOT.process('command:'+o.command, {'command': o.command, 'channel': o.channel, 'from': o.from, 'params': o.params, 'handled': 0}, function(ob, done){
          if(!ob.handled){
            BOT.events.emit("unhandled_command", ob);
            BOT.send.msg_to(ob.channel, ob.from, 'Command not recognized: <b>'+ob.command+'</b>');
            ob.handled++;
            o.handled++;
          }
          done(ob);
          d(o);
        });
      }else{
        d(o);
      }
    });
  };
  this.precommand = function(command, fn){
    BOT.pre('command:'+command, function(o,d){
      o.handled++;
      fn(o);
      d(o);
    });
  };
  this.postcommand = function(command, fn){
    BOT.post('command:'+command, function(o,d){
      o.handled++;
      fn(o);
      d(o);
    });
  };
}
