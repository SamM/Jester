module.exports = function(){
  var BOT = this;
  BOT.send = {
    handshake: function(){
      BOT.process('send:handshake', {'agent': BOT.config("useragent")}, function(o,d){
        BOT.send.pkt("dAmnClient 0.3","agent="+o.agent,''); d(o)
      });
    },
    login: function(){
      var token = BOT.config("damn_token");
      var username = BOT.config("username");
      if(!token){
        BOT.process("error", {type: "login", error: "No damn_token supplied in config"});
        return;
      }
      if(!username){
        BOT.process("error", {type: "login", error: "No username supplied in config"});
        return;
      }
      BOT.process('send:login', {'username': username, 'pk': token}, function(o,d){
        BOT.send.pkt("login "+o.username,"pk="+o.pk,''); d(o)
      })
    },
    autojoin: function(){
      BOT.process('autojoin', {'channels': BOT.config("autojoin")}, function(o,d){
        o.channels.forEach(function(ns){ BOT.send.join(ns) });
        d(o)
      });
      return BOT;
    },
    join: function(ns){
      if(ns[0]=="@" || ns.slice(0,6)=="pchat:") return BOT.send.chat(ns);
      BOT.process('send:join', {'channel': BOT.formatNS(ns)}, function(o,d){
        BOT.send.pkt("join "+o.channel, ''); d(o)
      })
    },
    chat: function(ns){
      if(!ns) return;
      if(ns[0]=="#" || ns.slice(0,5)=="chat:") return this.join(ns);
      BOT.process('send:chat', {'channel': BOT.formatChatNS(ns, BOT.config("username"))}, function(o,d){
        BOT.send.pkt("join "+o.channel, ''); d(o)
      })
    },
    part: function(ns){
      BOT.process('send:part', {'channel': BOT.formatNS(ns)}, function(o,d){
        BOT.send.pkt("part "+o.channel, ''); d(o)
      })
    },
    pong: function(){
      BOT.process('send:pong', function(o,d){
        BOT.send.pkt("pong", ''); d(o)
      })
    },
    disconnect: function(){
      BOT.process('send:disconnect', function(o,d){
        BOT.send.pkt("disconnect",'');
        d(o)
      });
    },
    msg_to: function(ns,to,msg){
      BOT.send.msg(ns,to+": "+msg);
    },
    msg: function(ns,msg){
      BOT.process('send:msg', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"msg main",'',o.text); d(o)
      });
    },
    action: function(ns,msg){
      BOT.process('send:action', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"action main",'',o.text);  d(o)
      });
    },
    npmsg: function(ns,msg){
      BOT.process('send:npmsg', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"npmsg main",'',o.text);  d(o)
      });
    },
    promote: function(ns,user,priv){
      BOT.process('send:promote', {'channel': BOT.formatNS(ns), 'user': user, 'priv': priv}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"promote "+o.user,'',o.priv||'');  d(o)
      });
    },
    demote: function(ns,user,priv){
      BOT.process('send:demote', {'channel': BOT.formatNS(ns), 'user': user, 'priv': priv}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"demote "+o.user,'',o.priv||'');  d(o)
      });
    },
    kick: function(ns,user,reason){
      BOT.process('send:kick', {'channel': BOT.formatNS(ns), 'user': user, 'reason': reason}, function(o,d){
        BOT.send.pkt("kick "+o.channel,"u="+o.user,'',o.reason||'');  d(o)
      });
    },
    ban: function(ns,user){
      BOT.process('send:ban', {'channel': BOT.formatNS(ns), 'user': user}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"ban "+o.user,'');  d(o)
      });
    },
    unban: function(ns,user){
      BOT.process('send:unban', {'channel': BOT.formatNS(ns), 'user': user}, function(o,d){
        BOT.send.pkt("send "+o.channel,'',"unban "+o.user,'');  d(o)
      });
    },
    pkt: function(){
      var data = [].slice.call(arguments).join("\n")+"\u0000";
      BOT.process('send:pkt', {'pkt': data}, function(o,d){
        BOT.DEBUG && BOT.log([BOT.config("username"),"SEND",o.pkt.replace(/\n/g,"\\n").replace(/\u0000/g,"\\u0000")].join(">"));
        BOT.connection.write(o.pkt);
         d(o)
      });
    }
  };
}
