module.exports = function(){
  var BOT = this;
  BOT.config("autojoin", [], true);
  this.autojoin = function(){
    var channels = [].slice.call(arguments);
    BOT.process("autojoin_append", { channels: channels }, function(o, d){
      BOT.config("autojoin", BOT.config("autojoin").concat(o.channels));
      d(o);
    })
    return this;
  };
}
