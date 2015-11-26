var Jester = require("./Jester");
var oauth = require("./oauth");
var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require('socket.io')(server);
var handlebars = require("express-handlebars");

var BOT = new Jester();
BOT.autojoin("sumobot", "Botdom");
BOT.set("owner", "sumopiggy");
BOT.set("trigger", "?");
BOT.DEBUG = false;

app.engine("handlebars", handlebars({
  defaultLayout: 'main'
}));
app.set("view engine", "handlebars");
app.use(express.static("public"));

app.get('/', function (req, res) {
  var data = {
    scripts: ["/socket.io/socket.io.js","/js/bot_connection.js"],
    token: BOT.get("damn_token"),
    username: BOT.get("username"),
    auth_error: BOT.get("auth_error"),

    auth_url: authURL = oauth.getAuthorizeUrl({
      redirect_uri: 'http://localhost:4000/auth/provider/deviantart/callback',
      scope: ['user'],
      state: "Hello World",
      response_type: "code"
    })
  };

  res.render("home", data);
});

io.on('connection', function (socket) {
  require("./bot_events").call(BOT, socket);
});


app.get('/auth/provider/deviantart/callback', function(req, res){
  console.log("code: "+req.query.code);
  oauth.getOAuthAccessToken(
    req.query.code,
    {
      'grant_type': 'authorization_code',
      redirect_uri: 'http://localhost:4000/auth/provider/deviantart/callback'
    },
    function(err, access_token, refresh_token, results){
      if(err){
        BOT.set("auth_error", err);
        res.redirect("/");
      }else{
        BOT.set("access_token", access_token);
        BOT.set("refresh_token", refresh_token);
        oauth.get('https://www.deviantart.com/api/v1/oauth2/user/whoami', access_token,
          function(err2, body, resp){
            if(err2){
              BOT.set("auth_error", err2);
              res.redirect("/");
              return;
            }
            var results = JSON.parse(body);
            BOT.set("username", results.username);
            BOT.set("user_icon", results.usericon);
            BOT.set("user_type", results.type);
            oauth.get('https://www.deviantart.com/api/v1/oauth2/user/damntoken', access_token,
              function(err3, body, resp){
                if(err3){
                  BOT.set("auth_error", err3);
                  res.redirect("/");
                  return;
                }
                var results = JSON.parse(body);
                BOT.set("damn_token", results.damntoken);
                res.redirect("/");
            });
        });

      }
    }
  );
});

server.listen(4000, function () {
  var port = server.address().port;
  console.log('Bot Control Panel listening at http://localhost:'+port);
});
