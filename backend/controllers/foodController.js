const db = require('../db');

const addFood = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'hostel') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only hostel users can add food',
      });
    }

    const { description, quantity, expires_at } = req.body;

    if (!description || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'description and quantity are required',
      });
    }

    const numericQuantity = Number(quantity);
    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive integer',
      });
    }

    let expiresAtValue = expires_at;
    if (!expiresAtValue) {
      const defaultExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expiresAtValue = defaultExpiry.toISOString().slice(0, 19).replace('T', ' ');
    }

    const query =
      'INSERT INTO food_listings (description, quantity, status, expires_at, hostel_id) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.execute(query, [
      description,
      numericQuantity,
      'available',
      expiresAtValue,
      req.user.id,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Food listing added successfully',
      food: {
        id: result.insertId,
        description,
        quantity: numericQuantity,
        status: 'available',
        expires_at: expiresAtValue,
        hostel_id: req.user.id,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAvailableFood = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only NGO users can view available food',
      });
    }

    const query = `
      SELECT
        f.id,
        f.description,
        f.quantity,
        f.status,
        f.expires_at,
        f.hostel_id,
        u.name AS hostel_name,
        f.created_at
      FROM food_listings f
      INNER JOIN users u ON f.hostel_id = u.id
      WHERE f.status = 'available'
        AND f.expires_at > NOW()
      ORDER BY f.created_at DESC
    `;

    const [rows] = await db.execute(query);

    return res.status(200).json({
      success: true,
      foodListings: rows,
    });
  } catch (error) {
    return next(error);
  }
};

const claimFood = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only NGO users can claim food',
      });
    }

    const { food_id } = req.body;
    const foodId = Number(food_id);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'food_id must be a positive integer',
      });
    }

    const [rows] = await db.execute(
      'SELECT id, status, ngo_id FROM food_listings WHERE id = ?',
      [foodId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found',
      });
    }

    const listing = rows[0];
    if (listing.status !== 'available') {
      return res.status(409).json({
        success: false,
        message: 'Food already claimed or picked',
      });
    }

    const [result] = await db.execute(
      `UPDATE food_listings
       SET status = 'claimed', ngo_id = ?
       WHERE id = ? AND status = 'available'`,
      [req.user.id, foodId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message: 'Food already claimed',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food claimed successfully',
      food: {
        id: foodId,
        status: 'claimed',
        ngo_id: req.user.id,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getClaimedFood = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only admin users can view claimed food',
      });
    }

    const query = `
      SELECT
        f.id,
        f.description,
        f.quantity,
        f.status,
        f.hostel_id,
        h.name AS hostel_name,
        f.ngo_id,
        n.name AS ngo_name,
        f.created_at
      FROM food_listings f
      INNER JOIN users h ON f.hostel_id = h.id
      LEFT JOIN users n ON f.ngo_id = n.id
      WHERE f.status = 'claimed'
      ORDER BY f.created_at DESC
    `;

    const [rows] = await db.execute(query);

    return res.status(200).json({
      success: true,
      foodListings: rows,
    });
  } catch (error) {
    return next(error);
  }
};

const approveFood = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only admin users can approve food',
      });
    }

    const { food_id } = req.body;
    const foodId = Number(food_id);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'food_id must be a positive integer',
      });
    }

    const [existingRows] = await db.execute(
      'SELECT id FROM food_listings WHERE id = ?',
      [foodId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found',
      });
    }

    await db.execute('UPDATE food_listings SET status = ? WHERE id = ?', [
      'picked',
      foodId,
    ]);

    const [updatedRows] = await db.execute(
      `SELECT id, description, quantity, status, hostel_id, ngo_id, created_at
       FROM food_listings
       WHERE id = ?`,
      [foodId]
    );

    return res.status(200).json({
      success: true,
      message: 'Food approved successfully',
      food: updatedRows[0],
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addFood,
  getAvailableFood,
  claimFood,
  getClaimedFood,
  approveFood,
};
