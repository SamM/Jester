var OAuth = require("oauth"),
    OAuth2 = OAuth.OAuth2;

var client = {
  id: '3957',
  secret: '4e9fbce42c670c2f85e54244b91d147d',
  url: 'http://localhost:4000/auth/provider/deviantart/callback'
};

var oauth = new OAuth2(
  client.id,
  client.secret,
  "https://www.deviantart.com/",
  "oauth2/authorize",
  "oauth2/token",
  null);

module.exports = oauth;
