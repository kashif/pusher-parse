/** Contains information about an HTTP request error.
 *
 * @constructor
 * @extends Error
 * @param {String} message error message
 * @param {String} url request URL
 * @param {Integer} [statusCode] response status code, if received
 * @param {String} [statusCode] response body, if received
 */
function RequestError(message, url, statusCode, body) {
    this.name = 'PusherRequestError';
    this.stack = (new Error()).stack;

    /** @member {String} error message */
    this.message = message;
    /** @member {String} request URL */
    this.url = url;
    /** @member {Integer} response status code, if received */
    this.statusCode = statusCode;
    /** @member {String} response body, if received */
    this.body = body;
}
RequestError.prototype = new Error();

exports.RequestError = RequestError;
