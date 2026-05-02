const db = require('../db');
const demoStore = require('../demoStore');

const queryLogs = [];
let logCounter = 0;

const SAFE_QUERY_PATTERN = /^(select|show|describe|desc|explain|call|with)\b/i;
const FORBIDDEN_PATTERN =
  /\b(insert|update|delete|drop|truncate|alter|create|replace|grant|revoke|rename|set)\b/i;

const PROCEDURE_WHITELIST = new Set([
  'get_student_360_view',
  'mess_consumption_analytics',
  'revenue_breakdown',
  'inventory_forecast',
  'detect_irregular_attendance',
  'iterate_students_generate_report',
]);

const PREBUILT_QUERIES = {
  student_plans: {
    id: 'student_plans',
    title: 'Students with mess plans',
    description: 'Multi-table join showing student identity with meal subscription.',
    chart: 'bar',
    query: `
      SELECT
        s.student_id,
        s.name,
        s.dept,
        s.room_no,
        mp.plan_type
      FROM STUDENT s
      LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
      ORDER BY s.student_id
    `,
  },
  attendance_percentage: {
    id: 'attendance_percentage',
    title: 'Attendance percentage calculation',
    description: 'Aggregates total, present, and attendance percentage per student.',
    chart: 'line',
    query: `
      SELECT
        s.student_id,
        s.name,
        COUNT(a.att_id) AS total_marks,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_marks,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.att_id), 0)) * 100,
          2
        ) AS attendance_percentage
      FROM STUDENT s
      LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
      GROUP BY s.student_id, s.name
      ORDER BY attendance_percentage DESC, s.student_id
    `,
  },
  feedback_heatmap: {
    id: 'feedback_heatmap',
    title: 'Feedback quality signal',
    description: 'Department-wise feedback and rating averages.',
    chart: 'heatmap',
    query: `
      SELECT
        s.dept,
        COUNT(f.feed_id) AS feedback_count,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM STUDENT s
      LEFT JOIN FEEDBACK f ON f.student_id = s.student_id
      GROUP BY s.dept
      ORDER BY avg_rating DESC, feedback_count DESC
    `,
  },
  meal_operations: {
    id: 'meal_operations',
    title: 'Daily operation view',
    description: 'Operational join across menu, attendance, and student occupancy signals.',
    chart: 'area',
    query: `
      SELECT
        a.date_val,
        a.meal_type,
        COUNT(a.att_id) AS total_marks,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count
      FROM ATTENDANCE a
      GROUP BY a.date_val, a.meal_type
      ORDER BY a.date_val DESC, a.meal_type
    `,
  },
  student_360: {
    id: 'student_360',
    title: 'Student 360 view',
    description: 'A joined overview of student profile, plan, attendance, and feedback.',
    chart: 'table',
    query: `
      SELECT
        s.student_id,
        s.name,
        s.dept,
        s.room_no,
        mp.plan_type,
        COUNT(a.att_id) AS attendance_marks,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS total_present,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM STUDENT s
      LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
      LEFT JOIN ATTENDANCE a ON a.student_id = s.student_id
      LEFT JOIN FEEDBACK f ON f.student_id = s.student_id
      GROUP BY s.student_id, s.name, s.dept, s.room_no, mp.plan_type
      ORDER BY s.student_id
    `,
  },
};

const isDatabaseUnavailable = (error) => {
  return [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
  ].includes(error?.code);
};

