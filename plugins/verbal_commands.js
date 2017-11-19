var llac = require('../lib/llac')

module.exports = function(){
  var BOT = this;

  // When a message is directed to the bot, check to see if it is a command that the bot knows
  // and if it is then execute the command

  console.log("HELLO FROM VERBAL COMMANDS")

  BOT.plugin("verbal_commands", {enabled: true}, function(plugin){

    BOT.verbal_commands = {};

    BOT.before("recv.msg", function(o,d){
      if(!plugin.enabled){
        d(o);
        return;
      };
      var nameL = (BOT.config("username")+":").toLowerCase(), textL = o.text.toLowerCase();
      if(textL.indexOf(nameL)==0){
        if(textL.indexOf(nameL+" ")==0){
          nameL = nameL+" ";
        }
        if(textL.indexOf(nameL+":")==0){
          nameL = nameL+":";
        }
        var sentence = o.text.slice(nameL.length);
        sentence = BOT.stripColorsTag(BOT.msgToText(sentence));
        trigger_vcommand(sentence, o.channel, o.from);
      }
      d(o);
    });

    BOT.matchCommand = function(command, message, result){
        var cmd = command.split(" ");
        var msg = message.split(" ");
        var i = 0;
        var word;
        var vars = {};
        var store = false;
        var content = [];
        for(var c=0; c<cmd.length; c++){
            word = cmd[c];
            var start = word.indexOf("(");
            var end = word.lastIndexOf(")");
            if(start > -1 && end > start){
                // Variable Declaration
                word = word.slice(start+1,end);
                for(var m=i; m<(cmd[c+1]?msg.lastIndexOf(cmd[c+1]):msg.length); m++){
                    content.push(msg[m]);
                }
                i = m;
                vars[word] = content.join(" ");
                var before
                console.log("Variable Recognized:", word,"=", vars[word]);
                content = [];
                if(i>=msg.length) break;
            }else{
                if(msg[i]!=word){
                    result(false);
                    return false;
                }
                i++;
            }
        }
        result(true, vars);
        return true;
    }

    function trigger_vcommand(sentence, channel, from){
        var done = false;
        function onDone(isDone){
            if(isDone){
                done = true;
            }
            if(!done){
                doNext();
            }
        }
        var structure_queue = Object.keys(BOT.verbal_commands).sort(function(a,b){
            var aa = a.split(" ").length;
            var bb = b.split(" ").length;
            if(aa==bb) return 0;
            return aa>bb?-1:1;
        });
        var structure;
        var response;
        var response_queue;
        var message_vars;
        function doNext(){
            var next = false;
            if(!structure||!response_queue.length){
                structure = structure_queue.shift();
                if(structure){
                    BOT.matchCommand(structure, sentence, function(match, vars){
                        if(!match){
                            structure = null;
                            response_queue = [];
                            next = true;
                        }else{
                            message_vars = vars;
                            message_vars.channel = channel;
                            message_vars.from = from;
                            message_vars.user = from;
                            response_queue = BOT.verbal_commands[structure];
                        }
                    });
                }else{
                    return;
                }
            }
            if(next){
                doNext();
                return;
            }
            response = response_queue.shift();
            if(typeof response == 'function'){
                response.call(BOT, message_vars, onDone)
            }
        }
        doNext();
    }

    BOT.vcommand = function(structure, command_fn){
        if(Object.keys(BOT.verbal_commands).indexOf(structure) < 0){
            BOT.verbal_commands[structure] = [];
        }
        var i = BOT.verbal_commands[structure].indexOf(command_fn);
        if(i<0){
            BOT.verbal_commands[structure].push(command_fn);
            return llac(null, true)
        }
        return llac("Command already exists.");
    };

    BOT.vcommand('say (message)', function(the, done){
        if(BOT.checkAuth(the.user, 1)){
            BOT.send.msg(the.channel, the.message);
        }else{
            BOT.send.msg_to(the.channel, the.user, "No.")
        }
        done(true);
    });
    BOT.vcommand('say (message) in (somewhere)', function(env, done){
        if(BOT.checkAuth(env.user, 1)){
            BOT.send.msg(env.somewhere, env.message);
        }else{
            BOT.send.msg_to(env.channel, env.user, "No.")
        }
        done(true);
    });
    BOT.vcommand('say (message) to (someone)', function(env, done){
        if(BOT.checkAuth(env.user, 1)){
            BOT.send.msg_to(env.channel, env.someone, env.message);
        }else{
            BOT.send.msg_to(env.channel, env.user, "No.")
        }
        done(true);
    });
    BOT.vcommand('say (message) to (someone) in (somewhere)', function(env, done){
        if(BOT.checkAuth(env.user, 1)){
            BOT.send.msg_to(env.somewhere, env.someone, env.message);
        }else{
            BOT.send.msg_to(env.channel, env.user, "No.")
        }
        done(true);
    });
    function join_cmd(env, done){
        if(BOT.checkAuth(env.user, 2)){
            BOT.send.join(env.chatroom);
            done(false);
        }else{
            BOT.send.msg_to(env.channel, env.user, "No.")
            done(true);
        }
    }
    BOT.vcommand('join (chatroom)', join_cmd);
    BOT.vcommand('goto (chatroom)', join_cmd);
    BOT.vcommand('go to (chatroom)', join_cmd);
    BOT.vcommand('goto the chatroom (chatroom)', join_cmd);
    BOT.vcommand('go to the chatroom (chatroom)', join_cmd);
    BOT.vcommand('join the chatroom (chatroom)', join_cmd);

    BOT.vcommand('please (command)', function(env, done){
        trigger_vcommand(env.command, env.channel, env.user);
        done(false);
    });

    BOT.vcommand('restart', function(env, done){
        if(BOT.checkAuth(env.user, 4)){
            BOT.restart();
        }
        done(true);
    });

  });

};
