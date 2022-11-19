"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const shared_1 = require("./shared");
const clientGroup = shared_1.native.client.group.create(0, shared_1.DEFAULT_PAYLOAD_LIMIT);
shared_1.setupNative(clientGroup, 'client');
const server = shared_1.native.server;
class WebSocket {
    constructor(_url, options = undefined) {
        this.OPEN = WebSocket.OPEN;
        this.CLOSED = WebSocket.OPEN;
        this.registeredEvents = {
            open: shared_1.noop,
            ping: shared_1.noop,
            pong: shared_1.noop,
            error: shared_1.noop,
            close: shared_1.noop,
            message: shared_1.noop
        };
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
        return this.external ? this.OPEN : this.CLOSED;
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
        if (this.registeredEvents[event] === undefined) {
            console.warn(`cWS does not support '${event}' event`);
            return;
        }
        if (typeof listener !== 'function') {
            throw new Error(`Listener for '${event}' event must be a function`);
        }
        if (this.registeredEvents[event] !== shared_1.noop) {
            console.warn(`cWS does not support multiple listeners for the same event. Old listener for '${event}' event will be overwritten`);
        }
        this.registeredEvents[event] = listener;
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
WebSocket.OPEN = 1;
WebSocket.CLOSED = 3;
WebSocket.Server = server_1.WebSocketServer;
