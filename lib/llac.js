function llac(){
    var outside = this;
    var call = function(){
        var args = Array.prototype.slice.call(arguments);
        call.callbacks.forEach(function(callback){
            callback.apply(outside, args);
        });
        call.args = args;
        return call.listen;
    };
    call.callbacks = [];
    call.args = null;
    call.listen = function(callback, remove){
        if(typeof callback == 'function'){
            if(remove){
                var i = call.callbacks.indexOf(callback);
                if(i>-1){
                    call.callbacks.splice(i,1);
                }
            }else if(call.args){
                call.callbacks = [callback];
                call.apply(call, call.args);
            }else{
                call.callbacks.push(callback);
            }
        }
        return call.listen;
    };
    call.listen = call.listen.bind(call);
    return arguments.length?call.apply(this, arguments):call;
}
var module;
if(module){
    module.exports = llac;
}