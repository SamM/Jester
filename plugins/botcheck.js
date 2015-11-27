var md5 = require('MD5');

module.exports = function(){
  var BOT = this;

	BOT.plugin('botcheck', {reply: 'I\'m a bot'}, function(plugin){
		function botcheckResponse(from){
			return 'BDS:BOTCHECK:RESPONSE:'+[
        from,
        BOT.config("owner"),
        BOT.config("useragent").split(" ").join(",")+"/0.2",
        md5((BOT.config("trigger")+from+BOT.config("username")).toLowerCase()),BOT.config("trigger")
      ].join(",");
		}
		this.after('recv:msg', function(o,d){
			if(new RegExp(BOT.config("username")+"(: |:)botcheck", "gi").test(o.text)) {
				var msg = plugin.reply+'<abbr title="'+[
          "botresponse:",
          o.from,
          BOT.config("owner"),
          BOT.config("useragent")+"/0.2",
          md5((BOT.config("trigger")+o.from+BOT.config("username")).toLowerCase()),
          BOT.config("trigger")
        ].join(" ")+'"></abbr>';
				BOT.send.msg(o.channel, msg);
			}
			if(o.channel == 'chat:DataShare'){
				if(o.text.indexOf("BOTCHECK:ALL") == 0 || o.text.indexOf("BDS:BOTCHECK:DIRECT:"+BOT.config("username"))==0){
					BOT.send.msg(o.channel, botcheckResponse(o.from));
				}
			}
			d(o);
		});
		BOT.before('logMsg', function(o,d){
			if(o.channel == 'chat:DataShare') o.halt = true;
      d(o);
		});
		BOT.autojoin('DataShare');
	});
}
