import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const roleRouteMap = {
  hostel: '/hostel',
  ngo: '/ngo',
  admin: '/admin',
};

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      navigate(roleRouteMap[data.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="mission-banner">
          <p className="mission-tag">SecureMeal Mission</p>
          <h1>Together, We Can Eliminate Hunger</h1>
          <p className="mission-text">
            Every surplus meal can become someone’s next hope. Sign in to turn compassion into action.
          </p>
          <blockquote className="mission-quote">
            “No one has ever become poor by giving.”
          </blockquote>
          <blockquote className="mission-quote">
            “If you can’t feed a hundred people, then feed just one.”
          </blockquote>
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-wide" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
        <p className="helper-text">
          New to SecureMeal? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
