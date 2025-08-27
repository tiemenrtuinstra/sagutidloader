/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + "vendors" + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "sagutidloader:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			792: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunksagutidloader"] = self["webpackChunksagutidloader"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// ./assets/js/Util/Logger.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Logger = /*#__PURE__*/function () {
  function Logger() {
    _classCallCheck(this, Logger);
  }
  return _createClass(Logger, null, [{
    key: "log",
    value: function log(message) {
      var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '#48dbfb';
      var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'App';
      if (Logger.debugMode) {
        var _console;
        for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
          args[_key - 3] = arguments[_key];
        }
        (_console = console).log.apply(_console, ["%c[".concat(context, "] ").concat(message), "color: ".concat(color, ";")].concat(args));
      }
    }
  }, {
    key: "error",
    value: function error(message) {
      var _console2;
      var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'App';
      for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }
      // Always log errors, regardless of debug mode
      (_console2 = console).error.apply(_console2, ["%c[".concat(context, "] ").concat(message), 'color: red; font-weight: bold;'].concat(args));
    }
  }]);
}();
/**
 * Determines whether debug logging is enabled.
 * Checks (in order):
 * 1. window.SAGUTID_CONFIG.debugMode (if defined)
 * 2. URL param "debug" === "true" or "1"
 * Defaults to false.
 */
