module.exports = function(){
  var BOT = this;
  BOT.users = {};
  this.checkAuth = function(user, privlevel){
    if(BOT.get("owner").toLowerCase() == user.toLowerCase()) return true;
    return BOT.users.hasOwnProperty(user.toLowerCase()) && BOT.users[user] >= privlevel;
  };
}