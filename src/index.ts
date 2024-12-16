import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import http, { IncomingMessage } from "http"
import { WebSocket } from "ws"
import cookieParser from "cookie-parser"
import login from "./login"
import chat from "./chat"
import * as common from "./common"
import { v4 as uuidv4 } from 'uuid';
// import { emit } from "process";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;


app.use(cookieParser())



app.use(/^\/(?!api\/login$).+$/, (req, res, next) => {
  let username = common.authenticate(req.cookies)
  if (!username){
    res.status(401).send('Unauthorized')
    return
  }
  (req as unknown as CustomRequest).context = {username}
  next()
});
app.get("/", (req: Request, res: Response) => {
  res.status(404)
})
app.use("/api/login", login)
app.use("/api/chat", express.json())
app.use("/api/chat", chat)

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
  let username = common.authenticate(req.cookies)
  if (!username) {
      console.log("Unauthorized")
      ws.close(3401, "Unauthorized")
    return
  }

  const uuid = uuidv4()
  ws.username = username
  ws.uuid = uuid
  ws.roomId = new URL(req.url!, `http://${req.headers.host}`).search.substring(1) 
  global.all_clients.set(uuid, ws)
  global.user_wsconnections.set({username: ws.username!, roomId: ws.roomId!}, uuid)
  if (!global.room_clients.has(ws.roomId!)) {
    console.log(`new room created: ${ws.roomId}`)
    global.room_clients.set(ws.roomId!, new Array<string>())
  }
  global.room_clients.get(ws.roomId!)!.push(uuid)
  console.log(`room_clients: ${global.room_clients.size}`)
  console.log(`WebSocket 连接已建立, username: ${ws.username}, roomId: ${ws.roomId}`)

  // 处理 WebSocket 消息
  ws.on('message', (message: string) => {
    if (message === "ping") {
      ws.send("pong")
      return
    }
  })

  // 处理 WebSocket 连接关闭
  ws.on('close', () => {
    if (!ws.username && !ws.roomId) {
      global.user_wsconnections.delete({username: ws.username!, roomId: ws.roomId!})
    }
    console.log('WebSocket 连接已关闭')
  })

})




global.user_data = [
    {username : "janlely", password: "1qaz@wsx", email: "janlely@163.com"},
    {username : "jnabo", password: "1qaz@wsx", email: "jnabo@163.com"},
    {username : "jason", password: "1qaz@wsx", email: "jason@163.com"},
    {username : "jacobo", password: "1qaz@wsx", email: "jacobo@163.com"},
    {username : "jqqq", password: "1qaz@wsx", email: "jqqq@163.com"},
]

global.user_session = new Map()
global.user_wsconnections = new Map()
global.room_clients = new Map()
global.all_clients = new Map()

server.listen(port, () => {
  console.log(`服务器已启动，监听端口 ${port}`)
})
