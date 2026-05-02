import { Link, useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('name') || 'User';
  const roleLabel = role === 'admin' ? 'Admin' : 'Student';
  const navItems = role === 'admin'
    ? [
        { to: '/admin', label: 'Operations' },
        { to: '/lab', label: 'Database Lab' },
      ]
    : [{ to: '/student', label: 'Dashboard' }];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('student_id');
    navigate('/login');
  };

  return (
    <div className={`dashboard-page dashboard-${role}`}>
      <header className="dashboard-header">
        <div>
          <h1>{title}</h1>
          <p>{roleLabel}: {userName}</p>
        </div>
        <div className="header-actions">
          <nav className="dashboard-nav">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`dashboard-nav-link ${location.pathname === item.to ? 'is-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <section className="dashboard-card glass-panel">{children}</section>
    </div>
  );
};

export default DashboardLayout;
