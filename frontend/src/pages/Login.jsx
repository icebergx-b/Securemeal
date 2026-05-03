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
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [createdStudentId, setCreatedStudentId] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [demoStudents, setDemoStudents] = useState(localDemoStudents);
  const [demoAdmins, setDemoAdmins] = useState(localDemoAdmins);
  const [quickStudentForm, setQuickStudentForm] = useState({
    name: '',
    dept: '',
    room_no: '',
    phone: '',
    plan_type: 'regular',
  });
  const navigate = useNavigate();

  const loadStudents = async () => {
    try {
      const { data } = await api.get('/student/all');
      if (Array.isArray(data.students) && data.students.length > 0) {
        setDemoStudents(data.students.slice(0, 8));
      }
      if (Array.isArray(data.demo_admins) && data.demo_admins.length > 0) {
        setDemoAdmins(data.demo_admins);
      }
    } catch (err) {
      console.error('Failed to load student sidebar data', err);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickStudentChange = (event) => {
    const { name, value } = event.target;
    setQuickStudentForm((prev) => ({ ...prev, [name]: value }));
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

  const handleQuickRegister = async (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setCreatedStudentId('');
    setRegisterLoading(true);

    try {
      const { data } = await api.post('/student/register', quickStudentForm);
      const studentId = String(data.student_id || '');
      setRegisterSuccess(data.message || 'Student registered successfully');
      setCreatedStudentId(studentId);
      setQuickStudentForm({
        name: '',
        dept: '',
        room_no: '',
        phone: '',
        plan_type: 'regular',
      });
      setFormData({
        name: quickStudentForm.name,
        role: 'student',
        student_id: studentId,
      });
      await loadStudents();
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Failed to register student');
    } finally {
      setRegisterLoading(false);
    }
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
          <h2>Recent Students</h2>
          <p className="helper-text">
            Use the latest students directly from the sidebar so you do not need to remember names, IDs, rooms, or plan details.
          </p>

          <div className="demo-section">
            <h3>Login from sidebar</h3>
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
            <h3>Quick Add Student</h3>
            <form className="compact-form" onSubmit={handleQuickRegister}>
              <input
                type="text"
                name="name"
                placeholder="Student name"
                value={quickStudentForm.name}
                onChange={handleQuickStudentChange}
                required
              />
              <input
                type="text"
                name="dept"
                placeholder="Department"
                value={quickStudentForm.dept}
                onChange={handleQuickStudentChange}
                required
              />
              <input
                type="text"
                name="room_no"
                placeholder="Room number"
                value={quickStudentForm.room_no}
                onChange={handleQuickStudentChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={quickStudentForm.phone}
                onChange={handleQuickStudentChange}
                required
              />
              <select
                name="plan_type"
                value={quickStudentForm.plan_type}
                onChange={handleQuickStudentChange}
              >
                <option value="regular">Regular</option>
                <option value="veg">Veg</option>
                <option value="special">Special</option>
              </select>
              {registerError && <p className="error-text">{registerError}</p>}
              {registerSuccess && <p className="success-text">{registerSuccess}</p>}
              {createdStudentId && (
                <p className="success-text">
                  Added student ID: {createdStudentId}. The login form is prefilled above.
                </p>
              )}
              <button type="submit" className="btn btn-wide" disabled={registerLoading}>
                {registerLoading ? 'Adding...' : 'Add Student'}
              </button>
            </form>
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
