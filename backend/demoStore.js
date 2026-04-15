const now = new Date().toISOString();

const state = {
  students: [
    {
      student_id: 101,
      name: 'Aarav Sharma',
      dept: 'CSE',
      room_no: 'A-101',
      phone: '9876543210',
      plan_type: 'regular',
      created_at: now,
    },
    {
      student_id: 102,
      name: 'Diya Patel',
      dept: 'ECE',
      room_no: 'B-204',
      phone: '9876501234',
      plan_type: 'veg',
      created_at: now,
    },
    {
      student_id: 103,
      name: 'Rohan Verma',
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
    { att_id: 1, student_id: 101, date_val: '2026-04-13', meal_type: 'lunch', status: 'present' },
    { att_id: 2, student_id: 102, date_val: '2026-04-13', meal_type: 'lunch', status: 'present' },
    { att_id: 3, student_id: 103, date_val: '2026-04-13', meal_type: 'lunch', status: 'absent' },
  ],
  feedback: [
    { feed_id: 1, student_id: 101, rating: 5, comments: 'Food quality is good and service is fast.' },
    { feed_id: 2, student_id: 102, rating: 4, comments: 'Need more fruit options during breakfast.' },
  ],
};

const counters = {
  student_id: Math.max(...state.students.map((student) => student.student_id)),
  menu_id: Math.max(...state.menu.map((row) => row.menu_id)),
  att_id: Math.max(...state.attendance.map((row) => row.att_id)),
  feed_id: Math.max(...state.feedback.map((row) => row.feed_id)),
};

const nextId = (key) => {
  counters[key] += 1;
  return counters[key];
};

const listStudents = () => {
  return [...state.students]
    .map((student) => {
      const attendanceRows = state.attendance.filter((row) => row.student_id === student.student_id);
      const presentCount = attendanceRows.filter((row) => row.status === 'present').length;

      return {
        student_id: student.student_id,
        name: student.name,
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

const registerStudent = ({ name, dept, room_no, phone, plan_type }) => {
  const student_id = nextId('student_id');

  state.students.push({
    student_id,
    name,
    dept,
    room_no,
    phone,
    plan_type: plan_type || 'regular',
    created_at: new Date().toISOString(),
  });

  return student_id;
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

const markAttendance = ({ student_id, date_val, meal_type, status }) => {
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

const demoAdmins = [
  {
    name: 'Mess Admin',
    role: 'admin',
    note: 'Use this for admin dashboard access during demo.',
  },
];

module.exports = {
  listStudents,
  registerStudent,
  getStudentById,
  getMenu,
  addMenu,
  markAttendance,
  getAttendanceByStudent,
  addFeedback,
  getAllFeedback,
  demoAdmins,
};
