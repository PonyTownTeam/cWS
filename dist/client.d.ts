import { WebSocketServer } from './server';
import { SocketAddress, ServerConfigs } from './index';
type onCloseType = (code?: number, reason?: string) => void;
type onErrorType = (err: Error) => void;
type onMessageType = (message: string | any) => void;
export declare class WebSocket {
    url: string;
    private options;
    static Server: new (options: ServerConfigs, cb?: () => void) => WebSocketServer;
    onCloseListener: onCloseType;
    onErrorListener: onErrorType;
    onMessageListener: onMessageType;
    private external;
    constructor(url: string, options?: any);
    get _socket(): SocketAddress;
    get readyState(): number;
    set onclose(listener: onCloseType);
    set onerror(listener: onErrorType);
    set onmessage(listener: onMessageType);
    send(message: Buffer): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
}
export {};
