import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const navItems = [
  'Overview',
  'Students',
  'Attendance',
  'Menu Management',
  'Feedback',
  'Login Logs',
  'Trigger Logs',
  'DB Lab',
];

const defaultStudentForm = { name: '', dept: '', room_no: '', phone: '' };

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('Overview');
  const [menuForm, setMenuForm] = useState({ day: '', meal_type: 'lunch', food_items: '' });
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [triggerLogs, setTriggerLogs] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));
  const [bulkMealType, setBulkMealType] = useState('lunch');
  const [bulkStatuses, setBulkStatuses] = useState({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editForm, setEditForm] = useState(defaultStudentForm);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBaseData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        statsResponse,
        studentsResponse,
        feedbackResponse,
        loginLogsResponse,
        triggerLogsResponse,
        todayAttendanceResponse,
      ] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/student/all'),
        api.get('/feedback/all'),
        api.get('/admin/login-logs'),
        api.get('/admin/trigger-logs'),
        api.get('/admin/attendance/today'),
      ]);

      setStats(statsResponse.data.stats || null);
      setStudents(studentsResponse.data.students || []);
      setFeedbackRows(feedbackResponse.data.feedback || []);
      setLoginLogs(loginLogsResponse.data.logs || []);
      setTriggerLogs(triggerLogsResponse.data.logs || []);
      setTodayAttendance(todayAttendanceResponse.data.attendance || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const [loginResponse, triggerResponse, statsResponse] = await Promise.all([
          api.get('/admin/login-logs'),
          api.get('/admin/trigger-logs'),
          api.get('/admin/stats'),
        ]);

        setLoginLogs(loginResponse.data.logs || []);
        setTriggerLogs(triggerResponse.data.logs || []);
        setStats(statsResponse.data.stats || null);
      } catch {
        // silent refresh failure for polling
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (students.length === 0) {
      return;
    }

    setBulkStatuses((prev) => {
      const next = { ...prev };
      students.forEach((student) => {
        if (!next[student.student_id]) {
          next[student.student_id] = 'present';
        }
      });
      return next;
    });
  }, [students]);

  const attendanceRateDisplay = stats?.attendanceRate ?? 0;
  const avgFeedbackDisplay = stats?.avgFeedback ?? 0;

  const liveLoginPreview = loginLogs.slice(0, 10);

  const attendanceGrid = useMemo(() => {
    const grouped = {};
    todayAttendance.forEach((row) => {
      grouped[row.meal_type] = grouped[row.meal_type] || [];
      grouped[row.meal_type].push(row);
    });
    return grouped;
  }, [todayAttendance]);

  const addMenu = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/menu/add', menuForm);
      setMessage(data.message || 'Menu added successfully');
      setMenuForm({ day: '', meal_type: 'lunch', food_items: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to add menu');
    }
  };

  const fetchAttendanceByStudent = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!studentIdInput) {
      setError('Student ID is required');
      return;
    }

    try {
      const { data } = await api.get(`/attendance/student/${studentIdInput}`);
      setAttendanceRows(data.attendance || []);
      setAttendanceSummary(data.summary || null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch attendance');
    }
  };

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    setMessage('');
    setError('');

    try {
      const records = students.map((student) => ({
        student_id: student.student_id,
        status: bulkStatuses[student.student_id] || 'present',
      }));

      const { data } = await api.post('/admin/attendance/bulk', {
        date_val: bulkDate,
        meal_type: bulkMealType,
        records,
      });

      setMessage(data.message || 'Bulk attendance committed successfully');
      await loadBaseData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to commit bulk attendance');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const startEdit = (student) => {
    setEditingStudentId(student.student_id);
    setEditForm({
      name: student.name,
      dept: student.dept,
      room_no: student.room_no,
      phone: student.phone,
    });
  };

  const saveEdit = async (studentId) => {
    setMessage('');
    setError('');
    try {
      const { data } = await api.put(`/student/${studentId}`, editForm);
      setMessage(data.message || 'Student updated successfully');
      setEditingStudentId(null);
      await loadBaseData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update student');
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    setMessage('');
    setError('');
    try {
      const { data } = await api.delete(`/student/${deleteCandidate.student_id}`);
      setMessage(data.message || 'Student deleted successfully');
      setDeleteCandidate(null);
      await loadBaseData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete student');
    }
  };

  const exportCsv = () => {
    const headers = ['att_id', 'student_id', 'name', 'dept', 'room_no', 'date_val', 'meal_type', 'status'];
    const lines = [
      headers.join(','),
      ...todayAttendance.map((row) =>
        headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="admin-section-stack">
      <section className="stats-grid admin-stats-grid">
        <article className="student-stat-card glass-panel">
          <span>Total Students</span>
          <strong>{stats?.totalStudents ?? 0}</strong>
          <em>
            vs yesterday:{' '}
            {(stats?.studentChangeVsYesterday ?? 0) >= 0 ? '+' : ''}
            {stats?.studentChangeVsYesterday ?? 0}
          </em>
        </article>
        <article className="student-stat-card glass-panel">
          <span>Logins Today</span>
          <strong>{stats?.loginsToday ?? 0}</strong>
          <em>{stats?.failedLoginsToday ?? 0} failed</em>
        </article>
        <article className="student-stat-card glass-panel">
          <span>Avg Feedback Rating</span>
          <strong>{avgFeedbackDisplay}</strong>
          <em>across all student reviews</em>
        </article>
        <article className="student-stat-card glass-panel">
          <span>Today&apos;s Attendance Rate</span>
          <strong>{attendanceRateDisplay}%</strong>
          <em>present vs total marked</em>
        </article>
      </section>

      <section className="panel-section glass-panel">
        <div className="section-heading">
          <h3>🔴 Live Login Activity</h3>
          <span>auto-refreshes every 5 seconds</span>
        </div>
        <div className="log-list">
          {liveLoginPreview.map((log) => (
            <div key={log.log_id} className={`log-item ${log.status === 'failed' ? 'log-error' : ''}`}>
              <strong>{log.login_name || `Student ${log.student_id}`}</strong>
              <span>{String(log.login_time).replace('T', ' ').slice(0, 19)}</span>
              <em className={`status-pill status-${log.status}`}>{log.status}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderStudents = () => (
    <section className="panel-section glass-panel">
      <div className="section-heading">
        <h3>Student CRUD</h3>
        <span>edit and delete live records</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Room</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>
                  {editingStudentId === student.student_id ? (
                    <input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                  ) : (
                    student.name
                  )}
                </td>
                <td>
                  {editingStudentId === student.student_id ? (
                    <input value={editForm.dept} onChange={(e) => setEditForm((prev) => ({ ...prev, dept: e.target.value }))} />
                  ) : (
                    student.dept
                  )}
                </td>
                <td>
                  {editingStudentId === student.student_id ? (
                    <input value={editForm.room_no} onChange={(e) => setEditForm((prev) => ({ ...prev, room_no: e.target.value }))} />
                  ) : (
                    student.room_no
                  )}
                </td>
                <td>
                  {editingStudentId === student.student_id ? (
                    <input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  ) : (
                    student.phone
                  )}
                </td>
                <td>{student.plan_type}</td>
                <td className="action-cell">
                  {editingStudentId === student.student_id ? (
                    <>
                      <button className="btn" type="button" onClick={() => saveEdit(student.student_id)}>Save</button>
                      <button className="btn btn-admin" type="button" onClick={() => setEditingStudentId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn" type="button" onClick={() => startEdit(student)}>Edit</button>
                      <button className="btn btn-danger" type="button" onClick={() => setDeleteCandidate(student)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAttendance = () => (
    <div className="admin-section-stack">
      <section className="panel-section glass-panel">
        <div className="section-heading">
          <h3>Bulk Attendance Marking</h3>
          <span>{bulkSubmitting ? 'committing transaction...' : 'single transaction submit'}</span>
        </div>
        <div className="bulk-toolbar">
          <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
          <select value={bulkMealType} onChange={(e) => setBulkMealType(e.target.value)}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
          <button className="btn" type="button" onClick={handleBulkSubmit} disabled={bulkSubmitting}>
            {bulkSubmitting ? 'Committing...' : 'Commit Attendance'}
          </button>
        </div>
        <div className="bulk-student-list">
          {students.map((student) => (
            <div key={student.student_id} className="bulk-student-row">
              <strong>{student.name}</strong>
              <span>ID {student.student_id}</span>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${bulkStatuses[student.student_id] === 'present' ? 'is-selected present' : ''}`}
                  onClick={() => setBulkStatuses((prev) => ({ ...prev, [student.student_id]: 'present' }))}
                >
                  Present
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${bulkStatuses[student.student_id] === 'absent' ? 'is-selected absent' : ''}`}
                  onClick={() => setBulkStatuses((prev) => ({ ...prev, [student.student_id]: 'absent' }))}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section glass-panel">
        <div className="section-heading">
          <h3>Color-Coded Attendance Table</h3>
          <span>today&apos;s records</span>
        </div>
        <button className="btn btn-admin" type="button" onClick={exportCsv}>
          Export CSV
        </button>
        <div className="attendance-chip-grid">
          {Object.entries(attendanceGrid).map(([mealType, rows]) => (
            <div key={mealType} className="attendance-chip-column">
              <h4>{mealType}</h4>
              {rows.map((row) => (
                <div key={row.att_id} className={`attendance-chip attendance-${row.status}`}>
                  <strong>{row.name || row.student_id}</strong>
                  <span>{row.status}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section glass-panel">
        <h3>View Attendance by Student</h3>
        <form className="form-grid" onSubmit={fetchAttendanceByStudent}>
          <input type="number" placeholder="Student ID" value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} required />
          <button className="btn btn-admin" type="submit">Load Attendance</button>
        </form>
        {attendanceSummary && (
          <p className="helper-text">
            Total: {attendanceSummary.total_marks || 0}, Present: {attendanceSummary.total_present || 0}, Absent: {attendanceSummary.total_absent || 0}
          </p>
        )}
        {attendanceRows.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attendance ID</th>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Status</th>
                  <th>Student</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((row) => (
                  <tr key={row.att_id}>
                    <td>{row.att_id}</td>
                    <td>{String(row.date_val).slice(0, 10)}</td>
                    <td>{row.meal_type}</td>
                    <td>{row.status}</td>
                    <td>{row.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderMenu = () => (
    <section className="panel-section glass-panel">
      <h3>Menu Management</h3>
      <form className="form-grid" onSubmit={addMenu}>
        <input type="text" placeholder="Day (e.g. Monday)" value={menuForm.day} onChange={(e) => setMenuForm((p) => ({ ...p, day: e.target.value }))} required />
        <select value={menuForm.meal_type} onChange={(e) => setMenuForm((p) => ({ ...p, meal_type: e.target.value }))}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <input type="text" placeholder="Food items" value={menuForm.food_items} onChange={(e) => setMenuForm((p) => ({ ...p, food_items: e.target.value }))} required />
        <button className="btn btn-admin" type="submit">Add Menu</button>
      </form>
    </section>
  );

  const renderFeedback = () => (
    <section className="panel-section glass-panel">
      <h3>Feedback</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feedback ID</th>
              <th>Student ID</th>
              <th>Student</th>
              <th>Dept</th>
              <th>Rating</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {feedbackRows.map((row) => (
              <tr key={row.feed_id}>
                <td>{row.feed_id}</td>
                <td>{row.student_id}</td>
                <td>{row.name}</td>
                <td>{row.dept}</td>
                <td>{row.rating}</td>
                <td>{row.comments || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderLoginLogs = () => (
    <section className="panel-section glass-panel">
      <h3>Login Logs</h3>
      <div className="log-list">
        {loginLogs.map((log) => (
          <div key={log.log_id} className={`log-item ${log.status === 'failed' ? 'log-error' : ''}`}>
            <strong>{log.login_name || `Student ${log.student_id}`}</strong>
            <span>{String(log.login_time).replace('T', ' ').slice(0, 19)}</span>
            <em className={`status-pill status-${log.status}`}>{log.status}</em>
          </div>
        ))}
      </div>
    </section>
  );

  const renderTriggerLogs = () => (
    <section className="panel-section glass-panel">
      <div className="section-heading">
        <h3>Trigger Logs</h3>
        <span>These entries are auto-created by MySQL triggers</span>
      </div>
      <div className="log-list">
        {triggerLogs.map((log) => (
          <div key={log.id} className="log-item">
            <strong>{String(log.event_desc).toLowerCase().includes('login') ? 'Login Event' : 'Registration Event'}</strong>
            <span>{log.event_desc}</span>
            <em>{String(log.fired_at).replace('T', ' ').slice(0, 19)}</em>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSection = () => {
    if (loading) {
      return (
        <div className="admin-section-stack">
          <div className="skeleton-block shimmer" />
          <div className="skeleton-block shimmer" />
        </div>
      );
    }

    switch (activeSection) {
      case 'Overview':
        return renderOverview();
      case 'Students':
        return renderStudents();
      case 'Attendance':
        return renderAttendance();
      case 'Menu Management':
        return renderMenu();
      case 'Feedback':
        return renderFeedback();
      case 'Login Logs':
        return renderLoginLogs();
      case 'Trigger Logs':
        return renderTriggerLogs();
      case 'DB Lab':
        return (
          <section className="panel-section glass-panel">
            <h3>Database Lab</h3>
            <p className="muted-text">Open the dedicated SQL demo workspace from here.</p>
            <Link className="btn btn-admin" to="/lab">Open DB Lab</Link>
          </section>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <div className="admin-shell">
        <aside className="admin-sidebar glass-panel">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`admin-sidebar-link ${activeSection === item ? 'is-active' : ''}`}
              onClick={() => setActiveSection(item)}
            >
              {item}
            </button>
          ))}
        </aside>

        <div className="admin-content">
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          {renderSection()}
        </div>
      </div>

      {deleteCandidate && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Are you sure?</h3>
            <p>This will also delete all attendance and feedback records for this student.</p>
            <div className="action-row">
              <button className="btn btn-danger" type="button" onClick={confirmDelete}>Delete</button>
              <button className="btn btn-admin" type="button" onClick={() => setDeleteCandidate(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
