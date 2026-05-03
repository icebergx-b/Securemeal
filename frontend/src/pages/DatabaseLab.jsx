import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const defaultQuery = `SELECT
  s.student_id,
  s.name,
  s.dept,
  mp.plan_type
FROM STUDENT s
LEFT JOIN MESS_PLAN mp ON mp.student_id = s.student_id
ORDER BY s.student_id`;

const ProcedureButton = ({ label, onClick }) => (
  <button className="btn btn-admin" type="button" onClick={onClick}>
    {label}
  </button>
);

const MiniChart = ({ rows, xKey, yKey, title }) => {
  if (!rows.length || !xKey || !yKey) {
    return null;
  }

  const numericValues = rows.map((row) => Number(row[yKey]) || 0);
  const max = Math.max(...numericValues, 1);

  return (
    <div className="mini-chart glass-panel">
      <div className="section-heading">
        <h3>{title}</h3>
        <span>Auto visualization</span>
      </div>
      <div className="mini-chart-bars">
        {rows.slice(0, 8).map((row, index) => (
          <div key={`${row[xKey]}-${index}`} className="mini-chart-item">
            <div
              className="mini-chart-bar"
              style={{ height: `${Math.max(((Number(row[yKey]) || 0) / max) * 100, 8)}%` }}
            />
            <strong>{row[xKey]}</strong>
            <span>{row[yKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultsTable = ({ columns, rows }) => {
  if (!rows.length) {
    return <p className="muted-text">No rows returned.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`}>{row[column] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DatabaseLab = () => {
  const [overview, setOverview] = useState({ metrics: [], riskFlags: [], procedureDemos: [] });
  const [prebuiltQueries, setPrebuiltQueries] = useState([]);
  const [query, setQuery] = useState(defaultQuery);
  const [result, setResult] = useState({ columns: [], rows: [], duration_ms: 0, mode: 'database' });
  const [logs, setLogs] = useState([]);
  const [triggerActivity, setTriggerActivity] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [explainEnabled, setExplainEnabled] = useState(false);

  const loadOverview = async () => {
    try {
      const { data } = await api.get('/lab/overview');
      setOverview(data.overview || { metrics: [], riskFlags: [], procedureDemos: [] });
      setPrebuiltQueries(data.prebuiltQueries || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load database lab overview');
    }
  };

  const loadLogs = async () => {
    try {
      const { data } = await api.get('/lab/logs');
      setLogs(data.logs || []);
      setTriggerActivity(data.triggerActivity || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lab logs');
    }
  };

  useEffect(() => {
    loadOverview();
    loadLogs();
  }, []);

  const runQuery = async ({ explain = false, nextQuery } = {}) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const isExplain = explain || explainEnabled;
      const payload = { query: nextQuery || query, explain: isExplain };
      const { data } = await api.post('/lab/playground', payload);
      setResult({
        columns: data.columns || [],
        rows: data.rows || [],
        duration_ms: data.duration_ms || 0,
        mode: data.mode || 'database',
      });
      setMessage(isExplain ? 'Execution plan loaded successfully.' : 'Query executed successfully.');
      loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const runPrebuilt = async (queryId) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.get(`/lab/prebuilt/${queryId}`);
      setQuery(data.query?.query || query);
      setResult({
        columns: data.columns || [],
        rows: data.rows || [],
        duration_ms: data.duration_ms || 0,
        mode: data.mode || 'database',
      });
      setMessage(`Loaded prebuilt query: ${data.query?.title || queryId}`);
      loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prebuilt query');
    } finally {
      setLoading(false);
    }
  };

  const runProcedure = async (procedureName, args = []) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/lab/procedure', {
        procedureName,
        args,
      });
      setResult({
        columns: data.columns || [],
        rows: data.rows || [],
        duration_ms: data.duration_ms || 0,
        mode: data.mode || 'database',
      });
      setMessage(`Procedure ${procedureName} executed.`);
      loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run procedure');
    } finally {
      setLoading(false);
    }
  };

  const chartColumns = result.columns.filter((column) => typeof result.rows[0]?.[column] !== 'object');
  const xKey = chartColumns[1] || chartColumns[0];
  const yKey = chartColumns.find((column) => typeof result.rows[0]?.[column] === 'number') || chartColumns[2];

  return (
    <DashboardLayout title="Database Lab Mode" role="admin">
      <div className="lab-hero glass-panel">
        <div>
          <p className="eyebrow">SQL Demonstration Suite</p>
          <h2>Run curated queries, inspect plans, and showcase DBMS depth live.</h2>
          <p className="muted-text">
            This panel is built for evaluation day: safe query execution, prebuilt joins, procedure demos,
            logs, and quick visualizations in one place.
          </p>
        </div>
        <div className="mode-pill">
          <span>Execution Mode</span>
          <strong>{result.mode}</strong>
        </div>
      </div>

      <section className="kpi-grid">
        {overview.metrics.map((metric) => (
          <article key={metric.label} className={`kpi-card tone-${metric.tone} glass-panel`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.trend}</em>
          </article>
        ))}
      </section>

      <section className="lab-grid">
        <div className="lab-main">
          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>SQL Playground</h3>
              <span>Only safe read queries are allowed</span>
            </div>
            <textarea
              className="sql-editor"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck="false"
            />
            <div className="action-row">
              <button className="btn" type="button" disabled={loading} onClick={() => runQuery()}>
                {loading ? 'Running...' : 'Run Query'}
              </button>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={explainEnabled}
                  onChange={(e) => setExplainEnabled(e.target.checked)}
                />
                <span>Enable EXPLAIN Mode</span>
              </label>
            </div>
            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}
            <p className="helper-text">
              Execution time: <strong>{result.duration_ms} ms</strong>
            </p>
          </div>

          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>Results</h3>
              <span>{result.rows.length} rows returned</span>
            </div>
            <ResultsTable columns={result.columns} rows={result.rows} />
          </div>

          <MiniChart rows={result.rows} xKey={xKey} yKey={yKey} title="Result Visualization" />
        </div>

        <aside className="lab-sidebar">
          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>Prebuilt Demo Queries</h3>
              <span>One-click DBMS showcase</span>
            </div>
            <div className="query-card-list">
              {prebuiltQueries.map((item) => (
                <button key={item.id} className="query-card" type="button" onClick={() => runPrebuilt(item.id)}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <em>{item.chart} chart ready</em>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>Procedure Demonstration</h3>
              <span>Enterprise blueprint hooks</span>
            </div>
            <div className="procedure-grid">
              <ProcedureButton label="get_student_360_view(101)" onClick={() => runProcedure('get_student_360_view', [101])} />
              <ProcedureButton label="revenue_breakdown()" onClick={() => runProcedure('revenue_breakdown', [])} />
              <ProcedureButton label="inventory_forecast()" onClick={() => runProcedure('inventory_forecast', [])} />
              <ProcedureButton label="detect_irregular_attendance()" onClick={() => runProcedure('detect_irregular_attendance', [])} />
            </div>
          </div>

          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>Risk Flags</h3>
              <span>Attendance intelligence snapshot</span>
            </div>
            <div className="risk-list">
              {overview.riskFlags.map((flag) => (
                <div key={flag.student_id} className="risk-item">
                  <strong>{flag.name}</strong>
                  <span>{flag.flag}</span>
                  <em>{flag.value}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section glass-panel">
            <div className="section-heading">
              <h3>Live Logs</h3>
              <span>Queries and trigger signals</span>
            </div>
            <div className="log-list">
              {logs.map((log) => (
                <div key={log.id} className="log-item">
                  <strong>{log.status.toUpperCase()}</strong>
                  <span>{log.query}</span>
                  <em>{log.duration_ms} ms</em>
                </div>
              ))}
            </div>
            <div className="log-list log-list-secondary">
              {triggerActivity.map((item) => (
                <div key={item.id} className="log-item">
                  <strong>{item.name}</strong>
                  <span>{item.message}</span>
                  <em>{item.timestamp.slice(11, 19)}</em>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
};

export default DatabaseLab;
