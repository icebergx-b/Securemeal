import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('name') || 'User';
  const roleLabel = role === 'admin' ? 'Admin' : 'Student';

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
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <section className="dashboard-card glass-panel">{children}</section>
    </div>
  );
};

export default DashboardLayout;
