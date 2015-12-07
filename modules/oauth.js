var OAuth = require("oauth"),
    OAuth2 = OAuth.OAuth2;

var client = {
  id: '4032',
  secret: 'b3539f81e5a0ef4c5af30621bf0f1798',
  url: 'http://localhost:4000/auth/provider/deviantart/callback'
};

var oauth = new OAuth2(
  client.id,
  client.secret,
  "https://www.deviantart.com/",
  "oauth2/authorize",
  "oauth2/token",
  null);

module.exports = function(){
  this.oauth = oauth;
};
module.exports.oauth = oauth;
