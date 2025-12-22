"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.native = exports.DEFAULT_PAYLOAD_LIMIT = exports.SLIDING_DEFLATE_WINDOW = exports.PERMESSAGE_DEFLATE = exports.noop = void 0;
exports.setupNative = setupNative;
const client_1 = require("./client");
const noop = () => { };
exports.noop = noop;
exports.PERMESSAGE_DEFLATE = 1;
exports.SLIDING_DEFLATE_WINDOW = 16;
exports.DEFAULT_PAYLOAD_LIMIT = 16777216;
exports.native = (() => {
    try {
        return require(`../dist/bindings/cws_${process.platform}_${process.versions.modules}`);
    }
    catch (err) {
        err.message = err.message + ` check './node_modules/@clusterws/cws/build_log.txt' for post install build logs`;
        throw err;
    }
})();
function setupNative(group, type, wsServer) {
    exports.native.setNoop(exports.noop);
    exports.native[type].group.onConnection(group, (external) => {
        if (type === 'server' && wsServer) {
            const socket = new client_1.WebSocket(null, { external });
            exports.native.setUserData(external, socket);
            if (wsServer.upgradeCb) {
                wsServer.upgradeCb(socket);
            }
            else {
                wsServer.registeredEvents['connection'](socket, wsServer.upgradeReq);
            }
            wsServer.upgradeCb = null;
            wsServer.upgradeReq = null;
            return;
        }
        const webSocket = exports.native.getUserData(external);
        webSocket.external = external;
    });
    exports.native[type].group.onMessage(group, (message, webSocket) => {
        webSocket.onMessageListener(message);
    });
    exports.native[type].group.onDisconnection(group, (newExternal, code, message, webSocket) => {
        webSocket.external = null;
        process.nextTick(() => {
            webSocket.onCloseListener(code || 1005, message || '');
        });
        exports.native.clearUserData(newExternal);
    });
    if (type === 'client') {
        exports.native[type].group.onError(group, (webSocket) => {
            process.nextTick(() => {
                webSocket.onErrorListener({
                    message: 'cWs client connection error',
                    stack: 'cWs client connection error'
                });
            });
        });
    }
}
