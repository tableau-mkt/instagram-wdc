// Generated on 2016-06-26 using generator-web-data-connector 1.0.3

var express = require('express'),
    request = require('request'),
    app = express(),
    sha1 = require('sha1'),
    port = process.env.PORT || 9001;

// Serve files as if this were a static file server.
app.use(express.static('./'));

// Proxy the index.html file.
app.get('/', function (req, res) {
  res.sendFile('./index.html');
});

app.get('/authorize', function (req, res) {
  var clientIP = req.ips.join('|'),
      redirectTo = 'https://api.instagram.com/oauth/authorize' +
        '?client_id=' + process.env.CLIENTID +
        '&redirect_uri=' + encodeURIComponent(process.env.REDIRECTURI) +
        '&state=' + sha1(clientIP + process.env.SALT) +
        '&response_type=code';

  res.redirect(redirectTo);
});

// Validates a given Instagram oauth state value.
app.get('/validate', function (req, res) {
  var state = req.query.state,
      clientIP = req.ips.join('|'),
      expectedState = sha1(clientIP + process.env.SALT);

  if (state === expectedState) {
    res.sendStatus(200);
  }
  else {
    res.sendStatus(403);
  }
});


// Create an endpoint to manage oauth bits.
app.get('/tokenize', function (req, res) {
  var instagramRequestOptions = {
        url: 'https://api.instagram.com/oauth/access_token',
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        form: {
          client_id: process.env.CLIENTID,
          client_secret: process.env.CLIENTSECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.REDIRECTURI,
          code: req.query.code
        }
      };

  // Post the supplied code to Instagram to return an Instagram oauth token.
  request(instagramRequestOptions, function (iError, iResponse, iBody) {
    // If Instagram responded favorably, proceed.
    if (!iError && iResponse.statusCode == 200) {
      res.set('Content-type', 'application/json');
      res.send(iBody);
    }
    else {
      res.sendStatus(500);
    }
  });
});

var server = app.listen(port, function () {
  var port = server.address().port;
  console.log('Express server listening on port ' + port);
});

module.exports = app;
