const db = require('../db');
const demoStore = require('../demoStore');

const isDatabaseUnavailable = (error) => {
  return [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
  ].includes(error?.code);
};

const registerStudent = async (req, res, next) => {
  const { name, dept, room_no, phone, plan_type } = req.body;

  if (!name || !dept || !room_no || !phone) {
    return res.status(400).json({
      success: false,
      message: 'name, dept, room_no, and phone are required',
    });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO STUDENT (name, dept, room_no, phone) VALUES (?, ?, ?, ?)',
      [name, dept, room_no, phone]
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
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    const student_id = demoStore.registerStudent({
      name,
      dept,
      room_no,
      phone,
      plan_type,
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
        s.dept,
        s.room_no,
        s.phone,
        mp.plan_type,
        COUNT(a.att_id) AS attendance_marks,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count
      FROM STUDENT s
      LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
      LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
      GROUP BY s.student_id, s.name, s.dept, s.room_no, s.phone, mp.plan_type
      ORDER BY s.student_id DESC
    `;

    const [rows] = await db.execute(query);

    return res.status(200).json({ success: true, students: rows });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
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

module.exports = {
  registerStudent,
  getAllStudents,
};
