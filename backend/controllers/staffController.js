const db = require('../db');

const getStaff = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT staff_id, name, role FROM STAFF ORDER BY staff_id ASC'
    );

    return res.status(200).json({ success: true, staff: rows });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStaff,
};
