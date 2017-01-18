module.exports = function(){
  var BOT = this;

  // Use bot username instead of a trigger to give commands
  BOT.plugin("name_trigger", {enabled: false}, function(plugin){

    BOT.before("recv.msg", function(o,d){
      if(!plugin.enabled){
        d(o);
        return;
      };
      var nameL = (BOT.config("username")+":").toLowerCase(), textL = o.text.toLowerCase();
      if(textL.indexOf(nameL)==0){
        if(textL.indexOf(nameL+" ")==0){
          nameL = nameL+" ";
        }
        console.log(nameL);
        var params = o.text.slice(nameL.length).split(" "),
          cmd = params.shift();
        BOT.command(cmd, o.channel, o.from, params);
      }
      d(o);
    });

  });

};
