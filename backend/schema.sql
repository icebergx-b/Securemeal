-- Hostel Mess Management System (Non-Billing)
-- DBMS academic schema

CREATE TABLE IF NOT EXISTS STUDENT (
  student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE,
  password VARCHAR(255),
  dept VARCHAR(80) NOT NULL,
  room_no VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS STAFF (
  staff_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS MESS_PLAN (
  plan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  CONSTRAINT fk_mess_plan_student
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MENU (
  menu_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  day VARCHAR(20) NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  food_items TEXT NOT NULL,
  UNIQUE KEY uq_menu_day_meal (day, meal_type)
);

CREATE TABLE IF NOT EXISTS ATTENDANCE (
  att_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  date_val DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL,
  UNIQUE KEY uq_attendance_student_date_meal (student_id, date_val, meal_type),
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_attendance_status CHECK (status IN ('present', 'absent'))
);

CREATE TABLE IF NOT EXISTS FEEDBACK (
  feed_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  rating INT NOT NULL,
  comments TEXT,
  CONSTRAINT fk_feedback_student
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
);

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
DROP TRIGGER IF EXISTS after_student_insert;
DROP PROCEDURE IF EXISTS get_login_history;
DROP VIEW IF EXISTS student_meal_summary;

DELIMITER $$
CREATE TRIGGER after_login_insert
AFTER INSERT ON Login_Log
FOR EACH ROW
BEGIN
  INSERT INTO TRIGGER_LOG (event_desc)
  VALUES (CONCAT('Login recorded for student ID: ', NEW.student_id));
END$$

CREATE TRIGGER after_student_insert
AFTER INSERT ON STUDENT
FOR EACH ROW
BEGIN
  INSERT INTO TRIGGER_LOG (event_desc)
  VALUES (CONCAT('New student registered: ', NEW.name, ' (ID: ', NEW.student_id, ')'));
END$$

CREATE PROCEDURE get_login_history(IN p_student_id INT)
BEGIN
  SELECT log_id, login_name, login_time, ip_address, status
  FROM Login_Log
  WHERE student_id = p_student_id
  ORDER BY login_time DESC;
END$$
DELIMITER ;

CREATE OR REPLACE VIEW student_meal_summary AS
SELECT s.student_id, s.name, s.dept,
       COUNT(a.att_id) AS meals_attended,
       mp.plan_type
FROM STUDENT s
LEFT JOIN ATTENDANCE a ON s.student_id = a.student_id
LEFT JOIN MESS_PLAN mp ON s.student_id = mp.student_id
GROUP BY s.student_id, s.name, s.dept, mp.plan_type;
