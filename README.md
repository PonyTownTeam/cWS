<h1 align="center">(Deprecated) ClusterWS/cWS</h1>
<h6 align="center">Fast WebSocket implementation for Node.js</h6>

<p align="center">
  <a href="https://badge.fury.io/js/%40clusterws%2Fcws"><img src="https://badge.fury.io/js/%40clusterws%2Fcws.svg" alt="npm version" height="22"></a>
   <a href="https://travis-ci.org/ClusterWS/cWS"><img src="https://travis-ci.org/ClusterWS/cWS.svg?branch=master" alt="travis build" height="22"></a>
</p>


## Important Notes

* **Consider using latest version of uWebSockets if you don't need ws compatibility.**

* This repository is a fork of [ClusterWS/cWS](https://github.com/ClusterWS/cWS)

* This repository is a fork of [uWebSockets v0.14](https://github.com/uNetworking/uWebSockets/tree/v0.14) therefore has two licence [MIT](https://github.com/ClusterWS/uWS/blob/master/LICENSE) and [ZLIB](https://github.com/ClusterWS/uWS/blob/master/src/LICENSE)
* Consider using latest [uWebSockets](https://github.com/uNetworking/uWebSockets.js) version instead

## Supported Node Versions (SSL)

This table is true if you run ssl directly with `cws` (`Node.js`). In case if you use proxy for example `nginx`, `cws` can be run on bigger coverage.

|  CWS Version | Node 10  | Node 11 | Node 12          |  Node 13  | Node 14 | Node 16 | Node 18 | Node 19 |
|--------------|----------|---------|------------------|-----------|---------|---------|---------|---------|
| 4.2.0        |    X     |    X    | >=12.18          |     X     | >=14.5  | >=16.0  | >=18.0  | >=19.0  |
| 4.1.0        |    X     |    X    | >=12.18          |     X     | >=14.5  | >=16.0  | >=18.0  |    X    |
| 4.0.0        |    X     |    X    | >=12.18          |     X     | >=14.5  | >=16.0  |    X    |    X    |
| 3.0.0        | >=10.0   |    X    | >=12.16          | >=13.9    | >=14.5  |    X    |    X    |    X    |
| 2.0.0        | >=10.0   |    X    | >=12.16          | >=13.9    |   X     |    X    |    X    |    X    |
| 1.6.0        | >=10.0   | >=11.0  | >=12.0 & <12.16  | >=13.9    |   X     |    X    |    X    |    X    |

## Documentation

#### Useful links

* [Examples](./examples)
* [Changelog](./CHANGELOG.md)

#### Table of Contents

* [Installation](#user-content-installation)
* [Websocket Client](#user-content-websocket-client)
* [Websocket Server](#user-content-websocket-server)
* [Secure WebSocket](#user-content-secure-websocket)
* [Handle App Level Ping In Browser (example)](#user-content-handle-app-level-ping-in-browser-example)

### Installation

```js
npm i @clusterws/cws
```

### Websocket Client

Typings: [dist/client.d.ts](https://github.com/ClusterWS/cWS/blob/master/dist/client.d.ts)

Import cws WebSocket:
```js
const { WebSocket } = require('@clusterws/cws');
```

Connect to WebSocket server:
```js
const socket = new WebSocket(/* ws server endpoint **/);
```

Event is triggered if there is an error with the connection:
```js
socket.onErrorListener = (err) => { };
```

Event is triggered when connection has been closed:
```js
socket.onCloseListener = (code, reason) => { };
```

Event is triggered when client receives message(s):
```js
socket.onmessonMessageListenerage = (message) => { };
```

To send message use `sendBuffer` function:
```js
// send accepts binary
socket.sendBuffer(msg);
```

To close connection you can use `close` or `terminate` methods:
```js
// clean close code and reason are optional
socket.close(code, reason);
// destroy socket 
socket.terminate()
```

To get current socket ready state can use `readyState` getter:
```js
socket.readyState; // -> OPEN (1) or CLOSED (3)

// check if socket open can be done by
if(socket.readyState === socket.OPEN) {}

// check if socket closed can be done by
if(socket.readyState === socket.CLOSED) {}
```

To get addresses use `_socket` getter:
```js
socket._socket;

// Returns some thing like (all fields could be undefined):
// {
//  remotePort,
//  remoteAddress,
//  remoteFamily
// }
```

**For more information check typings (`*.d.ts`) files in [dist](https://github.com/ClusterWS/cWS/blob/master/dist) folder**

### Websocket Server

Typings: [dist/server.d.ts](https://github.com/ClusterWS/cWS/blob/master/dist/server.d.ts)

Import cws WebSocket:
```js
const { WebSocket } = require('@clusterws/cws');
```

Create WebSocket server:
```js
const wsServer = new WebSocket.Server({ 
  /**
   * port?: number (creates server and listens on provided port)
   * host?: string (provide host if necessary with port)
   * path?: string (url at which accept ws connections)
   * server?: server (provide already existing server)
   * noDelay?: boolean (set socket no delay)
   * noServer?: boolean (use this when upgrade done outside of cws)
   * maxPayload?: number 
   * perMessageDeflate?: boolean | { serverNoContextTakeover: boolean;}
   * verifyClient?: (info: ConnectionInfo, next: VerifyClientNext) => void (use to allow or decline connections)
   **/ 
 }, () => {
  // callback called when server is ready
  // is not called when `noServer: true` or `server` is provided
  // from outside
});
```

Event on `connection` is triggered when new client is connected to the server:
```js
// `ws` is websocket client all available options 
// can be found in `Websocket Client` section above
// `req` is http upgrade request
wsServer.on('connection', (ws, req) => {})
```

Event on `error` is triggered when server has some issues and `noServer` is `false:`
```js
// on error event will NOT include httpServer errors IF
// server was passed under server parameter { server: httpServer },
// you can register on 'error' listener directly on passed server
wsServer.on('error', (err) => { })
```

Event on `close` is triggered after you call `wsServer.close()` function, if `cb` is provided both `cb` and on `close` listener will be triggered:
```js
wsServer.on('close', () => { })
```

To get all connected clients use `clients` getter:
```js
wsServer.clients;

// loop thought all clients:
wsServer.clients.forEach((ws) => { });

// get number of clients:
wsServer.clients.length;
```

To stop server use `close` function:
```js
wsServer.close(() => {
  // triggered after server has been stopped
})
```

`handleUpgrade` is function which is commonly used together with `noServer` (same as `ws` module)
```js
const wss = new WebSocket.Server({ noServer: true });
const server = http.createServer();

wss.on('connection', (ws, req) => { })

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
  });
});
```

**For more information check typings (`*.d.ts`) files in [dist](https://github.com/ClusterWS/cWS/blob/master/dist) folder**

### Secure WebSocket
You can use `wss://` with `cws` by providing `https` server to `cws` and setting `secureProtocol` on https options:

```js
const { readFileSync } = require('fs');
const { createServer }  = require('https');
const { WebSocket, secureProtocol  } = require('@clusterws/cws');

const options = {
  key: readFileSync(/** path to key */),
  cert: readFileSync(/** path to certificate */),
  secureProtocol
  // ...other Node HTTPS options
};

const server = createServer(options);
const wsServer = new WebSocket.Server({ server });
// your secure ws is ready (do your usual things)

server.listen(port, () => {
  console.log('Server is running');
})
```

**For more detail example check [examples](https://github.com/ClusterWS/cWS/blob/master/examples) folder**
