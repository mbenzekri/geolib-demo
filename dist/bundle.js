/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/calculator.ts":
/*!***************************!*\
  !*** ./src/calculator.ts ***!
  \***************************/
/*! namespace exports */
/*! export Calculator [provided] [no usage info] [missing usage info prevents renaming] */
/*! other exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_require__.r, __webpack_exports__, __webpack_require__.d, __webpack_require__.* */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Calculator": () => /* binding */ Calculator
/* harmony export */ });
var Calculator = (function () {
    function Calculator() {
    }
    Calculator.prototype.add = function (a, b) {
        console.log("version " + Calculator.version);
        return a + b;
    };
    Calculator.version = '1';
    return Calculator;
}());



/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! namespace exports */
/*! exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_require__, __webpack_require__.r, __webpack_exports__, __webpack_require__.* */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _calculator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./calculator */ "./src/calculator.ts");

console.log("Hello World from index.ts ! total =" + (new _calculator__WEBPACK_IMPORTED_MODULE_0__.Calculator()).add(1, 1));
var dropArea = document.getElementById('drop-area');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
    dropArea.addEventListener(eventName, preventDefaults, false);
});
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}
;
['dragenter', 'dragover'].forEach(function (eventName) {
    dropArea.addEventListener(eventName, highlight, false);
});
['dragleave', 'drop'].forEach(function (eventName) {
    dropArea.addEventListener(eventName, unhighlight, false);
});
function highlight() {
    dropArea.classList.add('highlight');
}
function unhighlight() {
    dropArea.classList.remove('highlight');
}
dropArea.addEventListener('drop', handleDrop, false);
function handleDrop(e) {
    var files = e.dataTransfer.files;
    var ul = document.getElementById('filelist');
    var litems = [];
    files;
    for (var i = 0; i < files.length; i++) {
        var file = files.item(i);
        litems.push("<li>file \"" + file.name + "\" dropped is " + file.size + " bytes</li>");
    }
    ul.innerHTML = litems.join('');
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
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
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./src/index.ts");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
//# sourceMappingURL=bundle.js.map