-- Drop old NGO/food system tables
DROP TABLE IF EXISTS food_listings;
DROP TABLE IF EXISTS users;

-- New DBMS schema
CREATE TABLE IF NOT EXISTS STUDENT (
  student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
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
  food_items TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ATTENDANCE (
  att_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  date_val DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL,
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

-- DBMS features: log table + trigger + view
CREATE TABLE IF NOT EXISTS STUDENT_UPDATE_LOG (
  log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  old_name VARCHAR(120) NOT NULL,
  new_name VARCHAR(120) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_student_name_update;
CREATE TRIGGER trg_student_name_update
AFTER UPDATE ON STUDENT
FOR EACH ROW
INSERT INTO STUDENT_UPDATE_LOG (student_id, old_name, new_name)
VALUES (OLD.student_id, OLD.name, NEW.name);

CREATE OR REPLACE VIEW STUDENT_SUMMARY AS
SELECT
  s.student_id,
  s.name,
  s.dept,
  mp.plan_type,
  COUNT(a.att_id) AS total_attendance_marks,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS total_present
FROM STUDENT s
LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
GROUP BY s.student_id, s.name, s.dept, mp.plan_type;

-- seed base staff rows for demo
INSERT INTO STAFF (name, role)
SELECT 'Mess Manager', 'manager'
WHERE NOT EXISTS (SELECT 1 FROM STAFF WHERE name = 'Mess Manager');

INSERT INTO STAFF (name, role)
SELECT 'Head Cook', 'cook'
WHERE NOT EXISTS (SELECT 1 FROM STAFF WHERE name = 'Head Cook');
