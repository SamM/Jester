module.exports = function(){
  var BOT = this;

  var express = require("express");
  var app = express();
  var server = require("http").Server(app);
  var io = require('socket.io')(server);
  var handlebars = require("express-handlebars");
  var fs = require("fs");
  var enableDestroy = require('server-destroy');

  enableDestroy(server);

  BOT.web = {};
  BOT.web.app = app;
  BOT.web.server = server;
  BOT.web.socket = io;

  BOT.config.unset("auth_error");

  //
  // Express App Settings
  //
  app.engine("handlebars", handlebars({
    defaultLayout: 'main'
  }));
  app.set("view engine", "handlebars");
  app.use(express.static("web"));

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
  // Index Route
  //
  function index(req, res, next){
    if(req.url.indexOf("/modules")==0 || req.url.indexOf("/plugins")==0){
      var data = { url: req.baseUrl };
      BOT.process("serve_404", data, function(o,d){
        res.status(404);
        res.type("html");
        res.render("notfound", o);
        d(o);
      });
    }else{
      var data = {
        stylesheets: [],
        head_scripts: [
          "/socket.io/socket.io.js",
          "/modules/js/page.js",
          "/modules/js/util.js",
          //"http://d3js.org/d3.v3.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react.js",
          "https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-dom.js",
          "https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"
        ],
        babel_scripts: [
          "/modules/js/controlpanel.js",
          "/modules/js/bot_connection.js"
        ],
        init_script: "/modules/js/init.js"
      };
      BOT.process("serve_page", data, function(o,d){
        res.type("html");
        res.render("home", o);
        d(o);
      });
    }
  }
  app.use(index);

  //
  // Include Plugin Javascript Files
  //
  BOT.before("serve_page", function(o,d){
    var dir = dir;
    fs.readdir(__dirname+"/../web/plugins/js", function(err, files){
      if(err){
        console.log("Error loading web plugin file list");
        console.log(err);
      }else{
        files.forEach(function(v){ o.babel_scripts.push("/modules/js/"+v); });
      }
      d(o);
    });
  });

  //
  // Include Module Stylesheets
  //
  BOT.before("serve_page", function(o,d){
    var dir = __dirname+"/../web/modules/css";
    fs.readdir(dir, function(err, files){
      if(err){
        console.log("Error loading web module stylesheet list");
        console.log(err);
      }else{
        files.forEach(function(v){ o.stylesheets.push("/modules/css/"+v); });
      }
      d(o);
    });
  });

  //
  // Include Plugin Stylesheets
  //
  BOT.before("serve_page", function(o,d){
    var dir = __dirname+"/../web/plugins/css";
    fs.readdir(dir, function(err, files){
      if(err){
        console.log("Error loading web plugin stylesheet list");
        console.log(err);
      }else{
        files.forEach(function(v){ o.stylesheets.push("/plugins/css/"+v); });
      }
      d(o);
    });
  });

  //
  // Start server listening on BOT.run()
  //
  BOT.after("run", function(o,d){
    o.server = BOT.web.server;
    BOT.web.server.listen(BOT.port||4000, function () {
      var port = o.server.address().port;
      var host = o.server.address().address;
      host = host=="::"?"localhost":host;
      o.port = port;
      o.host = host;
      console.log();
      console.log('Bot Control Panel available at http://'+host+':'+port);
      console.log('Please use the control panel to connect your bot to dAmn.')
      d(o);
    });
  });

};
