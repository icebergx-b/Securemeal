CREATE DATABASE IF NOT EXISTS securemeal_enterprise;
USE securemeal_enterprise;

CREATE TABLE ROLE (
  role_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(60) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PERMISSION (
  permission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  permission_code VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(200) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE ROLE_PERMISSION (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES ROLE(role_id),
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES PERMISSION(permission_id)
);

CREATE TABLE HOSTEL (
  hostel_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_name VARCHAR(120) NOT NULL,
  campus_name VARCHAR(120) NOT NULL,
  gender_policy VARCHAR(30) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE BLOCK (
  block_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  block_name VARCHAR(80) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_block_hostel FOREIGN KEY (hostel_id) REFERENCES HOSTEL(hostel_id),
  UNIQUE KEY uk_block_hostel_name (hostel_id, block_name)
);

CREATE TABLE FLOOR (
  floor_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  block_id INT UNSIGNED NOT NULL,
  floor_no INT NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_floor_block FOREIGN KEY (block_id) REFERENCES BLOCK(block_id),
  UNIQUE KEY uk_floor_block_no (block_id, floor_no)
);

CREATE TABLE ROOM (
  room_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  floor_id INT UNSIGNED NOT NULL,
  room_no VARCHAR(20) NOT NULL,
  room_type VARCHAR(30) NOT NULL,
  capacity INT NOT NULL,
  occupancy_status VARCHAR(20) NOT NULL DEFAULT 'available',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_room_floor FOREIGN KEY (floor_id) REFERENCES FLOOR(floor_id),
  UNIQUE KEY uk_room_floor_number (floor_id, room_no)
);

CREATE TABLE BED (
  bed_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  bed_code VARCHAR(20) NOT NULL,
  occupancy_status VARCHAR(20) NOT NULL DEFAULT 'vacant',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_bed_room FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
  UNIQUE KEY uk_bed_room_code (room_id, bed_code)
);

CREATE TABLE ADMIN (
  admin_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_role FOREIGN KEY (role_id) REFERENCES ROLE(role_id)
);

CREATE TABLE STAFF (
  staff_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  role_title VARCHAR(60) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  role_id INT UNSIGNED NOT NULL,
  assigned_hostel_id INT UNSIGNED,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES ROLE(role_id),
  CONSTRAINT fk_staff_hostel FOREIGN KEY (assigned_hostel_id) REFERENCES HOSTEL(hostel_id)
);

CREATE TABLE STUDENT (
  student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_no VARCHAR(40) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  dept VARCHAR(80) NOT NULL,
  year_of_study INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  guardian_phone VARCHAR(20),
  current_bed_id INT UNSIGNED,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_bed FOREIGN KEY (current_bed_id) REFERENCES BED(bed_id)
);

CREATE TABLE MESS_PLAN (
  plan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(80) NOT NULL UNIQUE,
  meal_quota INT NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  plan_category VARCHAR(30) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE SUBSCRIPTION (
  subscription_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  plan_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  created_by_admin_id INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES MESS_PLAN(plan_id),
  CONSTRAINT fk_subscription_admin FOREIGN KEY (created_by_admin_id) REFERENCES ADMIN(admin_id),
  INDEX idx_subscription_student_dates (student_id, start_date, end_date)
);

CREATE TABLE INVOICE (
  invoice_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT UNSIGNED NOT NULL,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  billing_month TINYINT NOT NULL,
  billing_year SMALLINT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_subscription FOREIGN KEY (subscription_id) REFERENCES SUBSCRIPTION(subscription_id),
  INDEX idx_invoice_billing_period (billing_year, billing_month)
);

CREATE TABLE PAYMENT (
  payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(80),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES INVOICE(invoice_id),
  CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  INDEX idx_payment_student_status (student_id, payment_status)
);

CREATE TABLE TRANSACTION_LOG (
  transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_name VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action_type VARCHAR(30) NOT NULL,
  actor_type VARCHAR(30) NOT NULL,
  actor_id BIGINT UNSIGNED,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transaction_entity (entity_name, entity_id),
  INDEX idx_transaction_created_at (created_at)
);

CREATE TABLE MEAL_SLOT (
  slot_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slot_name VARCHAR(30) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_order INT NOT NULL
);

CREATE TABLE MENU (
  menu_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  menu_date DATE NOT NULL,
  slot_id INT UNSIGNED NOT NULL,
  meal_label VARCHAR(120) NOT NULL,
  calories INT,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_slot FOREIGN KEY (slot_id) REFERENCES MEAL_SLOT(slot_id),
  UNIQUE KEY uk_menu_date_slot (menu_date, slot_id)
);

CREATE TABLE ATTENDANCE (
  attendance_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  slot_id INT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  scanned_at TIMESTAMP NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  CONSTRAINT fk_attendance_slot FOREIGN KEY (slot_id) REFERENCES MEAL_SLOT(slot_id),
  UNIQUE KEY uk_attendance_student_slot_date (student_id, slot_id, attendance_date),
  INDEX idx_attendance_date_status (attendance_date, status)
);

CREATE TABLE MEAL_LOG (
  meal_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attendance_id BIGINT UNSIGNED NOT NULL,
  menu_id INT UNSIGNED NOT NULL,
  consumption_status VARCHAR(20) NOT NULL DEFAULT 'consumed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_meal_log_attendance FOREIGN KEY (attendance_id) REFERENCES ATTENDANCE(attendance_id),
  CONSTRAINT fk_meal_log_menu FOREIGN KEY (menu_id) REFERENCES MENU(menu_id)
);

CREATE TABLE ITEM_CATEGORY (
  category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(80) NOT NULL UNIQUE,
  reorder_threshold INT NOT NULL DEFAULT 20
);

CREATE TABLE SUPPLIER (
  supplier_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(120),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  supplier_status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE INVENTORY (
  item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED,
  item_name VARCHAR(120) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 10,
  average_daily_usage DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_inventory_category FOREIGN KEY (category_id) REFERENCES ITEM_CATEGORY(category_id),
  CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES SUPPLIER(supplier_id),
  INDEX idx_inventory_category_stock (category_id, current_stock)
);

CREATE TABLE PURCHASE (
  purchase_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  purchased_by_staff_id INT UNSIGNED,
  purchase_date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  invoice_ref VARCHAR(80),
  CONSTRAINT fk_purchase_item FOREIGN KEY (item_id) REFERENCES INVENTORY(item_id),
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES SUPPLIER(supplier_id),
  CONSTRAINT fk_purchase_staff FOREIGN KEY (purchased_by_staff_id) REFERENCES STAFF(staff_id),
  INDEX idx_purchase_date_item (purchase_date, item_id)
);

CREATE TABLE STOCK_LOG (
  stock_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  movement_type VARCHAR(30) NOT NULL,
  quantity_delta DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  source_ref VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_log_item FOREIGN KEY (item_id) REFERENCES INVENTORY(item_id),
  INDEX idx_stock_log_item_time (item_id, created_at)
);

CREATE TABLE FEEDBACK (
  feedback_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  attendance_id BIGINT UNSIGNED,
  rating INT NOT NULL,
  feedback_text TEXT,
  sentiment_label VARCHAR(20) DEFAULT 'neutral',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  CONSTRAINT fk_feedback_attendance FOREIGN KEY (attendance_id) REFERENCES ATTENDANCE(attendance_id)
);

CREATE TABLE ANNOUNCEMENT (
  announcement_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  audience_type VARCHAR(30) NOT NULL,
  created_by_admin_id INT UNSIGNED NOT NULL,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_announcement_admin FOREIGN KEY (created_by_admin_id) REFERENCES ADMIN(admin_id)
);

CREATE TABLE NOTIFICATION (
  notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED,
  staff_id INT UNSIGNED,
  announcement_id BIGINT UNSIGNED,
  message VARCHAR(255) NOT NULL,
  notification_type VARCHAR(30) NOT NULL,
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  CONSTRAINT fk_notification_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  CONSTRAINT fk_notification_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
  CONSTRAINT fk_notification_announcement FOREIGN KEY (announcement_id) REFERENCES ANNOUNCEMENT(announcement_id)
);

INSERT INTO ROLE (role_name) VALUES
('super_admin'),
('hostel_admin'),
('mess_manager'),
('student'),
('accountant'),
('store_keeper');

INSERT INTO PERMISSION (permission_code, description) VALUES
('student.read', 'View student profile and history'),
('payment.manage', 'Manage invoices and payments'),
('inventory.manage', 'Manage stock and purchases'),
('mess.analytics', 'Access mess analytics'),
('announcement.publish', 'Publish platform announcements');

INSERT INTO ROLE_PERMISSION (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 4), (2, 5),
(3, 1), (3, 3), (3, 4),
(5, 2),
(6, 3);

DELIMITER $$

CREATE PROCEDURE get_student_360_view(IN p_student_id INT)
BEGIN
  SELECT
    s.student_id,
    s.registration_no,
    s.full_name,
    s.dept,
    s.status,
    b.bed_code,
    r.room_no,
    f.floor_no,
    bl.block_name,
    h.hostel_name,
    mp.plan_name,
    sub.status AS subscription_status,
    COUNT(DISTINCT a.attendance_id) AS attendance_marks,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS total_present,
    ROUND(AVG(fd.rating), 2) AS average_rating
  FROM STUDENT s
  LEFT JOIN BED b ON b.bed_id = s.current_bed_id
  LEFT JOIN ROOM r ON r.room_id = b.room_id
  LEFT JOIN FLOOR f ON f.floor_id = r.floor_id
  LEFT JOIN BLOCK bl ON bl.block_id = f.block_id
  LEFT JOIN HOSTEL h ON h.hostel_id = bl.hostel_id
  LEFT JOIN SUBSCRIPTION sub ON sub.student_id = s.student_id AND sub.status = 'active'
  LEFT JOIN MESS_PLAN mp ON mp.plan_id = sub.plan_id
  LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
  LEFT JOIN FEEDBACK fd ON fd.student_id = s.student_id
  WHERE s.student_id = p_student_id
  GROUP BY
    s.student_id, s.registration_no, s.full_name, s.dept, s.status,
    b.bed_code, r.room_no, f.floor_no, bl.block_name, h.hostel_name,
    mp.plan_name, sub.status;
END $$

CREATE PROCEDURE mess_consumption_analytics(IN p_month INT, IN p_year INT)
BEGIN
  SELECT
    ms.slot_name,
    COUNT(a.attendance_id) AS attendance_events,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_events,
    ROUND(AVG(fd.rating), 2) AS avg_rating
  FROM MEAL_SLOT ms
  LEFT JOIN ATTENDANCE a
    ON a.slot_id = ms.slot_id
   AND MONTH(a.attendance_date) = p_month
   AND YEAR(a.attendance_date) = p_year
  LEFT JOIN FEEDBACK fd ON fd.attendance_id = a.attendance_id
  GROUP BY ms.slot_id, ms.slot_name, ms.slot_order
  ORDER BY ms.slot_order;
END $$

CREATE PROCEDURE revenue_breakdown()
BEGIN
  SELECT
    mp.plan_name,
    COUNT(DISTINCT sub.subscription_id) AS active_subscriptions,
    SUM(inv.amount) AS invoiced_amount,
    SUM(COALESCE(pay.paid_amount, 0)) AS collected_amount,
    SUM(inv.amount - COALESCE(pay.paid_amount, 0)) AS outstanding_amount
  FROM MESS_PLAN mp
  LEFT JOIN SUBSCRIPTION sub ON sub.plan_id = mp.plan_id AND sub.status = 'active'
  LEFT JOIN INVOICE inv ON inv.subscription_id = sub.subscription_id
  LEFT JOIN PAYMENT pay ON pay.invoice_id = inv.invoice_id
  GROUP BY mp.plan_id, mp.plan_name
  ORDER BY collected_amount DESC;
END $$

CREATE PROCEDURE inventory_forecast()
BEGIN
  SELECT
    i.item_id,
    i.item_name,
    i.current_stock,
    i.average_daily_usage,
    CASE
      WHEN i.average_daily_usage = 0 THEN NULL
      ELSE ROUND(i.current_stock / i.average_daily_usage, 2)
    END AS projected_days_left,
    CASE
      WHEN i.current_stock <= i.reorder_level THEN 'Critical'
      WHEN i.current_stock <= i.reorder_level * 1.5 THEN 'Low'
      ELSE 'Healthy'
    END AS stock_health
  FROM INVENTORY i
  ORDER BY projected_days_left ASC, i.current_stock ASC;
END $$

CREATE PROCEDURE detect_irregular_attendance()
BEGIN
  SELECT
    s.student_id,
    s.full_name,
    ROUND(
      (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.attendance_id), 0)) * 100,
      2
    ) AS attendance_percentage,
    CASE
      WHEN SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.attendance_id), 0) < 0.55 THEN 'High Risk'
      WHEN SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.attendance_id), 0) < 0.75 THEN 'Watch'
      ELSE 'Healthy'
    END AS risk_flag
  FROM STUDENT s
  LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
  GROUP BY s.student_id, s.full_name
  HAVING COUNT(a.attendance_id) > 0
  ORDER BY attendance_percentage ASC;
