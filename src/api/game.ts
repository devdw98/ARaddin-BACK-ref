import express, { Request, Response } from 'express';
import * as yup from 'yup';

/**
 * 도둑 - [1]보물 수집, [2]금고에 보물 보관,
 * 보안관 - [3]금고 발견(+금고 안 보물 재배치), [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치),
 * 배신자 - [5]금고 위치 보안관에게 알리기
 */

// 게임 시작
function startGame() {}
// [1]도둑 - 보물 수집(가방에)
function findTreasure() {}
// [2]도둑 - 금고에 보물 보관 TODO
function keepTreasureInCabinet() {}
// [3]보안관 - 금고 발견(+금고 안 보물 재배치)
function findCabinet() {}
// [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치)
function catchRobber() {}
// [5]금고 위치 보안관에게 알리기
function notifyCabinetLocation() {}
// 게임 끝
function endGame() {}

const router = express.Router();

router.post('/', startGame); //게임 시작
router.put('/treasure', findTreasure);
router.put('/treasure/:id', keepTreasureInCabinet);
router.put('/cabinet', findCabinet);
router.post('/robber', catchRobber);
router.post('/cabinet', notifyCabinetLocation);
router.get('/', endGame); // 게임 종료 - TODO

export { router as gameRouter };
