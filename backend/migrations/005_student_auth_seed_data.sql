SET @student_email_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'STUDENT' AND column_name = 'email'
);
SET @student_email_sql := IF(
  @student_email_exists = 0,
  'ALTER TABLE STUDENT ADD COLUMN email VARCHAR(160) UNIQUE NULL AFTER name',
  'SELECT 1'
);
PREPARE student_email_stmt FROM @student_email_sql;
EXECUTE student_email_stmt;
DEALLOCATE PREPARE student_email_stmt;

SET @student_password_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'STUDENT' AND column_name = 'password'
);
SET @student_password_sql := IF(
  @student_password_exists = 0,
  'ALTER TABLE STUDENT ADD COLUMN password VARCHAR(255) NULL AFTER email',
  'SELECT 1'
);
PREPARE student_password_stmt FROM @student_password_sql;
EXECUTE student_password_stmt;
DEALLOCATE PREPARE student_password_stmt;

DELETE m1 FROM MENU m1
JOIN MENU m2
  ON m1.day = m2.day
 AND m1.meal_type = m2.meal_type
 AND m1.menu_id > m2.menu_id;

DELETE a1 FROM ATTENDANCE a1
JOIN ATTENDANCE a2
  ON a1.student_id = a2.student_id
 AND a1.date_val = a2.date_val
 AND a1.meal_type = a2.meal_type
 AND a1.att_id > a2.att_id;

SET @menu_unique_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'MENU' AND index_name = 'uq_menu_day_meal'
);
SET @menu_unique_sql := IF(
  @menu_unique_exists = 0,
  'ALTER TABLE MENU ADD UNIQUE KEY uq_menu_day_meal (day, meal_type)',
  'SELECT 1'
);
PREPARE menu_unique_stmt FROM @menu_unique_sql;
EXECUTE menu_unique_stmt;
DEALLOCATE PREPARE menu_unique_stmt;

SET @attendance_unique_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'ATTENDANCE' AND index_name = 'uq_attendance_student_date_meal'
);
SET @attendance_unique_sql := IF(
  @attendance_unique_exists = 0,
  'ALTER TABLE ATTENDANCE ADD UNIQUE KEY uq_attendance_student_date_meal (student_id, date_val, meal_type)',
  'SELECT 1'
);
PREPARE attendance_unique_stmt FROM @attendance_unique_sql;
EXECUTE attendance_unique_stmt;
DEALLOCATE PREPARE attendance_unique_stmt;

UPDATE STUDENT
SET
  email = CASE
    WHEN student_id = 1 THEN 'priyanshu.panda@securemeal.local'
    WHEN student_id = 2 THEN 'muruganaswamy.pillai@securemeal.local'
    ELSE email
  END,
  password = CASE
    WHEN student_id = 1 THEN '$2b$10$/MVpDlOFs7R2ebwddIUiE.XwTu4w66rbLoz24qoILfE/umh.AAxva'
    WHEN student_id = 2 THEN '$2b$10$U7fwJbYQIUie0Ba.bKMwH.i4L2JQ6vL/9bZs.0st7tEA./p3GFQZa'
    ELSE password
  END
WHERE student_id IN (1, 2);

