import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { localDemoAdmins, localDemoStudents } from '../demoData';
import api from '../services/api';

const roleRouteMap = {
  student: '/student',
  admin: '/admin',
};

const Login = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    student_id: '',
  });
  const [error, setError] = useState('');
  const [demoStudents, setDemoStudents] = useState(localDemoStudents);
  const [demoAdmins, setDemoAdmins] = useState(localDemoAdmins);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDemoAccounts = async () => {
      try {
        const { data } = await api.get('/student/all');
        if (Array.isArray(data.students) && data.students.length > 0) {
          setDemoStudents(data.students.slice(0, 6));
        }
        if (Array.isArray(data.demo_admins) && data.demo_admins.length > 0) {
          setDemoAdmins(data.demo_admins);
        }
      } catch (err) {
        console.error('Failed to load demo accounts', err);
      }
    };

    loadDemoAccounts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Name is required');
      return;
    }

    if (formData.role === 'student' && !formData.student_id) {
      setError('Student ID is required for student login');
      return;
    }

    localStorage.setItem('token', 'session-active');
    localStorage.setItem('role', formData.role);
    localStorage.setItem('name', formData.name);
    localStorage.setItem('student_id', formData.student_id || '');

    navigate(roleRouteMap[formData.role]);
  };

  const applyDemoLogin = ({ name, role, student_id }) => {
    setError('');
    setFormData({
      name,
      role,
      student_id: student_id ? String(student_id) : '',
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="mission-banner">
            <p className="mission-tag">Hostel Mess Management System</p>
            <h1>Student Mess Operations Portal</h1>
            <p className="mission-text">
              Manage menu, attendance, and feedback in one centralized DBMS system.
            </p>
          </div>

          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          {formData.role === 'student' && (
            <input
              type="number"
              name="student_id"
              placeholder="Student ID"
              value={formData.student_id}
              onChange={handleChange}
              required
            />
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-wide" type="submit">
            Login
          </button>

          <p className="helper-text">
            New student? <Link to="/register">Register here</Link>
          </p>
        </form>

        <aside className="auth-card demo-card">
          <h2>Ready Demo Accounts</h2>
          <p className="helper-text">
            Use these sample entries so you do not need to remember names, IDs, rooms, or plan details.
          </p>

          <div className="demo-section">
            <h3>Students</h3>
            <div className="demo-list">
              {demoStudents.map((student) => (
                <button
                  key={student.student_id}
                  type="button"
                  className="demo-item"
                  onClick={() =>
                    applyDemoLogin({
                      name: student.name,
                      role: 'student',
                      student_id: student.student_id,
                    })
                  }
                >
                  <strong>{student.name}</strong>
                  <span>ID: {student.student_id}</span>
                  <span>{student.dept} • Room {student.room_no}</span>
                  <span>{student.plan_type} plan</span>
                </button>
              ))}
            </div>
          </div>

          <div className="demo-section">
            <h3>Admin</h3>
            <div className="demo-list">
              {demoAdmins.map((admin) => (
                <button
                  key={admin.name}
                  type="button"
                  className="demo-item"
                  onClick={() => applyDemoLogin({ name: admin.name, role: 'admin' })}
                >
                  <strong>{admin.name}</strong>
                  <span>Role: admin</span>
                  <span>{admin.note}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
