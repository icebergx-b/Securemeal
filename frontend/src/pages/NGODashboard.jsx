import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const NGODashboard = () => {
  const [foodListings, setFoodListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [claimingId, setClaimingId] = useState(null);

  const fetchAvailableFood = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/food/available');
      setFoodListings(data.foodListings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch available food');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableFood();
  }, []);

  const handleClaim = async (foodId) => {
    setMessage('');
    setError('');
    setClaimingId(foodId);

    try {
      const { data } = await api.post('/food/claim', { food_id: foodId });
      setMessage(data.message || 'Food claimed successfully');
      await fetchAvailableFood();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim food');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <DashboardLayout title="NGO Dashboard" role="ngo">
      <div className="doodle-banner doodle-ngo">
        <div>
          <h3>Sunshine, Smiles, and Shared Meals</h3>
          <p>Claim available food and deliver hope to children and families.</p>
        </div>
        <svg viewBox="0 0 260 120" className="doodle-svg" aria-hidden="true">
          <circle cx="210" cy="28" r="16" fill="#facc15" />
          <path d="M46 86 C80 52, 112 52, 144 86" stroke="#22c55e" strokeWidth="5" fill="none" />
          <circle cx="74" cy="56" r="8" fill="#60a5fa" />
          <circle cx="112" cy="52" r="8" fill="#f472b6" />
          <path d="M74 64 L74 86 M112 60 L112 86" stroke="#334155" strokeWidth="3" />
          <path d="M64 90 Q74 102 84 90 M102 90 Q112 102 122 90" stroke="#334155" strokeWidth="3" fill="none" />
        </svg>
      </div>
      <h2>Available Food Listings</h2>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : foodListings.length === 0 ? (
        <p>No available food right now.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Hostel</th>
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
                  <td>{food.quantity}</td>
                  <td>
                    <span className="badge badge-available">{food.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ngo"
                      type="button"
                      onClick={() => handleClaim(food.id)}
                      disabled={claimingId === food.id}
                    >
                      {claimingId === food.id ? 'Claiming...' : 'Claim'}
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

export default NGODashboard;
