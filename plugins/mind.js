var util = require("util");

module.exports = function(){
  var BOT = this;

  BOT.stripAbbrs = function(text){
    return text;
  }

  Array.random = function(array){
    var i = Math.floor(Math.random()*array.length);
    return array[i];
  }

  BOT.mind = {};
  BOT.mind.responses = BOT.config.get("responses")||{};
  BOT.mind.response = function(name, message){
    var responses = BOT.mind.responses;
    if(!Array.isArray(responses[name])){
      responses[name] = [];
    }
    responses[name].push(message);
    BOT.config.set("responses", responses);
  };
  BOT.mind.get_response = function(name, from, channel, wildcards){
    var responses = BOT.mind.responses;
    if(Array.isArray(responses[name])){
      var response = Array.random(responses[name]);
      response = BOT.mind.replace_wildcards(response, from, channel, wildcards);
      return response;
    }else{
      return "";
    }
  }

  BOT.mind.replace_wildcards = function(input, from, channel, wildcards){
    input = input.split("$from").join(from);
    input = input.split("$room").join("#"+channel.replace("chat:", "").replace("#", ""));
    input = input.split("$self").join(BOT.config.get("username"));
    input = input.split("$owner").join(BOT.config.get("owner"));
    input = input.split("$trigger").join(BOT.config.get("trigger"));
    if(Array.isArray(wildcards)){
      input = input.split("$0").join(wildcards.join(" "));
      for(var v=0;v<10; v++){
        input = input.split("$"+(v+1)).join(wildcards[v]?wildcards[v]:"");
      }
    }
    return input;
  }

  BOT.mind.reactions = BOT.config.get("reactions")||{};
  BOT.mind.when = function(action, response){
    var reactions = BOT.mind.reactions;
    action = action.toLowerCase();
    if(!Array.isArray(reactions[action])){
      reactions[action] = [];
    }
    reactions[action].push(response);
    BOT.config.set("reactions", reactions);
  };

  BOT.mind.split = function(input){
    var steps = [];
    var build = "";
    for(var i=0; i<input.length; i++){
      var char = input[i];
      if(char == " "){
        if(build=="'s"){
          steps.push("is");
        }else{
          steps.push(build);
        }
        build = input[i-1]=='"'?'"':"";
        build += input[i+1]=='"'?'"':"";
        if(build) steps.push(build);
        build = "";
      }else if(char == "'" || char == "!" || char == "?"){
        steps.push(build);
        build = char;
      }else if(char == '"'){
        continue;
      }else if(char == '*' || char == "?" || char == "!"|| char == ","|| char == "."){
        steps.push(build);
        steps.push(char);
        build = "";
      }else{
        build+=char;
      }
    }
    if(build) steps.push(build);
    return steps;
  }

  BOT.mind.search = function(message, lookfor){
    var words = BOT.mind.split(lookfor.toLowerCase()),
    msg = BOT.mind.split(message.toLowerCase()),
    msgCase = BOT.mind.split(message),
    i = 0, results = [];
    for(var m=0; m<msg.length; m++){
      if(msg[m] == words[i]){
        i++;
      }else if(words[i] == "$$"){
        results.push(msgCase[m]);
        i++;
      }else if(words[i] == "$*"){
        results.push(msgCase[m]);
        i++;
      }
      if(i==words.length){
        return results;
      }
    }
    return false;
  }

  BOT.mind.respond = function(message, from, channel){
    var reactions = BOT.mind.reactions;
    var responses = BOT.mind.responses;
    var output = [];
    var response;
    var actions = [];
    var results;
    for(var action in reactions){
      results = BOT.mind.search(message, action)
      if(results){
        actions.push([action, results]);
      }
    }
    actions.sort(function(a,b){
      return a[0].length < b[0].length;
    })
    console.log(actions);
    if(actions.length){
      var action = actions[0][0];
      var vars = actions[0][1];
      response = reactions[action];
      for(var i=0; i<response.length; i++){
        var reaction = response[i];
        reaction = BOT.mind.replace_wildcards(reaction, from, channel, vars);
        if(responses[reaction]){
          var out = BOT.mind.get_response(reaction, from, channel, vars);
          output.push(out);
        }
      }
    }
    if(output.length){
      output = Array.random(output);
      if(output){
        if(output.indexOf(" ")>-1 && output.slice(output.indexOf(" ")-1,output.indexOf(" ")) == ":"){
          BOT.send.msg(channel, output);
        }else{
          BOT.send.msg(channel, from+": "+output);
        }
        return true;
      }
    }
    return false;
  }

  BOT.plugin("mind", {enabled: true}, function(plugin){

    this.command.before('what', function(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
        var channel = o.channel;
        var input = o.params.join(" ").split("|");
        if(input.length<2){
          BOT.send.msg_to(channel, o.from, BOT.mind.get_response("error", o.from, channel));
          return;
        }
        BOT.mind.response(input[0], input[1]);
        BOT.send.msg_to(channel, o.from, BOT.mind.get_response("done", o.from, channel));
    	}
    });

    this.command.before('responses', function(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
        var channel = o.channel;
        var input = o.params.join(" ");
        var response;
        if(!input){
          response = "I know responses for these keywords:<br>"+Object.keys(BOT.mind.responses).sort().join(", ");
        }else{
          var responses = BOT.mind.responses[input];
          response = responses?"<br>"+responses.join("<br>"):BOT.mind.get_response("none", o.from, channel);
        }
        BOT.send.msg_to(channel, o.from, response);
    	}
    });

    this.command.before('when', function(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
        var channel = o.channel;
        var input = o.params.join(" ").split("|");
        BOT.mind.when(input[0], input[1]);
        if(input.length<2){
          BOT.send.msg_to(channel, o.from, BOT.mind.get_response("error", o.from, channel));
          return;
        }
        BOT.send.msg_to(channel, o.from, BOT.mind.get_response("done", o.from, channel));
    	}
    });

    this.command.before('reactions', function(o){
      if(!plugin.enabled) return;
    	if(BOT.checkAuth(o.from, 1)){
        var channel = o.channel;
        //var input = o.params.join(" ");
        var reactions = BOT.mind.reactions;
        var sentences = [];
        for(var action in reactions){
          var responses = reactions[action];
          for(var i=0;i<responses.length;i++){
            sentences.push(action+"|"+responses[i]);
          }
        }
        var response = sentences?"<br>"+sentences.join("<br>"):BOT.mind.get_response("none", o.from, channel);
        BOT.send.msg_to(channel, o.from, response);
    	}
    });

    BOT.before("recv.msg", function(o,d){
      try{
        if(!plugin.enabled){
          d(o);
          return;
        }
        var color_tag = /<abbr title="[^"]*"><\/abbr>/gi;
        var text = BOT.msgToText(o.text).replace(color_tag, "");

        var nameL = (BOT.config("username")+":").toLowerCase(),
          textL = text.toLowerCase();

        if(textL.indexOf(nameL)==0){
          if(textL.indexOf(nameL+" ")==0){
            nameL = nameL+" ";
          }
          var input = text.slice(nameL.length);
          var fromL = o.from.toLowerCase()

          var responded = BOT.mind.respond(o.from+" says: "+input, o.from, o.channel);
          if(!responded) responded = BOT.mind.respond("anyone says: "+input, o.from, o.channel);
          if(!responded && false){
            var response = BOT.mind.get_response("dunno", o.from, o.channel);
            BOT.send.msg_to(o.channel, o.from, response);
          }
        }
      }catch(ex){
        console.error(ex.stack);
      }
      d(o);
    });

    BOT.before("recv.join", function(o,d){
      try{
        if(!plugin.enabled){
          d(o);
          return;
        }
        console.log(o.user+" joined "+o.channel);
        var channel = "#"+o.channel.replace("chat:","");
        var responded = BOT.mind.respond(o.user+" joins: "+channel, o.user, o.channel);
        if(!responded) responded = BOT.mind.respond("anyone joins: "+channel, o.user, o.channel);
        if(!responded) responded = BOT.mind.respond(o.user+" joins: anywhere", o.user, o.channel);
        if(!responded) responded = BOT.mind.respond("anyone joins: anywhere", o.user, o.channel);
      }catch(ex){
        console.error(ex.stack);
      }
      d(o);
    });
  });

};
