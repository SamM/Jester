module.exports = function(){
  var BOT = this;
  this.plugins = {};
  var unique_id = 1;
  this.plugin = function(id, data, fn){
    if(typeof id == 'function'){
      fn = id;
      id = "unknown_plugin_"+(unique_id++);
      data = {};
    }
    if(typeof data == "function"){
      fn = data;
      data = {};
    }
    if(typeof id != 'string' || typeof fn != 'function' || typeof data != "object")
      throw new Error('TypeError');

    BOT.process("plugin", { id: id, data: data }, function(o,d){
      data.plugin_id = id;
      BOT.plugins[id] = data;
      fn.call(BOT, BOT.plugins[id], BOT);
      d(o);
    });
  };
}
