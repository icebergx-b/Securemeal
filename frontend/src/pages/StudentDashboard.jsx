import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const StudentDashboard = () => {
  const [menuRows, setMenuRows] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const studentId = localStorage.getItem('student_id');
  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isInteger(numericStudentId) && numericStudentId > 0;

  const [attendanceForm, setAttendanceForm] = useState({
    date_val: new Date().toISOString().slice(0, 10),
    meal_type: 'lunch',
    status: 'present',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: '',
  });

  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const { data } = await api.get('/menu');
      setMenuRows(data.menu || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch menu');
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const markAttendance = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/attendance/mark', {
        student_id: Number(studentId),
        ...attendanceForm,
      });
      setMessage(data.message || 'Attendance marked');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/feedback/add', {
        student_id: Number(studentId),
        rating: Number(feedbackForm.rating),
        comments: feedbackForm.comments,
      });
      setMessage(data.message || 'Feedback submitted');
      setFeedbackForm({ rating: 5, comments: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  return (
    <DashboardLayout title="Student Dashboard" role="student">
      <p className="info-banner">
        Quick demo tip: use one of the sample student IDs from the login page if you want a fast walkthrough without registering a new student first.
      </p>

      <h2>Mess Menu</h2>
      {menuLoading ? (
        <p>Loading menu...</p>
      ) : menuRows.length === 0 ? (
        <p>No menu available.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Day</th>
                <th>Meal</th>
                <th>Food Items</th>
              </tr>
            </thead>
            <tbody>
              {menuRows.map((row) => (
                <tr key={row.menu_id}>
                  <td>{row.menu_id}</td>
                  <td>{row.day}</td>
                  <td>{row.meal_type}</td>
                  <td>{row.food_items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 20 }}>Mark Attendance</h2>
      {!hasValidStudentId && (
        <p className="error-text">
          Invalid Student ID in session. Please login again with a valid Student ID.
        </p>
      )}
      <form className="form-grid" onSubmit={markAttendance}>
        <input type="date" value={attendanceForm.date_val} onChange={(e) => setAttendanceForm((p) => ({ ...p, date_val: e.target.value }))} required />
        <select value={attendanceForm.meal_type} onChange={(e) => setAttendanceForm((p) => ({ ...p, meal_type: e.target.value }))}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <select value={attendanceForm.status} onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value }))}>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <button className="btn" type="submit" disabled={!hasValidStudentId}>Mark</button>
      </form>

      <h2 style={{ marginTop: 20 }}>Submit Feedback</h2>
      <form className="form-grid" onSubmit={submitFeedback}>
        <select value={feedbackForm.rating} onChange={(e) => setFeedbackForm((p) => ({ ...p, rating: e.target.value }))}>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
        <input type="text" placeholder="Comments" value={feedbackForm.comments} onChange={(e) => setFeedbackForm((p) => ({ ...p, comments: e.target.value }))} />
        <button className="btn" type="submit" disabled={!hasValidStudentId}>Submit</button>
      </form>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </DashboardLayout>
  );
};

export default StudentDashboard;
