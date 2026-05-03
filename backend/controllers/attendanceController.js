const db = require('../db');
const demoStore = require('../demoStore');
const { shouldUseDemoFallback } = require('../utils/runtimeMode');

const isValidStatus = (status) => ['present', 'absent'].includes(String(status).toLowerCase());

const markAttendance = async (req, res) => {
  const { student_id, date_val, meal_type, status } = req.body;

  if (!student_id || !date_val || !meal_type || !status) {
    return res.status(400).json({
      error: 'student_id, date_val, meal_type, and status are required',
    });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({
      error: "status must be 'present' or 'absent'",
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT att_id FROM ATTENDANCE
       WHERE student_id = ? AND date_val = ? AND meal_type = ?
       FOR UPDATE`,
      [student_id, date_val, meal_type]
    );

    if (existing.length > 0) {
      await conn.query(
        `UPDATE ATTENDANCE SET status = ? WHERE att_id = ?`,
        [String(status).toLowerCase(), existing[0].att_id]
      );
    } else {
      await conn.query(
        `INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status)
         VALUES (?, ?, ?, ?)`,
        [student_id, date_val, meal_type, String(status).toLowerCase()]
      );
    }

    await conn.commit();
    return res.json({ success: true, message: 'Attendance recorded safely' });
  } catch (err) {
    await conn.rollback();

    if (!shouldUseDemoFallback(err)) {
      return res.status(500).json({ error: err.message });
    }

    const student = demoStore.getStudentById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found in demo list.' });
    }

    demoStore.upsertAttendance({
      student_id: Number(student_id),
      date_val,
      meal_type,
      status: String(status).toLowerCase(),
    });

    return res.json({
      success: true,
      message: 'Attendance recorded safely in demo mode',
      mode: 'demo',
    });
  } finally {
    conn.release();
  }
};

const getAttendanceByStudent = async (req, res, next) => {
  const { id } = req.params;

  try {
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
    if (!shouldUseDemoFallback(error)) {
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
