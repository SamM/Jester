module.exports = function(){
  this.plugins = {};
  this.plugin = function(id, data, fn){
    BOT.events.emit("plugin", typeof id=="string"?id:null, typeof data=="object"?data:{});
    if(typeof id == 'function'){
      return id.call(this, this, {});
    }
    if(typeof data == 'function'){
      fn = data;
      data = {};
    }
    if(typeof id != 'string' || typeof fn != 'function')
      throw new Error('TypeError');
    this.plugins[id] = data;
    return fn.call(this, this, this.plugins[id]);
  };
}
