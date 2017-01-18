module.exports = function(){
  var BOT = this;
  BOT.users = {};
  this.checkAuth = function(user, privlevel){
    if(privlevel===0) return true;
    if(BOT.config("owner").toLowerCase() == user.toLowerCase()) return true;
    if(user == "*WEB*") return true;
    return BOT.users.hasOwnProperty(user.toLowerCase()) && BOT.users[user] >= privlevel;
  };
}
