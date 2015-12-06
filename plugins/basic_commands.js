module.exports = function(){
  var BOT = this;

  // Say
  BOT.plugin("say", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
        var channel = o.channel;
        if(o.params[0][0]=="#"){
          channel = BOT.formatNS(o.params.shift());
        }
    		BOT.send.msg(channel, o.params.join(" "));
    	}
    }
    this.command.before('say', cmd);

  });

  // Action
  BOT.plugin("action", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 1)){
    		BOT.send.action(o.channel, o.params.join(" "));
    	}
    }
    this.command.before('action', cmd);
    this.command.before('me', cmd);

  });

  // Join
  BOT.plugin("join", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 2)){
    		o.params.forEach(function(chan){
    			BOT.send.join(chan);
    		});
    	}
    }
    this.command.before('join', cmd);

  });

  // Autojoin
  BOT.plugin("autojoin", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 2)){
        switch(o.params[0]){
          case "remove":
          if(o.params.length > 1){
            BOT.autojoin.remove.apply(BOT, o.params.slice(1));
          }
          break;

          case "add":
          if(o.params.length > 1){
            BOT.autojoin.add.apply(BOT, o.params.slice(1));
          }
          break;

          case "list":
          default:
          // Return all of the channels in autojoin
          break;
        }
      }
    }
    this.command.before('autojoin', cmd);

  });

  // Chat
  BOT.plugin("chat", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
    	this.send.chat(o.from);
    }
    this.command.before('chat', cmd);

  });

  // Part
  BOT.plugin("part", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 2)){
    		o.params.forEach(function(chan){
    			BOT.send.part(chan);
    		});
    	}
    }
    this.command.before('part', cmd);

  });

  // Quit / Disconnect
  BOT.plugin("quit", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		BOT.send.disconnect();
    	}
    }
    this.command.before('quit', cmd);
    this.command.before('disconnect', cmd);

  });

  // Reconnect
  // Call

  // Kick
  BOT.plugin("kick", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 3)){
    		if(o.params.length)
    			BOT.send.kick(o.channel,o.params.shift(),o.params.join(" "));
    	}
    }
    this.command.before('kick', cmd);

  });

  // Trigger change
  BOT.plugin("trigger_change", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		if(o.params.length){
          var trigger = o.params[0];
    			BOT.config("trigger", trigger);
    			BOT.send.msg_to(o.channel,o.from,"My trigger is now "+trigger);
        }
    	}
    }
    this.command.before('trig', cmd);
    this.command.before('trigchg', cmd);

  });

};
