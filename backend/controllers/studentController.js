const bcrypt = require('bcrypt');
const db = require('../db');
const demoStore = require('../demoStore');
const { shouldUseDemoFallback } = require('../utils/runtimeMode');

const registerStudent = async (req, res, next) => {
  const { name, email, password, dept, room_no, phone, plan_type } = req.body;

  if (!name || !email || !password || !dept || !room_no || !phone) {
    return res.status(400).json({
      success: false,
      message: 'name, email, password, dept, room_no, and phone are required',
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO STUDENT (name, email, password, dept, room_no, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, dept, room_no, phone]
    );

    await db.execute(
      'INSERT INTO MESS_PLAN (student_id, plan_type) VALUES (?, ?)',
      [result.insertId, plan_type || 'regular']
    );

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student_id: result.insertId,
    });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return next(error);
    }

    const student_id = demoStore.registerStudent({
      name,
      email,
      dept,
      room_no,
      phone,
      plan_type,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered in demo mode because the database is currently unavailable',
      student_id,
      mode: 'demo',
    });
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const query = `
      SELECT
        s.student_id,
        s.name,
        s.email,
        s.dept,
        s.room_no,
        s.phone,
        mp.plan_type,
        COUNT(a.att_id) AS attendance_marks,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count
      FROM STUDENT s
      LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
      LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
      GROUP BY s.student_id, s.name, s.email, s.dept, s.room_no, s.phone, mp.plan_type
      ORDER BY s.student_id DESC
    `;

    const [rows] = await db.execute(query);
    return res.status(200).json({ success: true, students: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return next(error);
    }

    return res.status(200).json({
      success: true,
      students: demoStore.listStudents(),
      mode: 'demo',
      demo_admins: demoStore.demoAdmins,
    });
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, dept, room_no, phone } = req.body;

  try {
    await db.execute(
      `UPDATE STUDENT
       SET name = ?, email = ?, dept = ?, room_no = ?, phone = ?
       WHERE student_id = ?`,
      [name, email, dept, room_no, phone, id]
    );

    return res.status(200).json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    const student = demoStore.updateStudent(id, { name, email, dept, room_no, phone });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.status(200).json({ success: true, message: 'Student updated in demo mode', mode: 'demo' });
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM STUDENT WHERE student_id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    demoStore.deleteStudent(id);
    return res.status(200).json({ success: true, message: 'Student deleted in demo mode', mode: 'demo' });
  }
};

const getStudentAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM ATTENDANCE WHERE student_id = ? ORDER BY date_val DESC, att_id DESC',
      [id]
    );
    return res.status(200).json({ success: true, attendance: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    const { attendance } = demoStore.getAttendanceByStudent(id);
    return res.status(200).json({ success: true, attendance, mode: 'demo' });
  }
};

const getStudentLoginHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('CALL get_login_history(?)', [id]);
    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;
    return res.status(200).json({ success: true, loginHistory: resultRows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      loginHistory: demoStore.getLoginHistory(id).slice(0, 10),
      mode: 'demo',
    });
  }
};

const getStudentStats = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  try {
    const [attendanceRows] = await db.execute(
      `SELECT att_id, date_val, meal_type, status
       FROM ATTENDANCE
       WHERE student_id = ?
       ORDER BY date_val DESC, att_id DESC`,
      [numericId]
    );

    const [feedbackRows] = await db.execute(
      `SELECT rating
       FROM FEEDBACK
       WHERE student_id = ?`,
      [numericId]
    );

    const [planRows] = await db.execute(
      `SELECT plan_type
       FROM MESS_PLAN
       WHERE student_id = ?
       ORDER BY plan_id DESC
       LIMIT 1`,
      [numericId]
    );

    const currentMonth = new Date().toISOString().slice(0, 7);
    const mealsThisMonth = attendanceRows.filter(
      (row) => row.status === 'present' && String(row.date_val).slice(0, 7) === currentMonth
    ).length;

    const uniquePresentDays = [...new Set(
      attendanceRows
        .filter((row) => row.status === 'present')
        .map((row) => String(row.date_val).slice(0, 10))
    )].sort().reverse();

    let mealStreak = 0;
    let cursor = new Date();
    while (uniquePresentDays.includes(cursor.toISOString().slice(0, 10))) {
      mealStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const avgFeedback =
      feedbackRows.length === 0
        ? null
        : Number(
            (
              feedbackRows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / feedbackRows.length
            ).toFixed(1)
          );

    return res.status(200).json({
      success: true,
      stats: {
        mealsThisMonth,
        mealStreak,
        avgFeedback,
        messPlan: planRows[0]?.plan_type || 'regular',
      },
    });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    const attendanceData = demoStore.getAttendanceByStudent(numericId).attendance;
    const feedbackRows = demoStore.getFeedbackByStudent(numericId);
    const student = demoStore.getStudentById(numericId);

    return res.status(200).json({
      success: true,
      stats: {
        mealsThisMonth: attendanceData.filter((row) => row.status === 'present').length,
        mealStreak: attendanceData.filter((row) => row.status === 'present').length ? 1 : 0,
        avgFeedback:
          feedbackRows.length === 0
            ? null
            : Number(
                (
                  feedbackRows.reduce((sum, row) => sum + Number(row.rating || 0), 0) /
                  feedbackRows.length
                ).toFixed(1)
              ),
        messPlan: student?.plan_type || 'regular',
      },
      mode: 'demo',
    });
  }
};

module.exports = {
  deleteStudent,
  getAllStudents,
  getStudentAttendance,
  getStudentLoginHistory,
  getStudentStats,
  registerStudent,
  updateStudent,
};
