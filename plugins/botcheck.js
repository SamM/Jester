var md5 = require('MD5');

module.exports = function(){
  var BOT = this;

	BOT.plugin('botcheck', {reply: 'I\'m a bot'}, function(plugin){
		function botcheckResponse(from){
			return 'BDS:BOTCHECK:RESPONSE:'+[
        from,
        BOT.get("owner"),
        BOT.get("useragent").split(" ").join(",")+"/0.2",
        md5((BOT.get("trigger")+from+BOT.get("username")).toLowerCase()),BOT.get("trigger")
      ].join(",");
		}
		this.pre('recv:msg', function(o,d){
			if(new RegExp(BOT.get("username")+"(: |:)botcheck", "gi").test(o.text)) {
				var msg = plugin.reply+'<abbr title="'+[
          "botresponse:",
          o.from,
          BOT.get("owner"),
          BOT.get("useragent")+"/0.2",
          md5((BOT.get("trigger")+o.from+BOT.get("username")).toLowerCase()),
          BOT.get("trigger")
        ].join(" ")+'"></abbr>';
				BOT.send.msg(o.channel, msg);
			}
			if(o.channel == 'chat:DataShare'){
				if(o.text.indexOf("BOTCHECK:ALL") == 0 || o.text.indexOf("BDS:BOTCHECK:DIRECT:"+BOT.get("username"))==0){
					BOT.send.msg(o.channel, botcheckResponse(o.from));
				}
			}
			d(o);
		});
		BOT.pre('logMsg', function(o,d){
			if(o.channel != 'chat:DataShare') d(o);
		});
		BOT.autojoin('DataShare');
	});
}
