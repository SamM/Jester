window.ControlPanel = window.CP = new (function(){
  var CP = this;
  this.data = {
    current_page: "log",
    current_channel: null,
    config: {}
  };

  //
  // Control Panel Pages
  //
  this.pages = {};
  this.add_page = function(id, data){
    data.id = id;
    data.path = data.path?data.path:"/"+id;
    data.title = data.title?data.title:id.toTitleCase();
    data.component = data.component?data.component:EmptyPage;
    data.route = typeof data.route=="function"?data.route:route_noop;
    data.need_auth = !!data.need_auth;
    data.need_connection = !!data.need_connection;
    data.hide_when_auth = !!data.hide_when_auth;
    data.data = data.data?data.data:{};
    this.pages[id] = data;
    return this;
  };

  this.dAmn = {};
  this.chat = {};

  //
  // Log Messages
  //
  this.log_messages = [];
  this.log = function(message){
    if(message.text){
      message.text = CP.removeTags(message.text);
    }
    CP.log_messages.push(message);
    CP.ticker.queue(message);
    CP.render("log");
  };

  //
  // Message Formatting
  //
  this.removeTags = function(text){
    // Remove Emoticon img tag
    text = text.replace(/<img src="([^"]+)" alt="([^"]+)" title="([^"]+)" width="([^"]+)" height="([^"]+)" \/>/g, "$2");
    // Remove Thumbnail
    text = text.replace(/<a([^>]+)><img title="([^"]+)" width="([^"]+)" height="([^"]+)" alt="([^"]+)" src="([^"]+)"\/><\/a>/g, "$5");
    return text;
  }

  //
  // Event Ticker
  //
  this.ticker = {};
  this.ticker.events = [];
  this.ticker.timeout = null;
  this.ticker.queue = function(msg){
    CP.ticker.events.push(msg);
    if(!CP.ticker.timeout){
      CP.ticker.tick();
    }
  };
  this.ticker.clear = function(){
    clearTimeout(CP.ticker.timeout);
    CP.ticker.timeout = null;
  };
  this.ticker.tick = function(){
    CP.ticker.clear();

    if(CP.ticker.events.length > 1){
      if(CP.ticker.events.length > 10){
        CP.ticker.events = CP.ticker.events.slice(5);
      }
      CP.ticker.events.shift();
      CP.ticker.timeout = setTimeout(CP.ticker.tick, 500 / CP.ticker.events.length);
      CP.render();
    }else{
      CP.render();
    }
  }

  //
  // dAmn Connection Events
  //
  this.dAmn.connected = function(){
    CP.data.connected = true;
    CP.render();
  };
  this.dAmn.disconnected = function(){
    CP.data.connected = false;
    CP.render();
  };
  this.dAmn.join = function(o){
    var ns = o.channel.toLowerCase();
    CP.data.current_channel = ns;
    if(CP.channels[ns]){
      CP.channels[ns].joined = true;
    }else{
      CP.dAmn.channel_create({ns: o.channel, data: {joined: true}});
    }
    CP.render("chat");
  }
  this.dAmn.part = function(o){
    var ns = o.channel.toLowerCase();
    var next = "";
    var nss = Object.keys(CP.channels);
    var nsi = nss.indexOf(ns);
    function searchEnd(){
      for(var i = nsi+1; i<nss.length; i++){
        if(CP.channels[nss[i]].joined){
          return nss[i];
        }
      }
      return "";
    }
    function searchStart(){
      for(var i = nsi-1; i>=0; i--){
        if(CP.channels[nss[i]].joined){
          return nss[i];
        }
      }
      return "";
    }
    if(nsi == 0){
      next = searchEnd();
    }else{
      next = searchStart();
      if(next == "") next = searchEnd();
    }
    if(CP.channels[ns]){
      CP.channels[ns].joined = false;
      CP.data.current_channel = next;
      CP.render("chat");
    }
  }
  this.dAmn.recv = {};
  this.dAmn.recv.join = function(o){
    var ns = o.channel.toLowerCase();
    if(CP.channels[ns]){
      if(CP.channels[ns].members[o.user]){
        CP.channels[ns].members[o.user].instances++;
      }else{
        o.args.username = o.user;
        delete o.args.s;
        o.args.instances = 1;
        CP.channels[ns].members[o.user] = o.args;
      }
      CP.render("chat");
    }
  }
  this.dAmn.recv.part = function(o){
    var ns = o.channel.toLowerCase();
    if(CP.channels[ns]){
      if(CP.channels[ns].members[o.user]){
        CP.channels[ns].members[o.user].instances--;
        if(CP.channels[ns].members[o.user].instances == 0){
          delete CP.channels[ns].members[o.user];
        }
        CP.render("chat");
      }
    }
  }

  //
  // Config
  //
  this.config = function(data){
    this.data.config[data.key] = data.value;
    if(data.key == "damn_token" && data.value){
      this.data.authorized = true;
    }
    this.render();
  }

  //
  // Chat Events
  //
  this.chat.log = function(obj){
    var ns = obj.ns,
        msg = CP.chat.hilighter(obj.msg);
    if(!CP.channels.hasOwnProperty(ns)){
      CP.dAmn.channel_create({
        ns: ns,
        messages: [msg]
      });
    }else{
      CP.channels[ns].messages.push(msg);
    }
    CP.render("chat");
  }
  this.chat.hilighter = function(msg){
    if(msg.text && ["title", "topic"].indexOf(msg.type) == -1){
      msg.hilite = false;
      var trig = CP.data.config.trigger;
      if(trig && trig != "" && msg.text.indexOf(trig) == 0 ){
        if(/[a-zA-Z0-9]/.exec(msg.text.slice(trig.length)[0]) != null){
          // Bot Command
          msg.hilite = "cmd-hl";
        }
      }
      if( -1 != msg.user.search( RegExp("([^A-Za-z]+|^)"+CP.data.config.username+"([^A-Za-z]+|$|s$|s[^A-Za-z]+)","i") ) )
            msg.hilite = "self-hl";
      else if( -1 != msg.text.search( RegExp("([^A-Za-z]+|^)"+CP.data.config.username+"([^A-Za-z]+|$|s$|s[^A-Za-z]+)","im") ) )
            msg.hilite = "other-hl";
    }
    return msg;
  }

  //
  // Channel Methods
  //
  this.channels = {};
  this.dAmn.channel_create = function(obj){
    var nso = obj.ns,
        ns = nso.toLowerCase(),
        data = obj.data,
        safe = obj.safe;
    if(CP.channels[ns]){
      for(var key in data){
        var value = data[key];
        if(!safe){
          CP.channels[ns][key] = value;
        }else{
          if(typeof value == "string"){
            if(CP.channels[ns][key] == ""){
              CP.channels[ns][key] = value;
            }
          }else if(Array.isArray(value)){
            if(CP.channels[ns][key].length == 0){
              CP.channels[ns][key] = value;
            }
          }else if(typeof value == "object"){
            if(Object.keys(this.channels[ns][key]).length == 0){
              CP.channels[ns][key] = value;
            }
          }
        }
      }
    }else{
      var channel = {};
      channel.joined = true;
      channel.messages = data.messages?data.messages:[];
      channel.topic = data.topic?data.topic:"";
      channel.title = data.title?data.title:"";
      channel.members = data.members?data.members:{};
      channel.privclasses = data.privclasses?data.privclasses:{};
      channel.ns = nso;
      CP.channels[ns] = channel;
    }
    CP.render("chat");
  }
  this.switchChannel = function(ns){
    CP.data.current_channel = ns;
    CP.render("chat");
  }

  //
  // Page Routing
  //
  this.route = page;
  this.not_auth_path = "/";
  this.hide_auth_path = "/";
  this.not_connected_path = "/";
  function route_noop(ctx,next){next()};
  function extend_context(ctx, next){
    ctx.CP = ctx.ControlPanel = CP;
    ctx.data = CP.data;
    ctx.pages = CP.pages;
    next();
  }
  function check_auth(ctx, next){
    if(!CP.data.authorized){
      page.redirect(CP.not_auth_path);
    }else{
      next();
    }
  }
  function hide_when_auth(ctx, next){
    if(CP.data.authorized){
      page.redirect(CP.hide_auth_path);
    }else{
      next();
    }
  }
  function check_connected(ctx, next){
    if(!CP.data.connected){
      page.redirect(CP.not_connected_path);
    }else{
      next();
    }
  }
  //
  // Refresh Settings
  //
  this.refresh = function(){
      this.data.authorized = !!this.data.config.damn_token;
  }

  //
  // Render Control Panel to DOM
  //
  this.el_id = "controlpanel";
  this.render = function(only_for_page){
    if(typeof only_for_page == "string"){
      if(this.data.current_page != only_for_page) return;
    }
    this.refresh();
    ReactDOM.render(
      <ControlPanelComp data={this.data} channels={this.channels} pages={this.pages} log={this.log_messages} events={this.ticker.events}/>,
      document.getElementById(this.el_id)
    );
  };

  //
  // Initialize Control Panel
  //
  this.init = function(){
    // Set Up Routes
    for(var p in this.pages){
      let page = this.pages[p];
      CP.route(page.path,
        extend_context,
        page.need_auth?check_auth:route_noop,
        page.hide_when_auth?hide_when_auth:route_noop,
        page.need_connection?check_connected:route_noop,
        typeof page.route=="function"?page.route:route_noop,
        function(ctx, next){
          CP.data.current_page = page.id;
          CP.render();
        }
      );
    }
    CP.route();
  };

  // Reset data
  this.reset = function(){
    var data = {
      current_page: CP.data.current_page,
      current_channel: null,
      config: {}
    };
    CP.data = data;
    CP.channels = {};
    CP.log_messages = [];
    CP.ticker.events = [];
    CP.ticker.clear();
    CP.render();
  };

  // Connected event
  this.connected = function(data){
    console.log("Connected To Bot");
    for(var k in data){
      CP.data[k] = data[k];
    }
    CP.render();
  };

  this.uncaught_event = function(method){
    var args = [].slice.call(arguments,1);
    CP.debug && console.log("Uncaught Event: CP."+method+"("+args.map(JSON.stringify).join(", ")+")");
  }

})();

