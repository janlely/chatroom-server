import express, { Request, Response } from "express"
import { sha256 } from 'js-sha256'
import {optVerify, generateRandomString} from "./common"
import sqlite3 from "sqlite3"

const router = express.Router()
const db = new sqlite3.Database('chat.db')

router.get("/qrcode", (req: Request, res: Response) => {
  let chanllengeId = generateRandomString(128) 
  global.user_chanllenge_ids.add(chanllengeId)
  res.status(200).send({
    qrcode: `chanllengeId:${chanllengeId}`
  })
})

router.get("/", (req: Request, res: Response) => {
  let chanllengeId = req.query.chanllengeId as string
  if (!global.user_chanllenge_data.has(chanllengeId)) {
    return res.status(404).send("chanllengeId not found")
  }

  let token = generateRandomString(32) 
  let user_data = global.user_chanllenge_data.get(chanllengeId)!
  const cookieData = JSON.stringify({
    username: user_data.username,
    token: token,
    email: user_data.email,
    platform: "desktop"
  })

  global.user_chanllenge_data.delete(chanllengeId)
  global.user_chanllenge_ids.delete(chanllengeId)
  const signed = sha256(cookieData)
  console.log("signed ", signed)
  res.cookie('hackchat', { data: Buffer.from(cookieData).toString("hex"), sign: signed })
  res.send({
    imgApiKey: 'e6f9d7c24cedee8140680e140fa08f38',
    avatar: user_data.avatar,
    roomId: user_data.roomId
  })
})

router.post("/", (req: Request, res: Response) => {

  let username = req.body.username ?? ''
  // let password = req.body.password ?? ''
  let roomId = req.body.roomId ?? '' 
  let optToken = req.body.token ?? ''
  
  
  db.get('select * from users where username = ?', username, (err, user_data: any) => {
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
    global.user_session.set(username, {
      token: token,
      username: username,
      email: user_data.email,
      avatar: user_data.avatar
    })

    const cookieData = JSON.stringify({
      username: username,
      token: token,
      email: user_data.email,
      platform: "phone"
    })

    const signed = sha256(cookieData)
    console.log("signed ", signed)
    res.cookie('hackchat', {data: Buffer.from(cookieData).toString("hex"), sign: signed})
    res.send({
      imgApiKey: 'e6f9d7c24cedee8140680e140fa08f38',
      avatar: user_data.avatar
    })
  })
})

export default router