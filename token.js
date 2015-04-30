var crypto = require('crypto');
var Buffer = require('buffer').Buffer;

var util = require('cloud/modules/pusher/util');

/** Verifies and signs data against the key and secret.
 *
 * @constructor
 * @param {String} key app key
 * @param {String} secret app secret
 */
function Token(key, secret) {
  this.key = key;
  this.secret = secret;
}

/** Signs the string using the secret.
 *
 * @param {String} string
 * @returns {String}
 */
Token.prototype.sign = function(string) {
  return crypto.createHmac('sha256', this.secret)
    .update(new Buffer(string, 'utf-8'))
    .digest('hex');
};

module.exports = Token;
