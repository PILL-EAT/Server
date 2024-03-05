const express = require('express');
var router = express.Router()

var user = require('../lib/user');

// 서버 작동 확인용
router.get('/your/api/endpoint', (req, res) => {
    user.test(req, res);
});

// 로그인
router.post('/login', (req, res) => {
    user.login(req, res);
});

// 로그아웃
router.get('/logout/:userId', (req, res) => {
    user.logout(req, res);
});

// 회원가입
router.post('/join', (req, res) => {
    user.join(req, res);
});

// 회원탈퇴
router.delete('/user-delete/:userId', (req, res) => {
    user.delete(req, res);
});

// 내 정보 보기
router.get('/user-info/:userId', (req, res) => {
    user.userInfo(req, res);
});

// 내 정보 수정
router.put('/user-update/:userId', (req, res) => {
    user.userUpdate(req, res);
});

module.exports = router;