//
// ControlPanelComp Component
//
var ControlPanelComp = React.createClass({
  render: function(){
    var data = this.props.data;
    var pages =this.props.pages;
    var log = this.props.log;
    var page = pages[data.current_page];
    var channels = this.props.channels;
    var events = this.props.events;
    var Page_Component = page.component?page.component:EmptyPage;
    return (
      <div className="ControlPanel">
        <NavBar pages={pages} data={data}/>
        <EventTicker events={events} />
        <Page_Component page={page} data={data} log={log} channels={channels}/>
      </div>
    );
  }
});

//
// NavBar Component
//
var NavBar = React.createClass({
  render: function(){
    var self = this;
    return (
      <div className="NavBar">
        <Logo />
        <ul className="NavButtonsList">
        {ObjToArr(this.props.pages).map(function(page){
          if(page.need_auth && !self.props.data.authorized) return;
          if(page.hide_auth && self.props.data.authorized) return;
          if(page.need_connection && !self.props.data.connected) return;
          var current = self.props.data.current_page==page.id;
          return (
            <NavButton key={page.id} title={page.title} path={page.path} current={current}/>
          );
        })}
        </ul>
        <BotStatus data={this.props.data} />
      </div>
    );
  }
});

var NavButton = React.createClass({
  render: function(){
    var path = "/"+this.props.path.split("/")[1];
    var inner = this.props.current ?
      <span>{this.props.title}</span> :
      <a href={path}>{this.props.title}</a>;
    return (
      <li className="NavButton">{inner}</li>
    );
  }
});

