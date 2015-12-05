module.exports = function(){
  var BOT = this;
  this.autojoin = function(){
    var channels = [].slice.call(arguments);
    BOT.config("autojoin", [], true);
    BOT.process("autojoin_append", { channels: channels }, function(o, d){
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
    return this;
  };
}
