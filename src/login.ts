import express, { Request, Response } from "express"
import {formidable} from "formidable"
import { sha256 } from 'js-sha256'
import * as common from "./common"
import sqlite3 from "sqlite3"

const router = express.Router()
const db = new sqlite3.Database('chat.db')


router.post("/", (req: Request, res: Response, next: any) => {
  const form = formidable({})
  form.parse(req, (err, fields) => {
      if (err) {
        console.error('表单解析错误:', err)
        res.status(500).send('表单提交失败')
        return
      }

      const { usernameField, passwordField, roomIdField} = fields
      let username = usernameField?.[0] ?? ''
      let password = passwordField?.[0] ?? ''
      let roomId = roomIdField?.[0] ?? common.generateRandomString(10) 
      
      
      db.get('select * from users where username = ? and password = ?', [username, password], (err, user_data: any) => {
        if (err) {
          console.error('内部错误:', err)
          res.status(500).send('内部错误')
          return
        }
        if (!user_data) {
          res.status(401).send('用户名或密码错误')
          return
        }

        let token = common.generateRandomString(32) 
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
})

export default router