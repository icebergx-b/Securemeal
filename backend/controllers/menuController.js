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

const getMenu = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT menu_id, day, meal_type, food_items FROM MENU ORDER BY menu_id DESC'
    );

    return res.status(200).json({ success: true, menu: rows });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    return res.status(200).json({ success: true, menu: demoStore.getMenu(), mode: 'demo' });
  }
};

const addMenu = async (req, res, next) => {
  try {
    const { day, meal_type, food_items } = req.body;

    if (!day || !meal_type || !food_items) {
      return res.status(400).json({
        success: false,
        message: 'day, meal_type, and food_items are required',
      });
    }

    const [result] = await db.execute(
      'INSERT INTO MENU (day, meal_type, food_items) VALUES (?, ?, ?)',
      [day, meal_type, food_items]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu added successfully',
      menu_id: result.insertId,
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return next(error);
    }

    return res.status(201).json({
      success: true,
      message: 'Menu added successfully in demo mode',
      menu_id: demoStore.addMenu({ day, meal_type, food_items }),
      mode: 'demo',
    });
  }
};

module.exports = {
  getMenu,
  addMenu,
};
