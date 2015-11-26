module.exports = function(){
  this.autojoin_channels = [];
  this.autojoin = function(){
    this.autojoin_channels = this.autojoin_channels.concat([].slice.call(arguments));
    this.events.emit("add_autojoin", {channels: this.autojoin_channels});
    return this;
  };
}