INSERT INTO STUDENT (name, email, password, dept, room_no, phone)
SELECT * FROM (
  SELECT 'Aarav Sharma', 'aarav.sharma@securemeal.local', '$2b$10$JeG/Ts1Jyl5rkLgHqm1tUOit5g12yPdFHuibBFvZUautaRliErT32', 'CSE', 'A-101', '9876543210' UNION ALL
  SELECT 'Diya Patel', 'diya.patel@securemeal.local', '$2b$10$elQ9DtSA3h5YSoWvYOALeuXsGwBUzzo9qVXX4CygbHQAPpjgqzfNC', 'ECE', 'B-204', '9876501234' UNION ALL
  SELECT 'Rohan Verma', 'rohan.verma@securemeal.local', '$2b$10$7fJMYDqDc7/PYNLofLkCRODUvY2S1rv8Q5ISZZ9YgllcGpPgy6eKW', 'Mechanical', 'C-312', '9812345678' UNION ALL
  SELECT 'Meera Iyer', 'meera.iyer@securemeal.local', '$2b$10$d9kv7rjLXEoAk/ozlYMxPOeczA2317rQRwCv9DdOAPljIE5wa76RO', 'Biotech', 'A-208', '9822011133' UNION ALL
  SELECT 'Kabir Singh', 'kabir.singh@securemeal.local', '$2b$10$glATKtmUpnDX8xenwQArJ.lEgkVlFihCr0YCJiOxPoz13.QRX392e', 'IT', 'B-118', '9811189898' UNION ALL
  SELECT 'Ananya Rao', 'ananya.rao@securemeal.local', '$2b$10$SofJCY9pDffIMHcv8pHc8eCSodN/V07q1UKlcSWHmLvulvDtKpUpK', 'EEE', 'D-402', '9833391122' UNION ALL
  SELECT 'Vikram Nair', 'vikram.nair@securemeal.local', '$2b$10$nCmgAfyYAQ951LkvNE5/WOZWnaRFGmirle7kzfpnbjx0k9Jb63fJe', 'Civil', 'B-302', '9845017788' UNION ALL
  SELECT 'Ishita Kapoor', 'ishita.kapoor@securemeal.local', '$2b$10$u4/XjkcyQdG9o0vAvOVp9.cz71.O2d9hJgrZ5PC.XOJZzG4.3VVVe', 'Architecture', 'E-205', '9877123456' UNION ALL
  SELECT 'Manav Joshi', 'manav.joshi@securemeal.local', '$2b$10$npJQ2HnHGOxSC4wszkzoUuGzZGBAj2hdGqO7sqbQLdWgzfQlJHTsG', 'Chemical', 'C-111', '9886655443' UNION ALL
  SELECT 'Sneha Kulkarni', 'sneha.kulkarni@securemeal.local', '$2b$10$QCcmyJy3H8DZ8leCoHaFX.mn3oj03ZkKU3c3bx1YJNtSMlYnnMniC', 'CSE', 'A-309', '9900011223' UNION ALL
  SELECT 'Arjun Malhotra', 'arjun.malhotra@securemeal.local', '$2b$10$5cYG0b.r3xALH/7NzTeRO.qTMq9CD8w2oW5b0bOS1KMrTKHig9gdq', 'MBA', 'F-101', '9911345670' UNION ALL
  SELECT 'Pooja Desai', 'pooja.desai@securemeal.local', '$2b$10$fEw3BQ9KiTc0x2n1R4Py3uQtOhV.X2MZ.gXTFIZBKe25iWkvIDz7W', 'ECE', 'B-412', '9922446688' UNION ALL
  SELECT 'Nikhil Menon', 'nikhil.menon@securemeal.local', '$2b$10$0.Gfk.rH61k8O/Xv.7y4v.B/BxHgMgupdS.m.G52bMcVJ7kXC7vo2', 'Physics', 'D-102', '9933557799' UNION ALL
  SELECT 'Sanya Gupta', 'sanya.gupta@securemeal.local', '$2b$10$5QfEaMM1rARAb30m20eO7uJaiP.TRxzpO3dLmMjhNayw9Cv1LmY2a', 'Mathematics', 'C-410', '9944668811' UNION ALL
  SELECT 'Rahul Chhetri', 'rahul.chhetri@securemeal.local', '$2b$10$Azm7BrSdUvjInEa.d9n.jOKuq07RypcmfF3whLDF6D3bUyquab4Hi', 'CSE', 'A-413', '9955779922' UNION ALL
  SELECT 'Tara Fernandes', 'tara.fernandes@securemeal.local', '$2b$10$UalPSYEgUfT1dfJ3TZP.xurtDaCR8JcarqK0cUCJs7AV3/qIvQKjS', 'Psychology', 'E-118', '9966881133' UNION ALL
  SELECT 'Kunal Bhat', 'kunal.bhat@securemeal.local', '$2b$10$YhRdP4ivCY0h2aYLFChKUuT6SXW1EMmcEu1Swe/Azv3biSKCfZVji', 'IT', 'B-509', '9977992244' UNION ALL
  SELECT 'Neha Saxena', 'neha.saxena@securemeal.local', '$2b$10$XPoxXTtZ1ZheA4FGsaEHn.TiRMusMiWkRehXWiApmzivxohDy3Geu', 'Law', 'G-203', '9988113355'
) AS seeded(name, email, password, dept, room_no, phone)
WHERE NOT EXISTS (
  SELECT 1 FROM STUDENT existing WHERE existing.email = seeded.email
);