END $$

CREATE PROCEDURE iterate_students_generate_report()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_student_id INT;
  DECLARE v_full_name VARCHAR(120);
  DECLARE v_plan_name VARCHAR(80);

  DECLARE cur CURSOR FOR
    SELECT s.student_id, s.full_name, COALESCE(mp.plan_name, 'No Active Plan')
    FROM STUDENT s
    LEFT JOIN SUBSCRIPTION sub ON sub.student_id = s.student_id AND sub.status = 'active'
    LEFT JOIN MESS_PLAN mp ON mp.plan_id = sub.plan_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  DROP TEMPORARY TABLE IF EXISTS temp_student_report;
  CREATE TEMPORARY TABLE temp_student_report (
    seq_no INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED,
    full_name VARCHAR(120),
    plan_name VARCHAR(80),
    report_status VARCHAR(40)
  );

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_student_id, v_full_name, v_plan_name;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    INSERT INTO temp_student_report (student_id, full_name, plan_name, report_status)
    VALUES (v_student_id, v_full_name, v_plan_name, 'Generated');
  END LOOP;
  CLOSE cur;

  SELECT * FROM temp_student_report ORDER BY seq_no;
END $$

CREATE TRIGGER trg_purchase_stock_up
AFTER INSERT ON PURCHASE
FOR EACH ROW
BEGIN
  UPDATE INVENTORY
  SET current_stock = current_stock + NEW.quantity
  WHERE item_id = NEW.item_id;

  INSERT INTO STOCK_LOG (item_id, movement_type, quantity_delta, balance_after, source_ref)
  SELECT item_id, 'PURCHASE_IN', NEW.quantity, current_stock, CONCAT('PURCHASE#', NEW.purchase_id)
  FROM INVENTORY
  WHERE item_id = NEW.item_id;

  INSERT INTO TRANSACTION_LOG (entity_name, entity_id, action_type, actor_type, actor_id, message)
  VALUES ('PURCHASE', NEW.purchase_id, 'INSERT', 'staff', NEW.purchased_by_staff_id, 'Purchase recorded and stock increased');
