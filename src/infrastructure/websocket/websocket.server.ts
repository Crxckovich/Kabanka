import {roomWsHandler, type WsData} from "./handlers/room.handler";
import { UserDto } from "@/useCases";

class WebsocketServer {
  listen(port: number) {
    Bun.serve<WsData>({
      port,
      fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === "/ws/room") {
          const token = url.searchParams.get("token");
          const inviteCode = url.searchParams.get("inviteCode");
          const guestId = url.searchParams.get("guestId");

          const upgradeSuccess = server.upgrade(req, {
            data: {
              token: token || undefined,
              inviteCode: inviteCode || undefined,
              guestId: guestId || undefined,
            } as WsData,
          });

          if (upgradeSuccess) {
            return undefined;
          }
        }

        return new Response("Expected WebSocket", { status: 400 });
      },
      websocket: {
        open(ws) {
          roomWsHandler.onConnect(ws);
        },
        message(ws, message) {
          roomWsHandler.onMessage(ws, message);
        },
        close(ws) {
          roomWsHandler.onClose(ws);
        },
      },
    });

    console.log(`WebSocket сервер запущен на ws://localhost:${port}`);
  }
}

export const websocketServer = new WebsocketServer();