INSERT INTO MESS_PLAN (student_id, plan_type)
SELECT s.student_id,
  CASE
    WHEN s.name IN ('Aarav Sharma', 'Sneha Kulkarni', 'Rahul Chhetri') THEN 'regular'
    WHEN s.name IN ('Diya Patel', 'Pooja Desai', 'Tara Fernandes', 'Muruganaswamy Durgaswamy Pillai') THEN 'veg'
    WHEN s.name IN ('Kabir Singh', 'Vikram Nair', 'Kunal Bhat') THEN 'special'
    ELSE 'regular'
  END
FROM STUDENT s
LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
WHERE mp.student_id IS NULL;

INSERT INTO MENU (day, meal_type, food_items) VALUES
('Monday', 'breakfast', 'Masala dosa, coconut chutney, filter coffee'),
('Monday', 'lunch', 'Steamed rice, dal tadka, aloo jeera, curd'),
('Monday', 'dinner', 'Chapati, paneer butter masala, veg pulao, gulab jamun'),
('Tuesday', 'breakfast', 'Poha, sprouts salad, ginger tea'),
('Tuesday', 'lunch', 'Jeera rice, rajma masala, beetroot poriyal, papad'),
('Tuesday', 'dinner', 'Paratha, chana masala, cucumber raita, fruit custard'),
('Wednesday', 'breakfast', 'Idli, sambar, tomato chutney'),
('Wednesday', 'lunch', 'Lemon rice, veg kurma, dal fry, salad'),
('Wednesday', 'dinner', 'Chapati, kadai veg, peas pulao, kesari'),
('Thursday', 'breakfast', 'Upma, banana, cardamom tea'),
('Thursday', 'lunch', 'Rice, sambar, cabbage stir fry, curd'),
('Thursday', 'dinner', 'Phulka, dal makhani, mixed veg, semiya payasam'),
('Friday', 'breakfast', 'Aloo paratha, curd, pickle'),
('Friday', 'lunch', 'Veg biryani, onion raita, mirchi salan'),
('Friday', 'dinner', 'Chapati, palak paneer, steamed rice, halwa'),
('Saturday', 'breakfast', 'Pav bhaji, buttermilk'),
('Saturday', 'lunch', 'Tomato rice, chole, salad, curd rice'),
('Saturday', 'dinner', 'Noodles, gobi manchurian, veg soup'),
('Sunday', 'breakfast', 'Poori, potato masala, chai'),
('Sunday', 'lunch', 'Special veg thali, sweet lassi, pickle'),
('Sunday', 'dinner', 'Roti, dal khichdi, roasted papad, ice cream')
ON DUPLICATE KEY UPDATE food_items = VALUES(food_items);