var Logo = React.createClass({
  render: function(){
    return (
      <div className="Logo">Jester</div>
    );
  }
});

var BotStatus = React.createClass({
  render: function(){
    var button = this.props.data.connected ?
      <a className="DisconnectButton" onClick={BOT.disconnect}>Disconnect</a> :
      <a className="ConnectButton" onClick={BOT.connect}>Connect to dAmn</a>;
    var inner = this.props.data.authorized ?
      (
        <div className="box">
        <span className="BotUsername">{this.props.data.config.username}</span>
        {button}
        </div>
      ) :
      <div className="box"><a href={this.props.data.auth_url} className="LoginButton">Login to deviantART!</a></div>;
    return (
      <div className="BotStatus">{inner}</div>
    );
  }
});

//
// EventTicker Component
//
var EventTicker = React.createClass({
  render: function(){
    var events = this.props.events;
    var message = events[0];
    var text = message?message.text:"";
    return (
      <div className="EventTicker">{text}</div>
    );
  }
});

//
// EmptyPage Component
//
var EmptyPage = React.createClass({
  render: function(){
    return (
      <div className="EmptyPage"><h1>{this.props.page.title}</h1></div>
    )
  }
});

//
// LogPage Component
//
var LogPage = React.createClass({
  scrollElement: function(){
    var node = ReactDOM.findDOMNode(this);
    window.requestAnimationFrame(function(){
      if(node){
        node.scrollTop = node.scrollHeight;
      }
    });
  },
  componentDidMount: function() {
    this.scrollElement();
  },
  componentWillUpdate: function() {
    var node = ReactDOM.findDOMNode(this);
    this.shouldScrollBottom = node.scrollTop + node.offsetHeight >= node.scrollHeight;
  },
  componentDidUpdate: function() {
    if (this.shouldScrollBottom) {
      this.scrollElement();
    }
  },
  render: function(){
    return (
      <div className="LogPage">
        <div className="LogMessages">
        {this.props.log.map(function(msg, i){
          return <LogMessage message={msg} key={i}/>;
        })}
        </div>
      </div>
    )
  }
});

