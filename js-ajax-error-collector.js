/**
 * This singleton will add hooks to Javascript and Ajax errors so that it is possible to intercept and expose them
 * in the window object. This is especially useful for Selenium tests, since Selenium can't access the clients console.
 * The collected errors can be retrieved as an array by calling the `getJsErrorCollection` method in the `window` scope.
 *
 * Everything in this script is as unobtrusive as possible, so that its inclusion does not lead to any
 * behavioral changes on the page which includes it, which means:
 * - Script does no changes to DOM
 * - It has no kind of dependencies to any event/promise (only to the clients native window and XMLHttpRequest object)
 * - Every piece of code is wrapped within a try-catch block
 *
 * @class
 * @param {window} win - The window object
 */
(function(win) {
    'use strict';
    /**
     * Checks if a console object is available in the window and if it has a log method writes the error to it
     * @param {Object} error
     */
    var internalErrorCatcher = function(error) {
        if(error && win.console && win.console.log && typeof(win.console.log) == 'function') {
            win.console.log(error);
        }
    };
    try {
        /** Storage for Javascript and Ajax Errors */
        var jsErrorCollection = [];
        /** Copy the original XHR open handler */
        var origXHROpen = XMLHttpRequest.prototype.open;
        /**
         * Checks if a HTTP Status indicates that the response will deliver no response body
         * @param {number} status
         * @returns {boolean}
         */
        var isNullBodyCode = function(status) {
            return [101, 204, 205, 304].indexOf(status) != -1;
        };
        /**
         * Checks if a HTTP Status indicates a 4xx client or 5xx server error
         * @param {number} status
         * @returns {boolean}
         */
        var isErrorCode = function(status) {
            return status >= 400 && status <= 599;
        };
        /**
         * Builds a compact string out of all available information about the occurred JS Error
         * @param {string} message
         * @param {string} url
         * @param {number} line
         * @param {?number} col
         * @param {?string} error
         * @returns {string}
         */
        var jsErrorStringifier = function(message, url, line, col, error) {
            /** Some clients provide also the column value */
            var extraInfo = !col ? '' : " at column: " + col;
            /** Some clients provide also the precise error message */
            extraInfo += !error ? '' : " with error message: '" + error + "'";
            return "JS Error: '" + message + "' in URL '" + url + "' on line: " + line + extraInfo;
        };
        /**
         * Builds a compact string out of all available information about the occurred Ajax Error
         * @param {Object} xhr
         * @returns {string}
         */
        var xhrErrorStringifier = function(xhr) {
            var str = 'XHR Error: In URL "' + xhr.responseURL  + '" ';
            str += 'with status "' + xhr.status + ' ' + xhr.statusText + '"';
            str += "\n+++++++";
            str += "\nResponse headers:\n" + xhr.getAllResponseHeaders();
            str += "\n+++++++";
            /** If HTTP Status indicates that there is a response body, add it to the message */
            if(!isNullBodyCode(xhr.status)) {
                str += "\nResponse body:\n";
                if(xhr.responseText.length < 1000) {
                    str += xhr.responseText;
                } else {
                    /** In case response is longer than 1000 characters, cut it off */
                    str += xhr.responseText.substr(0, 995) + '[...]';
                }
                str += "\n+++++++";
            }
            return str;
        };
        /**
         * Override the original XHR open handler so that we can intercept 4xx and 5xx errors
         */
        XMLHttpRequest.prototype.open = function() {
            try {
                /** Add a listener to the XHR load event for this XHR instance */
                this.addEventListener('load', function() {
                    try {
                        /** Check if the result should be logged because of an error */
                        if(isErrorCode(this.status)) {
                            jsErrorCollection.push(xhrErrorStringifier(this));
                        }
                    } catch(e) {
                        internalErrorCatcher(e);
                    }
                });
            } catch(e) {
                internalErrorCatcher(e);
            }
            /** Now call the original XHR open handler (this has to be absolutely fail-safe) */
            origXHROpen.apply(this, arguments);
        };
        /**
         * Hook into window onerror event and write to our error storage
         * @param {string} message
         * @param {string} url
         * @param {number} line
         * @param {?number} col
         * @param {?string} error
         */
        win.onerror = function(message, url, line, col, error) {
            try {
                /** Some clients provide also the column value */
                col = typeof(col) === 'undefined' ? null : col;
                /** Some clients provide also the precise error message */
                error = typeof(error) === 'undefined' ? null : error;
                jsErrorCollection.push(jsErrorStringifier(message, url, line, col, error));
            } catch(e) {
                internalErrorCatcher(e);
            }
        };
        /**
         * Public getter for the error array
         * @returns {Array}
         */
        win.getJsErrorCollection = function() {
            return jsErrorCollection;
        }
    } catch(e) {
        internalErrorCatcher(e);
    }
})(window);
