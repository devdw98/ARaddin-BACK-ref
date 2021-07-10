import express, { Request, Response } from 'express';
import { IUser } from '../models/user';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import { IRoom, Place, ISetting } from '../models/room';
import logger from '../utils/logger';

const userScheme = yup.object({
  email: yup.string().email().required(),
  nickname: yup.string(),
});
async function createRoom(req: Request, res: Response) {
  try {
    const { email, nickname } = userScheme.validateSync(req.body);
    const photoPath = email.split('@')[0];
    const master: IUser = { email, nickname, photoPath };
    const room = await RoomDao.insert(master);
    if (!room) {
      logger.error(`POST /room | failed to create room.`);
      return res
        .status(400)
        .json({ success: false, msg: `couldn't create room` });
    }
    logger.info(`POST /room | success! room code : ${room.code}`);
    return res.status(201).json({ code: room.code, room: room.room });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const codeSchema = yup.string().required();
const changeSettingSchema = yup.object({
  nickname: yup.string().required(),
  goal: yup.number().required(),
  timeLimit: yup.number().required(),
  place: yup.mixed<Place>().required(),
});
async function changeSetting(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { nickname, goal, timeLimit, place } =
      changeSettingSchema.validateSync(req.body);
    const room = await RoomDao.find(code);
    if (!room) {
      logger.info(`PUT /room | Failed to find room code : ${code}.`);
      return res
        .status(400)
        .json({ success: false, msg: `Failed to find room code : ${code}.` });
    }
    if (room.master.nickname === nickname) {
      // 방장인 경우만 변경 가능
      const setting: ISetting = { goal, timeLimit, place };
      const update = await RoomDao.update(code, setting);
      logger.info(`PUT /room | success to change room setting! code : ${code}`);
      return res.status(200).json({ room: update });
    } else if (
      room.users.filter((isExisted) => isExisted.nickname === nickname)
    ) {
      logger.info(
        `PUT /room | failed to change room setting! code : ${code} - you are not existed in the room.`
      );
      return res
        .status(400)
        .json({ success: false, msg: `you are not existed in the room.` });
    } else {
      logger.info(
        `PUT /room | failed to change room setting! code : ${code} - you are not master.`
      );
      return res
        .status(400)
        .json({ success: false, msg: `you are not master.` });
    }
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
}

async function enterRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { email, nickname } = userScheme.validateSync(req.body);
    const photoPath = email.split('@')[0];
    const user: IUser = { email, nickname, photoPath };
    const room = await RoomDao.find(code);
    if (!room) {
      //방 없음
      logger.info(`GET /room | You can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room : ${code}` });
    } else {
      room.users = room.users.concat([user]);
      const result = await RoomDao.update(code, null, room.users);
      logger.info(`GET /room | Success to enter room code : ${code}`);
      return res.status(200).json({ room: result });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}

async function leaveRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { email, nickname } = userScheme.validateSync(req.body);
    const user: IUser = { email, nickname };
    const room = await RoomDao.find(code);
    if (!room) {
      logger.info(`DELETE /room | Failed! Can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room ${code}` });
    } else {
      room.users = room.users.filter(
        (exitUser) => exitUser.nickname !== user.nickname
      );
      if (room.master.nickname === user.nickname) {
        //방장이 나감
        room.master = room.users[0];
        if (room.users.length < 1) {
          // 방장 밖에 없음
          return (await RoomDao.deleteRoom(code))
            ? res.status(204).json({})
            : res
                .status(400)
                .json({ success: false, msg: `Couldn't delete room ${code}` });
        }
      }
      const result = await RoomDao.update(code, null, room.users, room.master);
      logger.info(`DELETE /room | success to leave room code : ${code}`);
      return res.status(204).json({});
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}

const router = express.Router();
router.post('/', createRoom);
router.put('/', changeSetting);
router.get('/', enterRoom);
router.delete('/', leaveRoom);

export { router as roomRouter };
