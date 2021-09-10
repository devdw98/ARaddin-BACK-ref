import express, { Request, Response } from 'express';
import { Master, User } from '../models/user';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import { Place, Setting, Room } from '../models/room';
import logger from '../utils/logger';
import { learningPhotosAIServer } from '../utils/axiosUtils';
import * as Service from '../utils/service';

const tokenScheme = yup.string().required();

// [master] - 방만들기
async function createRoom(req: Request, res: Response) {
  try {
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const code = Service.getRandomCode();
    const master = await RoomDao.setMaster(code, new Master(user, false));
    const setting = RoomDao.setSetting(code, new Setting());
    RoomDao.setUsers(code, [user.get()]);
    const gameUser = RoomDao.setUser(code, user);
    const room = new Room(code, master, [user], setting);
    logger.info(`POST /room/new | success! room code : ${room.code}`);
    return res.status(201).send(room);
  } catch (e) {
    logger.error(e.message);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const codeSchema = yup.string().required();
const changeSettingSchema = yup.object({
  goal: yup.number().required(),
  timeLimit: yup.number().required(),
  place: yup.mixed<Place>().required(),
});
// [master] 설정 변경
async function changeSetting(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { goal, timeLimit, place } = changeSettingSchema.validateSync(
      req.body
    );
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`PUT /room | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const master = await RoomDao.getMaster(code);
    if (master.nickname === user.nickname) {
      // 방장인 경우
      const setting = await RoomDao.setSetting(
        code,
        new Setting(goal, timeLimit, place)
      );
      logger.info(`PUT /room | success to change room setting! code : ${code}`);
      return res.status(200).json({ setting: setting });
    } else {
      logger.info(
        `PUT /room | failed to change room setting! code : ${code} - you are not master.`
      );
      return res
        .status(400)
        .json({ success: false, msg: `you are not master.` });
    }
  } catch (e) {
    logger.error(e.message);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// [player] 방 입장
async function enterRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const users = await RoomDao.findRoomUsers(code);
    if (!users) {
      //방 없음
      logger.info(`POST /room | You can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room : ${code}` });
    } else {
      users.push(user.get());
      const result = RoomDao.setUsers(code, users).then((data) => {
        return Service.getRoom(code, data);
      });
      const gameUser = RoomDao.setUser(code, user);
      logger.info(`POST /room | Success to enter room code : ${code}`);
      return res.status(200).json({ room: await result });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}
// TODO : collection 삭제 구현하기
async function leaveRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    let users = await RoomDao.findRoomUsers(code);
    let master = await RoomDao.getMaster(code);
    if (!users) {
      logger.info(`DELETE /room | Failed! Can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room ${code}` });
    } else {
      users = users.filter((exitUser) => exitUser.nickname !== user.nickname);
      RoomDao.setUsers(code, users);
      RoomDao.deleteUser(code, user);
      if (master.nickname === user.nickname) {
        //방장이 나감
        if (users.length < 1) {
          // 방장 밖에 없음 - 방 삭제
          logger.info(`DELETE /room | success to delete room code : ${code}`);
          // RoomDao.deleteSetting(code);
          return (await RoomDao.deleteRoom(code))
            ? res.status(204).json({})
            : res
                .status(400)
                .json({ success: false, msg: `Couldn't delete room ${code}` });
        }
        master = new Master(new User(users[0].email, users[0].nickname), false);
        RoomDao.setMaster(code, master);
      }
      logger.info(`DELETE /room | success to leave room code : ${code}`);
      return res.status(204).json({});
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}

async function getRoomInfo(req: Request, res: Response) {
  const code = codeSchema.validateSync(req.query.code);
  const room = await Service.getRoom(code);
  return res.status(200).json({ room });
}
const router = express.Router();
router.post('/new', createRoom);
router.put('/', changeSetting);
router.post('/', enterRoom);
router.delete('/', leaveRoom);
router.get('/', getRoomInfo);

export { router as roomRouter };
