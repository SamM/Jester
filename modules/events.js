var EventEmitter = require('events');

module.exports = function(){
  var BOT = this;
  this.events = new EventEmitter();
  this.preprocessors = {};
  this.postprocessors = {};
  this.process = function(id, object, process){
    if(typeof object == "function"){
      process = object;
      object = {};
    }
    if(typeof process != 'function')
      process = function(o,pass){ pass(o); };
    var prep = this.preprocessors[id], post = this.postprocessors[id], self=this, i=0;
    prep = Array.isArray(prep)?prep:[];
    post = Array.isArray(post)?post:[];
    function preprocessing(o){
      if(i>=prep.length) callprocess(o);
      else {try{
        prep[i++].call(self, o, preprocessing);
      }catch(ex){
        i++;
        console.log(ex);
        preprocessing(o);
      }
      }
    }
    function callprocess(o){
      i=0;
      BOT.events.emit("event", id, o);
      BOT.events.emit(id, o);
      process.call(self, o, postprocessing)
    }
    function postprocessing(o){
      if(i<post.length) {
        try{
          post[i++].call(self, o, postprocessing);
        }catch(ex){
          i++;
          console.log(ex);
          postprocessing(o);
        }
      }
    }
    (prep.length>0?preprocessing:callprocess)(object);
    return this;

  };
  this.before = function(id, processor){
    if(!Array.isArray(this.preprocessors[id]))
      this.preprocessors[id] = [];
    var prep=this.preprocessors[id];
    if(typeof processor == "function") prep.push(processor);
    return this;
  };
  this.after = function(id, processor){
    if(!Array.isArray(this.postprocessors[id]))
      this.postprocessors[id] = [];
    var post=this.postprocessors[id];
    if(typeof processor == "function") post.push(processor);
    return this;
  };
  this.on = this.events.on;
  this.emit = this.events.emit;
}
