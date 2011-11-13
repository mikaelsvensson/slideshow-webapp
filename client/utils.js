/**
 * @author Mikael
 */
(function () {
    
    var keyListeners = {
            left: null,
            right: null,
            enter: null,
            esc: null
            };
    
    var keyCodes = {
            left: 37,
            right: 39,
            enter: 13,
            esc: 27
            };
    
	Utils = function() {
		
	};
	
	Utils.prototype.$ = function (id) {
		return document.getElementById(id);
	};
	
	Utils.prototype.createElement = function (name, innerHTML, attr_varargs) {
		var el = document.createElement(name);
		if (innerHTML) {
			el.innerHTML = innerHTML;
		}
		for (var i=2; i < arguments.length; i+=2) {
			el[arguments[i]] = arguments[i+1];
		}
		
		return el;
	};
	
	Utils.prototype.createElementNS = function (namespace, name, attr_varargs) {
		var el = document.createElementNS(namespace, name);
		for (var i=2; i < arguments.length; i+=2) {
			el.setAttributeNS(null, arguments[i], arguments[i+1]);
		}
		return el;
	};
	
	Utils.prototype.removeElement = function (el) {
		el.parentNode.removeChild(el);
	};
	
	Utils.prototype.appendChildren = function (el, varargs) {
		for (var i=1; i < arguments.length; i++) {
			el.appendChild(arguments[i]);
		}
	};
	
	Utils.prototype.initKeyListening = function () {
	    document.onkeypress = this._onKeyPress;
	};
	
	Utils.prototype._onKeyPress = function (evt) {
	    var evt  = (evt) ? evt : ((event) ? event : null);
	    var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
	    
	    for (var name in keyCodes) {
	        var keyCode = keyCodes[name];
	        if (keyCode == evt.keyCode) {
	            if (keyListeners[name]) {
	                var fn = keyListeners[name];
	                fn(evt);
	            }
	        }
	    }
	}
	
	Utils.prototype.setKeyListener = function (keyName, fn, fnScope) {
	    keyListeners[keyName] = function (e) {
	        fn.call(fnScope);
	    };
	};
	
})();