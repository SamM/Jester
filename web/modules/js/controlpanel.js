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
    CP.log_messages.push(message);
    CP.render("log");
  };

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
        msg = obj.msg;
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
      <ControlPanelComp data={this.data} channels={this.channels} pages={this.pages} log={this.log_messages}/>,
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
    if(!current_channel){
      return (
        <div className="ChatroomPage Empty"></div>
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
// ChatTabs Component
//
var ChatTabs = React.createClass({
  render: function(){
    var channels = this.props.channels;
    var current_channel = this.props.current_channel;
    var tabs = [];
    for(var ns in channels){
      var current = ns.toLowerCase() == current_channel.toLowerCase();
      tabs.push(<ChatTab ns={ns} key={ns} current={current} />);
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
    if(this.props.current){
      inner = <span>{name}</span>;
    }else{
      inner = <a onClick={switchChannel}>{name}</a>;
    }
    return (
      <div className="ChatTab">
        {inner}
      </div>
    );
  }
});

//
// Chatroom Component
//
var Chatroom = React.createClass({
  render: function(){
    var channel = this.props.channel;
    return (
      <div className="Chatroom">
        <div className="ChatTitle" dangerouslySetInnerHTML={{__html: channel.title}}></div>
        <div className="ChatBody">
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
  render: function(){
    var messages = this.props.messages;
    var ns = this.props.ns;
    return (
      <div className="ChatMessageList">
        <div className="Messages">
        {messages.map(function(msg, i){
          return <ChatMessage key={i} message={msg} ns={ns} />;
        })}
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
      inner = <div className="msg"><span className="user">{msg.user}</span> <span className="text" dangerouslySetInnerHTML={{__html: msg.text}}></span></div>;
      break;

      case "action":
      inner = <div className="action"><span className="user">{msg.user}</span> <span className="text" dangerouslySetInnerHTML={{__html: msg.text}}></span></div>;
      break;

      case "join":
      inner = <div className="join"><span className="user">{msg.user}</span> <span className="text">has joined</span></div>;
      break;

      case "part":
      var reason = msg.reason?<span className="reason">{msg.reason}</span>:"";
      inner = <div className="part"><span className="user">{msg.user}</span> <span className="text">has left</span> {reason}</div>;
      break;

      case "title":
      inner = <div className="title"><span className="text">title changed by</span> <span className="user">{msg.user}</span></div>;
      break;

      case "topic":
      inner = <div className="topic"><span className="text">topic changed by</span> <span className="user">{msg.user}</span></div>;
      break;

      case "kicked":
      inner = <div className="kicked"><span className="user">{msg.user}</span> <span className="text">was kicked by</span> <span className="by">{msg.by}</span> <span className="reason" dangerouslySetInnerHTML={{__html: msg.reason}}></span></div>;
      break;

      case "privchange":
      inner = <div className="privchange"><span className="user">{msg.user}</span> <span className="text">has been made a member of <span className="pc">{msg.pc}</span> by</span> <span className="by">{msg.by}</span></div>;
      break;

      case "self_join":
      inner = <div className="join self"><span className="user">You</span> <span className="text">have joined {channel_name}</span></div>;
      break;

      case "self_part":
      inner = <div className="part self"><span className="user">You</span> <span className="text">have left {channel_name}</span></div>;
      break;

      case "self_kicked":
      inner = <div className="kicked self"><span className="user">You</span> <span className="text">have been kicked by</span> <span className="by">{msg.by}</span> <span className="reason" dangerouslySetInnerHTML={{__html: msg.reason}}></span></div>;
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
  render: function(){
    return (
      <div className="ChatInput">
        <input type="text" className="TextInput" />
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
          member_els.push(<li key={name} className="ChatMember">{member.username}{instances}</li>);
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
        <ConfigRow config={config} option="username" title="Bot Username" editable={false} />
        <ConfigRow config={config} option="damn_token" title="dAmn Token" editable={false} />
        <ConfigRow config={config} option="access_token" title="Access Token" editable={false} />
        <ConfigRow config={config} option="refresh_token" title="Refresh Token" editable={false} />
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
          <ConfigRow config={config} option="trigger" title="Bot Trigger" editable={true} />
          <ConfigRow config={config} option="owner" title="Bot Owner" editable={true} />
          <ConfigRow config={config} option="autojoin" title="Auto-Join Channels" subtitle="(space seperated)" editable={true} formatOutput={formatAJOutput} formatInput={formatAJInput} />
        </div>
      </div>
    )
  }
});

var ConfigRow = React.createClass({
  render: function(){
    var title = this.props.title;
    var config = this.props.config;
    var option = this.props.option;
    var editable = this.props.editable;
    var formatOutput = this.props.formatOutput || function(v){return v};
    var formatInput = this.props.formatInput || function(v){return v};
    var value = formatOutput(config[option]);
    var subtitle = this.props.subtitle?<span className="subtitle">{this.props.subtitle}</span>:"";
    function editConfig(){
      var new_value = prompt("Enter a new value: ", value);
      if(new_value !== null){
        BOT.config(option, formatInput(new_value));
      }
    }
    var edit_button = editable?<button className="EditButton" onClick={editConfig}>Edit</button>:"";
    return (
      <div className="ConfigRow">
        <label>{title}{subtitle}</label><span className="value">{value}</span>{edit_button}
      </div>
    )
  }
});

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
    var Page_Component = page.component?page.component:EmptyPage;
    return (
      <div className="ControlPanel">
        <NavBar pages={pages} data={data}/>
        <Page_Component page={page} data={data} log={log} channels={channels}/>
      </div>
    );
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
  },
  need_auth: true,
  need_connection: true
});
// Configure
ControlPanel.add_page("config",{
  title: "Configure",
  component: ConfigPage
});
