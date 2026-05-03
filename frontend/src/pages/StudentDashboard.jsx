import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const mealTypes = ['breakfast', 'lunch', 'dinner'];
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatDate = (value) => String(value).slice(0, 10);
const getCurrentMealWindow = () => {
  const hour = new Date().getHours();
  if (hour < 10) {
    return 'breakfast';
  }
  if (hour < 16) {
    return 'lunch';
  }
  return 'dinner';
};

const Toast = ({ toast }) =>
  toast ? <div className={`toast-banner toast-${toast.type}`}>{toast.message}</div> : null;

const SkeletonCard = () => <div className="skeleton-card shimmer" />;

const StudentDashboard = () => {
  const studentId = localStorage.getItem('student_id');
  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isInteger(numericStudentId) && numericStudentId > 0;
  const [menuRows, setMenuRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState({
    mealsThisMonth: 0,
    mealStreak: 0,
    avgFeedback: null,
    messPlan: 'regular',
  });
  const [loading, setLoading] = useState(true);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [attendanceLocked, setAttendanceLocked] = useState(false);
  const [feedbackLocked, setFeedbackLocked] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const [attendanceForm, setAttendanceForm] = useState({
    date_val: new Date().toISOString().slice(0, 10),
    meal_type: getCurrentMealWindow(),
    status: 'present',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: '',
  });
  const currentHour = new Date().getHours();
  const activeMeal = getCurrentMealWindow();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const alreadyMarked = attendanceRows.some(
      (row) => formatDate(row.date_val) === today && row.meal_type === activeMeal
    );
    setAttendanceLocked(alreadyMarked);
  }, [activeMeal, attendanceRows]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [menuResponse, attendanceResponse, statsResponse, historyResponse] = await Promise.all([
        api.get('/menu'),
        api.get(`/student/${numericStudentId}/attendance`),
        api.get(`/student/${numericStudentId}/stats`),
        api.get(`/student/${numericStudentId}/login-history`),
      ]);

      setMenuRows(menuResponse.data.menu || []);
      setAttendanceRows(attendanceResponse.data.attendance || []);
      setStats(statsResponse.data.stats || stats);
      setLoginHistory((historyResponse.data.loginHistory || []).slice(0, 10));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidStudentId) {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [hasValidStudentId, numericStudentId]);

  const weeklyAttendance = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    return weekdayLabels.map((label, index) => {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + index);
      const dateKey = currentDate.toISOString().slice(0, 10);
      const slots = mealTypes.map((mealType) => {
        const row = attendanceRows.find(
          (item) => formatDate(item.date_val) === dateKey && item.meal_type === mealType
        );

        if (row) {
          return { mealType, status: row.status };
        }

        if (currentDate > new Date()) {
          return { mealType, status: 'upcoming' };
        }

        return { mealType, status: 'unmarked' };
      });

      return {
        label,
        dateKey,
        slots,
      };
    });
  }, [attendanceRows]);

  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  const todaysMenu = useMemo(() => {
    return mealTypes.map((mealType) => {
      const menuItem = menuRows.find(
        (row) => String(row.day).toLowerCase() === todayLabel.toLowerCase() && row.meal_type === mealType
      );
      const attendance = attendanceRows.find(
        (row) => formatDate(row.date_val) === new Date().toISOString().slice(0, 10) && row.meal_type === mealType
      );

      return {
        mealType,
        foodItems: menuItem?.food_items || 'No menu assigned yet',
        status: attendance?.status || 'upcoming',
      };
    });
  }, [attendanceRows, menuRows, todayLabel]);

  const markAttendance = async (event) => {
    event.preventDefault();
    setError('');
    setAttendanceSubmitting(true);

    try {
      const { data } = await api.post('/attendance/mark', {
        student_id: Number(studentId),
        ...attendanceForm,
      });

      setAttendanceLocked(true);
      setToast({
        type: 'success',
        message: `${attendanceForm.meal_type} marked as ${attendanceForm.status} ✓`,
      });
      await loadDashboard();
      if (!data?.success && !data?.message) {
        throw new Error('Attendance request completed without confirmation');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setError('');
    setFeedbackSubmitting(true);

    try {
      await api.post('/feedback/add', {
        student_id: Number(studentId),
        rating: Number(feedbackForm.rating),
        comments: feedbackForm.comments,
      });
      setFeedbackLocked(true);
      setToast({
        type: 'success',
        message: `Feedback submitted successfully ✓`,
      });
      setFeedbackForm({ rating: 5, comments: '' });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Student Dashboard" role="student">
      <Toast toast={toast} />

      {!hasValidStudentId && (
        <p className="error-text">
          Invalid Student ID in session. Please login again with a valid Student ID.
        </p>
      )}

      {loading ? (
        <div className="student-dashboard-grid">
          <section className="stats-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={`sk-${index}`} />
            ))}
          </section>
          <div className="glass-panel panel-section">
            <div className="skeleton-block shimmer" />
            <div className="skeleton-block shimmer" />
            <div className="skeleton-block shimmer" />
          </div>
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <article className="student-stat-card glass-panel">
              <span>Meals This Month</span>
              <strong>{stats.mealsThisMonth}</strong>
            </article>
            <article className="student-stat-card glass-panel">
              <span>Meal Streak</span>
              <strong>{stats.mealStreak}</strong>
            </article>
            <article className="student-stat-card glass-panel">
              <span>Avg Feedback</span>
              <strong>{stats.avgFeedback ?? '-'}</strong>
            </article>
            <article className="student-stat-card glass-panel">
              <span>Mess Plan</span>
              <strong>{stats.messPlan}</strong>
            </article>
          </section>

          <section className="student-dashboard-grid">
            <div className="panel-stack">
              <section className="panel-section glass-panel">
                <div className="section-heading">
                  <h3>Weekly Attendance Heatmap</h3>
                  <span>Mon-Sun x 3 meals</span>
                </div>
                <div className="heatmap-grid">
                  {weeklyAttendance.map((day) => (
                    <div key={day.dateKey} className="heatmap-day">
                      <strong>{day.label}</strong>
                      <span>{day.dateKey.slice(5)}</span>
                      <div className="heatmap-slots">
                        {day.slots.map((slot) => (
                          <div
                            key={`${day.dateKey}-${slot.mealType}`}
                            className={`heatmap-cell heatmap-${slot.status}`}
                            title={`${day.label} ${slot.mealType}: ${slot.status}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel-section glass-panel">
                <div className="section-heading">
                  <h3>Mess Menu</h3>
                  <span>Full schedule</span>
                </div>
                {menuRows.length === 0 ? (
                  <p className="muted-text">No menu available.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Day</th>
                          <th>Meal</th>
                          <th>Food Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuRows.map((row) => (
                          <tr key={row.menu_id}>
                            <td>{row.menu_id}</td>
                            <td>{row.day}</td>
                            <td>{row.meal_type}</td>
                            <td>{row.food_items}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="panel-stack">
              <section className="panel-section glass-panel">
                <div className="section-heading">
                  <h3>Today&apos;s Menu Panel</h3>
                  <span>{todayLabel}</span>
                </div>
                <div className="today-menu-list">
                  {todaysMenu.map((item) => (
                    <article
                      key={item.mealType}
                      className={`today-meal-card ${item.mealType === activeMeal ? 'meal-current' : ''}`}
                    >
                      <div className="today-meal-header">
                        <strong>{item.mealType}</strong>
                        <span className={`status-pill status-${item.status}`}>{item.status}</span>
                      </div>
                      <p>{item.foodItems}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel-section glass-panel">
                <h3>Mark Attendance</h3>
                <form className="form-grid" onSubmit={markAttendance}>
                  <input
                    type="date"
                    value={attendanceForm.date_val}
                    onChange={(e) => setAttendanceForm((p) => ({ ...p, date_val: e.target.value }))}
                    required
                  />
                  <select
                    value={attendanceForm.meal_type}
                    onChange={(e) => setAttendanceForm((p) => ({ ...p, meal_type: e.target.value }))}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                  <button
                    className="btn"
                    type="submit"
                    disabled={!hasValidStudentId || attendanceSubmitting || attendanceLocked}
                  >
                    {attendanceLocked ? 'Marked ✓' : attendanceSubmitting ? 'Saving...' : 'Mark'}
                  </button>
                </form>
              </section>

              <section className="panel-section glass-panel">
                <h3>Submit Feedback</h3>
                <form className="form-grid" onSubmit={submitFeedback}>
                  <select
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm((p) => ({ ...p, rating: e.target.value }))}
                  >
                    <option value="5">5</option>
                    <option value="4">4</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Comments"
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm((p) => ({ ...p, comments: e.target.value }))}
                  />
                  <button
                    className="btn"
                    type="submit"
                    disabled={!hasValidStudentId || feedbackSubmitting || feedbackLocked}
                  >
                    {feedbackLocked ? 'Submitted ✓' : feedbackSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </section>

              <section className="panel-section glass-panel">
                <button
                  type="button"
                  className="plain-toggle"
                  onClick={() => setHistoryOpen((prev) => !prev)}
                >
                  <span>Login History</span>
                  <strong>{historyOpen ? 'Hide' : 'Show'}</strong>
                </button>

                {historyOpen && (
                  <div className="login-history-list">
                    {loginHistory.length === 0 ? (
                      <p className="muted-text">No login history found yet.</p>
                    ) : (
                      loginHistory.map((item) => (
                        <div key={item.log_id} className="login-history-item">
                          <div>
                            <strong>{String(item.login_time).replace('T', ' ').slice(0, 19)}</strong>
                            <span>{item.ip_address}</span>
                          </div>
                          <span className={`status-pill status-${item.status}`}>{item.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}

      {error && <p className="error-text">{error}</p>}
    </DashboardLayout>
  );
};

export default StudentDashboard;