END $$

CREATE TRIGGER trg_prevent_student_delete
BEFORE DELETE ON STUDENT
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM SUBSCRIPTION
    WHERE student_id = OLD.student_id
      AND status = 'active'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot delete student with active subscription history';
  END IF;
END $$

CREATE TRIGGER trg_subscription_invoice
AFTER INSERT ON SUBSCRIPTION
FOR EACH ROW
BEGIN
  DECLARE v_amount DECIMAL(10,2);
  SELECT monthly_fee INTO v_amount
  FROM MESS_PLAN
  WHERE plan_id = NEW.plan_id;

  INSERT INTO INVOICE (
    subscription_id,
    invoice_no,
    billing_month,
    billing_year,
    amount,
    due_date,
    status
  ) VALUES (
    NEW.subscription_id,
    CONCAT('INV-', NEW.subscription_id, '-', DATE_FORMAT(NEW.start_date, '%Y%m')),
    MONTH(NEW.start_date),
    YEAR(NEW.start_date),
    v_amount,
    DATE_ADD(NEW.start_date, INTERVAL 7 DAY),
    'pending'
  );

  INSERT INTO TRANSACTION_LOG (entity_name, entity_id, action_type, actor_type, actor_id, message)
  VALUES ('SUBSCRIPTION', NEW.subscription_id, 'INSERT', 'admin', NEW.created_by_admin_id, 'Subscription created and invoice generated');
