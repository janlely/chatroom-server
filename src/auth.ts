import express, { Request, Response } from "express"

const router = express.Router()

router.get("/", (req: Request, res: Response) => {
  let chanllengeId = req.query.chanllengeId as string
  let roomId = req.query.roomId as string
  const username = (req as unknown as CustomRequest).context.username
  const platform = (req as unknown as CustomRequest).context.platform

  if (!global.user_chanllenge_ids.has(chanllengeId) || platform !== "phone") {
    res.status(401).send('登录授权失败')
    return
  }

  const userSession = global.user_session.get(username)
  global.user_chanllenge_data.set(chanllengeId, {
    username: userSession!.username,
    email: userSession!.email,
    avatar: userSession!.avatar,
    roomId: roomId
  })
  res.status(200).send('ok')
})
