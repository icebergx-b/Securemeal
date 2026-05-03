const now = new Date().toISOString();

const state = {
  students: [
    {
      student_id: 101,
      name: 'Aarav Sharma',
      email: 'aarav.sharma@securemeal.local',
      password_hint: 'Aarav@101',
      dept: 'CSE',
      room_no: 'A-101',
      phone: '9876543210',
      plan_type: 'regular',
      created_at: now,
    },
    {
      student_id: 102,
      name: 'Diya Patel',
      email: 'diya.patel@securemeal.local',
      password_hint: 'Diya@102',
      dept: 'ECE',
      room_no: 'B-204',
      phone: '9876501234',
      plan_type: 'veg',
      created_at: now,
    },
    {
      student_id: 103,
      name: 'Rohan Verma',
      email: 'rohan.verma@securemeal.local',
      password_hint: 'Rohan@103',
      dept: 'Mechanical',
      room_no: 'C-312',
      phone: '9812345678',
      plan_type: 'special',
      created_at: now,
    },
  ],
  menu: [
    { menu_id: 1, day: 'Monday', meal_type: 'breakfast', food_items: 'Poha, Banana, Tea' },
    { menu_id: 2, day: 'Monday', meal_type: 'lunch', food_items: 'Rice, Dal, Paneer Curry, Salad' },
    { menu_id: 3, day: 'Monday', meal_type: 'dinner', food_items: 'Roti, Mixed Veg, Kheer' },
  ],
  attendance: [
    { att_id: 1, student_id: 101, date_val: '2026-05-01', meal_type: 'breakfast', status: 'present' },
    { att_id: 2, student_id: 101, date_val: '2026-05-01', meal_type: 'lunch', status: 'present' },
    { att_id: 3, student_id: 101, date_val: '2026-05-02', meal_type: 'dinner', status: 'present' },
    { att_id: 4, student_id: 102, date_val: '2026-05-01', meal_type: 'lunch', status: 'present' },
    { att_id: 5, student_id: 103, date_val: '2026-05-01', meal_type: 'lunch', status: 'absent' },
  ],
  feedback: [
    { feed_id: 1, student_id: 101, rating: 5, comments: 'Food quality is good and service is fast.' },
    { feed_id: 2, student_id: 102, rating: 4, comments: 'Need more fruit options during breakfast.' },
  ],
  loginLogs: [
    {
      log_id: 1,
      student_id: 101,
      login_name: 'Aarav Sharma',
      login_time: now,
      ip_address: '127.0.0.1',
      status: 'success',
    },
  ],
  triggerLogs: [
    {
      id: 1,
      event_desc: 'New student registered: Aarav Sharma (ID: 101)',
      fired_at: now,
    },
  ],
};

const counters = {
  student_id: Math.max(...state.students.map((student) => student.student_id)),
  menu_id: Math.max(...state.menu.map((row) => row.menu_id)),
  att_id: Math.max(...state.attendance.map((row) => row.att_id)),
  feed_id: Math.max(...state.feedback.map((row) => row.feed_id)),
  log_id: Math.max(...state.loginLogs.map((row) => row.log_id)),
  trigger_id: Math.max(...state.triggerLogs.map((row) => row.id)),
};

const nextId = (key) => {
  counters[key] += 1;
  return counters[key];
};

const pushTriggerLog = (event_desc) => {
  state.triggerLogs.unshift({
    id: nextId('trigger_id'),
    event_desc,
    fired_at: new Date().toISOString(),
  });
};

const listStudents = () => {
  return [...state.students]
    .map((student) => {
      const attendanceRows = state.attendance.filter((row) => row.student_id === student.student_id);
      const presentCount = attendanceRows.filter((row) => row.status === 'present').length;

      return {
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        dept: student.dept,
        room_no: student.room_no,
        phone: student.phone,
        plan_type: student.plan_type,
        attendance_marks: attendanceRows.length,
        present_count: presentCount,
      };
    })
    .sort((a, b) => b.student_id - a.student_id);
};

const registerStudent = ({ name, email, dept, room_no, phone, plan_type, password }) => {
  const student_id = nextId('student_id');

  state.students.push({
    student_id,
    name,
    email,
    dept,
    room_no,
    phone,
    plan_type: plan_type || 'regular',
    password_hint: password || 'student password',
    created_at: new Date().toISOString(),
  });

  pushTriggerLog(`New student registered: ${name} (ID: ${student_id})`);
  return student_id;
};

const updateStudent = (studentId, payload) => {
  const student = state.students.find((item) => item.student_id === Number(studentId));
  if (!student) {
    return null;
  }
  Object.assign(student, payload);
  return student;
};

const deleteStudent = (studentId) => {
  const numericId = Number(studentId);
  state.students = state.students.filter((student) => student.student_id !== numericId);
  state.attendance = state.attendance.filter((row) => row.student_id !== numericId);
  state.feedback = state.feedback.filter((row) => row.student_id !== numericId);
  state.loginLogs = state.loginLogs.filter((row) => row.student_id !== numericId);
  pushTriggerLog(`Student deleted from demo store (ID: ${numericId})`);
};

const getStudentById = (studentId) => {
  return state.students.find((student) => student.student_id === Number(studentId)) || null;
};