//
// LogMessage Component
//
var LogMessage = React.createClass({
  render: function(){
    return (
      <div className="LogMessage">
        {this.props.message.text}
      </div>
    )
  }
});

//
// ChatroomPage Component
//
var ChatroomPage = React.createClass({
  render: function(){
    var channels = this.props.channels;
    var current_channel = this.props.data.current_channel;
    if(!current_channel || !channels[current_channel]){
      current_channel = Object.keys(channels)[0];
    }
    if(!current_channel || !channels[current_channel].joined){
      return (
        <EmptyChatroomPage />
      );
    }
    return (
      <div className="ChatroomPage">
        <ChatTabs channels={channels} current_channel={current_channel} />
        <Chatroom channel={channels[current_channel]} />
      </div>
    )
  }
});

//
// EmptyChatroomPage Component
//
var EmptyChatroomPage = React.createClass({
  joinChatroom: function(){
    var ns = prompt("Enter the name of the chatroom you would like to join: ");
    if(ns != null && ns!=""){
      BOT.send.join(ns);
    }
  },
  render: function(){
    return (
      <div className="EmptyChatroomPage">
      <h1>No Chatrooms Have Been Joined</h1>
      <button className="JoinChatroomButton" onClick={this.joinChatroom}>Join a Chatroom</button>
      </div>
    )
  }
});

//
// ChatTabs Component
//
var ChatTabs = React.createClass({
  render: function(){
    var channels = this.props.channels;
    var current_channel = this.props.current_channel;
    var tabs = [];
    for(var ns in channels){
      var current = ns.toLowerCase() == current_channel.toLowerCase();
      if(channels[ns].joined){
        tabs.push(<ChatTab ns={channels[ns].ns} key={ns} current={current} />);
      }
    }
    return (
      <div className="ChatTabs">
        {tabs}
      </div>
    )
  }
});

//
// ChatTab Component
//
var ChatTab = React.createClass({
  render: function(){
    var ns = this.props.ns;
    var name = "#"+ns.split(":")[1];
    var inner = null;
    function switchChannel(){
      CP.switchChannel(ns);
    }
    function partChannel(){
      BOT.send.part(ns);
    }
    if(this.props.current){
      return <div className="ChatTab">
        <div className="active"><span className="label">{name}</span><button className="PartButton" onClick={partChannel}>&#x2715;</button></div>
      </div>;
    }else{
      return <div className="ChatTab">
        <a onClick={switchChannel}>{name}</a>
      </div>;
    }
  }
});

//
// Chatroom Component
//
var Chatroom = React.createClass({
  updateTitleHeight: function(){
    var title = ReactDOM.findDOMNode(this.refs["title"]);
    var inner = ReactDOM.findDOMNode(this.refs["title_inner"]);
    var body = ReactDOM.findDOMNode(this.refs["body"]);
    title.style.height = body.style.top = inner.offsetHeight+"px";
  },
  componentDidMount: function() {
    this.updateTitleHeight();
    window.addEventListener('resize', this.updateTitleHeight);
  },
  componentDidUpdate: function() {
    this.updateTitleHeight();
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this.updateTitleHeight);
  },
  render: function(){
    var channel = this.props.channel;
    if(!channel.joined){
      return (
        <div className="Chatroom Empty"></div>
      );
    }
    return (
      <div className="Chatroom">
        <div className="ChatTitle" ref="title">
          <div className="ChatTitleInner" ref="title_inner" dangerouslySetInnerHTML={{__html: channel.title}}></div>
        </div>
        <div className="ChatBody" ref="body">
          <div className="ChatIO">
            <div className="ChatTopic" dangerouslySetInnerHTML={{__html: channel.topic}}></div>
            <ChatMessageList ns={channel.ns} messages={channel.messages} />
            <ChatInput ns={channel.ns} draft={channel.draft} />
          </div>
          <ChatMembers ns={channel.ns} members={channel.members} privclasses={channel.privclasses} />
        </div>
      </div>
    )
  }
});

