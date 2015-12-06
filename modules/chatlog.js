module.exports = function(){
  var BOT = this;

  BOT.chat = {};
  BOT.chat.channels = {};
  BOT.chat.log = function(channel, msg){
    var ns = BOT.formatNS(channel.toLowerCase());
    msg.timestamp = (new Date()).getTime();
    BOT.process("chat.log", { ns: ns, msg: msg }, function(o,d){
      if(!BOT.chat.channels.hasOwnProperty(ns)){
        BOT.chat.channels[ns] = [];
      }
      BOT.chat.channels[ns].push(msg);
      d(o);
    });
  };

  BOT.chat.msg = function(channel, user, text){
    var msg = {
      type: "msg",
      user: user,
      text: text
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.action = function(channel, user, text){
    var msg = {
      type: "action",
      user: user,
      text: text
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.title = function(channel, user, text){
    var msg = {
      type: "title",
      user: user,
      text: text
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.topic = function(channel, user, text){
    var msg = {
      type: "msg",
      user: user,
      text: text
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.join = function(channel, user, args){
    var msg = {
      type: "join",
      user: user,
      args: args
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.part = function(channel, user, reason){
    var msg = {
      type: "part",
      user: user,
      reason: reason
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.kicked = function(channel, user, by, reason){
    var msg = {
      type: "kicked",
      user: user,
      by: by,
      reason: reason
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.self_join = function(channel){
    var msg = {
      type: "self_join"
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.self_part = function(channel){
    var msg = {
      type: "self_part"
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.self_kicked = function(channel, by, reason){
    var msg = {
      type: "self_kicked",
      by: by,
      reason: reason
    };
    BOT.chat.log(channel, msg);
  };

  BOT.chat.privchange = function(channel, user, by, pc){
    var msg = {
      type: "privchange",
      user: user,
      by: by,
      pc: pc
    };
    BOT.chat.log(channel, msg);
  };

};
