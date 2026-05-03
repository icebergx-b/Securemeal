const db = require('../db');
const demoStore = require('../demoStore');
const { shouldUseDemoFallback } = require('../utils/runtimeMode');

const getLoginLogs = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM Login_Log ORDER BY login_time DESC LIMIT 50'
    );
    return res.status(200).json({ success: true, logs: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, logs: demoStore.getLoginLogs(), mode: 'demo' });
  }
};

const getTriggerLogs = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM TRIGGER_LOG ORDER BY fired_at DESC LIMIT 50'
    );
    return res.status(200).json({ success: true, logs: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, logs: demoStore.getTriggerLogs(), mode: 'demo' });
  }
};

const getAdminStats = async (_req, res) => {
  try {
    const [[totalStudentsRow]] = await db.execute('SELECT COUNT(*) AS totalStudents FROM STUDENT');
    const [[yesterdayStudentsRow]] = await db.execute(
      `SELECT COUNT(*) AS yesterdayStudents
       FROM TRIGGER_LOG
       WHERE event_desc LIKE 'New student registered:%'
         AND DATE(fired_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    );
    const [[loginsTodayRow]] = await db.execute(
      'SELECT COUNT(*) AS loginsToday FROM Login_Log WHERE DATE(login_time) = CURDATE()'
    );
    const [[failedLoginsTodayRow]] = await db.execute(
      `SELECT COUNT(*) AS failedLoginsToday
       FROM Login_Log
       WHERE DATE(login_time) = CURDATE() AND status = 'failed'`
    );
    const [[avgFeedbackRow]] = await db.execute(
      'SELECT ROUND(AVG(rating), 1) AS avgFeedback FROM FEEDBACK'
    );
    const [[attendanceRateRow]] = await db.execute(
      `SELECT ROUND(SUM(status = 'present') / NULLIF(COUNT(*), 0) * 100, 1) AS attendanceRate
       FROM ATTENDANCE
       WHERE date_val = CURDATE()`
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: totalStudentsRow.totalStudents || 0,
        studentChangeVsYesterday:
          (totalStudentsRow.totalStudents || 0) - (yesterdayStudentsRow.yesterdayStudents || 0),
        loginsToday: loginsTodayRow.loginsToday || 0,
        failedLoginsToday: failedLoginsTodayRow.failedLoginsToday || 0,
        avgFeedback: avgFeedbackRow.avgFeedback || 0,
        attendanceRate: attendanceRateRow.attendanceRate || 0,
      },
    });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      stats: demoStore.getAdminStats(),
      mode: 'demo',
    });
  }
};

const getMealSummary = async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM student_meal_summary');
    return res.status(200).json({ success: true, summary: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, summary: demoStore.getMealSummary(), mode: 'demo' });
  }
};

const bulkAttendance = async (req, res) => {
  const { date_val, meal_type, records } = req.body || {};
  if (!date_val || !meal_type || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'date_val, meal_type, and records are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const record of records) {
      const [existing] = await conn.query(
        `SELECT att_id FROM ATTENDANCE
         WHERE student_id = ? AND date_val = ? AND meal_type = ?
         FOR UPDATE`,
        [record.student_id, date_val, meal_type]
      );

      if (existing.length > 0) {
        await conn.query(
          'UPDATE ATTENDANCE SET status = ? WHERE att_id = ?',
          [record.status, existing[0].att_id]
        );
      } else {
        await conn.query(
          `INSERT INTO ATTENDANCE (student_id, date_val, meal_type, status)
           VALUES (?, ?, ?, ?)`,
          [record.student_id, date_val, meal_type, record.status]
        );
      }
    }

    await conn.commit();
    return res.status(200).json({ success: true, message: 'Bulk attendance committed successfully' });
  } catch (error) {
    await conn.rollback();

    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }

    demoStore.bulkAttendance(
      records.map((record) => ({
        student_id: Number(record.student_id),
        date_val,
        meal_type,
        status: record.status,
      }))
    );
    return res.status(200).json({ success: true, message: 'Bulk attendance committed in demo mode', mode: 'demo' });
  } finally {
    conn.release();
  }
};

const getTodayAttendance = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.att_id, a.student_id, a.date_val, a.meal_type, a.status, s.name, s.dept, s.room_no
       FROM ATTENDANCE a
       INNER JOIN STUDENT s ON s.student_id = a.student_id
       WHERE a.date_val = CURDATE()
       ORDER BY a.meal_type, s.name`
    );
    return res.status(200).json({ success: true, attendance: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, attendance: demoStore.getTodayAttendance(), mode: 'demo' });
  }
};

module.exports = {
  bulkAttendance,
  getAdminStats,
  getLoginLogs,
  getMealSummary,
  getTodayAttendance,
  getTriggerLogs,
};
