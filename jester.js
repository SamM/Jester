DEBUG = false;

var http = require('http'),
	https = require('https'),
	net = require('net'),
	md5 = require('MD5');
	
String.prototype.sj=function(s,j){return this.split(s).join(j);};
var UserAgent = "Jester 0.1";
var Jester = function(username,password,owner,trigger){
	function ns_(ns){ ns = ns.sj("#","chat:"); return ns.indexOf("chat:")<0?"chat:"+ns:ns; }
	function _ns(ns){
		if(ns.indexOf("pchat:")==0){
			ns = ns.slice(6).split(":");
			if(ns.length==1) ns = ns[0];
			else ns = ns[0].toLowerCase()==BOT.username.toLowerCase()?ns[1]:ns[0];
			ns = "pchat:"+ns;
		}
		return ns.sj("pchat:","@").sj("chat:","#");
	}
	var BOT = {
		userAgent: "Jester 0.1",
		startTime: 0,
		username: username,
		authcode: null,
		owner: owner||"sumopiggy", // lol
		trigger: trigger||"?!",
		default_channels: [],
		channels: {},
		connection: null,
		formatNS: ns_,
		simpleNS: _ns,
		formatChatNS: function(ns){
			if(!ns || !ns.length) return null;
			if(ns[0]=="@") ns=ns.slice(1);
			if(ns.indexOf("pchat:")==0){
				ns = ns.slice(6).split(":");
				if(ns.length>1){
					if(ns[0].toLowerCase() == this.username.toLowerCase()) ns = ns[1];
					else if(ns[1].toLowerCase() == this.username.toLowerCase()) ns = ns[0];
					else return null;
				}else{
					ns=ns[0];
				}
			}
			return "pchat:"+[this.username,ns].sort().join(":");
			
		},
		plugins: {},
		plugin: function(id, data, fn){
			if(typeof id == 'function'){
				return id.call(this, this, {});
			}
			if(typeof data == 'function'){
				fn = data;
				data = {};
			}
			if(typeof id != 'string' || typeof fn != 'function') throw new Error('TypeError');
			this.plugins[id] = data;
			return fn.call(this, this, this.plugins[id]);
		},
		preprocessors: {},
		postprocessors: {},
		process: function(id, object, process, endProcessing){ 
			if(typeof object == "function"){
				endProcessing = process;
				process = object;
				object = {};
			}
			if(typeof process != 'function') process = function(o,pass){ pass(o); };
			with(prep = this.preprocessors[id], post = this.postprocessors[id], self=this){
				var i=0;
				function preprocessing(o){
					if(!prep || i>=prep.length) callprocess(o);
					else {try{
						prep[i++].call(self, o, preprocessing);
					}catch(ex){
						console.log(ex);
						preprocessing(o);
					}
					}
				}
				function callprocess(o){
					i=0;
					process.call(self, o, Array.isArray(post)?postprocessing:new Function)
				}
				function postprocessing(o){
					if(Array.isArray(post) && i<post.length) {
						try{
							post[i++].call(self, o, postprocessing);
						}catch(ex){
							console.log(ex);
							postprocessing(o)
						}
					}
				}
				(Array.isArray(prep)?preprocessing:callprocess)(object);
				return this;
			}
		},
		preprocess: function(id, processor){
			if(!Array.isArray(this.preprocessors[id])) 
				this.preprocessors[id] = [];
			with(prep=this.preprocessors[id]){
				if(typeof processor != "function") return prep;
				else prep.push(processor);
			}
			return this;
		},
		postprocess: function(id, processor){ 
			if(!Array.isArray(this.postprocessors[id])) 
				this.postprocessors[id] = [];
			with(post=this.postprocessors[id]){
				if(typeof processor != "function"){
					return post;
				}else{
					if(!Array.isArray(post)) post=[];
					post.push(processor);
				}
			} 
			return this;
		},
		log: function(str){ 
			this.process('log', {'text': str}, function(o,d){ console.log(o.text); d(o) } )
			return this;
		},
		logMsg: function(channel, str){ 
			this.process('logMsg', {'channel': channel, 'text': str}, function(o,d){ this.log("["+_ns(o.channel)+"] "+o.text); d(o) } )
			return this;
		},
		run: function(){
			this.process('run', function(o,d){
				var bot = this;
				bot.startTime = Date.now();
				BOT.log('Running dAmnBot: '+username+' @ '+bot.startTime);
				this.get_authcode(username,password,function(error, code){
					if(error){
						BOT.log(['BOT','ERROR', error||"Failed to login and get authtoken"]);
					}else{
						bot.authcode = code;
						BOT.log('AuthCode: '+code);
						bot.connect();
					}
				});
				d(o);
			});
		},
		get_authcode: function(username,password,ondone){
			this.process('get_authcode', {code: null}, function(o,d){
				var next = function(err, code){ if(code) o.code = code; d(o); ondone(err, code);  };
				this.log('Getting Auth Code');
				var postdata = "username="+username+"&password="+password+"&remember_me=1", //\u0000
					req = require('https').request({
						host: 'www.deviantart.com',
						port: '443',
						path: '/users/login',
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							'Content-Length': postdata.length,
							'Accept': 'text/html',
							'User-Agent': UserAgent,
							'Referrer': 'https://www.deviantart.com/users/rockedout'
						}
					},

					function(res){
						var cookie = res.headers['set-cookie'];
						if(!cookie.length){
							next(new Error("Bad login"));
						}else{
							cookie = cookie.join("; ");
							res.on('end', function(){
								var req2 = require('http').request({
									host: 'chat.deviantart.com',
									port: '80',
									path: '/chat/Botdom',
									method: 'GET',
									headers: {
										'Content-Type': 'application/x-www-form-urlencoded',
										'Accept': 'text/html',
										'User-Agent': UserAgent,
										"Cookie": cookie,
										'Referrer': 'http://chat.deviantart.com'
									}
								},
								function(resp){
									var page = "";
									resp.on('data', function(chunk){
										page+=chunk.toString();
									});
									resp.on('end', function(){
										if(page.indexOf("dAmn_Login(")>-1){
											var auth = page.slice(page.indexOf('dAmn_Login('));
											auth = auth.slice(0, auth.indexOf(")"));
											auth = auth.split("\"")[3];
											next(null, auth);
										}else{
											next(new Error('Cannot load Botdom page'));
										}
									});
									resp.on('error', function(err){ next(err) })
								});

								req2.end();
							})
						}
					});

					req.write(postdata);
					req.end();
			});
		},
		connect: function(){
			this.process('connect', function(o,d){
				BOT.log('Connecting to dAmn');
				var bot = this,
					con = this.connection = net.createConnection(3900, 'chat.deviantart.com');
				con.on("data",function(p){bot.read(p);});
				con.on("connect",function(){ bot.process('connected', function(o,d){ bot.send.handshake(); d(o) }); });
				con.on("end", function(){ bot.disconnect(); })
				d(o);
			});
		},
		disconnect: function(){
			this.process('disconnect', function(o,d){
				this.log("Disconnected");
				d(o);
			});
		},
		autojoin: function(){
			this.default_channels.push.apply(this.default_channels, [].slice.call(arguments));
			return this;
		},
		chunk: "",
		read: function(pkt){
			pkt = pkt.toString().replace(/\0/g,"\u0000").replace(/\r/g,"\u0000");
			if(false && pkt.indexOf("\u0000")<0){
				this.chunk = this.chunk + pkt;
				return;
			}
			if(this.chunk.length){
				pkt = this.chunk + pkt;
				chunk = "";
			}
			var pkts = pkt.split("\u0000");
			for(var i=0;i<pkts.length;i++)
				this.read_pkt(pkts[i]);
		},
		read_pkt : function(pkt){
			if(!pkt.length) return;
			pkt = pkt.split("\n");
			if(!pkt.length) return;
			var cmd = pkt[0].split(" ")[0] || "",
				param = pkt[0].split(" ")[1] || "",
				value = pkt[5]||"";
			DEBUG && BOT.log([BOT.username,"READ",pkt.join("\\n")].join("<"));
			switch(cmd){
				case "dAmnServer":
					BOT.log("*** Connection to dAmn "+param+" established ***");
					this.send.login();
					break;
				case "login":
					BOT.log("*** Successfully logged in as "+param+" ***");
					BOT.username = param;
					BOT.send.autojoin();
					break;
				case "ping":
					this.process('ping', function(o,d){
						this.log("*PING*PONG*");
						this.send.pong();
					});
					break;
				case "join":
					var e = (pkt[1]||"").split("=")[1] || "";
					if(e!="ok") BOT.log(BOT.username+">Error: Could not join "+param+": "+e);
					else this.channel_joined(param);
					break;
				case "part":
					var e = (pkt[1]||"").split("=")[1] || "";
					if(e!="ok") BOT.log(BOT.username+">ERROR: Could not part "+_ns(param)+": "+e);
					else this.channel_parted(param);
					break;
				case "property":
					var prop = (pkt[1] || "").split("=")[1] || "";
					(function(){
						switch(prop){
						case "topic":
						case "title":
							if(pkt.length>6) value = pkt.slice(6).join("");
							this['channel_'+prop](param, value);
						break;
						case "members":
						case "privclasses":
							this['channel_'+prop](param, pkt.slice(3));
						break;
						default:
							if(prop.indexOf("login:")==0){
								this.channel_whois(param, prop.slice(6), value);
							}
						break;
						}
					}).call(this);
					break;
				case "kicked":
					var by = (pkt[1]||"").split("=")[1] || "";
					this.process('kicked', {'channel': param, 'by': by, "reason": pkt[3]||''}, function(o,d){
						this.log("*** "+this.username+" has been kicked from "+this.simpleNS(o.channel)+" by "+o.by+" * "+o.reason);
					});
					break;
				case "recv":
					this.recv.pkt(pkt)
					break;
				case "disconnect":
					this.disconnect();
					break;
			}
		},
		channel_create: function(ns){
			ns = this.formatNS(ns);
			this.channels[ns.toLowerCase()] = this.channels[ns.toLowerCase()] || { 'ns': ns, members: {}, topic: "", title: "", privclasses: {} };
		},
		channel_topic: function(ns, text){
			this.process('topic', {channel: this.formatNS(ns), 'text': this.formatMsg(text)}, function(o,d){
				this.log("*** Topic of "+this.simpleNS(o.channel)+": "+o.text);
				this.channel_create(o.channel);
				this.channels[o.channel.toLowerCase()].topic = o.text;
				d(o);
			});
		},
		channel_title: function(ns, text){
			this.process('title', {channel: this.formatNS(ns), 'text': this.formatMsg(text)}, function(o,d){
				this.log("*** Title of "+this.simpleNS(o.channel)+": "+o.text);
				this.channel_create(o.channel);
				this.channels[o.channel.toLowerCase()].title = o.text;
				d(o);
			});
		},
		channel_members: function(ns, list){
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
			this.process('members', {channel: this.formatNS(ns), 'list': list, 'members': members}, function(o,d){
				var list = [],mem;
				for(var i in o.members){
					mem = o.members[i];
					list.push(mem.symbol+mem.username+"("+mem.pc+")")
				}
				this.log("*** Members of "+this.simpleNS(o.channel)+": "+list.join(" "));
				this.channel_create(o.channel);
				this.channels[o.channel.toLowerCase()].members = o.members;
				d(o);
			});
		},
		channel_privclasses: function(ns, list){
			var privclasses = {};
			for(var i=0,pair;i<list.length;i++){
				if(!list[i] || !list[i].length) continue;
				pair = list[i].split(":");
				privclasses[pair[1]] = pair[0];
			}
			this.process('privclasses', {channel: this.formatNS(ns), 'list': list, 'privclasses': privclasses}, function(o,d){
				this.log("*** Privclasses of "+this.simpleNS(o.channel)+": "+o.list.join(", "));
				this.channel_create(o.channel);
				this.channels[o.channel.toLowerCase()].privclasses = o.privclasses;
				d(o);
			});
		},
		channel_whois: function(ns, text){
			
		},
		channel_joined: function(ns){
			this.process('join', {channel: ns_(ns)}, function(o,d){
				this.log("*** "+BOT.username+" has joined "+o.channel+" *");
				this.channel_create(o.channel);
				d(o);
			})
		},
		channel_parted: function(ns){
			this.process('part', {channel: ns_(ns)}, function(o,d){
				this.log("*** "+BOT.username+" has left "+_ns(ns)+" *");
				d(o);
			})
		},
		recv:{
			pkt: function(pkt){
				if(!pkt.length){
					console.log(this.username+"<RECV<ERROR<Empty Pkt");
					return;
				}
				var ns = (pkt[0]||"").split(" ")[1] || "",
					cmd = (pkt[2]||"").split(" ")[0] || "",
					param = (pkt[2]||"").split(" ")[1] || "";
					
				DEBUG && BOT.log([BOT.username,"RECV",ns,cmd,param].join("<"));
				
				switch(cmd){
					case "msg":
					case "action":
						var from = (pkt[3]||"").split("=")[1] || "";
						(cmd=="msg"?this.msg:this.action)(ns,from,pkt[5]||"");
						break;
					case "join":
					case "part":
						(cmd=="join"?this.join:this.part)(ns,param);
						break;
					case "privchg":
						var by = (pkt[3]||"").split("=")[1] || "",
							pc = (pkt[4]||"").split("=")[1] || "";
						this.privchg(ns,param,by,pc);
						break;
					case "kicked":
						var by = (pkt[3]||"").split("=")[1] || "";
						this.kicked(ns,param,by,pkt[5]);
						break;
					case "default":
						log(BOT.username+"<RECV<ERROR<UNKNOWNCMD<"+cmd)
				}
			},
			msg: function(ns,from,content){
				BOT.process('recv:msg', {channel: ns_(ns), from: from, text: BOT.formatMsg(content)}, function(o,d){
					this.logMsg(o.channel, "<"+o.from+"> "+o.text);
					var trig = this.trigger, text = o.text;
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
					this.logMsg(o.channel, "* "+o.from+" "+o.text);
				});
			},
			join: function(ns, user){
				BOT.process('recv:join', {channel: ns, 'user': user},
				function(o,d){
					this.logMsg(o.channel, "** "+o.user+" has joined");
				});
			},
			part: function(ns, user){
				BOT.process('recv:part', {channel: ns, 'user': user},
				function(o,d){
					this.logMsg(o.channel, "** "+o.user+" has left");
				});
			},
			kicked: function(ns, user, by, reason){
				BOT.process('recv:kicked', {channel: ns, 'user': user, 'by': by, 'reason': BOT.formatMsg(reason)},
				function(o,d){
					this.logMsg(o.channel, "** "+o.user+" was kicked by "+o.by+" * "+o.reason);
				});
			},
			privchg: function(ns, user, by, privclass){
				BOT.process('recv:privchg', {channel: ns, 'user': user, 'by': by, 'privclass': privclass},
				function(o,d){
					this.logMsg(o.channel, "** "+o.user+" was promoted to "+o.privclass+" by "+o.by+" *");
				});
			}
		},
		users: {},
		checkAuth: function(user, privlevel){
			if(this.owner.toLowerCase() == user.toLowerCase()) return true;
			return this.users.hasOwnProperty(user.toLowerCase()) && this.users[user] >= privlevel;
		},
		command: function(cmd, channel, from, params){
			this.process('command', {'cmd': cmd, 'channel': channel, 'from': from, 'params': params, 'handled': 0}, function(o, d){
				if(!o.handled){
					this.process('command:'+cmd, {'cmd': o.cmd, 'channel': o.channel, 'from': o.from, 'params': o.params, 'handled': 0}, function(ob, done){
						if(!ob.handled){
							this.send.msg_to(ob.channel, ob.from, 'Command not recognized: <b>'+ob.cmd+'</b>');
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
		},
		formatMsg: function(msg){
			try{
	        // bold
				msg = msg.replace(/&b\t/g,	"<b>" );
				msg = msg.replace(/&\/b\t/g,"</b>");
	        // italic
				msg = msg.replace(/&i\t/g,	"<i>" );
				msg = msg.replace(/&\/i\t/g,"</i>");
	        // underline
				msg = msg.replace(/&u\t/g,	"<u>" );
				msg = msg.replace(/&\/u\t/g,"</u>");
	        // strike
				msg = msg.replace(/&s\t/g,	"<s>") ;
				msg = msg.replace(/&\/s\t/g,"</s>");
	        // paragraph
				msg = msg.replace(/&p\t/g,	"<p>" );
				msg = msg.replace(/&\/p\t/g,"</p>");
	        // break
				msg = msg.replace(/&br\t/g,"<br/>");
	        //li
				msg = msg.replace(/&li\t/g,	 "<li>" );
				msg = msg.replace(/&\/li\t/g,"</li>");
	        //ul
				msg = msg.replace(/&ul\t/g,	 "<ul>" );
				msg = msg.replace(/&\/ul\t/g,"</ul>");
	        //ol
				msg = msg.replace(/&ol\t/g,	 "<ol>" );
				msg = msg.replace(/&\/ol\t/g,"</ol>");
	        // subscript
				msg = msg.replace(/&sub\t/g,	"<sub>" );
				msg = msg.replace(/&\/sub\t/g,	"</sub>");
	        // superscript
				msg = msg.replace(/&sup\t/g,	"<sup>" );
				msg = msg.replace(/&\/sup\t/g,	"</sup>");
	        // code
				msg = msg.replace(/&code\t/g,	"<code>" );
				msg = msg.replace(/&\/code\t/g, "</code>");
	        // bcode
				msg = msg.replace(/&bcode\t/g,	"<bcode>" );
				msg = msg.replace(/&\/bcode\t/g,"</bcode>");
			// deviant
				msg = msg.replace(/&dev\t([^\t])\t([^\t]+)\t/g,':dev$2:');
	        // link no description
				msg = msg.replace(/&link\t([^\t]+)\t&/g,'$1');
	        // link with description
				msg = msg.replace(/&link\t([^\t]+)\t([^\t]+)\t&\t/g,'$1 \($2\)');
	        // abbr
				msg = msg.replace(/&abbr\t([^\t]+)\t/g,'<abbr title="$1">');
				msg = msg.replace(/&\/abbr\t/g,"</abbr>");
	        // acronym
				msg = msg.replace(/&acro\t([^\t]+)\t/g,'<acronym title="$1">');
				msg = msg.replace(/&\/acro\t/g,"</acronym>");
	        // anchor
				msg = msg.replace(/&a\t([^\t]+)\t([^\t]*)\t/g,'<a href="$1" title="$2">');
	        // avatar
				msg = msg.replace(/&avatar\t([^\t]+)\t([^\t]+)\t/g,':icon$1:');
	        // img
	        	msg = msg.replace(/&img\t([^\t]+)\t([^\t]*)\t([^\t]*)\t/g,'<image src="$1" />');
				msg = msg.replace(/&\/a\t/g,"</a>");
			// emote
				msg = msg.replace(/&emote\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t/g,'$1');
	        // iframe
	        	msg = msg.replace(/&iframe\t([^\t]+)\t([^\t]*)\t([^\t]*)\t/g,'<iframe href="$1" height="$2" width="$3" />');
	        // thumbnail
				msg = msg.replace(/&thumb\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t/g,':thumb$1:');
			}catch(ex){}	
			return msg;
		},
		send: {
			
			handshake: function(){
				BOT.process('send:handshake', {'agent': BOT.userAgent}, function(o,d){
					this.send.pkt("dAmnClient 0.3","agent="+o.agent,''); d(o)
				});
			},
			login: function(){
				BOT.process('send:login', {'username': BOT.username, 'pk': BOT.authcode}, function(o,d){
					this.send.pkt("login "+o.username,"pk="+o.pk,''); d(o)
				})
			},
			autojoin: function(){
				BOT.process('autojoin', {'channels': BOT.default_channels}, function(o,d){
					o.channels.forEach(function(ns){ BOT.send.join(ns) });
					d(o)
				});
				return BOT;
			},
			join: function(ns){
				if(ns[0]=="@" || ns.slice(0,6)=="pchat:") return this.chat(ns);

				BOT.process('send:join', {'channel': BOT.formatNS(ns)}, function(o,d){
					this.send.pkt("join "+o.channel, ''); d(o)
				})
			},
			chat: function(ns){
				if(!ns) return;
				if(ns[0]=="#" || ns.slice(0,5)=="chat:") return this.join(ns);
				BOT.process('send:chat', {'channel': BOT.formatChatNS(ns)}, function(o,d){
					this.send.pkt("join "+o.channel, ''); d(o)
				})
			},
			part: function(ns){
				BOT.process('send:part', {'channel': BOT.formatNS(ns)}, function(o,d){
					this.send.pkt("part "+o.channel, ''); d(o)
				})
			},
			pong: function(){
				BOT.process('send:pong', function(o,d){
					this.send.pkt("pong", ''); d(o)
				})
			},
			disconnect: function(){
				BOT.process('send:disconnect', function(o,d){
					this.send.pkt("disconnect",'');
					this.connection.end(); d(o)
				});
			},
			msg_to: function(ns,to,msg){ 
				this.msg(ns,to+": "+msg); 
			},
			msg: function(ns,msg){ 
				BOT.process('send:msg', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
					this.send.pkt("send "+o.channel,'',"msg main",'',o.text); d(o)
				});
			},
			action: function(ns,msg){
				BOT.process('send:action', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
					this.send.pkt("send "+o.channel,'',"action main",'',o.text);  d(o)
				});
			},
			npmsg: function(ns,msg){
				BOT.process('send:npmsg', {'channel': BOT.formatNS(ns), 'text': msg}, function(o,d){
					this.send.pkt("send "+o.channel,'',"npmsg main",'',o.text);  d(o)
				});
			},
			promote: function(ns,user,priv){
				BOT.process('send:promote', {'channel': BOT.formatNS(ns), 'user': user, 'priv': priv}, function(o,d){
					this.send.pkt("send "+o.channel,'',"promote "+o.user,'',o.priv||'');  d(o)
				});
			},
			demote: function(ns,user,priv){
				BOT.process('send:demote', {'channel': BOT.formatNS(ns), 'user': user, 'priv': priv}, function(o,d){
					this.send.pkt("send "+o.channel,'',"demote "+o.user,'',o.priv||'');  d(o)
				});
			},
			kick: function(ns,user,reason){ 
				BOT.process('send:kick', {'channel': BOT.formatNS(ns), 'user': user, 'reason': reason}, function(o,d){
					this.send.pkt("kick "+o.channel,"u="+o.user,'',o.reason||'');  d(o)
				});
			},
			ban: function(ns,user){
				BOT.process('send:ban', {'channel': BOT.formatNS(ns), 'user': user}, function(o,d){
					this.send.pkt("send "+o.channel,'',"ban "+o.user,'');  d(o)
				});
			},
			unban: function(ns,user){
				BOT.process('send:unban', {'channel': BOT.formatNS(ns), 'user': user}, function(o,d){
					this.send.pkt("send "+o.channel,'',"unban "+o.user,'');  d(o)
				});
			},
			pkt: function(){
				var data = [].slice.call(arguments).join("\n")+"\u0000";
				BOT.process('send:pkt', {'pkt': data}, function(o,d){
					DEBUG && this.log([this.username,"SEND",o.pkt.replace(/\n/g,"\\n").replace(/\u0000/g,"\\u0000")].join(">"));
					BOT.connection.write(o.pkt);
					 d(o)
				});
			}
			
		}
	};
	return BOT;
};

function basicCommands(){
	
	// Say
	function botSay(o,d){
		if(this.checkAuth(o.from, 1)){
			this.send.msg(o.channel, o.params.join(" "));
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:say', botSay);
	
	// Join
	function botJoin(o,d){
		var bot = this;
		if(this.checkAuth(o.from, 2)){
			o.params.forEach(function(chan){
				bot.send.join(chan);
			});
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:join', botJoin);
	
	// Chat
	function botChat(o,d){
		this.send.chat(o.from);
		o.handled++; d(o);
	}
	this.preprocess('command:chat', botChat);
	
	// Quit
	function botQuit(o,d){
		if(this.checkAuth(o.from, 5)){
			this.send.disconnect();
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:quit', botQuit);
	this.preprocess('command:disconnect', botQuit);
	
	// Part
	function botPart(o,d){
		var bot = this;
		if(this.checkAuth(o.from, 2)){
			o.params.forEach(function(chan){
				bot.send.part(chan);
			});
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:part', botPart);
	
	// Kick
	function botKick(o,d){
		if(this.checkAuth(o.from, 3)){
			if(o.params.length) 
				this.send.kick(o.channel,o.params.shift(),o.params.join(" "));
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:kick', botKick);
	
	// Trigger change
	function botTrig(o,d){
		if(this.checkAuth(o.from, 5)){
			if(o.params.length) 
				this.trigger=o.params[0];
				this.send.msg_to(o.channel,o.from,"My trigger is now "+this.trigger);
		}else{
			this.send.msg_to(o.channel, o.from, 'You do not have permission to use the command '+o.cmd);
		}
		o.handled++; d(o);
	}
	this.preprocess('command:trig', botTrig);
	this.preprocess('command:trigchg', botTrig);
	
}
function basicPlugins(){
	this.plugin('botcheck', {reply: 'I\'m a bot'}, function(bot,opt){
		function botcheckResponse(from){
			return 'BDS:BOTCHECK:RESPONSE:'+[from,bot.owner,bot.userAgent.split(" ").join(",")+"/0.2",md5((bot.trigger+from+bot.username).toLowerCase()),bot.trigger].join(",");
		}
		this.preprocess('recv:msg', function(o,d){ 
			if(new RegExp(this.username+"(: |:)botcheck", "gi").test(o.text)) {
				var msg = opt.reply+'<abbr title="'+["botresponse:",o.from,this.owner,this.userAgent+"/0.2",md5((this.trigger+o.from+this.username).toLowerCase()), this.trigger].join(" ")+'"></abbr>';
				this.send.msg(o.channel, msg);
			}
			if(o.channel == 'chat:DataShare'){
				if(o.text.indexOf("BOTCHECK:ALL") == 0 || o.text.indexOf("BDS:BOTCHECK:DIRECT:"+this.username)==0){
					this.send.msg(o.channel, botcheckResponse(o.from));
				}
			}
			d(o);
		});
		this.preprocess('logMsg', function(o,d){
			if(o.channel != 'chat:DataShare') d(o);
		});
		this.autojoin('DataShare');
	});
	
	this.plugin('antikick', {enabled: true}, function(b,opt){
		b.preprocess('kicked', function(o,d){
			if(opt.enabled){
				this.send.join(o.channel);
			}
			d(o);
		});
	});
}
function dAmnBot(u,p,o,t){
	var bot = Jester(u,p,o,t);
	bot.plugin(basicCommands);
	bot.plugin(basicPlugins);
	return bot;
}

module.exports = dAmnBot;
/*
var yourbot = Jester("botusername","botpassword","botownerusername","???");
yourbot.autojoin("Botdom", "#YourChannel", "chat:AnotherChannel");
yourbot.run();
*/