_defineProperty(Logger, "debugMode", function () {
  // 1) Check global config
  var configDebug = !!(window.SAGUTID_CONFIG && window.SAGUTID_CONFIG.debugMode === true);

  // 2) Check URL parameter
  var urlParams = new URLSearchParams(window.location.search);
  var urlDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';

  // 3) Default to false if neither condition is met              
  return configDebug || urlDebug || false;
}());
;// ./assets/js/PWAHandler.js
function PWAHandler_typeof(o) { "@babel/helpers - typeof"; return PWAHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, PWAHandler_typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == PWAHandler_typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(PWAHandler_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function PWAHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function PWAHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, PWAHandler_toPropertyKey(o.key), o); } }
function PWAHandler_createClass(e, r, t) { return r && PWAHandler_defineProperties(e.prototype, r), t && PWAHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function PWAHandler_defineProperty(e, r, t) { return (r = PWAHandler_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function PWAHandler_toPropertyKey(t) { var i = PWAHandler_toPrimitive(t, "string"); return "symbol" == PWAHandler_typeof(i) ? i : i + ""; }
function PWAHandler_toPrimitive(t, r) { if ("object" != PWAHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != PWAHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var PWAHandler = /*#__PURE__*/function () {
  function PWAHandler() {
    PWAHandler_classCallCheck(this, PWAHandler);
  }
  return PWAHandler_createClass(PWAHandler, null, [{
    key: "init",
    value: function init() {
      var installPopup = document.getElementById('installPopup');
      if (!installPopup) {
        Logger.error('Install popup element not found.', 'PWAHandler');
        return;
      }
      this.hideInstallPopup(installPopup);
      this.listenForInstallPrompt(installPopup);
      this.handleInstallButtonClick(installPopup);
      this.handleDismissButtonClick(installPopup);
      this.listenForAppInstalled();
      this.registerServiceWorker();
    }
  }, {
    key: "hideInstallPopup",
    value: function hideInstallPopup(installPopup) {
      installPopup.style.display = 'none';
      Logger.log('Install popup hidden.', 'blue', 'PWAHandler');
    }
  }, {
    key: "listenForInstallPrompt",
    value: function listenForInstallPrompt(installPopup) {
      var _this = this;
      window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        _this.deferredPrompt = e;
        installPopup.style.display = 'block';
        Logger.log('Install prompt triggered and popup displayed.', 'green', 'PWAHandler');
      });
    }
  }, {
    key: "handleInstallButtonClick",
    value: function handleInstallButtonClick(installPopup) {
      var _this2 = this;
      document.addEventListener('click', /*#__PURE__*/function () {
        var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
          var result;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                if (!e.target.matches('[aria-label="install-app"]')) {
                  _context.next = 10;
                  break;
                }
                e.preventDefault();
                if (!_this2.deferredPrompt) {
                  _context.next = 10;
                  break;
                }
                _this2.deferredPrompt.prompt();
                _context.next = 6;
                return _this2.deferredPrompt.userChoice;
              case 6:
                result = _context.sent;
                if (result.outcome === 'accepted') {
                  Logger.log('🎉 App successfully installed.', 'green', 'PWAHandler');
                } else {
                  Logger.log('❌ App installation declined.', 'red', 'PWAHandler');
                }
                _this2.deferredPrompt = null;
                installPopup.style.display = 'none';
              case 10:
              case "end":
                return _context.stop();
            }
          }, _callee);
        }));
        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }, {
    key: "handleDismissButtonClick",
    value: function handleDismissButtonClick(installPopup) {
      document.addEventListener('click', function (e) {
        if (e.target.matches('[aria-label="dismiss-install-popup"]')) {
          e.preventDefault();
          installPopup.style.display = 'none';
          Logger.log('Install popup dismissed.', 'orange', 'PWAHandler');
        }
      });
    }
  }, {
    key: "listenForAppInstalled",
    value: function listenForAppInstalled() {
      window.addEventListener('appinstalled', function () {
        Logger.log('🎉 App successfully installed via appinstalled event.', 'green', 'PWAHandler');
      });
    }
  }, {
    key: "registerServiceWorker",
    value: function registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(SAGUTID_CONFIG.serviceWorkerPath).then(function (registration) {
          console.log('Service Worker registered with scope:', registration.scope);

          // Pass additional configuration to the service worker
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'INIT_CONFIG',
              config: SAGUTID_CONFIG
            });
          }
        })["catch"](function (error) {
          console.error('Service Worker registration failed:', error);
        });
      }
    }
  }]);
}();
PWAHandler_defineProperty(PWAHandler, "deferredPrompt", null);
;// ./assets/js/ServiceWorkerHandler.js
function ServiceWorkerHandler_typeof(o) { "@babel/helpers - typeof"; return ServiceWorkerHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, ServiceWorkerHandler_typeof(o); }
function ServiceWorkerHandler_regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ ServiceWorkerHandler_regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == ServiceWorkerHandler_typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(ServiceWorkerHandler_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function ServiceWorkerHandler_asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function ServiceWorkerHandler_asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { ServiceWorkerHandler_asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { ServiceWorkerHandler_asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }

var ServiceWorkerHandler = {
  init: function init() {
    var _this = this;
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', /*#__PURE__*/ServiceWorkerHandler_asyncToGenerator(/*#__PURE__*/ServiceWorkerHandler_regeneratorRuntime().mark(function _callee() {
      var cfg, swPath, reg;
      return ServiceWorkerHandler_regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            cfg = typeof window !== 'undefined' && window.SAGUTID_CONFIG ? window.SAGUTID_CONFIG : {};
            swPath = cfg.serviceWorker || cfg.serviceWorkerPath || '/plugins/system/sagutidloader/assets/serviceworker.js';
            _context.next = 5;
            return navigator.serviceWorker.register(swPath, {
              updateViaCache: 'none'
            });
          case 5:
            reg = _context.sent;
            // Force a check now and on window focus
            reg.update();
            window.addEventListener('focus', function () {
              return reg.update();
            });

            // Handle an already waiting worker on page load
            if (reg.waiting) _this._activate(reg.waiting);

            // Detect new update arrivals
            reg.addEventListener('updatefound', function () {
              var sw = reg.installing;
              if (!sw) return;
              sw.addEventListener('statechange', function () {
                if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version ready – activate it (or show a prompt first)
                  _this._activate(sw);
                }
              });
            });

            // When the new SW takes control, reload to get fresh assets
            navigator.serviceWorker.addEventListener('controllerchange', function () {
              window.location.reload();
            });
            _context.next = 16;
            break;
          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](0);
            console.error('SW registration failed:', _context.t0);
          case 16:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[0, 13]]);
    })));
  },
  _activate: function _activate(sw) {
    // Auto-activate. If you want a prompt, show UI then call this.
    sw.postMessage('SKIP_WAITING');
  }
};
;// ./assets/js/MetaTagHandler.js
function MetaTagHandler_typeof(o) { "@babel/helpers - typeof"; return MetaTagHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, MetaTagHandler_typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function MetaTagHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function MetaTagHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, MetaTagHandler_toPropertyKey(o.key), o); } }
function MetaTagHandler_createClass(e, r, t) { return r && MetaTagHandler_defineProperties(e.prototype, r), t && MetaTagHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function MetaTagHandler_toPropertyKey(t) { var i = MetaTagHandler_toPrimitive(t, "string"); return "symbol" == MetaTagHandler_typeof(i) ? i : i + ""; }
function MetaTagHandler_toPrimitive(t, r) { if ("object" != MetaTagHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != MetaTagHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var MetaTagHandler = /*#__PURE__*/function () {
  function MetaTagHandler() {
    MetaTagHandler_classCallCheck(this, MetaTagHandler);
  }
  return MetaTagHandler_createClass(MetaTagHandler, null, [{
    key: "init",
    value: function init() {
      this.addIcons();
      this.addMetaTags();
      this.addOpenGraphTags();
      this.addCanonicalLink();
    }
  }, {
    key: "addLink",
    value: function addLink(attributes) {
      if (typeof joomlaLogoPath === 'undefined') {
        Logger.error('Joomla logo path is not defined.', 'MetaTagHandler');
        return;
      }

      // Prepend joomlaLogoPath to relative hrefs
      if (attributes.href && !attributes.href.startsWith('http')) {
        attributes.href = joomlaLogoPath + attributes.href;
      }
      var link = document.createElement('link');
      Object.entries(attributes).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        link.setAttribute(key, value);
      });
      document.head.appendChild(link);
      Logger.log("Link tag added: ".concat(JSON.stringify(attributes)), 'green', 'MetaTagHandler');
    }
  }, {
    key: "addMeta",
    value: function addMeta(attributes) {
      var attrType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'name';
      var meta = document.createElement('meta');
      Object.entries(attributes).forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          key = _ref4[0],
          value = _ref4[1];
        meta.setAttribute(key, value);
      });
      document.head.appendChild(meta);
      Logger.log("Meta tag added: ".concat(JSON.stringify(attributes)), 'green', 'MetaTagHandler');
    }
  }, {
    key: "addIcons",
    value: function addIcons() {
      var _this = this;
      var icons = [{
        rel: 'apple-touch-icon',
        href: 'android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }, {
        rel: 'apple-touch-icon',
        href: 'android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }, {
        rel: 'apple-touch-icon',
        href: 'apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }, {
        rel: 'icon',
        href: 'favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      }, {
        rel: 'icon',
        href: 'favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'
      }];
      icons.forEach(function (icon) {
        return _this.addLink(icon);
      });
      Logger.log('Icons added to the document.', 'green', 'MetaTagHandler');
    }
  }, {
    key: "addMetaTags",
    value: function addMetaTags() {
      var _this2 = this;
      var metaTags = [{
        name: 'theme-color',
        content: '#0B9444'
      }, {
        name: 'apple-mobile-web-app-capable',
        content: 'yes'
      }, {
        name: 'mobile-web-app-capable',
        content: 'yes'
      }, {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent'
      }, {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0, viewport-fit=cover'
      }, {
        name: 'screen-orientation',
        content: 'natural'
      }, {
        name: 'facebook-domain-verification',
        content: 'yt99npcp5if48m2yx2m0kmm434ponl'
      }];
      metaTags.forEach(function (tag) {
        return _this2.addMeta(tag);
      });
      Logger.log('Meta tags added to the document.', 'green', 'MetaTagHandler');
    }
  }, {
    key: "addOpenGraphTags",
    value: function addOpenGraphTags() {
      var _this3 = this;
      var openGraphTags = [{
        property: 'og:title',
        content: document.title
      }, {
        property: 'og:description',
        content: 'Welkom op Sagutid.nl, waar verhalen tot leven komen.'
      }, {
        property: 'og:image',
        content: 'https://sagutid.nl/images/Logo/Sagutid-groot.jpg'
      }, {
        property: 'og:url',
        content: window.location.href
      }, {
        property: 'og:type',
        content: 'website'
      }];
      openGraphTags.forEach(function (tag) {
        return _this3.addMeta(tag, 'property');
      });
      Logger.log('OpenGraph tags added to the document.', 'green', 'MetaTagHandler');
    }
  }, {
    key: "addCanonicalLink",
    value: function addCanonicalLink() {
      this.addLink({
        rel: 'canonical',
        href: window.location.href
      });
      Logger.log('Canonical link added to the document.', 'green', 'MetaTagHandler');
    }
  }]);
}();
;// ./assets/js/CCommentHandler.js
function CCommentHandler_typeof(o) { "@babel/helpers - typeof"; return CCommentHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, CCommentHandler_typeof(o); }
function CCommentHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function CCommentHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, CCommentHandler_toPropertyKey(o.key), o); } }
function CCommentHandler_createClass(e, r, t) { return r && CCommentHandler_defineProperties(e.prototype, r), t && CCommentHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function CCommentHandler_toPropertyKey(t) { var i = CCommentHandler_toPrimitive(t, "string"); return "symbol" == CCommentHandler_typeof(i) ? i : i + ""; }
function CCommentHandler_toPrimitive(t, r) { if ("object" != CCommentHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != CCommentHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var CCommentHandler = /*#__PURE__*/function () {
  function CCommentHandler() {
    CCommentHandler_classCallCheck(this, CCommentHandler);
  }
  return CCommentHandler_createClass(CCommentHandler, null, [{
    key: "init",
    value: function init() {
      this.removePoweredByLink();
    }
  }, {
    key: "removePoweredByLink",
    value: function removePoweredByLink() {
      var poweredByElements = document.querySelectorAll('.ccomment-powered');
      if (poweredByElements.length > 0) {
        poweredByElements.forEach(function (element) {
          return element.remove();
        });
        Logger.log('CComment "Powered by" link removed', 'orange', 'CCommentHandler');
      }
    }
  }]);
}();
;// ./assets/js/HeaderHandler.js
function HeaderHandler_typeof(o) { "@babel/helpers - typeof"; return HeaderHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, HeaderHandler_typeof(o); }
function HeaderHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function HeaderHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, HeaderHandler_toPropertyKey(o.key), o); } }
function HeaderHandler_createClass(e, r, t) { return r && HeaderHandler_defineProperties(e.prototype, r), t && HeaderHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function HeaderHandler_toPropertyKey(t) { var i = HeaderHandler_toPrimitive(t, "string"); return "symbol" == HeaderHandler_typeof(i) ? i : i + ""; }
function HeaderHandler_toPrimitive(t, r) { if ("object" != HeaderHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != HeaderHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var HeaderHandler = /*#__PURE__*/function () {
  function HeaderHandler() {
    HeaderHandler_classCallCheck(this, HeaderHandler);
  }
  return HeaderHandler_createClass(HeaderHandler, null, [{
    key: "init",
    value: function init() {
      HeaderHandler.removeHeaderOnPages();
    }
  }, {
    key: "removeHeaderOnPages",
    value: function removeHeaderOnPages() {
      var pathsToRemoveHeader = ["/sagu-overzicht", "/verhalen/", "/gedichten/", "/overig/"];
      var shouldRemoveHeader = pathsToRemoveHeader.some(function (path) {
        return window.location.pathname.includes(path);
      });
      if (shouldRemoveHeader) {
        $(".tm-header-mobile, .tm-header, .tm-toolbar, #mobile-tab-menu, #footer-copyright").remove();
        Logger.log('Header verwijderd van pagina', 'orange');
      }
    }
  }]);
}();
;// ./assets/js/PWAShareHandler.js
function PWAShareHandler_typeof(o) { "@babel/helpers - typeof"; return PWAShareHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, PWAShareHandler_typeof(o); }
function PWAShareHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function PWAShareHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, PWAShareHandler_toPropertyKey(o.key), o); } }
function PWAShareHandler_createClass(e, r, t) { return r && PWAShareHandler_defineProperties(e.prototype, r), t && PWAShareHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function PWAShareHandler_toPropertyKey(t) { var i = PWAShareHandler_toPrimitive(t, "string"); return "symbol" == PWAShareHandler_typeof(i) ? i : i + ""; }
function PWAShareHandler_toPrimitive(t, r) { if ("object" != PWAShareHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != PWAShareHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var PWAShareHandler = /*#__PURE__*/function () {
  function PWAShareHandler() {
    PWAShareHandler_classCallCheck(this, PWAShareHandler);
  }
  return PWAShareHandler_createClass(PWAShareHandler, null, [{
    key: "init",
    value: function init() {
      this.setupShareLinks();
    }
  }, {
    key: "setupShareLinks",
    value: function setupShareLinks() {
      var _this = this;
      var shareLinks = document.querySelectorAll('[aria-label="pwa-share"]');
      if (!shareLinks.length) {
        Logger.log('No share links found on the page.', 'orange', 'PWAShareHandler');
        return;
      }
      shareLinks.forEach(function (shareLink) {
        shareLink.classList.add('pwa-share');
        shareLink.setAttribute('aria-label', 'Share Sagutid.nl');
        shareLink.addEventListener('click', function (event) {
          return _this.handleShareClick(event, shareLink);
        });
      });
      Logger.log('Share links initialized.', 'green', 'PWAShareHandler');
    }
  }, {
    key: "handleShareClick",
    value: function handleShareClick(event, shareLink) {
      event.preventDefault();

      // Early Web Share API check
      if (!navigator.share) {
        Logger.error('Web Share API is not supported in this browser.', 'PWAShareHandler');
        return;
      }
      var href = shareLink.getAttribute('href');
      if (!href || !href.includes('?')) {
        Logger.error('Invalid or missing href attribute on share link.', 'PWAShareHandler');
        return;
      }
      var params = new URLSearchParams(href.substring(href.indexOf('?') + 1));
      var url = decodeURIComponent(params.get('url') || '').trim();
      if (!url) {
        Logger.error('No URL found in share parameters.', 'PWAShareHandler');
        return;
      }
      var text = decodeURIComponent(params.get('text') || '').trim().replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/&[^;]+;/g, ' ') // Strip HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
      if (!text) {
        Logger.log('No text provided for sharing, using default.', 'orange', 'PWAShareHandler');
      }
      var shareData = {
        title: document.title,
        text: text || 'Check this out!',
        url: url
      };
      navigator.share(shareData).then(function () {
        return Logger.log('Content shared successfully.', 'green', 'PWAShareHandler');
      })["catch"](function (error) {
        var _navigator$clipboard;
        Logger.error("Share failed: ".concat(error.message || error), 'PWAShareHandler');
        // Fallback: copy URL to clipboard
        (_navigator$clipboard = navigator.clipboard) === null || _navigator$clipboard === void 0 || _navigator$clipboard.writeText(url).then(function () {
          return Logger.log('URL copied to clipboard as fallback.', 'orange', 'PWAShareHandler');
        })["catch"](function () {
          return Logger.error('Fallback clipboard copy also failed.', 'PWAShareHandler');
        });
      });
    }
  }]);
}();
;// ./assets/js/DataLayerHandler.js
function DataLayerHandler_typeof(o) { "@babel/helpers - typeof"; return DataLayerHandler_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, DataLayerHandler_typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { DataLayerHandler_defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function DataLayerHandler_defineProperty(e, r, t) { return (r = DataLayerHandler_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function DataLayerHandler_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function DataLayerHandler_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, DataLayerHandler_toPropertyKey(o.key), o); } }
function DataLayerHandler_createClass(e, r, t) { return r && DataLayerHandler_defineProperties(e.prototype, r), t && DataLayerHandler_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function DataLayerHandler_toPropertyKey(t) { var i = DataLayerHandler_toPrimitive(t, "string"); return "symbol" == DataLayerHandler_typeof(i) ? i : i + ""; }
function DataLayerHandler_toPrimitive(t, r) { if ("object" != DataLayerHandler_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != DataLayerHandler_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var DataLayerHandler = /*#__PURE__*/function () {
  function DataLayerHandler() {
    DataLayerHandler_classCallCheck(this, DataLayerHandler);
  }
  return DataLayerHandler_createClass(DataLayerHandler, null, [{
    key: "hasErrors",
    value: function hasErrors() {
      return document.querySelectorAll('.rsform-error').length > 0;
    }
  }, {
    key: "pushEvent",
    value: function pushEvent(eventData) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(eventData);
      if (Logger.debugMode) {
        if (DataLayerHandler.hasErrors()) {
          Logger.error('Validation errors present, check your form.', 'DataLayerHandler');
        }
        Logger.log('Event pushed to dataLayer:', '#48dbfb', 'DataLayerHandler', eventData);
      }
    }
  }, {
    key: "bindTrackEvent",
    value: function bindTrackEvent(selector, eventType, eventName, step, formId, getData) {
      var elements = document.querySelectorAll(selector);
      if (!elements.length) {
        Logger.log("No elements found for selector: ".concat(selector), 'orange', 'DataLayerHandler');
        return;
      }
      elements.forEach(function (element) {
        element.addEventListener(eventType, function (event) {
          if (document.activeElement === element && !DataLayerHandler.hasErrors() || eventType === 'change') {
            var stepData = step || {};
            var enrichedData = (getData === null || getData === void 0 ? void 0 : getData(event.target)) || {};
            var eventPayload = _objectSpread(_objectSpread({
              event: eventName,
              formId: formId
            }, stepData), enrichedData);
            DataLayerHandler.pushEvent(eventPayload);
          }
        });
      });
      Logger.log("Event binding added for selector: ".concat(selector), 'green', 'DataLayerHandler');
    }
  }, {
    key: "createFormFieldEvent",
    value: function createFormFieldEvent(field) {
      var name = field.name,
        id = field.id,
        type = field.type,
        tagName = field.tagName,
        value = field.value;
      var fieldName = name || id || 'unknown';
      var fieldType = type || tagName.toLowerCase();
      var isSensitive = /(email|name|phone|tel|adres|address)/i.test(fieldName);
      var fieldValue = isSensitive ? '[masked]' : value;
      Logger.log("Form field event created for field: ".concat(fieldName), '#48dbfb', 'DataLayerHandler');
      return {
        event: 'formFieldChange',
        fieldName: fieldName,
        fieldType: fieldType,
        fieldValue: fieldValue
      };
    }
  }, {
    key: "initializeDataLayer",
    value: function initializeDataLayer() {
      window.dataLayer = window.dataLayer || [];
      var originalPush = window.dataLayer.push;
      window.dataLayer.push = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (Logger.debugMode) {
          args.forEach(function (arg) {
            return Logger.log('Pushed to dataLayer:', '#48dbfb', 'DataLayerHandler', arg);
          });
        }
        return originalPush.apply(window.dataLayer, args);
      };
      Logger.log('DataLayer initialized and enhanced with debug logging.', 'green', 'DataLayerHandler');
    }
  }, {
    key: "attachFormEventListeners",
    value: function attachFormEventListeners(form, formId) {
      DataLayerHandler.bindTrackEvent(form, 'rsform-init', 'formStep', 1, formId);
      form.dispatchEvent(new Event('rsform-init'));
      DataLayerHandler.bindTrackEvent('.rsform-button-next', 'click', 'formStep', 2, formId);
      DataLayerHandler.bindTrackEvent('.rsform-submit-button', 'click', 'formSubmission', 'submit', formId);
      form.querySelectorAll('input, select, textarea').forEach(function (element) {
        var fieldId = element.id;
        if (fieldId) {
          DataLayerHandler.bindTrackEvent("#".concat(fieldId), 'change', 'formFieldChange', null, formId, DataLayerHandler.createFormFieldEvent);
        }
      });
      form.addEventListener('keyup', function (event) {
        var _target$closest;
        var target = event.target;
        var classValue = target.className;
        var formId = (_target$closest = target.closest('form')) === null || _target$closest === void 0 ? void 0 : _target$closest.id;
        if (event.key === 'Enter') {
          var step = null;
          if (target.classList.contains('rsform-submit-button')) {
            step = 'submit';
          }
          if (target.classList.contains('rsform-button-next')) {
            step = 2;
          }
          if (step) {
            DataLayerHandler.bindTrackEvent(".".concat(classValue), 'click', 'formStep', step, formId);
          }
        }
      });
      Logger.log('Form event listeners attached.', 'green', 'DataLayerHandler');
    }
  }, {
    key: "init",
    value: function init() {
      DataLayerHandler.initializeDataLayer();

      // Track all button clicks
      document.addEventListener('click', function (event) {
        var target = event.target;
        var tagName = target.tagName.toLowerCase();
        var elementText = target.textContent.trim();
        var elementClass = target.className;
        var elementId = target.id;
        var elementHref = target.href;
        var eventData = {
          event: 'interaction',
          elementType: tagName,
          elementText: elementText,
          elementClass: elementClass,
          elementId: elementId,
          elementHref: elementHref
        };
        DataLayerHandler.pushEvent(eventData);
        Logger.log('Button clicked:', '#48dbfb', 'DataLayerHandler', eventData);
      });
      document.addEventListener('DOMContentLoaded', function () {
        var form = document.querySelector('.rsform form');
        if (!form) {
          Logger.log('No form found on the page.', 'orange', 'DataLayerHandler');
          return;
        }
        var formId = form.id;
        DataLayerHandler.attachFormEventListeners(form, formId);
      });
      Logger.log('DataLayerHandler initialized.', 'green', 'DataLayerHandler');
    }
  }]);
}();
;// ./assets/js/sagutid.js
function sagutid_typeof(o) { "@babel/helpers - typeof"; return sagutid_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, sagutid_typeof(o); }
function sagutid_regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ sagutid_regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == sagutid_typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(sagutid_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function sagutid_asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function sagutid_asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { sagutid_asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { sagutid_asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }








// Lazy-load Material Web only when needed to keep initial bundle small
function loadMaterialIfNeeded() {
  return _loadMaterialIfNeeded.apply(this, arguments);
}
function _loadMaterialIfNeeded() {
  _loadMaterialIfNeeded = sagutid_asyncToGenerator(/*#__PURE__*/sagutid_regeneratorRuntime().mark(function _callee() {
    var hasMaterialElements, _yield$import, typescaleStyles, _Logger$log;
    return sagutid_regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          if (!(typeof document === 'undefined')) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return");
        case 3:
          // Detect any Material Web custom element tags (md-*) present in DOM
          hasMaterialElements = Array.from(document.getElementsByTagName('*')).some(function (el) {
            return el.tagName.startsWith('MD-');
          });
          if (hasMaterialElements) {
            _context.next = 6;
            break;
          }
          return _context.abrupt("return");
        case 6:
          _context.next = 8;
          return __webpack_require__.e(/* import() | material */ 96).then(__webpack_require__.bind(__webpack_require__, 464));
        case 8:
          _context.next = 10;
          return __webpack_require__.e(/* import() | material */ 96).then(__webpack_require__.bind(__webpack_require__, 187));
        case 10:
          _yield$import = _context.sent;
          typescaleStyles = _yield$import.styles;
          if ('adoptedStyleSheets' in document && typescaleStyles !== null && typescaleStyles !== void 0 && typescaleStyles.styleSheet) {
            document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
          }
          _context.next = 18;
          break;
        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](0);
          Logger === null || Logger === void 0 || (_Logger$log = Logger.log) === null || _Logger$log === void 0 || _Logger$log.call(Logger, 'Material load skipped: ' + _context.t0, '#ffaa00', 'sagutid.js');
        case 18:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 15]]);
  }));
  return _loadMaterialIfNeeded.apply(this, arguments);
}
function initializeApp() {
  // Optionally load Material bundle and typography if the page uses md-* elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      return loadMaterialIfNeeded();
    }, {
      once: true
    });
  } else {
    // DOM is ready enough to scan
    loadMaterialIfNeeded();
  }

  // Log the debug mode status
  Logger.log("Debug mode: ".concat(Logger.debugMode), '#00ff00', 'sagutid.js');
  var handlers = [{
    condition: !!document.querySelector('#installPopup'),
    handler: PWAHandler
  }, {
    condition: 'serviceWorker' in navigator,
    handler: ServiceWorkerHandler
  }, {
    condition: true,
    handler: MetaTagHandler
  }, {
    condition: true,
    handler: CCommentHandler
  }, {
    condition: true,
    handler: HeaderHandler
  }, {
    condition: true,
    handler: PWAShareHandler
  }, {
    condition: true,
    handler: DataLayerHandler
  }];
  handlers.forEach(function (_ref) {
    var condition = _ref.condition,
      handler = _ref.handler;
    if (condition) {
      try {
        handler.init();
      } catch (error) {
        Logger.error("Error initializing ".concat(handler.name, ": ").concat(error), 'sagutid.js');
      }
    }
  });
}
initializeApp();
/******/ })()
;
//# sourceMappingURL=main.bundle.js.map