USE securemeal;

SELECT '=== CONSTRAINTS ===' AS topic;
SELECT 'Q1: Show CHECK constraints in FEEDBACK and ATTENDANCE' AS question;
SHOW CREATE TABLE FEEDBACK;
SHOW CREATE TABLE ATTENDANCE;

SELECT 'Q2: Invalid rating should fail (constraint check)' AS question;
INSERT INTO FEEDBACK (student_id, rating, comments) VALUES (101, 6, 'Invalid rating');

SELECT 'Q3: Invalid attendance status should fail (constraint check)' AS question;
INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status)
VALUES (101, CURDATE(), 'Lunch', 'late');

SELECT '=== AGGREGATE FUNCTIONS ===' AS topic;
SELECT 'Q1: Count students department-wise' AS question;
SELECT dept, COUNT(*) AS student_count
FROM STUDENT
GROUP BY dept;

SELECT 'Q2: Average feedback rating' AS question;
SELECT ROUND(AVG(rating),2) AS avg_rating
FROM FEEDBACK;

SELECT 'Q3: Max/Min room number' AS question;
SELECT MAX(room_no) AS max_room, MIN(room_no) AS min_room
FROM STUDENT;

SELECT '=== SET QUERIES ===' AS topic;
SELECT 'Q1: Students in MESS_PLAN UNION FEEDBACK' AS question;
SELECT student_id FROM MESS_PLAN
UNION
SELECT student_id FROM FEEDBACK;

SELECT 'Q2: Students in both MESS_PLAN and FEEDBACK' AS question;
SELECT student_id FROM MESS_PLAN
INTERSECT
SELECT student_id FROM FEEDBACK;

SELECT 'Q3: Students in MESS_PLAN but not in FEEDBACK' AS question;
SELECT student_id FROM MESS_PLAN
EXCEPT
SELECT student_id FROM FEEDBACK;

SELECT '=== SUBQUERIES ===' AS topic;
SELECT 'Q1: Students with max rating' AS question;
SELECT s.student_id, s.name, f.rating
FROM STUDENT s
JOIN FEEDBACK f ON s.student_id = f.student_id
WHERE f.rating = (SELECT MAX(rating) FROM FEEDBACK);

SELECT 'Q2: Students whose room_no > average room_no' AS question;
SELECT student_id, name, room_no
FROM STUDENT
WHERE room_no > (SELECT AVG(room_no) FROM STUDENT);

SELECT 'Q3: Students who gave rating above average' AS question;
SELECT s.student_id, s.name, f.rating
FROM STUDENT s
JOIN FEEDBACK f ON s.student_id = f.student_id
WHERE f.rating > (SELECT AVG(rating) FROM FEEDBACK);

SELECT '=== JOINS ===' AS topic;
SELECT 'Q1: STUDENT + MESS_PLAN' AS question;
SELECT s.student_id, s.name, s.dept, mp.plan_type
FROM STUDENT s
JOIN MESS_PLAN mp ON s.student_id = mp.student_id;

SELECT 'Q2: STUDENT + FEEDBACK' AS question;
SELECT s.student_id, s.name, f.rating, f.comments
FROM STUDENT s
JOIN FEEDBACK f ON s.student_id = f.student_id;

SELECT 'Q3: STUDENT + MESS_PLAN + FEEDBACK' AS question;
SELECT s.student_id, s.name, mp.plan_type, f.rating
FROM STUDENT s
JOIN MESS_PLAN mp ON s.student_id = mp.student_id
JOIN FEEDBACK f ON s.student_id = f.student_id;

SELECT '=== VIEWS ===' AS topic;
SELECT 'Q1: Show view definition' AS question;
SHOW CREATE VIEW student_summary;

SELECT 'Q2: Show all rows from view' AS question;
SELECT * FROM student_summary;

SELECT 'Q3: Filtered view rows (Veg students)' AS question;
SELECT * FROM student_summary
WHERE plan_type = 'Veg';

SELECT '=== TRIGGERS ===' AS topic;
SELECT 'Q1: Show all triggers' AS question;
SHOW TRIGGERS;

SELECT 'Q2: Fire UPDATE trigger by changing department' AS question;
UPDATE STUDENT SET dept = 'EEE' WHERE student_id = 102;
SELECT * FROM student_update_log ORDER BY log_id DESC LIMIT 5;

SELECT 'Q3: Fire DELETE trigger' AS question;
INSERT INTO STUDENT (student_id, name, dept, room_no, phone)
VALUES (999, 'Temp Student', 'CSE', 999, '9999999999');
DELETE FROM STUDENT WHERE student_id = 999;
SELECT * FROM student_delete_log ORDER BY log_id DESC LIMIT 5;

SELECT '=== CURSORS ===' AS topic;
SELECT 'Q1: Show stored procedures' AS question;
SHOW PROCEDURE STATUS WHERE Db='securemeal';

SELECT 'Q2: Call cursor procedure to print high-room students' AS question;
CALL get_high_room_students();

SELECT 'Q3: Call cursor procedure to print each student with plan type' AS question;
CALL student_plan_cursor();
