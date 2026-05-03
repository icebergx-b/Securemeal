import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { localDemoStudents } from '../demoData';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    room_no: '',
    phone: '',
    plan_type: 'regular',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentStudents, setRecentStudents] = useState(localDemoStudents);

  const loadRecentStudents = async () => {
    try {
      const { data } = await api.get('/student/all');
      if (Array.isArray(data.students) && data.students.length > 0) {
        setRecentStudents(data.students.slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to load recent students', err);
    }
  };

  useEffect(() => {
    loadRecentStudents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setStudentId('');
    setLoading(true);

    try {
      const { data } = await api.post('/student/register', formData);
      setSuccess(data.message || 'Student registered successfully');
      setStudentId(String(data.student_id || ''));
      setFormData({
        name: '',
        dept: '',
        room_no: '',
        phone: '',
        plan_type: 'regular',
      });
      await loadRecentStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Student Registration</h1>
          <input type="text" name="name" placeholder="Student name" value={formData.name} onChange={handleChange} required />
          <input type="text" name="dept" placeholder="Department" value={formData.dept} onChange={handleChange} required />
          <input type="text" name="room_no" placeholder="Room number" value={formData.room_no} onChange={handleChange} required />
          <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
          <select name="plan_type" value={formData.plan_type} onChange={handleChange}>
            <option value="regular">Regular</option>
            <option value="veg">Veg</option>
            <option value="special">Special</option>
          </select>
          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
          {studentId && <p className="success-text">Your Student ID: {studentId}</p>}
          <button className="btn btn-wide" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="helper-text">Already registered? <Link to="/login">Go to login</Link></p>
        </form>

        <aside className="auth-card demo-card">
          <h2>Recent Students</h2>
          <p className="helper-text">
            Newly added students appear here so you can quickly verify registration and use them for login.
          </p>
          <div className="demo-list">
            {recentStudents.map((student) => (
              <div key={student.student_id} className="demo-item demo-item-static">
                <strong>{student.name}</strong>
                <span>ID: {student.student_id}</span>
                <span>{student.dept} • Room {student.room_no}</span>
                <span>{student.phone} • {student.plan_type} plan</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Register;
