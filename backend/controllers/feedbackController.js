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

const addFeedback = async (req, res, next) => {
  const { student_id, rating, comments } = req.body;

  if (!student_id || !rating) {
    return res.status(400).json({
      success: false,
      message: 'student_id and rating are required',
    });
  }

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'rating must be an integer between 1 and 5',
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
      'INSERT INTO FEEDBACK (student_id, rating, comments) VALUES (?, ?, ?)',
      [numericStudentId, numericRating, comments || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feed_id: result.insertId,
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
      message: 'Feedback submitted successfully in demo mode',
      feed_id: demoStore.addFeedback({
        student_id: numericStudentId,
        rating: numericRating,
        comments,
      }),
      mode: 'demo',
    });
  }
};

const getAllFeedback = async (req, res, next) => {
  try {
    const query = `
      SELECT
        f.feed_id,
        f.rating,
        f.comments,
        s.student_id,
        s.name,
        s.dept
      FROM FEEDBACK f
      INNER JOIN STUDENT s ON s.student_id = f.student_id
      ORDER BY f.feed_id DESC
    `;

    const [rows] = await db.execute(query);

    return res.status(200).json({ success: true, feedback: rows });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    return res.status(200).json({
      success: true,
      feedback: demoStore.getAllFeedback(),
      mode: 'demo',
    });
  }
};

module.exports = {
  addFeedback,
  getAllFeedback,
};
