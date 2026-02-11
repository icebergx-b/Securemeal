import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className={`dashboard-page dashboard-${role}`}>
      <header className="dashboard-header">
        <div>
          <h1>{title}</h1>
          <p>Role: {role}</p>
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
