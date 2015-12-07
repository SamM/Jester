var http = require('http'),
	https = require('https'),
	net = require('net');

module.exports = function(){
  var BOT = this;
	this.connected = false;
  this.connection = null;
  this.channels = {};
  this.connect = function(){
    BOT.process('connect', function(o,d){
			if(!BOT.config("damn_token") || !BOT.config("username")){
				BOT.log('*** Could not connect to dAmn *** (insufficient bot config)');
				d(o);
				return;
			}
      BOT.log('*** Connecting to dAmn ***');
      var con = BOT.connection = net.createConnection(3900, 'chat.deviantart.com');
			BOT.connected = true;
			con.on("data",function(p){ BOT.read(p); });
      con.on("connect",function(){ BOT.process('connected', function(o,d){ BOT.send.handshake(); d(o) }); });
      con.on("end", function(){ BOT.connection_closed(); })
      d(o);
    });
  };
  this.disconnected = function(){
    BOT.process('disconnected', function(o,d){
      BOT.log("*** Disconnected from dAmn ***");
      BOT.connection.end();
			BOT.connected = false;
      d(o);
    });
  };
	this.connection_closed = function(){
		BOT.process('connection_closed', function(o,d){
			BOT.connected = false;
      d(o);
    });
	};
  var data = "";
  this.read = function(chunk){
		BOT.process("read", {chunk: chunk}, function(o,d){
			var chunk = o.chunk.toString().replace(/\0/g,"\u0000").replace(/\r/g,"\u0000");
			data += chunk;
			while(data.indexOf("\u0000")>-1){
				var index = data.indexOf("\u0000");
				var pkt = data.slice(0, index);
				data = data.slice(index+1);
				BOT.read_pkt(pkt);
			}
			d(o);
		});
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
		BOT.process("read_pkt",{ pkt: pkt, data: data },function(o,d){
			var data = o.data;
			var cmd = data.command;
	    var param = data.param;
	    var body = data.body;
	    var args = data.args;
			//BOT.DEBUG && BOT.log(data);
	    BOT.DEBUG && BOT.log(data.raw);
	    switch(cmd){
	      case "dAmnServer":
	        BOT.log("*** Connection to dAmn "+param+" established ***");
					BOT.process("connected",{version: param},function(o2,d2){
						BOT.send.login();
						d2(o2);
					});
	        break;
	      case "login":
	        var e = args.e;
					BOT.process("login",{ event: e, success: e=="ok", username: param },function(o2,d2){
						if(!o2.success){
		          BOT.log("*** Failed to authenticate as "+o2.username+" ***\nReason: "+o2.event);
		        }else{
		          BOT.log("*** Successfully authenticated as "+o2.username+" *** ");
		          BOT.send.autojoin();
		        }
						d2(o2);
					});
	        break;
	      case "ping":
	        BOT.process('ping', function(o2,d2){
						BOT.send.pong();
						d2(o2);
	        });
	        break;
	      case "join":
	        var e = args.e;
	        if(e!="ok") BOT.log("ERROR: Could not join "+BOT._ns(param)+": "+e);
	        else BOT.channel_joined(param);
	        break;
	      case "part":
	        var e = args.e;
	        if(e!="ok") BOT.log("ERROR: Could not part "+BOT._ns(param)+": "+e);
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
					BOT.kicked(param, args.by, args.r);
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
			d(o);
		});
  };
	this.kicked = function(channel, by, reason){
		BOT.process('kicked', {'channel': channel, 'by': by, "reason": reason?reason:""}, function(o,d){
			BOT.log("*** "+BOT.config("username")+" has been kicked from "+BOT.simpleNS(o.channel)+" by "+o.by+" * "+o.reason);
			BOT.chat.self_kicked(o.channel, o.by, o.reason);
			d(o);
		});
	};
	this.get_channel = function(ns){
		var ns = BOT.formatNS(ns).toLowerCase();
		return BOT.channels[ns];
	};
	this.channel_destroy = function(ns){
		var ns = BOT.formatNS(ns).toLowerCase();
		delete BOT.channels[ns];
	}
  this.channel_create = function(ns, data, safe){
    BOT.process('channel_create', {ns: BOT.formatNS(ns), data: data?data:{}, safe: safe}, function(o,d){
			var data = o.data;
			var safe = !!o.safe;
			var ns = o.ns.toLowerCase();
			if(BOT.channels[ns]){
	      for(var key in data){
	        var value = data[key];
	        if(!safe){
	          BOT.channels[ns][key] = value;
	        }else{
	          if(typeof value == "string"){
	            if(BOT.channels[ns][key] == ""){
	              BOT.channels[ns][key] = value;
	            }
	          }else if(Array.isArray(value)){
	            if(BOT.channels[ns][key].length == 0){
	              BOT.channels[ns][key] = value;
	            }
	          }else if(typeof value == "object"){
	            if(Object.keys(BOT.channels[ns][key]).length == 0){
	              BOT.channels[ns][key] = value;
	            }
	          }
	        }
	      }
	    }else{
				var channel = {};
	      channel.topic = data.topic?data.topic:"";
	      channel.title = data.title?data.title:"";
	      channel.members = data.members?data.members:{};
				channel.privclasses = data.privclasses?data.privclasses:{};
	      channel.ns = o.ns;
	      BOT.channels[ns] = channel;
	    }
      d(o);
    });
  };
  this.channel_topic = function(ns, text, by, ts){
    BOT.process('topic', {channel: BOT.formatNS(ns), 'text': this.formatMsg(text), by: by, ts: ts}, function(o,d){
      BOT.log("*** Got topic for "+BOT.simpleNS(o.channel)+" ***");
			var channel = BOT.get_channel(o.channel);
			if(channel.topic != ""){
				BOT.chat.topic(o.channel, o.by, o.text, o.ts);
			}
      BOT.channel_create(o.channel, {topic: o.text});
      d(o);
    });
  };
  this.channel_title = function(ns, text, by, ts){
    BOT.process('title', {channel: this.formatNS(ns), 'text': this.formatMsg(text), by: by, ts: ts}, function(o,d){
      BOT.log("*** Got title for "+BOT.simpleNS(o.channel)+" ***");
			var channel = BOT.get_channel(o.channel);
			if(channel.title != ""){
				BOT.chat.title(o.channel, o.by, o.text, o.ts);
			}
      BOT.channel_create(o.channel, {title: o.text});
      d(o);
    });
  };
  this.channel_members = function(ns, list){
    var members = {},
      member;
		var blocks = list.split("\n\n");
		for(var b=0; b<blocks.length; b++){
			var lines = blocks[b].split("\n");
			if(lines.length > 1){
				var username = lines[0].split(" ")[1];
				if(members[username]){
					members[username].instances++;
				}else{
					var member = {};
					member.username = username;
					member.instances = 1;
					if(members[username]){
						members[username].instances++;
					}
					for(var l = 1; l<lines.length; l++){
						var line = lines[l].split("=");
						member[line[0]] = line[1];
					}
					members[username] = member;
				}
			}
		}
    BOT.process('members', {channel: BOT.formatNS(ns), 'list': list, 'members': members}, function(o,d){
      BOT.log("*** Got members for "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel, {members: o.members});
      d(o);
    });
  };
  this.channel_privclasses = function(ns, list){
    var privclasses = {};
		var lines = list.split("\n");
		lines.forEach(function(line){
			if(line.length){
				line = line.split(":");
				privclasses[line[0]] = line[1];
			}
		});
    BOT.process('privclasses', {channel: BOT.formatNS(ns), 'list': list, 'privclasses': privclasses}, function(o,d){
      BOT.log("*** Got privclasses for "+BOT.simpleNS(o.channel)+" ***");
      BOT.channel_create(o.channel, {privclasses: o.privclasses});
      d(o);
    });
  };
  this.channel_whois = function(ns, args){
		BOT.process("whois", { channel: ns, args: args }, function(o,d){
			d(o);
		})
	};
  this.channel_joined = function(ns){
    BOT.process('join', {channel: BOT.formatNS(ns)}, function(o,d){
      BOT.log("*** "+BOT.config("username")+" has joined "+o.channel+" *");
      BOT.channel_create(o.channel);
			BOT.chat.self_join(o.channel);
      d(o);
    })
  };
  this.channel_parted = function(ns){
    BOT.process('part', {channel: BOT.formatNS(ns)}, function(o,d){
      BOT.log("*** "+BOT.config("username")+" has left "+BOT._ns(ns)+" *");
			BOT.chat.self_part(o.channel);
			BOT.channel_destroy(o.channel);
      d(o);
    })
  };
  this.recv = {
    pkt: function(data){
			BOT.process("recv.pkt", { data: data }, function(o,d){
				var data = o.data,
					ns = data.param,
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

	      BOT.DEBUG && BOT.log([BOT.config("username"),"RECV",ns,cmd,param].join("<"));

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
	          BOT.log("RECV ERROR: Recieved unknown cmd: "+cmd)
	      }
				d(o);
			});
    },
    msg: function(ns,from,content){
      BOT.process('recv.msg', {channel: BOT.ns_(ns), from: from, text: BOT.formatMsg(content)}, function(o,d){
        this.logMsg(o.channel, "<"+o.from+"> "+o.text);
				BOT.chat.msg(o.channel, o.from, o.text);
        var trig = BOT.config("trigger"), text = o.text;
        if(text.indexOf(trig)==0){
          var params = text.slice(trig.length).split(" "),
            cmd = params.shift();
          BOT.command(cmd, o.channel, o.from, params);
        }
        d(o);
      });
    },
    action: function(ns, from, content){
      BOT.process('recv.action', {channel: ns, 'from': from, 'text': BOT.formatMsg(content)},
      function(o,d){
        BOT.logMsg(o.channel, "* "+o.from+" "+o.text);
				BOT.chat.action(o.channel, o.from, o.text);
      });
    },
    join: function(ns, user, args){
      BOT.process('recv.join', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" has joined");
				BOT.chat.join(o.channel, o.user, o.args);
      });
    },
    part: function(ns, user, args){
      BOT.process('recv.part', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" has left");
				BOT.chat.part(o.channel, o.user, o.args.r?o.args.r:"");
      });
    },
    kicked: function(ns, user, by, reason){
      BOT.process('recv.kicked', {channel: ns, 'user': user, 'by': by, 'reason': BOT.formatMsg(reason)},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" was kicked by "+o.by+" * "+o.reason);
				BOT.chat.kicked(o.channel, o.user, o.by, o.reason);
			});
    },
    privchg: function(ns, user, args){
      BOT.process('recv.privchg', {channel: ns, 'user': user, args: args},
      function(o,d){
        BOT.logMsg(o.channel, "** "+o.user+" was promoted to "+o.args.pc+" by "+o.args.by+" *");
				BOT.chat.privchange(o.channel, o.user, o.args.by, o.args.pc);
			});
    }
  };
}
