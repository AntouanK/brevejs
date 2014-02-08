define([], function ($) {

    'use strict';

    var BR =  {};

    /**
     * A bog standard mixin
     * Expects receiver + methods as arguments
     */
    BR.mixin = function() {
        if (arguments.length < 2) {
            throw Error("This mixin expect at least 3 arguments, receiver and augmentator, and a method name");
        }

        var args = Array.prototype.slice.apply(arguments),
            target = args.shift(),
            source = args.shift(),
            methodNames = args,
            len = methodNames.length - 1;

        while(len >= 0) {
            target[methodNames[len]] = source[methodNames[len]];
            len--;
        }
    };

    /**
     * Extend method. If no child is supplied, one will be created
     * @param [optional] childObj
     * @param parentObj
     */
    BR.extend = function (childObj, parentObj) {

        var child, parent;

        if (!arguments.length) {
            throw Error("Extend expect at least 1 argument");
        }

        if (arguments.length === 1) {
            parent = arguments[0];
            child = function(){}
        } else {
            parent = parentObj;
            child = childObj;
        }

        var F = function() {};
        F.prototype = parent.prototype;

        child.prototype = new F();
        child.prototype.constructor = child;

        child.superclass = parent.prototype;
        if(parent.prototype.constructor == Object.prototype.constructor) {
            parent.prototype.constructor = parent;
        }
    };

    /**
     * Mixes in all the methods needed to transform an object into an observable
     * @param target
     */
    BR.makeObservable = function(target) {
        BR.mixin(target, this, 'publish', 'subscribe', 'unsubscribe', 'unsubscribeAll');
    };

    /**
     * Unique id
     * @param seed
     * @returns {string}
     */
    BR.uuid = function(seed) {
        var s = seed || 's';
        return s +
            (Math.random() * 1000).toString().substr(0,4) +
            (new Date().valueOf().toString().substr(8));
    };

    /**
     * Publishes events
     * @param event
     * @param args
     */
    BR.publish = function(event, args) {
        var callbacks,
            len,
            l, scope;

        this.listeners = this.listeners || {};
        callbacks = this.listeners[event];
        len = callbacks? callbacks.length : 0;

        if (!callbacks || !len) {
            return;
        }
        l = len-1;
        while (l >= 0) {
            scope = callbacks[l].scope || this;
            callbacks[l].callback.call(scope, args);
            l--;
        }
    };

    /**
     * Subscribes to an event. Returns a token that can be used to unsubscribe.
     * @param event
     * @param callback
     * @param scope
     * @returns {string}
     */
    BR.subscribe = function(event, callback, scope) {
        var listeners,
            token = BR.uuid('event');

        this.listeners = this.listeners || {};

        listeners = this.listeners;
        listeners[event] = listeners[event] || [];

        listeners[event].push({
            callback : callback,
            scope : scope,
            token : token
        });
        return token;
    };

    /**
     * Unsubscribe all the listeners
     * @param event
     */
    BR.unsubscribeAll = function(event) {
        if (event) {
            this.listeners[event] = [];
        } else {
            delete this.listeners;
        }
    };

    /**
     * Unsubscribe a single subscription. If called without the token, it will unsubscribe
     * everything for that event.
     * @param event
     * @param token
     */
    BR.unsubscribe = function(event, token) {

        var listeners,
            len;

        this.listeners = this.listeners || {};
        listeners = this.listeners;

        listeners[event] = listeners[event] || [];
        len = listeners[event].length;
        if (!token) {
            listeners[event] = [];
        }
        while (len >= 0) {
            if (token) {
                if (listeners[event][len].token === token) {
                    listeners[event].splice(len,1);
                    return;
                }
            }
            len--;
        }

    };

    BR.throttles = {};
    BR.debounces = {};

    /**
     * Throttles a function in order for it to be executed not too frequently.
     * @param id
     * @param func
     * @param scope
     * @param time
     * @param params
     */
    BR.throttle = function(id, func, scope, time, params) {
        if (BR.throttles[id]) {
            return;
        }
        func.call(scope, params);
        BR.throttles[id] = window.setTimeout(function() {
            window.clearTimeout(BR.throttles[id]);
            delete BR.throttles[id];
        }, time);
    };

    /**
     * Debounces a function for it to be executed after x time after the last call has elapsed
     * @param id
     * @param func
     * @param scope
     * @param time
     * @param params
     */
    BR.debounce = function (id, func, scope, time, params) {
        if (BR.debounces[id]) {
            window.clearTimeout(BR.debounces[id]);
        } else {
            BR.debounces.id = id;
        }
        window.setTimeout(function () {
            func.call(scope, params);
            delete BR.debounces[id];
        }, time);
    };

    /**
     * Stubbing the console when it's not around
     * @type {Function}
     */
    window.console = window.console || {};
    ['log', 'warn', 'error', 'assert', 'info', 'debug'].forEach(function(value, iterator) {
        !window.console[value] && (window.console[value] = function(){});
    });

    /**
     * Polyfill for requestAnimationFrame
     */
    window.requestAnimationFrame = (function(){
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    window.cancelAnimationFrame = (function() {
        return window.cancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            function(id) {
                window.clearTimeout(id);
            };
    })();

    return BR;

});