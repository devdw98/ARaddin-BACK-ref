import express, { Request, Response } from 'express';
import User from '../models/user';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import Room, { Place, Setting } from '../models/room';

const userScheme = yup.object({
  email: yup.string().required(),
  nickname: yup.string(),
});
async function createRoom(req: Request, res: Response) {
  try {
    const { email, nickname } = userScheme.validateSync(req.body);
    const master = new User(email, nickname);
    const room = await RoomDao.insert(new Room(master.get()));
    if (!room) {
      return res
        .status(400)
        .json({ success: false, msg: `couldn't create room` });
    }
    return res.status(201).json({ code: room.code, room: room.room });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const codeSchema = yup.string().required();
const changeSettingSchema = yup.object({
  email: yup.string().required(),
  goal: yup.number().required(),
  timeLimit: yup.number().required(),
  place: yup.mixed<Place>().required(),
});
async function changeSetting(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { email, goal, timeLimit, place } = changeSettingSchema.validateSync(
      req.body
    );
    const room = await RoomDao.find(code);
    if (room.master.email === email) {
      const setting = new Setting(goal, timeLimit, place);
      const update = await RoomDao.update(code, setting);
      return res.status(200).json({ room: update });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: `you are not master.` });
    }
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
}

async function enterRoom(req: Request, res: Response) {
  const code = codeSchema.validateSync(req.query.code);
  const { email, nickname } = userScheme.validateSync(req.body);
  const user = new User(email, nickname);
  const room = await RoomDao.find(code);
  if (!room) {
    return res
      .status(400)
      .json({ success: false, msg: `Can't find room ${code}` });
  } else {
    room.users = room.users.concat([user.get()]);
    const result = await RoomDao.update(code, null, room.users);
    return res.status(200).json({ room: result });
  }
}

async function leaveRoom(req: Request, res: Response) {
  const code = codeSchema.validateSync(req.query.code);
  const { email, nickname } = userScheme.validateSync(req.body);
  const user = new User(email, nickname);
  const room = await RoomDao.find(code);
  if (!room) {
    return res
      .status(400)
      .json({ success: false, msg: `Can't find room ${code}` });
  } else {
    room.users = room.users.filter((exitUser) => exitUser.email !== user.email);
    if (room.master.email === user.email) {
      room.master = room.users[0];
      if (room.users.length <= 1) {
        return (await RoomDao.deleteRoom(code))
          ? res.status(204).json({})
          : res
              .status(400)
              .json({ success: false, msg: `Couldn't delete room ${code}` });
      }
    }
    const result = await RoomDao.update(code, null, room.users, room.master);
    return res.status(204).json({ room: result });
  }
}

const router = express.Router();
router.post('/', createRoom);
router.put('/', changeSetting);
router.get('/', enterRoom);
router.delete('/', leaveRoom);

export { router as roomRouter };
