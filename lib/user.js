var db = require('./db');

module.exports = {  
    // 로그인
    login: (req, res) => {
        var loginData = req.body;
        console.log('userLogin:', loginData);

        // user 테이블에서 로그인 확인
        db.query('SELECT * FROM user WHERE user_email = ? AND user_password = ?',
            [loginData.email, loginData.password], (err, result) => {
                if (err) {
                    // 로그인 실패
                    const responseData = {
                        isSuccess: false,
                        code: 0,
                        message: "요청에 실패하였습니다.",
                        result: {
                            userId: null,
                            type: null,
                            takerId: null
                        }
                    };
                    res.json(responseData);
                } else if (result.length === 0) {
                    // 로그인 실패: 일치하는 항목이 없음
                    const responseData = {
                        isSuccess: false,
                        code: 0,
                        message: "일치하는 사용자가 없습니다. 로그인에 실패하였습니다.",
                        result: {
                            userId: null,
                            type: null,
                            takerId: null
                        }
                    };
                    res.json(responseData);
                } else {
                    if (result[0].user_type === 'taker' || result[0].user_type === 'manager') {
                        // 로그인 성공
                        const responseData = {
                            isSuccess: true,
                            code: 1000,
                            message: "요청에 성공하였습니다.",
                            result: {
                                userId: result[0].user_id,
                                type: result[0].user_type,  // user_type에 따라 "taker" or "protector" or "manager"
                                takerId: null
                            }
                        };
                        res.json(responseData);
                    } else if (result[0].user_type === 'protector') {
                        // 로그인 성공 (프로텍터)
                        db.query('SELECT * from user where protector_id = ?',[result[0].user_id], (err,result2)=>{
                            if(result2.length === 0){
                                const responseData = {
                                    isSuccess: true,
                                    code: 1000,
                                    message: "요청에 성공하였습니다.",
                                    result: {
                                        userId: result[0].user_id,
                                        type: result[0].user_type,
                                        takerId: null
                                    }
                                };
    
                                console.log(result[0].user_id)
                                res.json(responseData);
                            }
                            else{
                                const responseData = {
                                    isSuccess: true,
                                    code: 1000,
                                    message: "요청에 성공하였습니다.",
                                    result: {
                                        userId: result[0].user_id,
                                        type: result[0].user_type,
                                        takerId: result2[0].user_id
                                    }
                                };
    
                                console.log(`보호자 로그인 id = ${result[0].user_id}`)
                                res.json(responseData);
                            }
                            
                        })
                    }
                }
            });
    },

    logout: (req,res) => {
        var userId = req.params.userId;
        clients.delete(userId);

        const responseData = {
            isSuccess: true,
            code: 1000,
            message: "요청에 성공하였습니다.",
        }

        res.json(responseData);
    },

    // 회원가입 기능
    join: (req, res) => {
        var joinData = req.body;
    
        // 이메일 중복 확인 - user 테이블
        db.query('SELECT * FROM user WHERE user_email = ?', [joinData.email], (errUser, resultUser) => {
            if (errUser) {
                throw errUser;
            }
    
            if (resultUser.length > 0) {
                // 이미 존재하는 이메일이라면 클라이언트에게 에러 메시지 전송
                const responseData = {
                    isSuccess: false,
                    code: 2017,
                    message: "중복된 이메일입니다.",
                };
                res.json(responseData);
            } else {
                // 회원 가입
                db.query(`INSERT INTO user (user_email, user_password, user_name, user_birth, user_number, user_date, user_type)
                     VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
                    [joinData.email, joinData.password, joinData.name, joinData.birth, joinData.phone, 
                        (joinData.mode === 'taker' ? 'taker' : 'protector')], (err, result) => {
                        if (err) {
                            throw err;
                        }
                        const responseData = {
                            isSuccess: true,
                            code: 1000,
                            message: "요청에 성공하였습니다.",
                        }
                        res.json(responseData);
                    });
            }
        });
    },
    

    // 회원 탈퇴
    delete: (req, res) => {
        const userId = req.params.userId;
        
        console.log("userDelete " + userId)
    
        // user 테이블에서 삭제
        db.query(`DELETE FROM user WHERE user_id = ?`, [userId], (err, result) => {
            if (err) {
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: `요청에 실패하였습니다.`,
                };
                res.json(responseData);
            }else{
                const responseData = {
                    isSuccess: true,
                    code: 200,
                    message: `요청에 성공하였습니다.`,
                };
                res.json(responseData);
            }
        });
    },

    // 내 정보 보기
    userInfo: (req, res) => {
        const userId = req.params.userId;
        console.log(`userInfo ${userId}`)
        db.query(`
        SELECT u.*, p.user_number as protector_number
        FROM user u
        LEFT JOIN user p ON u.protector_id = p.user_id
        WHERE u.user_id = ?;
      `, [userId], (err, result) => {
            if (err) {
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: "요청에 실패하였습니다.",
                    result: null
                };
                res.json(responseData);
            } else {
                if (result.length === 0) {
                    // 쿼리 결과가 없는 경우에 대한 처리
                    const responseData = {
                        isSuccess: false,
                        code: 204,
                        message: "해당 유저 정보가 없습니다.",
                        result: null
                    };
                    res.json(responseData);
                } else {
                    const responseData = {
                        isSuccess: true,
                        code: 200,
                        message: "요청에 성공하였습니다.",
                        result: {
                            email: result[0].user_email,
                            password: result[0].user_password,
                            name: result[0].user_name,
                            birth: result[0].user_birth,
                            phone: result[0].user_number,
                            join_date: result[0].user_date,
                            mode: result[0].user_type,
                            protector_phone: result[0].protector_number
                        }
                    };
                    res.json(responseData);
                }
            }
        });
    },
    
    // 내 정보 수정
    userUpdate: (req, res) => {
        const userId = req.params.userId;
        var updateData = req.body;
    
        console.log("userUpdate " + userId)
        db.query(
            'UPDATE user SET user_name = ?, user_birth = ?, user_number = ? WHERE user_Id = ?',
            [updateData.name, updateData.birth, updateData.phone, userId],(err, result) => {
                if (err) {
                    const responseData = {
                        isSuccess: false,
                        code: 600,
                        message: "요청에 실패하였습니다.",
                    };
                    res.json(responseData);
                } else {
                    const responseData = {
                        isSuccess: true,
                        code: 200,
                        message: "요청에 성공하였습니다.",
                    };
                    res.json(responseData);
                }
            }
        );
    },
}
