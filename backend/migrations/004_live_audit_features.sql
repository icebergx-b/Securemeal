CREATE TABLE IF NOT EXISTS Login_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  login_name VARCHAR(100),
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  status ENUM('success', 'failed') DEFAULT 'success'
);

CREATE TABLE IF NOT EXISTS TRIGGER_LOG (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_desc VARCHAR(255),
  fired_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS after_login_insert;
CREATE TRIGGER after_login_insert
AFTER INSERT ON Login_Log
FOR EACH ROW
INSERT INTO TRIGGER_LOG (event_desc)
VALUES (CONCAT('Login recorded for student ID: ', NEW.student_id));

DROP TRIGGER IF EXISTS after_student_insert;
CREATE TRIGGER after_student_insert
AFTER INSERT ON STUDENT
FOR EACH ROW
INSERT INTO TRIGGER_LOG (event_desc)
VALUES (CONCAT('New student registered: ', NEW.name, ' (ID: ', NEW.student_id, ')'));

DROP VIEW IF EXISTS student_meal_summary;
CREATE VIEW student_meal_summary AS
SELECT
  s.student_id,
  s.name,
  s.dept,
  COUNT(a.att_id) AS meals_attended,
  mp.plan_type
FROM STUDENT s
LEFT JOIN ATTENDANCE a ON s.student_id = a.student_id
LEFT JOIN MESS_PLAN mp ON s.student_id = mp.student_id
GROUP BY s.student_id, s.name, s.dept, mp.plan_type;

DROP PROCEDURE IF EXISTS get_login_history;
CREATE PROCEDURE get_login_history(IN p_student_id INT)
SELECT log_id, login_name, login_time, ip_address, status
FROM Login_Log
WHERE student_id = p_student_id
ORDER BY login_time DESC;
