import { WebSocketServer } from './server';
import { SocketAddress, ServerConfigs } from './index';
import { native, setupNative, noop, DEFAULT_PAYLOAD_LIMIT } from './shared';

const clientGroup: any = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);
setupNative(clientGroup, 'client');
const { server } = native;

type onCloseType = (code?: number, reason?: string) => void;
type onErrorType = (err: Error) => void;
type onMessageType = (message: string | any) => void;

const OPEN = 1;
const CLOSED = 3;

export class WebSocket {
  public static Server: new (options: ServerConfigs, cb?: () => void) => WebSocketServer = WebSocketServer;

  public onCloseListener: onCloseType = noop;
  public onErrorListener: onErrorType = noop;
  public onMessageListener: onMessageType = noop;

  private external: any;

  constructor(public url: string, private options: any = {}) {
    if (!this.url && (this.options as any).external) {
      this.external = (this.options as any).external;
    }
  }

  public get _socket(): SocketAddress {
    const address: any[] = this.external ? native.getAddress(this.external) : new Array(3);
    return {
      remotePort: address[0],
      remoteAddress: address[1],
      remoteFamily: address[2]
    };
  }

  public get readyState(): number {
    return this.external ? OPEN : CLOSED;
  }

  public sendBuffer(message: Buffer): void {
    if (this.external) {
      server.send(this.external, message);
    }
  }

  public close(code: number = 1000, reason?: string): void {
    if (this.external) {
      server.close(this.external, code, reason);
      this.external = null;
    }
  }

  public terminate(): void {
    if (this.external) {
      server.terminate(this.external);
      this.external = null;
    }
  }
}
