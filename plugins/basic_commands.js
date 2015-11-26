module.exports = function(){
  var BOT = this;

  // Say
  BOT.plugin("say", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
    		BOT.send.msg(o.channel, o.params.join(" "));
    	}
    }
    this.precommand('say', cmd);

  });

  // Action
  BOT.plugin("action", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 1)){
    		BOT.send.action(o.channel, o.params.join(" "));
    	}
    }
    this.precommand('action', cmd);
    this.precommand('me', cmd);

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
    this.precommand('join', cmd);

  });

  // Chat
  BOT.plugin("chat", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
    	this.send.chat(o.from);
    }
    this.precommand('chat', cmd);

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
    this.precommand('part', cmd);

  });

  // Quit / Disconnect
  BOT.plugin("quit", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		BOT.send.disconnect();
    	}
    }
    this.precommand('quit', cmd);
    this.precommand('disconnect', cmd);

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
    this.precommand('kick', cmd);

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
    this.precommand('trig', cmd);
    this.precommand('trigchg', cmd);

  });

};