END $$

CREATE TRIGGER trg_payment_log
AFTER INSERT ON PAYMENT
FOR EACH ROW
BEGIN
  UPDATE INVOICE
  SET status = CASE
    WHEN NEW.paid_amount >= amount THEN 'paid'
    ELSE 'partial'
  END
  WHERE invoice_id = NEW.invoice_id;

  INSERT INTO TRANSACTION_LOG (entity_name, entity_id, action_type, actor_type, actor_id, message)
  VALUES ('PAYMENT', NEW.payment_id, 'INSERT', 'student', NEW.student_id, 'Payment captured and invoice status updated');
END $$

DELIMITER ;

CREATE OR REPLACE VIEW STUDENT_DASHBOARD_VIEW AS
SELECT
  s.student_id,
  s.registration_no,
  s.full_name,
  s.dept,
  h.hostel_name,
  bl.block_name,
  r.room_no,
  b.bed_code,
  mp.plan_name,
  sub.status AS subscription_status
FROM STUDENT s
LEFT JOIN BED b ON b.bed_id = s.current_bed_id
LEFT JOIN ROOM r ON r.room_id = b.room_id
LEFT JOIN FLOOR f ON f.floor_id = r.floor_id
LEFT JOIN BLOCK bl ON bl.block_id = f.block_id
LEFT JOIN HOSTEL h ON h.hostel_id = bl.hostel_id
LEFT JOIN SUBSCRIPTION sub ON sub.student_id = s.student_id AND sub.status = 'active'
LEFT JOIN MESS_PLAN mp ON mp.plan_id = sub.plan_id;

