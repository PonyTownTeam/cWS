"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const shared_1 = require("./shared");
const clientGroup = shared_1.native.client.group.create(0, shared_1.DEFAULT_PAYLOAD_LIMIT);
shared_1.setupNative(clientGroup, 'client');
const server = shared_1.native.server;
class WebSocket {
    constructor(_url, options = undefined) {
        this.open = shared_1.noop;
        this.ping = shared_1.noop;
        this.error = shared_1.noop;
        this.close = shared_1.noop;
        this.message = shared_1.noop;
        this.external = options?.external;
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
        return this.external ? 1 : 3;
    }
    set onopen(listener) {
        this.on('open', listener);
    }
    set onclose(listener) {
        this.on('close', listener);
    }
    set onerror(listener) {
        this.on('error', listener);
    }
    set onmessage(listener) {
        this.on('message', listener);
    }
    on(event, listener) {
        if (event === 'open') this.open = listener;
        else if (event === 'ping') this.ping = listener;
        else if (event === 'error') this.error = listener;
        else if (event === 'close') this.close = listener;
        else if (event === 'message') this.message = listener;
        else console.error(`invalid event`, event);
    }
    send(message) {
        // this check is needed to ensure the socket isn't closed
        if (this.external) {
            // at least the initial message is string, binary afterwards
            const opCode = typeof message === 'string' ? 1 : 2;
            server.send(this.external, message, opCode, null, false);
        }
    }
    ping(message) {
        if (this.external) {
            server.send(this.external, message, 9);
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
