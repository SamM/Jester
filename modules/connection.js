var http = require('http'),
	https = require('https'),
	net = require('net');

module.exports = function(){
  var BOT = this;
  this.connection = null;
  this.channels = {};
  this.connect = function(){
    BOT.process('connect', function(o,d){
      BOT.log('Connecting to dAmn');
      var con = BOT.connection = net.createConnection(3900, 'chat.deviantart.com');
      con.on("data",function(p){ BOT.read(p); });
      con.on("connect",function(){ BOT.process('connected', function(o,d){ BOT.send.handshake(); d(o) }); });
      con.on("end", function(){ BOT.disconnected(); })
      d(o);
    });
  };
  this.disconnected = function(){
    BOT.process('disconnected', function(o,d){
      BOT.log("Disconnected from dAmn");
      BOT.connection.end();
      d(o);
    });
  };
  var chunk = "";
  this.read = function(pkt){
		BOT.events.emit("read", pkt);
    pkt = pkt.toString().replace(/\0/g,"\u0000").replace(/\r/g,"\u0000");
    if(false && pkt.indexOf("\u0000")<0){
      chunk = chunk + pkt;
      return;
    }
    if(chunk.length){
      pkt = chunk + pkt;
      chunk = "";
    }
    var pkts = pkt.split("\u0000");
    for(var i=0;i<pkts.length;i++)
      BOT.read_pkt(pkts[i]);
  };
  this.format_data = function(data){
    //
    // Shamelessly copied from Panavia (thanks :-P)
    //
    var dat = {},
    command = null,
    param = null,
    args = {},
    body = null,
    raw = data,
    sep = '=';

    if(!data.length) return;
    if(data.indexOf('\n\n') != -1){
      body = data.slice(data.indexOf('\n\n')+2);
      data = data.slice(0, data.indexOf('\n\n'));
    }
    var breaks = data.split('\n');
    if(!breaks.length) return;
    if(breaks.length >= 1 && breaks[0].indexOf(sep) < 0){
        head = breaks.shift().split(' ');
        command = head[0] || null;
        param = head.length < 2 ? null : head[1];
    }
    breaks.forEach(function(line){
      if(line.indexOf(sep) > -1){
        args[line.slice(0, line.indexOf(sep))] = line.slice(line.indexOf(sep)+sep.length);
      }
    });
    dat['raw'] = raw;
    dat['command'] = command;
    dat['param'] = param;
    dat['args'] = args;
    dat['body'] = body;
    return dat;
  };
  this.read_pkt  = function(pkt){
    if(!pkt.length) return;
    var data = this.format_data(pkt);
		BOT.events.emit("read_pkt", data);
		var cmd = data.command;
    var param = data.param;
    var body = data.body;
    var args = data.args;
		BOT.DEBUG && BOT.log(data);
    BOT.DEBUG && BOT.log([BOT.get("username"),"READ",data.raw].join("<"));
    switch(cmd){
      case "dAmnServer":
        BOT.log("*** Connection to dAmn "+param+" established ***");
				BOT.events.emit("connected", param);
        BOT.send.login();
        break;
      case "login":
        var e = args.e;
        if(e!="ok"){
          BOT.log("*** Failed to authenticate as "+param+" ***\nReason: "+e);
					BOT.events.emit("login", {success: false, username: param, reason: e});
        }else{
          BOT.log("*** Successfully authenticated as "+param+" *** ");
					BOT.events.emit("login", {success: true, username: param});
          BOT.send.autojoin();
        }
        break;
      case "ping":
        BOT.process('ping', function(o,d){
          BOT.log("*PING*PONG*");
					BOT.events.emit("ping");
          BOT.send.pong();
        });
        break;
      case "join":
        var e = args.e;
        if(e!="ok") BOT.log(BOT.get("username")+">Error: Could not join "+BOT._ns(param)+": "+e);
        else BOT.channel_joined(param);
        break;
      case "part":
        var e = args.e;
        if(e!="ok") BOT.log(BOT.get("username")+">ERROR: Could not part "+BOT._ns(param)+": "+e);
        else BOT.channel_parted(param);
        break;
      case "property":
        var prop = args.p;
        (function(){
          switch(prop){
          case "topic":
          case "title":
            BOT['channel_'+prop](param, body, args.by, args.ts);
          break;
          case "members":
          case "privclasses":
            BOT['channel_'+prop](param, body);
          break;
          default:
            if(prop.indexOf("login:")==0){
              BOT.channel_whois(param, prop.slice(6), body);
            }
          break;
          }
        }).call(this);
        break;
      case "kicked":
        var by = args.by;
        BOT.process('kicked', {'channel': param, 'by': by, "reason": args.r || false}, function(o,d){
					BOT.events.emit("kicked", o);
          BOT.log("*** "+BOT.get("username")+" has been kicked from "+BOT.simpleNS(o.channel)+" by "+o.by+" * "+o.reason);
        });
        break;
      case "recv":
        BOT.recv.pkt(data)
        break;
      case "disconnect":
        if(args.e == "ok"){
          // Restart
        }
        BOT.disconnected();
        break;
    }
  };
  this.channel_create = function(ns){
    if(!BOT.channels[BOT.formatNS(ns).toLowerCase()]){
      BOT.process('channel_create', {ns: BOT.formatNS(ns)}, function(o,d){
        BOT.channels[o.ns.toLowerCase()] = {
          'ns': o.ns,
          members: {},
          topic: "",
          title: "",
          privclasses: {}
        };
        d(o);
      });
    }
  };
  this.channel_topic = function(ns, text, by, ts){
    BOT.process('topic', {channel: BOT.formatNS(ns), 'text': this.formatMsg(text)}, function(o,d){
      BOT.log("*** Got topic of "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel);
      BOT.channels[o.channel.toLowerCase()].topic = o.text;
      d(o);
    });
  };
  this.channel_title = function(ns, text, by, ts){
    BOT.process('title', {channel: this.formatNS(ns), 'text': this.formatMsg(text)}, function(o,d){
      BOT.log("*** Got title of "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel);
      BOT.channels[o.channel.toLowerCase()].title = o.text;
      d(o);
    });
  };
  this.channel_members = function(ns, list){
    var members = {},
      member;
    for(var i=0,line;i<list.length;i++){
      line = list[i];
      if(!line.length) member = undefined;
      else if(line.indexOf('member ')==0){
        member = line.split(" ")[1].toLowerCase();
        members[member] = { username: line.split(" ")[1] };
      }else if(line.indexOf('=')>-1 && member){
        pair = line.split("=");
        members[member][pair[0]] = pair[1];
      }
    }
    BOT.process('members', {channel: BOT.formatNS(ns), 'list': list, 'members': members}, function(o,d){
      var list = [],mem;
      for(var i in o.members){
        mem = o.members[i];
        list.push(mem.symbol+mem.username+"("+mem.pc+")")
      }
      BOT.log("*** Got members of "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel);
      BOT.channels[o.channel.toLowerCase()].members = o.members;
      d(o);
    });
  };
  this.channel_privclasses = function(ns, list){
    var privclasses = {};
    for(var i=0,pair;i<list.length;i++){
      if(!list[i] || !list[i].length) continue;
      pair = list[i].split(":");
      privclasses[pair[1]] = pair[0];
    }
    BOT.process('privclasses', {channel: BOT.formatNS(ns), 'list': list, 'privclasses': privclasses}, function(o,d){
      BOT.log("*** Got privclasses of "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel);
      BOT.channels[o.channel.toLowerCase()].privclasses = o.privclasses;
      d(o);
    });
  };
  this.channel_whois = function(ns, text){
		BOT.events.emit("whois", ns, text);
  };
  this.channel_joined = function(ns){
    BOT.process('join', {channel: BOT.formatNS(ns)}, function(o,d){
      BOT.log("*** "+BOT.get("username")+" has joined "+o.channel+" *");
      BOT.channel_create(o.channel);
      d(o);
    })
  };
  this.channel_parted = function(ns){
    BOT.process('part', {channel: BOT.formatNS(ns)}, function(o,d){
      BOT.log("*** "+BOT.get("username")+" has left "+BOT._ns(ns)+" *");
      d(o);
    })
  };
  this.recv = {
    pkt: function(data){
			BOT.events.emit("recv:pkt", {pkt: data});
      var ns = data.param,
				body = data.body,
				chunks = body.split("\n"),
        cmd = chunks[0].split(" ")[0],
				param = chunks[0].split(" ")[1];

			var args = {};
			chunks.slice(1).forEach(function(chunk){
				if(chunk.indexOf("=")>-1){
					chunk = chunk.split("=");
					args[chunk[0]] = chunk[1];
				}
			});

      BOT.DEBUG && BOT.log([BOT.get("username"),"RECV",ns,cmd,param].join("<"));

      switch(cmd){
        case "msg":
        case "action":
          var from = chunks[1].split("=")[1] || "";
          (cmd=="msg"?BOT.recv.msg:BOT.recv.action)(ns,from,chunks[3]||"");
          break;
        case "join":
          BOT.recv.join(ns,param,args);
          break;
				case "part":
          BOT.recv.part(ns,param,args);
          break;
        case "privchg":
          BOT.recv.privchg(ns,param,args);
          break;
        case "kicked":
          BOT.recv.kicked(ns,param,args.by,chunks.pop());
          break;
        case "default":
          BOT.log(BOT.get("username")+"<RECV<ERROR<UNKNOWN_RECV<"+cmd)
      }
    },
    msg: function(ns,from,content){
      BOT.process('recv:msg', {channel: BOT.ns_(ns), from: from, text: BOT.formatMsg(content)}, function(o,d){
        this.logMsg(o.channel, "<"+o.from+"> "+o.text);
        var trig = BOT.get("trigger"), text = o.text;
        if(text.indexOf(trig)==0){
          if(content.indexOf(trig+":")==0)trig+=":";
          if(content.indexOf(trig+" ")==0)trig+=" ";
          var params = text.slice(trig.length).split(" "),
            cmd = params.shift();
          BOT.command(cmd, o.channel, o.from, params);
        }
        d(o);
      });
    },
    action: function(ns, from, content){
      BOT.process('recv:action', {channel: ns, 'from': from, 'text': BOT.formatMsg(content)},
      function(o,d){
        BOT.logMsg(o.channel, "* "+o.from+" "+o.text);
      });
    },
    join: function(ns, user, args){
      BOT.process('recv:join', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" has joined");
      });
    },
    part: function(ns, user, args){
      BOT.process('recv:part', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" has left");
      });
    },
    kicked: function(ns, user, by, reason){
      BOT.process('recv:kicked', {channel: ns, 'user': user, 'by': by, 'reason': BOT.formatMsg(reason)},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" was kicked by "+o.by+" * "+o.reason);
      });
    },
    privchg: function(ns, user, args){
      BOT.process('recv:privchg', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" was promoted to "+o.args.pc+" by "+o.args.by+" *");
      });
    }
  };
}
