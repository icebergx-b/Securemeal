import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const AdminDashboard = () => {
  const [foodListings, setFoodListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  const fetchClaimedFood = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/food/claimed');
      setFoodListings(data.foodListings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch claimed food');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimedFood();
  }, []);

  const handleApprove = async (foodId) => {
    setMessage('');
    setError('');
    setApprovingId(foodId);

    try {
      const { data } = await api.put('/food/approve', { food_id: foodId });
      setMessage(data.message || 'Food approved successfully');
      await fetchClaimedFood();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve food');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <div className="admin-note">
        <strong>Operations Panel:</strong> Review claimed entries and confirm pickup completion.
      </div>
      <h2>Claimed Food Listings</h2>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : foodListings.length === 0 ? (
        <p>No claimed food pending approval.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Hostel</th>
                <th>NGO</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {foodListings.map((food) => (
                <tr key={food.id}>
                  <td>{food.id}</td>
                  <td>{food.description}</td>
                  <td>{food.hostel_name}</td>
                  <td>{food.ngo_name || 'Not assigned'}</td>
                  <td>{food.quantity}</td>
                  <td>
                    <span className="badge badge-claimed">{food.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-admin"
                      type="button"
                      onClick={() => handleApprove(food.id)}
                      disabled={approvingId === food.id}
                    >
                      {approvingId === food.id ? 'Approving...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
