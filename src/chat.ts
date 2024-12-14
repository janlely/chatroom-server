import express, { Request, Response } from "express"
import sqlite3 from "sqlite3"

const db = new sqlite3.Database('chat.db')
const router = express.Router()

router.post("/message", (req: Request, res: Response) => {
    console.log(`body: ${req.body}, header: ${JSON.stringify(req.headers)}`)
    const message = req.body as Message
    const roomId = req.headers.roomId![0]
    const username = (req as unknown as CustomRequest).context.username
    
    db.run('INSERT INTO messages (username, roomId, type, data, message_id, uuid) VALUES (?, ?, ?, ?, ?, ?)',
        [username, roomId, message.type, message.data, message.messageId, Date.now()], (err) => {
        if (err) {
            console.error('插入消息失败:', err)
            res.status(500).send('插入消息失败')
            return
        }
        global.room_clients.get(roomId)?.forEach(ws=> {
            ws.send("notify")
        })
        res.status(200).send('插入消息成功')
    })
})

export default router