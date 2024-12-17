import express, { Request, Response } from "express"
import sqlite3 from "sqlite3"

const db = new sqlite3.Database('chat.db')
const router = express.Router()

router.post("/send", (req: Request, res: Response) => {
    const message = req.body as Message
    const roomId = req.get("roomid")!
    const username = (req as unknown as CustomRequest).context.username
    
    const uuid = Date.now()
    db.run('INSERT INTO messages (username, room_id, message_type, message, message_id, uuid) VALUES (?, ?, ?, ?, ?, ?)',
        [username, roomId, message.type, message.data, message.messageId, uuid], (err) => {
        if (err) {
            console.error('插入消息失败:', err)
            res.status(500).send('插入消息失败')
            return
        }
        console.log(`roomId: ${roomId},
            client: ${global.room_clients.size},
            room keys: ${global.room_clients.keys().next().value},
            room length: ${global.room_clients.get(roomId)?.length}`)
        global.room_clients.get(roomId)?.forEach( ws_uuid => {
            console.log("ws_uuid: ", ws_uuid)
            if (!global.all_clients.has(ws_uuid)) {
                console.log("no such client")
                return
            }
            if (global.all_clients.get(ws_uuid)?.username === username) {
                console.log("no need to send notify to himself")
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
    const direction = req.body.direction
    const roomId = req.get("roomid")!
    const username = (req as unknown as CustomRequest).context.username
    
    const resultHandler = (err: Error | null, rows: any[]) => {
        if (err) {
            console.error('查询消息失败:', err)
            res.status(500).send('查询消息失败')
            return
        }
        res.status(200).send(rows.map(row => {
            console.log("row: ", row)
            return {
                message: {
                    messageId: row.message_id,
                    type: row.message_type,
                    data: row.message,
                    sender: row.username == username ? "me" : username
                },
                send: username === row.username,
                success: true,
                uuid: row.uuid
            }
        }))
    }
    if (uuid === 0) {
        console.log("query condition 1")
        db.all('select * from (select * from messages where room_id = ? order by uuid desc limit 20) order by uuid asc', roomId, resultHandler)
        return
    }
    if (direction === "before") {
        console.log("query condition 2")
        db.all('select * from messages where room_id = ? and uuid < ? order by uuid asc limit 20', roomId, uuid, resultHandler)
    } else {
        console.log("query condition 3")
        db.all('select * from messages where room_id = ? and uuid > ? order by uuid asc limit 20', roomId, uuid, resultHandler)
    }


})



router.get("/members", (req: Request, res: Response) => {
    const roomId = req.get("roomid")!
    const username = (req as unknown as CustomRequest).context.username
    const result = new Array()
    global.room_clients.get(roomId)?.forEach( ws_uuid => {
        if (global.all_clients.has(ws_uuid)) {
            const username1 = global.all_clients.get(ws_uuid)!.username 
            result.push({
                username: username === username1 ? "me" : username1
            })
        }
    })
    res.status(200).send(result)
})

export default router