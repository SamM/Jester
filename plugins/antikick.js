module.exports = function(){
  var BOT = this;

	BOT.plugin('antikick', {enabled: true}, function(plugin){

		BOT.post('kicked', function(o,d){
			if(plugin.enabled){
				BOT.send.join(o.channel);
			}
			d(o);
		});
    
	});

};
