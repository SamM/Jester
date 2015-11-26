module.exports = function(){
  this.config = {};
  this.set = function(key, value){
    this.config[key] = value;
    this.events.emit("set", key, value);
  }
  this.get = function(key){
    this.events.emit("get", key);
    return this.config[key];
  }
}
