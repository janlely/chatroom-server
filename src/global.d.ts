import { sha256 } from 'js-sha256'
import { WebSocket } from 'ws'
import { IncomingMessage } from 'http'

declare global {

    interface CustomRequest extends Request {
        context: {
            username: string,
            platform: string
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
        sender: string,
        quote?: number
    }

    interface UserSession {
        token: string,
        username: string,
        email: string,
        avatar: string
    }

    var user_session: Map<string,UserSession>
    var user_chanllenge_data: Map<string, UserData>
    var user_chanllenge_ids: Set<string>

    type UserData = {
        username: string,
        email: string,
        avatar: string,
        roomId: string
    }
    type UserRoom = {
        username: string
        roomId: string,
    }
    var user_wsconnections: Map<UserRoom, string>
    var room_clients: Map<string, string[]>
    var all_clients: Map<string, WebSocket>


    const cookie_secret = "123456"

    // var user_data: {username: string, password: string, email: string}[]

}

declare module 'ws' {
  interface WebSocket {
    username?: string
    roomId?: string
    uuid: string
    platform: string
  }
}

// 导出空对象以确保这是一个模块（可选）
export {};