//
// ChatMessageList Component
//
var ChatMessageList = React.createClass({
  scrollElement: function(){
    var node = ReactDOM.findDOMNode(this);
    window.requestAnimationFrame(function(){
      if(node){
        node.scrollTop = node.scrollHeight;
      }
    });
  },
  componentDidMount: function() {
    this.scrollElement();
  },
  componentWillUpdate: function() {
    var node = ReactDOM.findDOMNode(this);
    this.shouldScrollBottom = node.scrollTop + node.offsetHeight >= node.scrollHeight;
  },
  componentDidUpdate: function() {
    if (this.shouldScrollBottom) {
      this.scrollElement();
    }
  },
  render: function(){
    var messages = this.props.messages;
    var ns = this.props.ns;
    return (
      <div className="ChatMessageList">
        <div className="ChatMessageListOuter">
          <div className="ChatMessageListInner">
            <div className="Messages">
            {messages.map(function(msg, i){
              return <ChatMessage key={i} message={msg} ns={ns} />;
            })}
            </div>
          </div>
        </div>
      </div>
    )
  }
});

//
// ChatMessage Component
//
var ChatMessage = React.createClass({
  render: function(){
    var ns = this.props.ns;
    var channel_name = "#"+ns.split(":")[1];
    var msg = this.props.message;
    var inner = null;
    switch(msg.type){
      case "msg":
      var classes = msg.hilite?"msg "+msg.hilite:"msg";
      inner = <div className={classes}><span className="user"><span className="username">{msg.user}</span></span> <span className="text" dangerouslySetInnerHTML={{__html: msg.text}}></span></div>;
      break;

      case "action":
      var classes = msg.hilite?"action "+msg.hilite:"action";
      inner = <div className={classes}><span className="user"><span className="username">{msg.user}</span></span> <span className="text" dangerouslySetInnerHTML={{__html: msg.text}}></span></div>;
      break;

      case "join":
      inner = <div className="join"><span className="user"><span className="username">{msg.user}</span></span> <span className="text">has joined</span></div>;
      break;

      case "part":
      var reason = msg.reason?<span className="reason">{msg.reason}</span>:"";
      inner = <div className="part"><span className="user"><span className="username">{msg.user}</span></span><span className="text">has left</span> {reason}</div>;
      break;

      case "title":
      inner = <div className="title"><span className="text">title changed by</span> <span className="by">{msg.user}</span></div>;
      break;

      case "topic":
      inner = <div className="topic"><span className="text">topic changed by</span> <span className="by">{msg.user}</span></div>;
      break;

      case "kicked":
      inner = <div className="kicked"><span className="user"><span className="username">{msg.user}</span></span><span className="text">was kicked by </span> <span className="by">{msg.by}</span> <span className="reason" dangerouslySetInnerHTML={{__html: msg.reason}}></span></div>;
      break;

      case "privchange":
      inner = <div className="privchange"><span className="user"><span className="username">{msg.user}</span></span><span className="text">has been made a member of <span className="pc">{msg.pc}</span> by</span> <span className="by">{msg.by}</span></div>;
      break;

      case "self_join":
      inner = <div className="join self"><span className="user"><span className="username">You</span></span><span className="text">have joined {channel_name}</span></div>;
      break;

      case "self_part":
      inner = <div className="part self"><span className="user"><span className="username">You</span></span><span className="text">have left {channel_name}</span></div>;
      break;

      case "self_kicked":
      inner = <div className="kicked self"><span className="user"><span className="username">You</span></span><span className="text">have been kicked by</span> <span className="by">{msg.by}</span> <span className="reason" dangerouslySetInnerHTML={{__html: msg.reason}}></span></div>;
      break;

      default:
      inner = <div className="unknown">{JSON.stringify(msg)}</div>;
      break;
    }
    return (
      <div className="ChatMessage">
        {inner}
      </div>
    );
  }
});

//
// ChatInput Component
//
var ChatInput = React.createClass({
  getInitialState: function(){
    return {value : ""};
  },
  handleChange: function(event){
    this.setState({value: event.target.value});
  },
  sendMessage: function(event){
    event.preventDefault();
    BOT.send.parse(this.props.ns, this.state.value);
    this.setState({value: ""});
  },
  render: function(){
    var value = this.state.value;
    return (
      <div className="ChatInput">
        <form className="SendForm" onSubmit={this.sendMessage}>
          <input type="text" className="TextInput" value={value} onChange={this.handleChange} tabIndex="1" />
        </form>
      </div>
    )
  }
});

