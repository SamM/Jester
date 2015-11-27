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
    this.before_command('say', cmd);

  });

  // Action
  BOT.plugin("action", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 1)){
    		BOT.send.action(o.channel, o.params.join(" "));
    	}
    }
    this.before_command('action', cmd);
    this.before_command('me', cmd);

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
    this.before_command('join', cmd);

  });

  // Chat
  BOT.plugin("chat", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
    	this.send.chat(o.from);
    }
    this.before_command('chat', cmd);

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
    this.before_command('part', cmd);

  });

  // Quit / Disconnect
  BOT.plugin("quit", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		BOT.send.disconnect();
    	}
    }
    this.before_command('quit', cmd);
    this.before_command('disconnect', cmd);

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
    this.before_command('kick', cmd);

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
    this.before_command('trig', cmd);
    this.before_command('trigchg', cmd);

  });

};
