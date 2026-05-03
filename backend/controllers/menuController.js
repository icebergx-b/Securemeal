const db = require('../db');
const demoStore = require('../demoStore');
const { shouldUseDemoFallback } = require('../utils/runtimeMode');

const getMenu = async (req, res, next) => {
  try {
    const normalizedDay = String(req.query.day || '').trim();
    const [rows] = await db.execute(
      normalizedDay
        ? `SELECT menu_id, day, meal_type, food_items
           FROM MENU
           WHERE day = ?
           ORDER BY FIELD(meal_type, 'breakfast', 'lunch', 'dinner')`
        : `SELECT menu_id, day, meal_type, food_items
           FROM MENU
           ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                    FIELD(meal_type, 'breakfast', 'lunch', 'dinner')`,
      normalizedDay ? [normalizedDay] : []
    );

    return res.status(200).json({ success: true, menu: rows });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
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
      `INSERT INTO MENU (day, meal_type, food_items)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE food_items = VALUES(food_items), menu_id = LAST_INSERT_ID(menu_id)`,
      [day, meal_type, food_items]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu saved successfully',
      menu_id: result.insertId,
    });
  } catch (error) {
    if (!shouldUseDemoFallback(error)) {
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