INSERT INTO FEEDBACK (student_id, rating, comments)
SELECT s.student_id, seeded.rating, seeded.comments
FROM (
  SELECT 'Aarav Sharma' AS student_name, 5 AS rating, 'Breakfast is crisp and fresh every day.' AS comments UNION ALL
  SELECT 'Diya Patel', 4, 'Would love one more fruit option with lunch.' UNION ALL
  SELECT 'Rohan Verma', 5, 'Dinner portions are generous and tasty.' UNION ALL
  SELECT 'Meera Iyer', 4, 'South Indian breakfast days are the best.' UNION ALL
  SELECT 'Kabir Singh', 5, 'Special menu on Sunday feels premium.' UNION ALL
  SELECT 'Ananya Rao', 4, 'Could use more soup choices at dinner.' UNION ALL
  SELECT 'Vikram Nair', 5, 'Rice and curry combinations are excellent.' UNION ALL
  SELECT 'Ishita Kapoor', 4, 'Clean dining area and quick service.' UNION ALL
  SELECT 'Manav Joshi', 5, 'Love the balance between healthy and tasty food.' UNION ALL
  SELECT 'Sneha Kulkarni', 5, 'The dessert rotation keeps the menu exciting.' UNION ALL
  SELECT 'Arjun Malhotra', 4, 'Weekend lunch feels like a mini celebration.' UNION ALL
  SELECT 'Pooja Desai', 4, 'Please keep the biryani every Friday.' UNION ALL
  SELECT 'Nikhil Menon', 5, 'Very consistent quality this month.' UNION ALL
  SELECT 'Sanya Gupta', 4, 'The tea station is always well managed.' UNION ALL
  SELECT 'Rahul Chhetri', 5, 'Good protein variety for hostel students.' UNION ALL
  SELECT 'Tara Fernandes', 4, 'Would appreciate more millet options sometimes.' UNION ALL
  SELECT 'Kunal Bhat', 5, 'Late dinner service is still hot and fresh.' UNION ALL
  SELECT 'Neha Saxena', 4, 'The veg menu is thoughtfully planned.'
) AS seeded
JOIN STUDENT s ON s.name = seeded.student_name
LEFT JOIN FEEDBACK f ON f.student_id = s.student_id AND f.comments = seeded.comments
WHERE f.feed_id IS NULL;

INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status)
SELECT s.student_id, seeded.date_val, seeded.meal_type, seeded.status
FROM (
  SELECT 'Aarav Sharma' AS student_name, DATE_SUB(CURDATE(), INTERVAL 6 DAY) AS date_val, 'breakfast' AS meal_type, 'present' AS status UNION ALL
  SELECT 'Aarav Sharma', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'lunch', 'present' UNION ALL
  SELECT 'Aarav Sharma', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Diya Patel', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'breakfast', 'present' UNION ALL
  SELECT 'Diya Patel', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'lunch', 'absent' UNION ALL
  SELECT 'Diya Patel', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Rohan Verma', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'lunch', 'present' UNION ALL
  SELECT 'Rohan Verma', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Meera Iyer', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'breakfast', 'present' UNION ALL
  SELECT 'Meera Iyer', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'lunch', 'present' UNION ALL
  SELECT 'Kabir Singh', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'breakfast', 'absent' UNION ALL
  SELECT 'Kabir Singh', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Ananya Rao', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Ananya Rao', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'breakfast', 'present' UNION ALL
  SELECT 'Vikram Nair', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'lunch', 'present' UNION ALL
  SELECT 'Ishita Kapoor', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'breakfast', 'present' UNION ALL
  SELECT 'Manav Joshi', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Sneha Kulkarni', CURDATE(), 'breakfast', 'present' UNION ALL
  SELECT 'Arjun Malhotra', CURDATE(), 'lunch', 'present' UNION ALL
  SELECT 'Pooja Desai', CURDATE(), 'dinner', 'present' UNION ALL
  SELECT 'Nikhil Menon', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'lunch', 'present' UNION ALL
  SELECT 'Sanya Gupta', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'breakfast', 'present' UNION ALL
  SELECT 'Rahul Chhetri', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Tara Fernandes', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'lunch', 'absent' UNION ALL
  SELECT 'Kunal Bhat', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'dinner', 'present' UNION ALL
  SELECT 'Neha Saxena', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'lunch', 'present'
) AS seeded
JOIN STUDENT s ON s.name = seeded.student_name
ON DUPLICATE KEY UPDATE status = VALUES(status);
