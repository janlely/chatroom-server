import express, { Express, NextFunction, Request, Response } from "express"
import dotenv from "dotenv"
import http, { IncomingMessage } from "http"
import { WebSocket } from "ws"
import cookieParser from "cookie-parser"
import login from "./login"
import chat from "./chat"
import auth from './auth'
import * as common from "./common"
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors'
// import { emit } from "process";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;


app.use(cors())
app.use(cookieParser())


function authInterceptor(req: Request, res: Response, next: NextFunction) {
  let authRes = common.authenticate(req.cookies)
  if (!authRes || !authRes.username){
    res.status(401).send('Unauthorized')
    return
  }
  (req as unknown as CustomRequest).context = {username: authRes.username, platform: authRes.platform}
  next()
}
// app.use(/^\/(?!api\/login$).+$/, (req, res, next) => {
// });
app.use('/api/chat', authInterceptor)
app.use('/api/auth', authInterceptor)
app.use("/api", express.json())
app.use("/api/login", login)
app.use("/api/chat", chat)
app.use("/api/auth", auth)
app.get("/", (req: Request, res: Response) => {
  res.status(404)
})

const server = http.createServer(app);
// let wsCookieParser = cookieParser()

const wss = new WebSocket.Server({ server, path: "/chat-ws"})

async function wsCookieParser(req: WebSocketRequest) {
  // 使用 Express 的 cookie-parser 中间件来解析 Cookie
  return new Promise((resolve, reject) => {
    cookieParser()(req as unknown as Request, {} as unknown as Response, () => {
      resolve(null);
    });
  });
}

wss.on('connection', async (ws: WebSocket, req: WebSocketRequest) => {

  await wsCookieParser(req)
  let authRes = common.authenticate(req.cookies)
  if (!authRes || !authRes.username) {
      console.log("Unauthorized")
      ws.close(3401, "Unauthorized")
    return
  }

  const uuid = uuidv4()
  ws.username = authRes!.username
  ws.platform = authRes!.platform
  ws.uuid = uuid
  ws.roomId = decodeURIComponent(new URL(req.url!, `http://${req.headers.host}`).search.substring(1))
  global.all_clients.set(uuid, ws)
  global.user_wsconnections.set({username: ws.username!, roomId: ws.roomId!}, uuid)
  if (!global.room_clients.has(ws.roomId!)) {
    console.log(`new room created: ${ws.roomId}`)
    global.room_clients.set(ws.roomId!, new Array<string>())
  }
  console.log(`use add into room: ${ws.roomId}`)
  global.room_clients.get(ws.roomId!)?.push(uuid)
  console.log(`room length: ${global.room_clients.get(ws.roomId)?.length}`)
  console.log(`WebSocket 连接已建立, username: ${ws.username}, roomId: ${ws.roomId}`)

  //通知其他客户端拉取房间成员列表
  global.room_clients.get(ws.roomId)?.forEach( ws_uuid => {
    if (!global.all_clients.has(ws_uuid)) {
      console.log("no such client")
      return
    }
    if (global.all_clients.get(ws_uuid)?.username === authRes!.username && global.all_clients.get(ws_uuid)?.platform === ws.platform) {
      console.log("no need to send notify to himself")
      return
    }
    console.log(`send notify to ${global.all_clients.get(ws_uuid)!.username}`)
    global.all_clients.get(ws_uuid)!.send("members")
  })

  // 处理 WebSocket 消息
  ws.on('message', (message: string) => {
    console.log('received: ', message.toString())
    if (message.toString() === "ping") {
      ws.send("pong")
      return
    }
  })

  // 处理 WebSocket 连接关闭
  ws.on('close', () => {
    global.all_clients.delete(ws.uuid)
    global.room_clients.set(ws.roomId!,
      global.room_clients.get(ws.roomId!)?.filter(ws_uuid => global.all_clients.has(ws_uuid)) ?? new Array<string>())
    if (!ws.username && !ws.roomId) {
      global.user_wsconnections.delete({username: ws.username!, roomId: ws.roomId!})
    }
    console.log(`WebSocket 连接已关闭, username: ${ws.username}, roomId: ${ws.roomId}`)
  })

})



global.user_session = new Map()
global.user_wsconnections = new Map()
global.room_clients = new Map()
global.all_clients = new Map()
global.user_chanllenge_data = new Map()
global.user_chanllenge_ids = new Set()

server.listen(port, () => {
  console.log(`服务器已启动，监听端口 ${port}`)
})
