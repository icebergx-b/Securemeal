import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const AdminDashboard = () => {
  const [menuForm, setMenuForm] = useState({ day: '', meal_type: 'lunch', food_items: '' });
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchFeedback = async () => {
    try {
      const { data } = await api.get('/feedback/all');
      setFeedbackRows(data.feedback || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const addMenu = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/menu/add', menuForm);
      setMessage(data.message || 'Menu added successfully');
      setMenuForm({ day: '', meal_type: 'lunch', food_items: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu');
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
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <p className="info-banner">
        Demo mode is supported, so menu, attendance, and feedback can still be shown if the MySQL database is temporarily unavailable.
      </p>

      <h2>Add Menu</h2>
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

      <h2 style={{ marginTop: 20 }}>View Attendance by Student</h2>
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
                  <td>{row.date_val?.slice?.(0, 10) || row.date_val}</td>
                  <td>{row.meal_type}</td>
                  <td>{row.status}</td>
                  <td>{row.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 20 }}>Feedback</h2>
      {feedbackRows.length === 0 ? (
        <p>No feedback submitted yet.</p>
      ) : (
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
      )}

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </DashboardLayout>
  );
};

export default AdminDashboard;
