module.exports = function(){
  var BOT = this;

  var express = require("express");
  var app = express();
  var server = require("http").Server(app);
  var io = require('socket.io')(server);
  var handlebars = require("express-handlebars");

  BOT.web = {};
  BOT.web.app = app;
  BOT.web.server = server;
  BOT.web.io = io;

  //
  // Web Socket Connection
  //
  io.on('connection', function (socket) {
    BOT.web.socket = socket;
    //
    // Load Bot Events Plugin
    //
    require("./bot_events").call(BOT);
  });

  //
  // Express App Settings
  //
  app.engine("handlebars", handlebars({
    defaultLayout: 'main'
  }));
  app.set("view engine", "handlebars");
  app.use(express.static("public"));

  //
  // Load OAuth Plugin
  //
  require("./oauth").call(BOT);

  //
  // Index Route
  //
  app.get('/', function (req, res) {
    var data = {
      scripts: ["/socket.io/socket.io.js","/js/bot_connection.js"],
      token: BOT.config("damn_token"),
      username: BOT.config("username"),
      auth_error: BOT.config("auth_error"),

      auth_url: authURL = BOT.oauth.getAuthorizeUrl({
        redirect_uri: 'http://localhost:4000/auth/provider/deviantart/callback',
        scope: ['user'],
        state: "Hello World",
        response_type: "code"
      })
    };

    res.render("home", data);
  });

  //
  //  Callback route for deviantart oauth
  //
  app.get('/auth/provider/deviantart/callback', function(req, res){

    //
    //  Get DA Access & Refresh Token
    //
    BOT.oauth.getOAuthAccessToken(
      req.query.code,
      {
        'grant_type': 'authorization_code',
        redirect_uri: 'http://localhost:4000/auth/provider/deviantart/callback'
      },
      function(err, access_token, refresh_token, results){
        if(err){
          BOT.config("auth_error", err);
          res.redirect("/");
        }else{
          BOT.config("access_token", access_token);
          BOT.config("refresh_token", refresh_token);

          //
          //  Get DA User Info
          //
          BOT.oauth.get('https://www.deviantart.com/api/v1/oauth2/user/whoami', access_token,
            function(err2, body, resp){
              if(err2){
                BOT.config("auth_error", err2);
                res.redirect("/");
                return;
              }
              var results = JSON.parse(body);
              BOT.config("username", results.username);
              BOT.config("user_icon", results.usericon);
              BOT.config("user_type", results.type);

              //
              //  Get dAmn Token
              //
              BOT.oauth.get('https://www.deviantart.com/api/v1/oauth2/user/damntoken', access_token,
                function(err3, body, resp){
                  if(err3){
                    BOT.config("auth_error", err3);
                    res.redirect("/");
                    return;
                  }
                  var results = JSON.parse(body);
                  BOT.config("damn_token", results.damntoken);
                  res.redirect("/");
              });
          });

        }
      }
    );
  });

  //
  // Start server listening on BOT.run()
  //
  BOT.pre("run", function(o,d){
    o.server = BOT.server;
    BOT.server.listen(4000, function () {
      var port = server.address().port;
      var host = server.address().host;
      host = host==":"?"localhost":host;
      o.port = port;
      o.host = host;
      console.log('Bot Control Panel available at http://+'host'+:'+port);
      d(o);
    });
  });

};
