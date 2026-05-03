const bcrypt = require('bcrypt');
const db = require('../db');
const demoStore = require('../demoStore');
const { shouldUseDemoFallback } = require('../utils/runtimeMode');

const getCurrentMealType = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 10) {
    return 'breakfast';
  }
  if (currentHour < 16) {
    return 'lunch';
  }
  return 'dinner';
};

const listRegisteredStudents = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT student_id, name, dept, room_no
       FROM STUDENT
       WHERE password IS NOT NULL AND password <> ''
       ORDER BY student_id DESC
       LIMIT 20`
    );

    return res.status(200).json({ success: true, students: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      students: demoStore.listStudents().slice(0, 20),
      mode: 'demo',
    });
  }
};

const studentLogin = async (req, res) => {
  const { name, role, student_id, password } = req.body || {};
  const ipAddress = req.ip;

  if (!role) {
    return res.status(400).json({ error: 'role is required' });
  }

  if (role === 'admin') {
    if (!name) {
      return res.status(400).json({ error: 'name is required for admin login' });
    }

    return res.status(200).json({
      success: true,
      user: {
        role: 'admin',
        name,
      },
      token: 'session-active',
    });
  }

  if (!student_id) {
    return res.status(400).json({ error: 'student_id is required for student login' });
  }

  if (!password) {
    return res.status(400).json({ error: 'password is required for student login' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT student_id, name, email, password, dept, room_no, phone
       FROM STUDENT
       WHERE student_id = ?`,
      [student_id]
    );

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO Login_Log (student_id, login_name, ip_address, status)
         VALUES (NULL, ?, ?, 'failed')`,
        [req.body.name || `student-${student_id}`, ipAddress]
      );

      return res.status(401).json({ error: 'Student not found' });
    }

    const student = rows[0];
    if (!student.password) {
      await db.query(
        `INSERT INTO Login_Log (student_id, login_name, ip_address, status)
         VALUES (NULL, ?, ?, 'failed')`,
        [student.name, ipAddress]
      );
      return res.status(401).json({ error: 'Password is not set for this student yet' });
    }

    const passwordMatches = await bcrypt.compare(password, student.password);
    if (!passwordMatches) {
      await db.query(
        `INSERT INTO Login_Log (student_id, login_name, ip_address, status)
         VALUES (NULL, ?, ?, 'failed')`,
        [student.name, ipAddress]
      );

      return res.status(401).json({ error: 'Incorrect password' });
    }

    const mealType = getCurrentMealType();
    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      `INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status)
       VALUES (?, ?, ?, 'present')
       ON DUPLICATE KEY UPDATE status = status`,
      [student.student_id, today, mealType]
    );

    await db.query(
      `INSERT INTO Login_Log (student_id, login_name, ip_address, status)
       VALUES (?, ?, ?, 'success')`,
      [student.student_id, student.name, ipAddress]
    );

    return res.status(200).json({
      success: true,
      token: 'session-active',
      user: {
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        dept: student.dept,
        room_no: student.room_no,
        phone: student.phone,
        role: 'student',
      },
    });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    const student = demoStore.getStudentById(student_id);
    if (!student || student.password_hint !== password) {
      demoStore.addLoginLog({
        student_id: null,
        login_name: req.body.name || `student-${student_id}`,
        ip_address: ipAddress,
        status: 'failed',
      });
      return res.status(401).json({ error: 'Invalid student credentials' });
    }

    demoStore.markAttendance({
      student_id: student.student_id,
      date_val: new Date().toISOString().slice(0, 10),
      meal_type: getCurrentMealType(),
      status: 'present',
    });

    demoStore.addLoginLog({
      student_id: student.student_id,
      login_name: student.name,
      ip_address: ipAddress,
      status: 'success',
    });

    return res.status(200).json({
      success: true,
      token: 'session-active',
      user: {
        ...student,
        role: 'student',
      },
      mode: 'demo',
    });
  }
};

module.exports = {
  listRegisteredStudents,
  studentLogin,
};
