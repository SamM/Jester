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
        var msg = o.params.join(" ");
    		BOT.send.msg(channel, msg);
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
        console.log(o.params)
        switch(o.params[0]){
          case "remove":
          if(o.params.length > 1){
            var channels = o.params.slice(1);
            BOT.autojoin.remove.apply(BOT, channels);
            BOT.send.msg_to(o.channel, o.from, "Removed from Autojoin: "+channels.map(function(ns){ return BOT.simpleNS(ns); }).join(", "))
          }
          break;

          case "add":
          if(o.params.length > 1){
            var channels = o.params.slice(1);
            BOT.autojoin.add.apply(BOT, channels);
            BOT.send.msg_to(o.channel, o.from, "Added to Autojoin: "+channels.map(function(ns){ return BOT.simpleNS(ns); }).join(", "))
          }
          break;

          case "list":
          default:
          // Return all of the channels in
          var list = BOT.config("autojoin");
          var msg = (!list || !list.length)
              ? "There are no autojoin channels configured."
              : "Autojoin Channels: "+list.map(function(ns){ return BOT.simpleNS(ns); }).join(", ");
          BOT.send.msg_to(o.channel, o.from, msg);
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
        if(o.params.length==1 && o.params[0]==""){
          BOT.send.part(o.channel);
        }else{
          o.params.forEach(function(chan){
      			BOT.send.part(chan);
      		});
        }
    	}
    }
    this.command.before('part', cmd);

  });

  // Quit
  BOT.plugin("quit", {enabled: true}, function(plugin){

    function quit(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		BOT.send.disconnect();
        BOT.web.server.destroy();
    	}
    }

    this.command.before('quit', quit);

  });

  // Disconnect
  BOT.plugin("disconnect", {enabled: true}, function(plugin){

    function disconnect(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
    		BOT.send.disconnect();
    	}
    }
    this.command.before('disconnect', disconnect);

  });

  // Restart
  BOT.plugin("restart", {enabled: true}, function(plugin){

    function cmd(o){
      if(!plugin.enabled) return;
      if(BOT.checkAuth(o.from, 5)){
        //BOT.send.msg_to(o.channel, o.from, "Ok! BRB :D");
        BOT.restart();
    	}
    }
    this.command.before('restart', cmd);

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
    		if(o.params.length && o.params[0] != ""){
          var trigger = o.params[0];
    			BOT.config("trigger", trigger);
    			BOT.send.msg_to(o.channel,o.from,"My trigger is now "+trigger);
        }
    	}
    }
    this.command.before('trig', cmd);
    this.command.before('trigger', cmd);
    this.command.before('trigchg', cmd);

  });

  BOT.plugin("control_panel_reply", {enabled: true, replace_with: ""}, function(plugin){

    BOT.before("send.msg_to", function(o,d){
      if(plugin.enabled && o.to == "*WEB*"){
        o.to = plugin.replace_with;
      }
      d(o);
    });

  });

};
