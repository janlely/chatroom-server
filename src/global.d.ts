import { sha256 } from 'js-sha256'
import { WebSocket } from 'ws'
import { IncomingMessage } from 'http'

declare global {

    interface CustomRequest extends Request {
        context: {
            username: string,
        }
    }
    interface WebSocketRequest extends IncomingMessage {
        cookies: {[key: string]: any}
    }
    // interface CustomWebSocket extends WebSocket {
    //     userId?: string;
    //     chatRoomId?: string;
    // }

    enum MessageType {
        TEXT,
        IMAGE
    }

    interface Message {
        messageId: number,
        type: MessageType,
        data: string,
        sender: string
    }

    interface UserSession {
        token: string,
        username: string,
    }

    var user_session: Map<string,UserSession>
    type UserRoom = {
        username: string
        roomId: string,
    }
    var user_wsconnections: Map<UserRoom, string>
    var room_clients: Map<string, string[]>
    var all_clients: Map<string, WebSocket>


    const cookie_secret = "123456"

    var user_data: {username: string, password: string, email: string}[]

}

declare module 'ws' {
  interface WebSocket {
    username?: string
    roomId?: string
    uuid: string
  }
}

// 导出空对象以确保这是一个模块（可选）
export {};