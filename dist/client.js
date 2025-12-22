"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = void 0;
const server_1 = require("./server");
const shared_1 = require("./shared");
const clientGroup = shared_1.native.client.group.create(0, shared_1.DEFAULT_PAYLOAD_LIMIT);
(0, shared_1.setupNative)(clientGroup, 'client');
const { server } = shared_1.native;
const OPEN = 1;
const CLOSED = 3;
class WebSocket {
    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
        this.onCloseListener = shared_1.noop;
        this.onErrorListener = shared_1.noop;
        this.onMessageListener = shared_1.noop;
        if (!this.url && this.options.external) {
            this.external = this.options.external;
        }
    }
    get _socket() {
        const address = this.external ? shared_1.native.getAddress(this.external) : new Array(3);
        return {
            remotePort: address[0],
            remoteAddress: address[1],
            remoteFamily: address[2]
        };
    }
    get readyState() {
        return this.external ? OPEN : CLOSED;
    }
    set onclose(listener) {
        this.onCloseListener = listener;
    }
    set onerror(listener) {
        this.onErrorListener = listener;
    }
    set onmessage(listener) {
        this.onMessageListener = listener;
    }
    send(message) {
        if (this.external) {
            server.send(this.external, message);
        }
    }
    close(code = 1000, reason) {
        if (this.external) {
            server.close(this.external, code, reason);
            this.external = null;
        }
    }
    terminate() {
        if (this.external) {
            server.terminate(this.external);
            this.external = null;
        }
    }
}
exports.WebSocket = WebSocket;
WebSocket.Server = server_1.WebSocketServer;
