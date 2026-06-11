import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Wifi,
  WifiOff
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { getAlerts, resolveAlert } from "./api/alerts";
import { login } from "./api/auth";
import { getHealthStatus } from "./api/health";
import { getSensorReadings } from "./api/sensorReadings";
import { API_BASE_URL } from "./config";
import { useDashboardSocket } from "./hooks/useDashboardSocket";
import type { AlertItem, AuthUser, SensorReading } from "./types";

type HealthState = "checking" | "online" | "offline";

const TOKEN_STORAGE_KEY = "safemotion.dashboard.token";
const USER_STORAGE_KEY = "safemotion.dashboard.user";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));

const readStoredUser = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as AuthUser;
};

export const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [email, setEmail] = useState("caregiver@example.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [monitoredPersonId, setMonitoredPersonId] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const { events, isConnected } = useDashboardSocket(token);

  const activeAlertCount = useMemo(() => alerts.filter((alert) => alert.status === "ACTIVE").length, [alerts]);
  const latestReading = readings[0];

  const chartData = useMemo(
    () =>
      readings
        .slice()
        .reverse()
        .map((reading) => ({
          time: formatTime(reading.recordedAt),
          acceleration: Number(reading.accelerationMagnitude?.toFixed(2) ?? 0),
          rotation: Number(reading.rotationMagnitude?.toFixed(2) ?? 0)
        })),
    [readings]
  );

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await getHealthStatus();
        setHealthState("online");
      } catch {
        setHealthState("offline");
      }
    };

    void checkHealth();
  }, []);

  const refreshAlerts = async () => {
    if (!token) {
      return;
    }

    const result = await getAlerts(token);
    setAlerts(result.items);
  };

  const refreshReadings = async () => {
    if (!token || !monitoredPersonId) {
      return;
    }

    const result = await getSensorReadings(token, monitoredPersonId);
    setReadings(result.items);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void refreshAlerts().catch((error) => setStatusMessage(error instanceof Error ? error.message : "Alert refresh failed"));
  }, [token]);

  useEffect(() => {
    const alertEvent = events.find((event) => event.name === "alert.created" || event.name === "alert.resolved");

    if (alertEvent && token) {
      void refreshAlerts().catch(() => undefined);
    }
  }, [events, token]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setStatusMessage("Signing in");

    try {
      const result = await login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setStatusMessage("Signed in");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
      setStatusMessage("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAlerts([]);
    setReadings([]);
    setPassword("");
    setStatusMessage("Signed out");
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!token) {
      return;
    }

    await resolveAlert(token, alertId, "Resolved from SafeMotion dashboard.");
    await refreshAlerts();
  };

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand auth-brand">
            <ShieldCheck aria-hidden="true" />
            <span>SafeMotion</span>
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="form-error">{loginError}</p> : null}
            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck aria-hidden="true" />
          <span>SafeMotion</span>
        </div>
        <nav className="nav-list" aria-label="Dashboard sections">
          <a href="#overview">Overview</a>
          <a href="#monitoring">Live Monitoring</a>
          <a href="#alerts">Alerts</a>
          <a href="#events">Events</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Caregiver dashboard</p>
            <h1>Live safety monitoring</h1>
          </div>
          <div className="topbar-actions">
            <div className={`status-pill status-${healthState}`}>
              <span aria-hidden="true" />
              {healthState === "online" ? "Backend online" : healthState === "checking" ? "Checking backend" : "Backend offline"}
            </div>
            <div className={`status-pill status-${isConnected ? "online" : "offline"}`}>
              {isConnected ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
              Socket {isConnected ? "connected" : "offline"}
            </div>
            <button className="icon-button" type="button" onClick={handleLogout} aria-label="Sign out">
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="summary-grid" id="overview" aria-label="Dashboard summary">
          <article className="metric">
            <Activity aria-hidden="true" />
            <div>
              <p>Latest acceleration</p>
              <strong>{latestReading?.accelerationMagnitude?.toFixed(2) ?? "No data"}</strong>
            </div>
          </article>
          <article className="metric">
            <AlertTriangle aria-hidden="true" />
            <div>
              <p>Active alerts</p>
              <strong>{activeAlertCount}</strong>
            </div>
          </article>
          <article className="metric">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <p>Signed in as</p>
              <strong>{user.fullName}</strong>
            </div>
          </article>
        </section>

        <section className="toolbar">
          <label>
            Monitored person ID
            <input
              value={monitoredPersonId}
              onChange={(event) => setMonitoredPersonId(event.target.value)}
              placeholder="UUID"
            />
          </label>
          <button type="button" onClick={() => void refreshReadings()} disabled={!monitoredPersonId}>
            <RefreshCcw aria-hidden="true" />
            Refresh readings
          </button>
          <button type="button" onClick={() => void refreshAlerts()}>
            <RefreshCcw aria-hidden="true" />
            Refresh alerts
          </button>
          <span>{statusMessage}</span>
        </section>

        <section className="workspace" id="monitoring">
          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Motion readings</h2>
              <span>{readings.length} rows</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={24} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="acceleration" stroke="#15735d" dot={false} />
                <Line type="monotone" dataKey="rotation" stroke="#b45309" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" id="events">
            <div className="panel-header">
              <h2>Live events</h2>
              <span>{events.length}</span>
            </div>
            <div className="event-list">
              {events.map((event) => (
                <article key={event.id} className="event-row">
                  <strong>{event.name}</strong>
                  <span>{formatTime(event.receivedAt)}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel" id="alerts">
          <div className="panel-header">
            <h2>Alerts</h2>
            <span>{API_BASE_URL}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.severity}</td>
                    <td>{alert.status}</td>
                    <td>{alert.title}</td>
                    <td>{formatTime(alert.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void handleResolveAlert(alert.id)}
                        disabled={alert.status === "RESOLVED"}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
};

