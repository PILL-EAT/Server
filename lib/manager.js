var db = require('./db');

module.exports = {
    // 사용자 정보 목록 요청
    userList: (req, res) => {
        console.log("manager userList");

        db.query(`
            SELECT
                user_name AS name,
                user_date AS time,
                user_birth AS birth,
                user_type AS mode
            FROM user;
        `, (err, result) => {
            if (err) {
                console.error(err);
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: "요청에 실패하였습니다.",
                    result: null
                };
                console.log(result);
                return res.json(responseData);
            }

            const users = result.map(user => ({
                name: user.name,
                time: user.time,
                birth: user.birth,
                mode: user.mode,
            }));

            const responseData = {
                isSuccess: true,
                code: 200,
                message: "요청에 성공하였습니다.",
                result: {
                    users: users
                }
            };
            console.log(responseData);
            console.log(JSON.stringify(result, null, 2));
            res.json(responseData);
        });
    }
};
