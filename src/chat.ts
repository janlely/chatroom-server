import express, { Request, Response } from "express"
import sqlite3 from "sqlite3"

const db = new sqlite3.Database('chat.db')
const router = express.Router()

router.post("/send", (req: Request, res: Response) => {
    console.log(`body: ${req.body}, header: ${JSON.stringify(req.headers)}`)
    const message = req.body as Message
    const roomId = req.headers.roomid![0]
    const username = (req as unknown as CustomRequest).context.username
    
    const uuid = Date.now()
    db.run('INSERT INTO messages (username, room_id, message_type, message, message_id, uuid) VALUES (?, ?, ?, ?, ?, ?)',
        [username, roomId, message.type, message.data, message.messageId, uuid], (err) => {
        if (err) {
            console.error('插入消息失败:', err)
            res.status(500).send('插入消息失败')
            return
        }
        console.log(`roomId: ${roomId}, client: ${global.room_clients.size}, room keys: ${global.room_clients.keys().next().value}`)
        global.room_clients.get(roomId)?.forEach( ws_uuid => {
            console.log("ws_uuid: ", ws_uuid)
            if (!global.all_clients.has(ws_uuid)) {
                return
            }
            if (global.all_clients.get(ws_uuid)?.username === username) {
                return
            }
            console.log(`send notify to ${global.all_clients.get(ws_uuid)!.username}`)
            global.all_clients.get(ws_uuid)!.send("notify")
        })
        res.status(200).send({
            uuid: uuid
        })
    })
})


router.post("/pull", (req: Request, res: Response) => {
    console.log(`body: ${req.body}, header: ${JSON.stringify(req.headers)}`)
    const uuid = req.body.uuid
    const roomId = req.headers.roomid![0]
    const username = (req as unknown as CustomRequest).context.username
    
    db.all('select * from messages where uuid > ? order by uuid asc', uuid, (err, rows: any[]) => {
        if (err) {
            console.error('查询消息失败:', err)
            res.status(500).send('查询消息失败')
            return
        }
        res.status(200).send(rows.map(row => {
            return {
                message: {
                    messageId: row.message_id,
                    type: row.message_type,
                    data: row.message
                },
                send: username === row.username,
                success: true,
                uuid: row.uuid
            }
        }))
    })
})
export default router