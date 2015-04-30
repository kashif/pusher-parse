# Pusher cloud module for Parse

This is a [Parse](https://parse.com/) cloud module for [Pusher](https://pusher.com/).

## Install

To install this module, simply checkout this repository into your Parse project's `cloud/modules/` folder:

```shell
$ cd myParseProject/
$ git clone https://github.com/kashif/pusher-parse cloud/modules/pusher
...
```

or you could also use git submodules too:

```shell
$ git submodule add https://github.com/kashif/pusher-parse cloud/modules/pusher
...
```

## Usage

To use the module, simply require it like any other in your `app.js` with a valid Pusher `appId`, `key` and `secret`:

```js
...
var Pusher = require('cloud/modules/pusher/pusher');
var pusher = new Pusher( { appId: 'myAppId', key: 'myKey', secret: 'mySecret' } );
```

###  Pusher authorisation callback

In order to use [presence](https://pusher.com/docs/client_api_guide/client_presence_channels) or [private](https://pusher.com/docs/client_api_guide/client_private_channels) channels your app will need to authenticate a user from Parse's cloud server. One way is to create an `/authorise` end point on your cloud app which then calls the pusher `authenticate` method and return a valid token. An example authentication callback for a presence channel case would look something like the following:

```js
app.post('/authorise', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var user_id = channel.split("-")[1];

  var user = Parse.Object.extend("User");
  var query = new Parse.Query(user);
  query.get(user_id, {
    success: function(userAgain) {
        var presenceData = {
          user_id: userAgain.id,
          user_info: {
            username: userAgain.get("username"),
            email: userAgain.get("email")
          }
        };
        var auth = pusher.authenticate( socketId, channel, presenceData );
        res.send(auth);
    },
    error: function(model, error) {
      res.status(403);
      res.send('Forbidden');
    }
  });
});
```

### Sending messages

In order to send a message we could use an `afterSave` callback on a `Message` Parse class, for example:

```js
Parse.Cloud.afterSave('Message', function(request) {
  if (request.object.existed()) {
    return;
  }

  var channel = request.object.get("channel");
  var socketID = request.object.get("socketID");

  pusher.trigger(channel, 'new-message', request.object, socketID);
});
```

## License

The code for this module is copied from [pusher-http-node](https://github.com/pusher/pusher-http-node).
