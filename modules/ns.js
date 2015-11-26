module.exports = function(){
  String.prototype.sj=function(s,j){return this.split(s).join(j);};
  function ns_(ns){ ns = ns.sj("#","chat:"); return ns.indexOf("chat:")<0?"chat:"+ns:ns; }
	function _ns(ns){
		if(ns.indexOf("pchat:")==0){
			ns = ns.slice(6).split(":");
			if(ns.length==1) ns = ns[0];
			else ns = ns[0].toLowerCase()==BOT.config("username").toLowerCase()?ns[1]:ns[0];
			ns = "pchat:"+ns;
		}
		return ns.sj("pchat:","@").sj("chat:","#");
	}
  this.ns_ = this.formatNS = ns_;
  this._ns = this.simpleNS = _ns;
  this.formatChatNS = function(ns, bot_username){
    if(!ns || !ns.length) return null;
    if(!bot_username){
      bot_username = this.get("username");
    }
    if(!bot_username){
      return null;
    }
    if(ns[0]=="@") ns=ns.slice(1);
    if(ns.indexOf("pchat:")==0){
      ns = ns.slice(6).split(":");
      if(ns.length>1){

        if(ns[0].toLowerCase() == bot_username.toLowerCase()) ns = ns[1];
        else if(ns[1].toLowerCase() == bot_username.toLowerCase()) ns = ns[0];
        else return null;
      }else{
        ns=ns[0];
      }
    }
    return "pchat:"+[bot_username,ns].sort().join(":");
  };
}