const getMenu = () => [...state.menu].sort((a, b) => b.menu_id - a.menu_id);

const addMenu = ({ day, meal_type, food_items }) => {
  const menu_id = nextId('menu_id');
  state.menu.unshift({ menu_id, day, meal_type, food_items });
  return menu_id;
};

const upsertAttendance = ({ student_id, date_val, meal_type, status }) => {
  const existing = state.attendance.find(
    (row) =>
      row.student_id === Number(student_id) &&
      row.date_val === date_val &&
      row.meal_type === meal_type
  );

  if (existing) {
    existing.status = status;
    return existing.att_id;
  }

  const att_id = nextId('att_id');
  state.attendance.unshift({
    att_id,
    student_id: Number(student_id),
    date_val,
    meal_type,
    status,
  });
  return att_id;
};

const markAttendance = (payload) => upsertAttendance(payload);

const bulkAttendance = (rows) => {
  rows.forEach((row) => upsertAttendance(row));
};

const getAttendanceByStudent = (studentId) => {
  const student = getStudentById(studentId);
  const attendance = state.attendance
    .filter((row) => row.student_id === Number(studentId))
    .map((row) => ({
      ...row,
      name: student?.name || 'Unknown',
      dept: student?.dept || '',
      room_no: student?.room_no || '',
    }))
    .sort((a, b) => {
      if (a.date_val === b.date_val) {
        return b.att_id - a.att_id;
      }
      return String(b.date_val).localeCompare(String(a.date_val));
    });

  const total_present = attendance.filter((row) => row.status === 'present').length;
  const total_absent = attendance.filter((row) => row.status === 'absent').length;

  return {
    attendance,
    summary: {
      total_marks: attendance.length,
      total_present,
      total_absent,
    },
  };
};

const getTodayAttendance = () => {
  const today = new Date().toISOString().slice(0, 10);
  return state.attendance.filter((row) => row.date_val === today);
};

const addFeedback = ({ student_id, rating, comments }) => {
  const feed_id = nextId('feed_id');
  state.feedback.unshift({
    feed_id,
    student_id: Number(student_id),
    rating: Number(rating),
    comments: comments || null,
  });
  return feed_id;
};

const getAllFeedback = () => {
  return state.feedback.map((row) => {
    const student = getStudentById(row.student_id);
    return {
      ...row,
      name: student?.name || 'Unknown',
      dept: student?.dept || '',
    };
  });
};

const getFeedbackByStudent = (studentId) => {
  return getAllFeedback().filter((row) => row.student_id === Number(studentId));
};

const addLoginLog = ({ student_id, login_name, ip_address, status }) => {
  const log_id = nextId('log_id');
  state.loginLogs.unshift({
    log_id,
    student_id: student_id == null ? null : Number(student_id),
    login_name,
    ip_address,
    status,
    login_time: new Date().toISOString(),
  });
  pushTriggerLog(`Login recorded for student ID: ${student_id}`);
  return log_id;
};

const getLoginHistory = (studentId) => {
  return state.loginLogs
    .filter((row) => row.student_id === Number(studentId))
    .sort((a, b) => String(b.login_time).localeCompare(String(a.login_time)));
};

const getLoginLogs = () => [...state.loginLogs].slice(0, 50);
const getTriggerLogs = () => [...state.triggerLogs].slice(0, 50);

const getAdminStats = () => {
  const students = listStudents();
  const today = new Date().toISOString().slice(0, 10);
  const todayLogins = state.loginLogs.filter((row) => String(row.login_time).slice(0, 10) === today);
  const todayAttendance = state.attendance.filter((row) => row.date_val === today);
  const avgFeedback =
    state.feedback.length === 0
      ? 0
      : Number(
          (
            state.feedback.reduce((sum, row) => sum + Number(row.rating || 0), 0) /
            state.feedback.length
          ).toFixed(1)
        );

  return {
    totalStudents: students.length,
    loginsToday: todayLogins.length,
    failedLoginsToday: todayLogins.filter((row) => row.status === 'failed').length,
    avgFeedback,
    attendanceRate:
      todayAttendance.length === 0
        ? 0
        : Number(
            (
              (todayAttendance.filter((row) => row.status === 'present').length / todayAttendance.length) *
              100
            ).toFixed(1)
          ),
  };
};

const getMealSummary = () => {
  return listStudents().map((student) => ({
    student_id: student.student_id,
    name: student.name,
    dept: student.dept,
    meals_attended: student.present_count,
    plan_type: student.plan_type,
  }));
};

const demoAdmins = [
  {
    name: 'Mess Admin',
    role: 'admin',
    note: 'Use this for admin dashboard access during demo.',
  },
];

module.exports = {
  addFeedback,
  addLoginLog,
  addMenu,
  bulkAttendance,
  deleteStudent,
  demoAdmins,
  getAdminStats,
  getAllFeedback,
  getAttendanceByStudent,
  getFeedbackByStudent,
  getLoginHistory,
  getLoginLogs,
  getMealSummary,
  getMenu,
  getStudentById,
  getTodayAttendance,
  getTriggerLogs,
  listStudents,
  markAttendance,
  registerStudent,
  updateStudent,
  upsertAttendance,
};
