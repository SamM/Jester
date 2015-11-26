module.exports = function(){
  this.log = function(str){
    this.process('log', {'text': str}, function(o,d){
      console.log(o.text);
      d(o);
    });
    return this;
  };
  this.logMsg = function(channel, str){
    this.process('logMsg', {'channel': channel, 'text': str}, function(o,d){
      this.log("["+this.simpleNS(o.channel)+"] "+o.text);
      d(o);
    })
    return this;
  };
};
