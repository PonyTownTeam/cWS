#include "Hub.h"
#include "HTTPSocket.h"
#include <openssl/sha.h>
#include <string>
#include <charconv>

namespace cWS {

void Hub::onServerAccept(cS::Socket *s) {
    HttpSocket<SERVER> *httpSocket = new HttpSocket<SERVER>(s);
    delete s;

    httpSocket->setState<HttpSocket<SERVER>>();
    httpSocket->start(httpSocket->nodeData->loop, httpSocket, httpSocket->setPoll(UV_READABLE));
    httpSocket->setNoDelay(true);
    Group<SERVER>::from(httpSocket)->addHttpSocket(httpSocket);
    Group<SERVER>::from(httpSocket)->httpConnectionHandler(httpSocket);
}

void Hub::onClientConnection(cS::Socket *s, bool error) {
    HttpSocket<CLIENT> *httpSocket = (HttpSocket<CLIENT> *) s;

    if (error) {
        httpSocket->onEnd(httpSocket);
    } else {
        httpSocket->setState<HttpSocket<CLIENT>>();
        httpSocket->change(httpSocket->nodeData->loop, httpSocket, httpSocket->setPoll(UV_READABLE));
        httpSocket->setNoDelay(true);
        httpSocket->upgrade(nullptr, nullptr, 0, nullptr, 0, nullptr);
    }
}

bool Hub::listen(const char *host, int port, cS::TLS::Context sslContext, int options, Group<SERVER> *eh) {
    if (!eh) {
        eh = (Group<SERVER> *) this;
    }

    if (cS::Node::listen<onServerAccept>(host, port, sslContext, options, (cS::NodeData *) eh, nullptr)) {
        eh->errorHandler(port);
        return false;
    }
    return true;
}

bool Hub::listen(int port, cS::TLS::Context sslContext, int options, Group<SERVER> *eh) {
    return listen(nullptr, port, sslContext, options, eh);
}

cS::Socket *allocateHttpSocket(cS::Socket *s) {
    return (cS::Socket *) new HttpSocket<CLIENT>(s);
}

bool parseURI(std::string &uri, bool &secure, std::string &hostname, int &port, std::string &path) {
    port = 80;
    secure = false;
    size_t offset = 5;
    if (!uri.compare(0, 6, "wss://")) {
        port = 443;
        secure = true;
        offset = 6;
    } else if (uri.compare(0, 5, "ws://")) {
        return false;
    }

    if (offset == uri.length()) {
        return false;
    }

    if (uri[offset] == '[') {
        if (++offset == uri.length()) {
            return false;
        }
        size_t endBracket = uri.find(']', offset);
        if (endBracket == std::string::npos) {
            return false;
        }
        hostname = uri.substr(offset, endBracket - offset);
        offset = endBracket + 1;
    } else {
        hostname = uri.substr(offset, uri.find_first_of(":/", offset) - offset);
        offset += hostname.length();
    }

    if (offset == uri.length()) {
        path.clear();
        return true;
    }

    if (uri[offset] == ':') {
        offset++;
        std::string portStr = uri.substr(offset, uri.find('/', offset) - offset);
        if (portStr.length()) {
			auto result = std::from_chars(portStr.data(), portStr.data() + portStr.size(), port);
			if (result.ec != std::errc{} || result.ptr != portStr.data() + portStr.size()) {
				return false;
			}
        } else {
            return false;
        }
        offset += portStr.length();
    }

    if (offset == uri.length()) {
        path.clear();
        return true;
    }

    if (uri[offset] == '/') {
        path = uri.substr(++offset);
    }
    return true;
}

void Hub::connect(std::string uri, void *user, std::map<std::string, std::string> extraHeaders, int timeoutMs, Group<CLIENT> *eh) {
    if (!eh) {
        eh = (Group<CLIENT> *) this;
    }

    int port;
    bool secure;
    std::string hostname, path;

    if (!parseURI(uri, secure, hostname, port, path)) {
        eh->errorHandler(user);
    } else {
        HttpSocket<CLIENT> *httpSocket = (HttpSocket<CLIENT> *) cS::Node::connect<allocateHttpSocket, onClientConnection>(hostname.c_str(), port, secure, eh);
        if (httpSocket) {
            // startTimeout occupies the user
            httpSocket->startTimeout<HttpSocket<CLIENT>::onEnd>(timeoutMs);
            httpSocket->httpUser = user;

            std::string randomKey = "x3JJHMbDL1EzLkh9GBhXDw==";
//            for (int i = 0; i < 22; i++) {
//                randomKey[i] = rand() %
//            }

            httpSocket->httpBuffer = "GET /" + path + " HTTP/1.1\r\n"
                                     "Upgrade: websocket\r\n"
                                     "Connection: Upgrade\r\n"
                                     "Sec-WebSocket-Key: " + randomKey + "\r\n"
                                     "Host: " + hostname + ":" + std::to_string(port) + "\r\n"
                                     "Sec-WebSocket-Version: 13\r\n";

            for (std::pair<std::string, std::string> header : extraHeaders) {
                httpSocket->httpBuffer += header.first + ": " + header.second + "\r\n";
            }

            httpSocket->httpBuffer += "\r\n";
        } else {
            eh->errorHandler(user);
        }
    }
}

void Hub::upgrade(uv_os_sock_t fd, const char *secKey, SSL *ssl, const char *extensions, size_t extensionsLength, const char *subprotocol, size_t subprotocolLength, Group<SERVER> *serverGroup) {
    if (!serverGroup) {
        serverGroup = &getDefaultGroup<SERVER>();
    }

    cS::Socket s((cS::NodeData *) serverGroup, serverGroup->loop, fd, ssl);
    s.setNoDelay(true);

    // todo: skip httpSocket -> it cannot fail anyways!
    HttpSocket<SERVER> *httpSocket = new HttpSocket<SERVER>(&s);
    httpSocket->setState<HttpSocket<SERVER>>();
    httpSocket->change(httpSocket->nodeData->loop, httpSocket, httpSocket->setPoll(UV_READABLE));
    bool perMessageDeflate;
    httpSocket->upgrade(secKey, extensions, extensionsLength, subprotocol, subprotocolLength, &perMessageDeflate);

    WebSocket<SERVER> *webSocket = new WebSocket<SERVER>(perMessageDeflate, httpSocket);
    delete httpSocket;
    webSocket->setState<WebSocket<SERVER>>();
    webSocket->change(webSocket->nodeData->loop, webSocket, webSocket->setPoll(UV_READABLE));
    serverGroup->addWebSocket(webSocket);
    serverGroup->connectionHandler(webSocket, {});
}

}
