import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const roleRouteMap = {
  student: '/student',
  admin: '/admin',
};

const Login = () => {
  const [formData, setFormData] = useState({
    role: 'student',
    student_id: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectorOpen && studentOptions.length === 0) {
      loadStudents();
    }
  }, [selectorOpen, studentOptions.length]);

  const loadStudents = async () => {
    setStudentLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/students');
      setStudentOptions(data.students || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load registered students');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.role === 'student' && !formData.student_id) {
      setError('Please select a registered student first');
      return;
    }

    if (formData.role === 'student' && !formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.role === 'admin' && !formData.name) {
      setError('Admin name is required');
      return;
    }

    try {
      const { data } = await api.post('/auth/login', formData);
      const user = data.user || {};

      localStorage.setItem('token', data.token || 'session-active');
      localStorage.setItem('role', user.role || formData.role);
      localStorage.setItem('name', user.name || formData.name);
      localStorage.setItem('student_id', String(user.student_id || formData.student_id || ''));

      navigate(roleRouteMap[user.role || formData.role]);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const applyStudentSelection = (student) => {
    setError('');
    setFormData({
      role: 'student',
      student_id: String(student.student_id),
      password: '',
      name: student.name,
    });
    setSelectorOpen(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="mission-banner">
            <p className="mission-tag">Hostel Mess Management System</p>
            <h1>Welcome Back to the Mess Hall</h1>
            <p className="mission-text">
              Secure student login, auto-marked attendance, and a delicious weekly menu in one place.
            </p>
            <p className="mission-quote">
              Fresh meals, smooth attendance, and a vibrant dining experience for every hostel day.
            </p>
          </div>

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          {formData.role === 'student' ? (
            <>
              <button
                type="button"
                className="btn btn-selector"
                onClick={() => setSelectorOpen((prev) => !prev)}
              >
                {formData.name ? `Selected: ${formData.name}` : 'Select Registered Student'}
              </button>

              {selectorOpen && (
                <div className="student-selector-panel">
                  {studentLoading ? (
                    <div className="selector-skeleton shimmer" />
                  ) : (
                    <div className="selector-grid">
                      {studentOptions.map((student) => (
                        <button
                          key={student.student_id}
                          type="button"
                          className="selector-student-card"
                          onClick={() => applyStudentSelection(student)}
                        >
                          <strong>{student.name}</strong>
                          <span>ID: {student.student_id}</span>
                          <span>{student.dept} • Room {student.room_no}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <input
              type="text"
              name="name"
              placeholder="Admin name"
              value={formData.name}
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

        <aside className="auth-card demo-card login-illustration-card">
          <div className="food-illustration-cloud food-illustration-cloud-top" />
          <div className="food-illustration-cloud food-illustration-cloud-bottom" />
          <div className="login-hero-copy">
            <p className="mission-tag">Deliciously Organized</p>
            <h2>Today's mess feels like a premium food app.</h2>
            <p className="helper-text">
              Warm menus, instant attendance, and student-specific access built on live MySQL tables.
            </p>
          </div>
          <div className="plate-scene floating-scene" aria-hidden="true">
            <svg viewBox="0 0 420 280" className="plate-svg">
              <defs>
                <linearGradient id="sunrise" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <circle cx="340" cy="52" r="28" fill="#fde68a" />
              <ellipse cx="210" cy="186" rx="136" ry="70" fill="#fff7ed" stroke="#fdba74" strokeWidth="8" />
              <ellipse cx="210" cy="186" rx="92" ry="44" fill="#fef3c7" />
              <path d="M162 165c15-24 40-32 71-28 25 3 42 16 57 34-27 15-54 22-81 19-25-2-42-10-47-25z" fill="url(#sunrise)" />
              <circle cx="170" cy="158" r="16" fill="#16a34a" />
              <circle cx="262" cy="170" r="14" fill="#22c55e" />
              <circle cx="216" cy="153" r="11" fill="#fef08a" />
              <path d="M114 214c36 15 158 15 194-2" fill="none" stroke="#fb923c" strokeWidth="7" strokeLinecap="round" />
              <path d="M96 92c22-18 48-22 68-12" fill="none" stroke="#fdba74" strokeWidth="6" strokeLinecap="round" />
              <path d="M286 88c20-8 40-4 58 11" fill="none" stroke="#fdba74" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="taste-notes">
            <div className="taste-chip">Weekly breakfast, lunch, dinner menus</div>
            <div className="taste-chip">Auto attendance on secure student login</div>
            <div className="taste-chip">Feedback, audit logs, and live DB visibility</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
