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

const markAttendance = async (req, res, next) => {
  const { student_id, date_val, meal_type, status } = req.body;

  if (!student_id || !date_val || !meal_type || !status) {
    return res.status(400).json({
      success: false,
      message: 'student_id, date_val, meal_type, and status are required',
    });
  }

  const statusNormalized = String(status).toLowerCase();
  if (!['present', 'absent'].includes(statusNormalized)) {
    return res.status(400).json({
      success: false,
      message: "status must be 'present' or 'absent'",
    });
  }

  const numericStudentId = Number(student_id);
  if (!Number.isInteger(numericStudentId) || numericStudentId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'student_id must be a valid positive integer',
    });
  }

  try {
    const [studentRows] = await db.execute(
      'SELECT student_id FROM STUDENT WHERE student_id = ?',
      [numericStudentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please login with a valid Student ID.',
      });
    }

    const [result] = await db.execute(
      'INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status) VALUES (?, ?, ?, ?)',
      [numericStudentId, date_val, meal_type, statusNormalized]
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      att_id: result.insertId,
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    const student = demoStore.getStudentById(numericStudentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in demo list. Use one of the listed demo student IDs.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully in demo mode',
      att_id: demoStore.markAttendance({
        student_id: numericStudentId,
        date_val,
        meal_type,
        status: statusNormalized,
      }),
      mode: 'demo',
    });
  }
};

const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const detailQuery = `
      SELECT
        a.att_id,
        a.date_val,
        a.meal_type,
        a.status,
        s.student_id,
        s.name,
        s.dept,
        s.room_no
      FROM ATTENDANCE a
      INNER JOIN STUDENT s ON s.student_id = a.student_id
      WHERE a.student_id = ?
      ORDER BY a.date_val DESC, a.att_id DESC
    `;

    const summaryQuery = `
      SELECT
        COUNT(*) AS total_marks,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS total_present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS total_absent
      FROM ATTENDANCE
      WHERE student_id = ?
    `;

    const [attendance] = await db.execute(detailQuery, [id]);
    const [summaryRows] = await db.execute(summaryQuery, [id]);

    return res.status(200).json({
      success: true,
      attendance,
      summary: summaryRows[0],
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    const { attendance, summary } = demoStore.getAttendanceByStudent(id);

    return res.status(200).json({
      success: true,
      attendance,
      summary,
      mode: 'demo',
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByStudent,
};
