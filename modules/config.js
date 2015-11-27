module.exports = function(){
  this.config_data = {};
  this.config = function(key, value, safe){
    if(typeof value == "undefined"){
      this.events.emit("config_get", {key: key, value: this.config_data[key]});
      return this.config_data[key];
    }
    this.events.emit("config_set", {key: key, value: value});
    if(typeof this.config_data[key] != "undefined" && safe) return;
    this.config_data[key] = value;
  }
}
