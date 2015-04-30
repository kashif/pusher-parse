var errors = require('cloud/modules/pusher/errors');
var util = require('cloud/modules/pusher/util');

var RESERVED_QUERY_KEYS = {
  auth_key: true,
  auth_timestamp: true,
  auth_version: true,
  auth_signature: true,
  body_md5: true
};

function send(config, options, callback) {
  var path = config.prefixPath(options.path);
  var body = options.body ? JSON.stringify(options.body) : undefined;

  var queryString = createSignedQueryString(config.token, {
    method: options.method,
    path: path,
    params: options.params,
    body: body
  });

  var url = config.getBaseURL() + path + "?" + queryString;

  Parse.Cloud.httpRequest({
    method: options.method.toUpperCase(),
    url: url,
    headers: {
      'content-type': (body ? 'application/json;charset=utf-8' : undefined)
    },
    body: body,
    success: function(res) {
      if (typeof callback !== "function") {
        return;
      }
      callback(null, this, res);
    },
    error: function(res) {
      if (typeof callback !== "function") {
        return;
      }
      var error = new errors.RequestError(
        "Request failed with an error",
        url,
        res ? res.status : null,
        res ? res.buffer : null
      );
      if (res.status >= 400) {
        error = new errors.RequestError(
          "Unexpected status code " + res.status,
          url,
          res ? res.status : null,
          res ? res.buffer : null
        );
      }
      callback(error, this, res);
    }
  });
}

function createSignedQueryString(token, request) {
  var timestamp = Date.now() / 1000 | 0;

  var params = {
    auth_key: token.key,
    auth_timestamp: timestamp,
    auth_version: '1.0'
  };

  if (request.body) {
    params.body_md5 = util.getMD5(request.body);
  }

  if (request.params) {
    for (var key in request.params) {
      if (RESERVED_QUERY_KEYS[key] !== undefined) {
        throw Error(key + ' is a required parameter and cannot be overidden');
      }
      params[key] = request.params[key];
    }
  }

  var method = request.method.toUpperCase();
  var sortedKeyVal = util.toOrderedArray(params);
  var queryString = sortedKeyVal.join('&');

  var signData = [method, request.path, queryString].join('\n');
  queryString += '&auth_signature=' + token.sign(signData);

  return queryString;
}

exports.send = send;
exports.createSignedQueryString = createSignedQueryString;
