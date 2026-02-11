import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const HostelDashboard = () => {
  const [formData, setFormData] = useState({
    description: '',
    quantity: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const payload = {
        description: formData.description,
        quantity: Number(formData.quantity),
      };
      const { data } = await api.post('/food/add', payload);
      setSuccess(data.message || 'Food listing added successfully');
      setFormData({ description: '', quantity: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add food listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Hostel Dashboard" role="hostel">
      <div className="doodle-banner doodle-hostel">
        <div>
          <h3>Fresh Meals, Warm Smiles</h3>
          <p>Share surplus food quickly so no plate stays empty tonight.</p>
        </div>
        <svg viewBox="0 0 240 120" className="doodle-svg" aria-hidden="true">
          <ellipse cx="120" cy="72" rx="76" ry="28" fill="#fde68a" />
          <circle cx="100" cy="66" r="10" fill="#f97316" />
          <circle cx="122" cy="62" r="9" fill="#34d399" />
          <circle cx="142" cy="68" r="8" fill="#f43f5e" />
          <path d="M45 58 C58 34, 76 34, 88 58" stroke="#475569" strokeWidth="3" fill="none" />
          <path d="M154 58 C167 34, 185 34, 198 58" stroke="#475569" strokeWidth="3" fill="none" />
        </svg>
      </div>
      <h2>Add Food Listing</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          type="text"
          name="description"
          placeholder="Food description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          min="1"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
        <button className="btn btn-hostel" type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Food'}
        </button>
      </form>
      {success && <p className="success-text">{success}</p>}
      {error && <p className="error-text">{error}</p>}
    </DashboardLayout>
  );
};

export default HostelDashboard;
