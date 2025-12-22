"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureProtocol = exports.WebSocketServer = exports.WebSocket = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "WebSocket", { enumerable: true, get: function () { return client_1.WebSocket; } });
var server_1 = require("./server");
Object.defineProperty(exports, "WebSocketServer", { enumerable: true, get: function () { return server_1.WebSocketServer; } });
exports.secureProtocol = 'TLSv1_2_method';
