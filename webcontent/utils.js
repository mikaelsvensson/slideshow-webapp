/**
 * @author Mikael
 */
(function () {
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
})();