const addLog = (entry) => {
  queryLogs.unshift({
    id: ++logCounter,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  queryLogs.splice(25);
};

const normalizeQuery = (query) => String(query || '').trim();

const isSafeQuery = (query) => {
  if (!query || query.length > 5000) {
    return false;
  }

  if (!SAFE_QUERY_PATTERN.test(query)) {
    return false;
  }

  if (query.includes(';')) {
    return false;
  }

  const strippedPrefix = query.replace(/^(explain\s+)?/i, '');
  return !FORBIDDEN_PATTERN.test(strippedPrefix);
};

const summarizeRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  if (Array.isArray(rows[0])) {
    return rows[0];
  }

  return rows;
};

const buildOverview = () => {
  const students = demoStore.listStudents();
  const feedback = demoStore.getAllFeedback();
  const attendanceSnapshots = students.map((student) => {
    const attendance = demoStore.getAttendanceByStudent(student.student_id);
    return {
      student,
      summary: attendance.summary,
    };
  });

  const riskFlags = attendanceSnapshots
    .filter(({ summary }) => summary.total_marks > 0)
    .map(({ student, summary }) => {
      const attendanceRate = Math.round((summary.total_present / summary.total_marks) * 100);
      return {
        student_id: student.student_id,
        name: student.name,
        flag: attendanceRate < 60 ? 'Low attendance' : 'Stable',
        value: `${attendanceRate}%`,
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value))
    .slice(0, 5);

  return {
    metrics: [
      { label: 'Students onboarded', value: students.length, trend: '+12%', tone: 'blue' },
      { label: 'Attendance marks', value: attendanceSnapshots.reduce((sum, row) => sum + row.summary.total_marks, 0), trend: '+8%', tone: 'green' },
      { label: 'Feedback signals', value: feedback.length, trend: '+4%', tone: 'amber' },
      { label: 'Enterprise modules', value: 22, trend: 'Blueprint', tone: 'slate' },
    ],
    riskFlags,
    procedureDemos: Array.from(PROCEDURE_WHITELIST).map((name) => ({
      name,
      label: name.replaceAll('_', ' '),
    })),
  };
};

const runDemoQuery = (query, { explain = false } = {}) => {
  const normalized = normalizeQuery(query).toLowerCase();

  if (explain) {
    return {
      rows: [
        {
          id: 1,
          select_type: 'SIMPLE',
          table: 'demo_store',
          type: 'ALL',
          possible_keys: 'primary',
          key: 'primary',
          rows: demoStore.listStudents().length,
          Extra: 'Using in-memory demo planner',
        },
      ],
      columns: ['id', 'select_type', 'table', 'type', 'possible_keys', 'key', 'rows', 'Extra'],
      mode: 'demo',
    };
  }

  if (normalized.startsWith('call get_student_360_view')) {
    const rows = demoStore.listStudents().slice(0, 5).map((student) => {
      const attendance = demoStore.getAttendanceByStudent(student.student_id).summary;
      const feedback = demoStore.getAllFeedback().find((row) => row.student_id === student.student_id);
      return {
        student_id: student.student_id,
        name: student.name,
        dept: student.dept,
        room_no: student.room_no,
        plan_type: student.plan_type,
        attendance_marks: attendance.total_marks,
        total_present: attendance.total_present,
        avg_rating: feedback?.rating || null,
      };
    });

    return {
      rows,
      columns: Object.keys(rows[0] || {}),
      mode: 'demo',
    };
  }

  if (normalized.startsWith('call revenue_breakdown')) {
    const rows = [
      { plan_type: 'regular', active_students: 8, monthly_revenue: 48000 },
      { plan_type: 'veg', active_students: 6, monthly_revenue: 39000 },
      { plan_type: 'special', active_students: 4, monthly_revenue: 34000 },
    ];
    return {
      rows,
      columns: Object.keys(rows[0]),
      mode: 'demo',
    };
  }

  if (normalized.startsWith('call inventory_forecast')) {
    const rows = [
      { item_name: 'Rice', current_stock: 180, projected_days_left: 12, status: 'Stable' },
      { item_name: 'Milk', current_stock: 42, projected_days_left: 3, status: 'Restock soon' },
      { item_name: 'Cooking Oil', current_stock: 28, projected_days_left: 5, status: 'Monitor' },
    ];
    return {
      rows,
      columns: Object.keys(rows[0]),
      mode: 'demo',
    };
  }

  if (normalized.startsWith('call detect_irregular_attendance')) {
    const rows = buildOverview().riskFlags;
    return {
      rows,
      columns: Object.keys(rows[0] || {}),
      mode: 'demo',
    };
  }

  if (normalized.startsWith('call iterate_students_generate_report')) {
    const rows = demoStore.listStudents().map((student, index) => ({
      seq_no: index + 1,
      student_id: student.student_id,
      name: student.name,
      plan_type: student.plan_type,
      report_status: 'Generated',
    }));
    return {
      rows,
      columns: Object.keys(rows[0] || {}),
      mode: 'demo',
    };
  }

  if (normalized.includes('from student') && normalized.includes('mess_plan')) {
    const rows = demoStore.listStudents().map((student) => ({
      student_id: student.student_id,
      name: student.name,
      dept: student.dept,
      room_no: student.room_no,
      plan_type: student.plan_type,
    }));
    return { rows, columns: Object.keys(rows[0] || {}), mode: 'demo' };
  }

  if (normalized.includes('attendance_percentage') || normalized.includes('from attendance')) {
    const rows = demoStore.listStudents().map((student) => {
      const summary = demoStore.getAttendanceByStudent(student.student_id).summary;
      const attendance_percentage =
        summary.total_marks === 0
          ? 0
          : Number(((summary.total_present / summary.total_marks) * 100).toFixed(2));
      return {
        student_id: student.student_id,
        name: student.name,
        total_marks: summary.total_marks,
        present_marks: summary.total_present,
        attendance_percentage,
      };
    });
    return { rows, columns: Object.keys(rows[0] || {}), mode: 'demo' };
  }

  if (normalized.includes('from feedback')) {
    const rows = demoStore.getAllFeedback();
    return { rows, columns: Object.keys(rows[0] || {}), mode: 'demo' };
  }

  const rows = demoStore.listStudents();
  return {
    rows,
    columns: Object.keys(rows[0] || {}),
    mode: 'demo',
  };
};

const executeQuery = async (query, { explain = false } = {}) => {
  const sql = normalizeQuery(query);
  if (!isSafeQuery(sql)) {
    const error = new Error('Only single SELECT, SHOW, DESC, EXPLAIN, WITH, or approved CALL queries are allowed.');
    error.statusCode = 400;
    throw error;
  }

  if (/^call\b/i.test(sql)) {
    const match = sql.match(/^call\s+([a-zA-Z0-9_]+)/i);
    if (!match || !PROCEDURE_WHITELIST.has(match[1])) {
      const error = new Error('Procedure is not whitelisted for lab mode.');
      error.statusCode = 400;
      throw error;
    }
  }

  const startedAt = Date.now();

  try {
    const effectiveSql = explain && !/^explain\b/i.test(sql) ? `EXPLAIN ${sql}` : sql;
    const [rows] = await db.query(effectiveSql);
    const resultRows = summarizeRows(rows);
    const columns = Object.keys(resultRows[0] || {});
    const duration_ms = Date.now() - startedAt;

    addLog({
      type: explain ? 'explain' : 'query',
      status: 'success',
      query: effectiveSql,
      row_count: resultRows.length,
      duration_ms,
    });

    return {
      rows: resultRows,
      columns,
      duration_ms,
      mode: 'database',
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      addLog({
        type: explain ? 'explain' : 'query',
        status: 'error',
        query: sql,
        row_count: 0,
        duration_ms: Date.now() - startedAt,
      });
      throw error;
    }

    const demoResult = runDemoQuery(sql, { explain });
    const duration_ms = Date.now() - startedAt;

    addLog({
      type: explain ? 'explain' : 'query',
      status: 'demo',
      query: sql,
      row_count: demoResult.rows.length,
      duration_ms,
    });

    return {
      ...demoResult,
      duration_ms,
    };
  }
};

const getOverview = async (_req, res) => {
  return res.status(200).json({
    success: true,
    overview: buildOverview(),
    prebuiltQueries: Object.values(PREBUILT_QUERIES),
  });
};

const getLogs = async (_req, res) => {
  const triggerActivity = [
    {
      id: 'trigger-1',
      name: 'trg_student_name_update',
      message: 'Tracks student profile changes into STUDENT_UPDATE_LOG',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'trigger-2',
      name: 'enterprise_trigger_blueprint',
      message: 'Blueprint includes stock, invoice, and transaction logging triggers',
      timestamp: new Date().toISOString(),
    },
  ];

  return res.status(200).json({
    success: true,
    logs: queryLogs,
    triggerActivity,
  });
};

const executePlayground = async (req, res, next) => {
  try {
    const { query, explain } = req.body || {};
    const result = await executeQuery(query, { explain: Boolean(explain) });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

const runPrebuiltQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const config = PREBUILT_QUERIES[queryId];

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Prebuilt query not found',
      });
    }

    const result = await executeQuery(config.query);
    return res.status(200).json({
      success: true,
      query: config,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

const runProcedureDemo = async (req, res, next) => {
  try {
    const { procedureName, args = [] } = req.body || {};
    if (!PROCEDURE_WHITELIST.has(procedureName)) {
      return res.status(400).json({
        success: false,
        message: 'Procedure is not available in lab mode',
      });
    }

    const placeholders = args.map(() => '?').join(', ');
    const callSql = `CALL ${procedureName}(${placeholders})`;

    const result = await executeQuery(
      placeholders ? callSql.replace(/\?/g, () => JSON.stringify(args.shift())) : callSql
    );

    return res.status(200).json({
      success: true,
      procedureName,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  executePlayground,
  getLogs,
  getOverview,
  runPrebuiltQuery,
  runProcedureDemo,
};
