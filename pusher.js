var auth = require('cloud/modules/pusher/auth');
var errors = require('cloud/modules/pusher/errors');
var events = require('cloud/modules/pusher/events');
var requests = require('cloud/modules/pusher/requests');
var util = require('cloud/modules/pusher/util');

var Config = require('cloud/modules/pusher/config');
var Token = require('cloud/modules/pusher/token');

var validateChannel = function(channel) {
  if (typeof channel !== "string" || channel === "" || channel.match(/[^A-Za-z0-9_\-=@,.;]/)) {
    throw new Error("Invalid channel name: '" + channel + "'");
  }
  if (channel.length > 200) {
    throw new Error("Channel name too long: '" + channel + "'");
  }
};

var validateSocketId = function(socketId) {
  if (typeof socketId !== "string" || socketId === "" || !socketId.match(/^\d+\.\d+$/)) {
    throw new Error("Invalid socket id: '" + socketId + "'");
  }
};

/** Provides access to Pusher's authentication.
 *
 * @constructor
 * @param {Object} options
 * @param {String} [options.host="api.pusherapp.com"] API hostname
 * @param {Boolean} [options.encrypted=false] whether to use SSL
 * @param {Integer} [options.port] port, default depends on the scheme
 * @param {Integer} options.appId application ID
 * @param {String} options.key application key
 * @param {String} options.secret application secret
 * @param {String} [options.proxy] HTTP proxy to channel requests through
 * @param {Integer} [options.timeout] request timeout in milliseconds
 * @param {Boolean} [options.keepAlive] whether requests should use keep-alive
 */
function Pusher(options) {
  this.config = new Config(options);
}

/** Returns a signature for given socket id, channel and socket data.
 *
 * @param {String} socketId socket id
 * @param {String} channel channel name
 * @param {Object} [data] additional socket data
 * @returns {String} authentication signature
 */
Pusher.prototype.authenticate = function(socketId, channel, data) {
  validateSocketId(socketId);
  validateChannel(channel);

  return auth.getSocketSignature(this.config.token, channel, socketId, data);
};

/** Builds a signed query string that can be used in a request to Pusher.
 *
 * @param {Object} options
 * @param {String} options.method request method
 * @param {String} options.path request path
 * @param {Object} options.params query params
 * @param {String} options.body request body
 * @returns {String} signed query string
 */
Pusher.prototype.createSignedQueryString = function(options) {
  return requests.createSignedQueryString(this.config.token, options);
};

/** Makes a POST request to Pusher, handles the authentication.
 *
 * Calls back with three arguments - error, request and response. When request
 * completes with code < 400, error will be null. Otherwise, error will be
 * populated with response details.
 *
 * @param {Object} options
 * @param {String} options.path request path
 * @param {Object} options.params query params
 * @param {String} options.body request body
 * @param {requestCallback} [callback]
 * @see RequestError
 */
Pusher.prototype.post = function(options, callback) {
  requests.send(
    this.config, util.mergeObjects({}, options, { method: "POST" }), callback
  );
};

/** Makes a GET request to Pusher, handles the authentication.
 *
 * Calls back with three arguments - error, request and response. When request
 * completes with code < 400, error will be null. Otherwise, error will be
 * populated with response details.
 *
 * @param {Object} options
 * @param {String} options.path request path
 * @param {Object} options.params query params
 * @param {requestCallback} [callback]
 * @see RequestError
 */
Pusher.prototype.get = function(options, callback) {
  requests.send(
    this.config, util.mergeObjects({}, options, { method: "GET" }), callback
  );
};

/** Triggers an event.
 *
 * Channel names can contain only characters which are alphanumeric, '_' or '-'
 * and have to be at most 200 characters long.
 *
 * Event name can be at most 200 characters long.
 *
 * Calls back with three arguments - error, request and response. When request
 * completes with code < 400, error will be null. Otherwise, error will be
 * populated with response details.
 *
 * @param {String|String[]} channel list of at most 10 channels
 * @param {String} event event name
 * @param data event data, objects are JSON-encoded
 * @param {String} [socketId] id of a socket that should not receive the event
 * @param {requestCallback} [callback]
 * @see RequestError
 */
Pusher.prototype.trigger = function(channels, event, data, socketId, callback) {
  if (socketId) {
    validateSocketId(socketId);
  }
  if (!(channels instanceof Array)) {
    // add single channel to array for multi trigger compatibility
    channels = [channels];
  }
  if (event.length > 200) {
    throw new Error("Too long event name: '" + event + "'");
  }
  if (channels.length > 10) {
    throw new Error("Can't trigger a message to more than 10 channels");
  }
  for (var i = 0; i < channels.length; i++) {
    validateChannel(channels[i])
  }
  events.trigger(this, channels, event, data, socketId, callback);
};

/** Exported {@link Token} constructor. */
Pusher.Token = Token;
/** Exported {@link RequestError} constructor. */
Pusher.RequestError = errors.RequestError;

module.exports = Pusher;
