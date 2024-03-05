use db23322;

CREATE TABLE user (
  user_id INT NOT NULL AUTO_INCREMENT,
  user_email VARCHAR(50) NOT NULL UNIQUE,
  user_password VARCHAR(50) NOT NULL,
  user_name VARCHAR(50) NOT NULL,
  user_birth VARCHAR(50) NOT NULL,
  user_number VARCHAR(50) NOT NULL,
  user_date VARCHAR(50) NOT NULL,
  protector_id INT UNIQUE,
  user_type VARCHAR(10) NOT NULL,
  iot_id INT UNIQUE DEFAULT NULL,
  
  PRIMARY KEY (user_id),
  FOREIGN KEY (protector_id) REFERENCES user(user_id) ON DELETE SET NULL,
  FOREIGN KEY (iot_id) REFERENCES iot(iot_id) ON DELETE SET NULL
);
INSERT INTO user (user_email,user_password,user_name,user_birth,user_number,user_date,taker_id,user_type) 
VALUES ('sus32578@naver.com','1234','이상호','1990-01-01','123456789','2023-12-06', NULL, 'taker');

INSERT INTO user (user_email,user_password,user_name,user_birth,user_number,user_date,taker_id,user_type) 
VALUES ('sus325789@naver.com','1234','보호자','1990-01-01','123456789','2023-12-06', 1, 'protector');

INSERT INTO user (user_email,user_password,user_name,user_birth,user_number,user_date,taker_id,user_type) 
VALUES ('pilleat','1234','관리자','0','0','0', null, 'manager');

select * from user;
----------------------------------------------------------------------------------
CREATE TABLE iot (
  iot_id INT NOT NULL AUTO_INCREMENT,
  iot_code VARCHAR(20) NOT NULL UNIQUE,
  PRIMARY KEY (iot_id)
);

INSERT INTO iot(iot_code) VALUES('2XTV6D');
----------------------------------------------------------------------------------

CREATE TABLE pill_alert (
  pill_alert_id INT AUTO_INCREMENT,
  taker_id INT,
  pill_name VARCHAR(50) NOT NULL,
  pill_kind VARCHAR(50) NOT NULL,
  alert_time VARCHAR(50) NOT NULL,
  alert_day VARCHAR(50) NOT NULL,
  iotYN BOOLEAN NOT NULL DEFAULT false, 
  
  PRIMARY KEY (pill_alert_id),
  FOREIGN KEY (taker_id) REFERENCES user(user_id) ON DELETE CASCADE
);


INSERT INTO pill_alert (taker_id, pill_name, pill_kind, alert_time, alert_day) VALUES
(1, '아스피린', '진통제', '08:00', '1010101');


select * from pill_alert


--------------------------------------------------------------------

CREATE TABLE pill_history (
  pill_history_id INT AUTO_INCREMENT,
  date VARCHAR(20) NOT NULL,
  pill_alert_id INT,
  taker_id INT,
  pill_name VARCHAR(50) NOT NULL,
  pill_kind VARCHAR(50) NOT NULL,
  alert_time VARCHAR(50) NOT NULL,
  alert_day VARCHAR(50) NOT NULL,
  iotYN BOOLEAN NOT NULL DEFAULT false, 
  is_taken BOOLEAN NOT NULL,
  
  PRIMARY KEY (pill_history_id),
  FOREIGN KEY (pill_alert_id) REFERENCES pill_alert(pill_alert_id) ON DELETE SET NULL,
  FOREIGN KEY (taker_id) REFERENCES user(user_id) ON DELETE SET NULL
);



INSERT INTO pill_history (date, pill_alert_id, is_taken) 
VALUES 
  ('2023-12-12', 10, 0),
  ('2023-12-12', 11, 1),
  ('2023-12-12', 12, 0);
