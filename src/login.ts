import express, { Request, Response } from "express"
// import {formidable} from "formidable"
import { sha256 } from 'js-sha256'
import {optVerify, generateRandomString} from "./common"
import sqlite3 from "sqlite3"

const router = express.Router()
const db = new sqlite3.Database('chat.db')


router.post("/", (req: Request, res: Response) => {

  let username = req.body.username ?? ''
  let password = req.body.password ?? ''
  let roomId = req.body.roomId ?? '' 
  let optToken = req.body.token ?? ''
  
  
  db.get('select * from users where username = ? and password = ?', [username, password], (err, user_data: any) => {
    if (err) {
      console.error('内部错误:', err)
      res.status(500).send('内部错误')
      return
    }
    console.log("user_data: ", user_data)
    if (!user_data || !optVerify(optToken, user_data.secret)) {
      res.status(401).send('登录验证失败')
      return
    }

    let token = generateRandomString(32) 
    global.user_session.set(username, {token: token, username: username})

    const cookieData = JSON.stringify({
      username: username,
      token: token,
      email: user_data.email
    })

    const signed = sha256(cookieData)
    console.log("signed ", signed)
    res.cookie('hackchat', {data: Buffer.from(cookieData).toString("hex"), sign: signed})
    res.redirect(`/chat?${roomId}`)
  })
})

export default router