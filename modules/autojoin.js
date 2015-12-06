module.exports = function(){
  var BOT = this;
  BOT.autojoin = function(){
    var channels = [].slice.call(arguments);
    BOT.process("autojoin_add", { channels: channels }, function(o, d){
      var channels = (BOT.config("autojoin")||[]).concat(o.channels);
      var output = [];
      channels.forEach(function(c){
        if(output.indexOf(c)==-1){
          output.push(c);
        }
      });
      o.channels = output;
      BOT.config("autojoin", output);
      d(o);
    })
    return BOT;
  };
  BOT.autojoin.add = this.autojoin;
  BOT.autojoin.remove = function(){
    var channels = [].slice.call(arguments);
    BOT.process("autojoin_add", { channels: channels }, function(o, d){
      var existing = (BOT.config("autojoin")||[]);
      var output = [];
      var channels = o.channels.map(function(chan){
        return chan.toLowerCase();
      });
      existing.forEach(function(c){
        if(channels.indexOf(c.toLowerCase())==-1){
          output.push(c);
        }
      });
      o.channels = output;
      BOT.config("autojoin", output);
      d(o);
    })
    return BOT;
  }
}
