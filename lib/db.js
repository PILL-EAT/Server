//db설정
var mysql = require('mysql');

// MySQL 데이터베이스 연결 설정
var db = mysql.createConnection({
    host: 'localhost',        // 데이터베이스 호스트 주소
    user: 'dbid233',             // 데이터베이스 사용자 이름
    password: 'dbpass233',         // 데이터베이스 암호
    database: 'db23322',    // 사용할 데이터베이스 이름
    multipleStatements: true  // 여러 SQL 문을 하나의 문자열로 전달할 수 있도록 허용
});

// 데이터베이스에 연결
db.connect();

module.exports = db;