//
// ChatMembers Component
//
var ChatMembers = React.createClass({
  render: function(){
    var inner = [];
    var privclasses = this.props.privclasses;
    var members = this.props.members;
    var levels = Object.keys(this.props.privclasses).sort().reverse();
    levels.forEach(function(lev){
      var privclass = privclasses[lev];
      var member_els = [];
      for(var name in members){
        var member = members[name];
        if(member.pc == privclass){
          var instances = member.instances>1?"["+member.instances+"]":"";
          var url = "http://"+member.username+".deviantart.com/";
          member_els.push(<li key={name} className="ChatMember"><a href={url} target="_blank">{member.username}{instances}</a></li>);
        }
      }
      if(member_els.length>0){
        inner.push(<div className="ChatPrivclass" key={privclass}><h2>{privclass}</h2>
        <ul className="ChatMemberList">{member_els}</ul>
        </div>);
      }
    })
    return (
      <div className="ChatMembers">
        {inner}
      </div>
    )
  }
});

//
// ConfigPage Component
//
var ConfigPage = React.createClass({
  render: function(){
    var config = this.props.data.config;
    function doLogout(){
      BOT.logout();
    }
    var loginDetails = !!config.damn_token?
      <div className="ConfigModule">
        <button className="LogoutButton" onClick={doLogout}>Logout</button>
        <h2>Login Details</h2>
        <ConfigInput config={config} option="username" title="Bot Username" editable={false} />
        <ConfigInput config={config} option="damn_token" title="dAmn Token" editable={false} />
        <ConfigInput config={config} option="access_token" title="Access Token" editable={false} />
        <ConfigInput config={config} option="refresh_token" title="Refresh Token" editable={false} />
      </div>
      :"";
    function formatAJOutput(v){
      var v=v||[];
      return v.join(" ");
    }
    function formatAJInput(v){
      if(v == "") return [];
      return v.split(" ");
    }
    return (
      <div className="ConfigPage">
        <h1>Configure Bot</h1>
        {loginDetails}
        <div className="ConfigModule">
          <h2>Bot Configuration</h2>
          <ConfigInput config={config} option="trigger" title="Bot Trigger" editable={true} />
          <ConfigInput config={config} option="owner" title="Bot Owner" editable={true} />
          <ConfigInput config={config} option="autojoin" title="Auto-Join Channels" subtitle="(space seperated)" editable={true} formatOutput={formatAJOutput} formatInput={formatAJInput} />
          <ConfigInput config={config} option="auto_connect" title="Auto-Connect to dAmn" subtitle="when running bot" editable={true} checkbox={true} />
        </div>
      </div>
    )
  }
});

var ConfigInput = React.createClass({
  handleCheckbox: function(event){
    BOT.config(this.props.option, event.target.checked);
  },
  render: function(){
    var title = this.props.title;
    var config = this.props.config;
    var option = this.props.option;
    var editable = this.props.editable;
    var formatOutput = this.props.formatOutput || function(v){return v};
    var formatInput = this.props.formatInput || function(v){return v};
    var value = formatOutput(config[option]);
    var check = this.props.checkbox;
    var subtitle = this.props.subtitle?<span className="subtitle">{this.props.subtitle}</span>:"";
    function editConfig(){
      var new_value = prompt("Enter a new value: ", value);
      if(new_value !== null){
        BOT.config(option, formatInput(new_value));
      }
    }
    if(check){
      var text = value?"(Enabled)":"(Disabled)";
      return (
        <div className="ConfigRow">
          <label>{title}{subtitle}</label><span className="value"><input type="checkbox" checked={value} onChange={this.handleCheckbox} /> {text}</span>
        </div>
      )
    }
    var edit_button = editable?<button className="EditButton" onClick={editConfig}>Edit</button>:"";
    return (
      <div className="ConfigRow">
        <label>{title}{subtitle}</label><span className="value">{value}</span>{edit_button}
      </div>
    )
  }
});

// Index
ControlPanel.add_page("log",{
  path: "/",
  title: "Log",
  component: LogPage
});
// Chat
ControlPanel.add_page("chat",{
  title: "Chat",
  path: "/chat",
  component: ChatroomPage,
  route: function(ctx, next){
    CP.data.current_channel = "ns:sumobot";
    next();
  }
});
// Configure
ControlPanel.add_page("config",{
  title: "Configure",
  component: ConfigPage
});