CREATE OR REPLACE VIEW FINANCIAL_SUMMARY_VIEW AS
SELECT
  s.student_id,
  s.full_name,
  SUM(inv.amount) AS total_invoiced,
  SUM(COALESCE(pay.paid_amount, 0)) AS total_paid,
  SUM(inv.amount - COALESCE(pay.paid_amount, 0)) AS total_due
FROM STUDENT s
LEFT JOIN SUBSCRIPTION sub ON sub.student_id = s.student_id
LEFT JOIN INVOICE inv ON inv.subscription_id = sub.subscription_id
LEFT JOIN PAYMENT pay ON pay.invoice_id = inv.invoice_id
GROUP BY s.student_id, s.full_name;

CREATE OR REPLACE VIEW INVENTORY_HEALTH_VIEW AS
SELECT
  i.item_id,
  i.item_name,
  c.category_name,
  i.current_stock,
  i.reorder_level,
  i.average_daily_usage,
  CASE
    WHEN i.current_stock <= i.reorder_level THEN 'Critical'
    WHEN i.current_stock <= i.reorder_level * 1.5 THEN 'Low'
    ELSE 'Healthy'
  END AS stock_health
FROM INVENTORY i
JOIN ITEM_CATEGORY c ON c.category_id = i.category_id;

CREATE OR REPLACE VIEW DAILY_OPERATION_VIEW AS
SELECT
  a.attendance_date,
  ms.slot_name,
  COUNT(a.attendance_id) AS total_marks,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count
FROM ATTENDANCE a
JOIN MEAL_SLOT ms ON ms.slot_id = a.slot_id
GROUP BY a.attendance_date, ms.slot_name, ms.slot_order
ORDER BY a.attendance_date DESC, ms.slot_order;
