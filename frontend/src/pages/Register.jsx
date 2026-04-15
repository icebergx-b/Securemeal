import { useState } from 'react';
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
          <h2>Existing Demo Students</h2>
          <p className="helper-text">
            These sample students are already available for quick login and easier live demonstration.
          </p>
          <div className="demo-list">
            {localDemoStudents.map((student) => (
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
