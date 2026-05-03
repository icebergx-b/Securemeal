import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { localDemoStudents } from '../demoData';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
        email: '',
        password: '',
        dept: '',
        room_no: '',
        phone: '',
        plan_type: 'regular',
      });
      await loadRecentStudents();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
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
          <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required />
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

        <aside className="auth-card demo-card login-illustration-card">
          <div className="login-hero-copy">
            <p className="mission-tag">Fresh Enrolment</p>
            <h2>Create a secure student account for mess access.</h2>
            <p className="helper-text">
              Every newly registered student lands directly in MySQL with live visibility in SQL Workbench.
            </p>
          </div>
          <div className="taste-notes">
            <div className="taste-chip">Unique password per student</div>
            <div className="taste-chip">Dynamic menu + attendance dashboards</div>
            <div className="taste-chip">Immediate database updates for lab demos</div>
          </div>
          <div className="demo-list">
            {recentStudents.map((student) => (
              <div key={student.student_id} className="demo-item demo-item-static">
                <strong>{student.name}</strong>
                <span>ID: {student.student_id}</span>
                <span>{student.email || 'Email stored in database'}</span>
                <span>{student.dept} • Room {student.room_no}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Register;
