import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  KeyRound,
  ListChecks,
  LogOut,
  Plus,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
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

import { exportAlertsCsv, getAlerts, resolveAlert } from "./api/alerts";
import { changePassword, login, signup } from "./api/auth";
import { createPairingCode } from "./api/devices";
import { getHealthStatus } from "./api/health";
import { createMonitoredPerson, getMonitoredPersons } from "./api/monitoredPersons";
import { getSensorReadings } from "./api/sensorReadings";
import { deactivateUser, getUsers, reactivateUser, removeUser, resetUserPassword } from "./api/users";
import { useDashboardSocket } from "./hooks/useDashboardSocket";
import type {
  AlertItem,
  AuthUser,
  DevicePlatform,
  ManagedUser,
  MonitoredPerson,
  PairingCodeResponse,
  SensorReading
} from "./types";

type HealthState = "checking" | "online" | "offline";
type AuthMode = "signin" | "signup";

const TOKEN_STORAGE_KEY = "safemotion.dashboard.token";
const USER_STORAGE_KEY = "safemotion.dashboard.user";
const APP_ICON_SRC = "/safemotion.png";

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

const getPayloadMonitoredPersonId = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || !("monitoredPersonId" in payload)) {
    return null;
  }

  const monitoredPersonId = (payload as { monitoredPersonId?: unknown }).monitoredPersonId;

  return typeof monitoredPersonId === "string" ? monitoredPersonId : null;
};

export const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("caregiver@example.com");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [authError, setAuthError] = useState("");
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [monitoredPersons, setMonitoredPersons] = useState<MonitoredPerson[]>([]);
  const [selectedMonitoredPersonId, setSelectedMonitoredPersonId] = useState("");
  const [newMonitoredPersonName, setNewMonitoredPersonName] = useState("");
  const [newMonitoredPersonNotes, setNewMonitoredPersonNotes] = useState("");
  const [personFormError, setPersonFormError] = useState("");
  const [pairingDeviceName, setPairingDeviceName] = useState("Demo Phone");
  const [pairingPlatform, setPairingPlatform] = useState<DevicePlatform>("UNKNOWN");
  const [pairingCodeResult, setPairingCodeResult] = useState<PairingCodeResponse | null>(null);
  const [pairingError, setPairingError] = useState("");
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("Ready");
  const { events, isConnected } = useDashboardSocket(token);

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.status === "ACTIVE"), [alerts]);
  const activeAlertCount = activeAlerts.length;
  const latestActiveAlert = activeAlerts[0] ?? null;
  const latestReading = readings[0];
  const selectedMonitoredPerson = monitoredPersons.find((person) => person.id === selectedMonitoredPersonId) ?? null;
  const latestReadingLabel = latestReading ? formatTime(latestReading.receivedAt) : "Waiting";
  const demoSteps = [
    { label: "Person selected", isDone: Boolean(selectedMonitoredPerson) },
    { label: "Pairing code ready", isDone: Boolean(pairingCodeResult) },
    { label: "Sensor readings received", isDone: readings.length > 0 },
    { label: "Live socket connected", isDone: isConnected },
    { label: "Alert list ready", isDone: true }
  ];

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

  const refreshMonitoredPersons = async () => {
    if (!token) {
      return;
    }

    const result = await getMonitoredPersons(token);
    setMonitoredPersons(result.items);

    if (!selectedMonitoredPersonId && result.items[0]) {
      setSelectedMonitoredPersonId(result.items[0].id);
    }
  };

  const refreshReadings = async () => {
    if (!token || !selectedMonitoredPersonId) {
      return;
    }

    setStatusMessage("Loading readings");
    const result = await getSensorReadings(token, selectedMonitoredPersonId);
    setReadings(result.items);
    setStatusMessage(result.items.length ? "Readings loaded" : "No readings found for selected person");
  };

  const refreshManagedUsers = async () => {
    if (!token || user?.role !== "ADMIN") {
      return;
    }

    const result = await getUsers(token);
    setManagedUsers(result.items);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void refreshAlerts().catch((error) => setStatusMessage(error instanceof Error ? error.message : "Alert refresh failed"));
    void refreshMonitoredPersons().catch((error) =>
      setStatusMessage(error instanceof Error ? error.message : "Monitored person refresh failed")
    );
    void refreshManagedUsers().catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedMonitoredPersonId) {
      setReadings([]);
      return;
    }

    void refreshReadings().catch((error) => setStatusMessage(error instanceof Error ? error.message : "Reading refresh failed"));
  }, [selectedMonitoredPersonId, token]);

  useEffect(() => {
    const alertEvent = events.find((event) => event.name === "alert.created" || event.name === "alert.resolved");

    if (alertEvent && token) {
      setStatusMessage(alertEvent.name === "alert.created" ? "New alert received" : "Alert update received");
      void refreshAlerts().catch(() => undefined);
    }
  }, [events, token]);

  useEffect(() => {
    const latestEvent = events[0];

    if (!latestEvent || latestEvent.name !== "sensor.reading.created" || !selectedMonitoredPersonId) {
      return;
    }

    if (getPayloadMonitoredPersonId(latestEvent.payload) === selectedMonitoredPersonId) {
      void refreshReadings().catch((error) => setStatusMessage(error instanceof Error ? error.message : "Reading refresh failed"));
    }
  }, [events, selectedMonitoredPersonId]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setStatusMessage("Signing in");

    try {
      const result = await login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setStatusMessage("Signed in");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
      setStatusMessage("Login failed");
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setStatusMessage("Creating account");

    try {
      if (password !== passwordConfirmation) {
        setAuthError("Passwords do not match");
        setStatusMessage("Signup failed");
        return;
      }

      const result = await signup(fullName, email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setPasswordConfirmation("");
      setStatusMessage("Account created");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Signup failed");
      setStatusMessage("Signup failed");
    }
  };

  const fillDemoCredentials = (role: "admin" | "caregiver") => {
    setAuthMode("signin");
    setAuthError("");
    setPasswordConfirmation("");
    setEmail(role === "admin" ? "admin@example.com" : "caregiver@example.com");
    setPassword("StrongPassword123!");
    setStatusMessage(`${role === "admin" ? "Admin" : "Caregiver"} demo credentials filled`);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAlerts([]);
    setReadings([]);
    setMonitoredPersons([]);
    setSelectedMonitoredPersonId("");
    setPairingCodeResult(null);
    setPassword("");
    setPasswordConfirmation("");
    setStatusMessage("Signed out");
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSettingsError("");
    setSettingsSuccess("");

    if (newPassword !== newPasswordConfirmation) {
      setSettingsError("New passwords do not match");
      return;
    }

    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setSettingsSuccess("Password updated");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Password update failed");
    }
  };

  const handleDeactivateUser = async (managedUserId: string) => {
    if (!token) {
      return;
    }

    setSettingsError("");
    setSettingsSuccess("");

    try {
      await deactivateUser(token, managedUserId);
      await refreshManagedUsers();
      setSettingsSuccess("Account deactivated");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Account deactivation failed");
    }
  };

  const handleReactivateUser = async (managedUserId: string) => {
    if (!token) {
      return;
    }

    setSettingsError("");
    setSettingsSuccess("");

    try {
      await reactivateUser(token, managedUserId);
      await refreshManagedUsers();
      setSettingsSuccess("Account reactivated");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Account reactivation failed");
    }
  };

  const handleRemoveUser = async (managedUser: ManagedUser) => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${managedUser.email}? This is only allowed for accounts without related records.`
    );

    if (!confirmed) {
      return;
    }

    setSettingsError("");
    setSettingsSuccess("");

    try {
      await removeUser(token, managedUser.id);
      await refreshManagedUsers();
      setSettingsSuccess("Account removed");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Account removal failed");
    }
  };

  const handleResetManagedUserPassword = async (managedUserId: string) => {
    if (!token) {
      return;
    }

    const passwordForUser = resetPasswords[managedUserId] ?? "";
    setSettingsError("");
    setSettingsSuccess("");

    try {
      await resetUserPassword(token, managedUserId, passwordForUser);
      setResetPasswords((current) => ({ ...current, [managedUserId]: "" }));
      setSettingsSuccess("Password reset");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Password reset failed");
    }
  };

  const handleCreateMonitoredPerson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setPersonFormError("");
    setStatusMessage("Creating monitored person");

    try {
      const monitoredPerson = await createMonitoredPerson(token, newMonitoredPersonName, newMonitoredPersonNotes);
      setMonitoredPersons((current) => [monitoredPerson, ...current]);
      setSelectedMonitoredPersonId(monitoredPerson.id);
      setNewMonitoredPersonName("");
      setNewMonitoredPersonNotes("");
      setStatusMessage("Monitored person created");
    } catch (error) {
      setPersonFormError(error instanceof Error ? error.message : "Monitored person creation failed");
      setStatusMessage("Monitored person creation failed");
    }
  };

  const handleSelectMonitoredPerson = (person: MonitoredPerson) => {
    setSelectedMonitoredPersonId(person.id);
    setPairingCodeResult(null);
    setStatusMessage(`Selected ${person.displayName}`);
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!token) {
      return;
    }

    await resolveAlert(token, alertId, "Resolved from SafeMotion dashboard.");
    await refreshAlerts();
  };

  const handleCreatePairingCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !selectedMonitoredPersonId) {
      return;
    }

    setPairingError("");
    setStatusMessage("Creating pairing code");

    try {
      const result = await createPairingCode(token, selectedMonitoredPersonId, pairingDeviceName, pairingPlatform);
      setPairingCodeResult(result);
      setStatusMessage("Pairing code created");
    } catch (error) {
      setPairingError(error instanceof Error ? error.message : "Pairing code creation failed");
      setStatusMessage("Pairing code creation failed");
    }
  };

  const handleExportCsv = async () => {
    if (!token) {
      return;
    }

    try {
      const blob = await exportAlertsCsv(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "safemotion-alerts.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusMessage("CSV export downloaded");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "CSV export failed");
    }
  };

  if (!token || !user) {
    const isSignup = authMode === "signup";

    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand auth-brand">
            <img src={APP_ICON_SRC} alt="" aria-hidden="true" />
            <span>SafeMotion</span>
          </div>
          <div className="auth-copy">
            <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p>{isSignup ? "Start monitoring motion safety as a caregiver." : "Sign in to monitor alerts and live sensor data."}</p>
          </div>
          <form className="login-form" onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup ? (
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  type="text"
                  autoComplete="name"
                  required
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
                required
              />
            </label>
            {isSignup ? (
              <label>
                Confirm password
                <input
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            ) : null}
            {authError ? <p className="form-error">{authError}</p> : null}
            <button type="submit">{isSignup ? "Create account" : "Sign in"}</button>
          </form>
          {isSignup ? (
            <p className="demo-login-note">Public signup creates caregiver accounts only. Use the seeded admin account for admin features.</p>
          ) : (
            <div className="demo-login-actions" aria-label="Demo accounts">
              <button type="button" onClick={() => fillDemoCredentials("caregiver")}>
                <Users />
                Use caregiver demo
              </button>
              <button type="button" onClick={() => fillDemoCredentials("admin")}>
                <ShieldCheck />
                Use admin demo
              </button>
            </div>
          )}
          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setAuthMode(isSignup ? "signin" : "signup");
                setAuthError("");
              }}
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={APP_ICON_SRC} alt="" aria-hidden="true" />
          <span>SafeMotion</span>
        </div>
        <nav className="nav-list" aria-label="Dashboard sections">
          <a href="#overview">Overview</a>
          <a href="#people">People</a>
          <a href="#pairing">Pairing</a>
          <a href="#monitoring">Live Monitoring</a>
          <a href="#alerts">Alerts</a>
          <a href="#events">Events</a>
          <a href="#settings">Settings</a>
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
            <Users aria-hidden="true" />
            <div>
              <p>Selected person</p>
              <strong>{selectedMonitoredPerson?.displayName ?? "None selected"}</strong>
            </div>
          </article>
          <article className="metric">
            <Activity aria-hidden="true" />
            <div>
              <p>Latest acceleration</p>
              <strong>{latestReading?.accelerationMagnitude?.toFixed(2) ?? "No data"}</strong>
              <small>{latestReadingLabel}</small>
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

        <section className="demo-status-panel" aria-label="Demo readiness">
          <div>
            <p className="eyebrow">Demo flow</p>
            <h2>{selectedMonitoredPerson ? selectedMonitoredPerson.displayName : "Create or select a monitored person"}</h2>
          </div>
          <div className="demo-step-list">
            {demoSteps.map((step) => (
              <span key={step.label} className={step.isDone ? "demo-step-done" : ""}>
                <CheckCircle2 aria-hidden="true" />
                {step.label}
              </span>
            ))}
          </div>
        </section>

        {latestActiveAlert ? (
          <section className={`alert-banner alert-${latestActiveAlert.severity.toLowerCase()}`} aria-live="polite">
            <AlertTriangle aria-hidden="true" />
            <div>
              <p className="eyebrow">Active alert</p>
              <h2>{latestActiveAlert.title}</h2>
              <span>{latestActiveAlert.message}</span>
            </div>
            <button type="button" onClick={() => void handleResolveAlert(latestActiveAlert.id)}>
              Resolve alert
            </button>
          </section>
        ) : null}

        <section className="people-layout" id="people">
          <div className="panel">
            <div className="panel-header">
              <h2>Monitored persons</h2>
              <button type="button" onClick={() => void refreshMonitoredPersons()}>
                <RefreshCcw aria-hidden="true" />
                Refresh
              </button>
            </div>
            <div className="person-list">
              {monitoredPersons.length ? (
                monitoredPersons.map((person) => (
                  <button
                    key={person.id}
                    className={`person-row ${person.id === selectedMonitoredPersonId ? "person-row-active" : ""}`}
                    type="button"
                    onClick={() => handleSelectMonitoredPerson(person)}
                  >
                    <span>
                      <strong>{person.displayName}</strong>
                      <small>{person.notes || "No notes"}</small>
                    </span>
                    <small>{person.id}</small>
                  </button>
                ))
              ) : (
                <p className="empty-state">No monitored persons yet. Create one to start the demo flow.</p>
              )}
            </div>
          </div>

          <div className="panel selected-person-panel">
            <div className="panel-header">
              <h2>Selected person</h2>
              <Users aria-hidden="true" />
            </div>
            {selectedMonitoredPerson ? (
              <dl className="detail-list">
                <div>
                  <dt>Name</dt>
                  <dd>{selectedMonitoredPerson.displayName}</dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{selectedMonitoredPerson.notes || "No notes"}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd>{selectedMonitoredPerson.id}</dd>
                </div>
              </dl>
            ) : (
              <p className="empty-state">Select a monitored person to prepare pairing and live monitoring.</p>
            )}
          </div>

          <form className="panel person-form" onSubmit={handleCreateMonitoredPerson}>
            <div className="panel-header">
              <h2>Create monitored person</h2>
              <Plus aria-hidden="true" />
            </div>
            <label>
              Display name
              <input
                value={newMonitoredPersonName}
                onChange={(event) => setNewMonitoredPersonName(event.target.value)}
                type="text"
                placeholder="Demo Patient"
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={newMonitoredPersonNotes}
                onChange={(event) => setNewMonitoredPersonNotes(event.target.value)}
                placeholder="Lives alone and carries the paired phone."
                maxLength={500}
              />
            </label>
            {personFormError ? <p className="form-error">{personFormError}</p> : null}
            <button type="submit">
              <Plus aria-hidden="true" />
              Create person
            </button>
          </form>
        </section>

        <section className="pairing-layout" id="pairing">
          <form className="panel pairing-form" onSubmit={handleCreatePairingCode}>
            <div className="panel-header">
              <h2>Device pairing</h2>
              <KeyRound aria-hidden="true" />
            </div>
            <p className="panel-copy">
              {selectedMonitoredPerson
                ? `Create a temporary code for ${selectedMonitoredPerson.displayName}.`
                : "Select or create a monitored person before creating a pairing code."}
            </p>
            <label>
              Device name
              <input
                value={pairingDeviceName}
                onChange={(event) => setPairingDeviceName(event.target.value)}
                type="text"
                placeholder="Demo Phone"
                required
              />
            </label>
            <label>
              Platform
              <select value={pairingPlatform} onChange={(event) => setPairingPlatform(event.target.value as DevicePlatform)}>
                <option value="UNKNOWN">Unknown</option>
                <option value="ANDROID">Android</option>
                <option value="IOS">iOS</option>
              </select>
            </label>
            {pairingError ? <p className="form-error">{pairingError}</p> : null}
            <button type="submit" disabled={!selectedMonitoredPersonId}>
              <KeyRound aria-hidden="true" />
              Create pairing code
            </button>
          </form>

          <div className="panel pairing-code-panel">
            <div className="panel-header">
              <h2>Latest pairing code</h2>
              <span>{pairingCodeResult ? "Ready" : "Not created"}</span>
            </div>
            {pairingCodeResult ? (
              <div className="pairing-code-box">
                <strong>{pairingCodeResult.pairingCode}</strong>
                <dl>
                  <div>
                    <dt>Device ID</dt>
                    <dd>{pairingCodeResult.deviceId}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{new Date(pairingCodeResult.expiresAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="empty-state">Create a pairing code, then enter it on the mobile app pairing screen.</p>
            )}
          </div>
        </section>

        <section className="toolbar">
          <span>
            {selectedMonitoredPerson
              ? `Monitoring ${selectedMonitoredPerson.displayName}`
              : "Select or create a monitored person to load readings"}
          </span>
          <button type="button" onClick={() => void refreshReadings()} disabled={!selectedMonitoredPersonId}>
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
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={24} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="acceleration" stroke="#1261a6" dot={false} />
                  <Line type="monotone" dataKey="rotation" stroke="#ef4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <Smartphone aria-hidden="true" />
                <p>
                  {selectedMonitoredPerson
                    ? `No readings are loaded for ${selectedMonitoredPerson.displayName}. Use Refresh readings after mobile monitoring starts.`
                    : "Select a monitored person to load live motion readings."}
                </p>
              </div>
            )}
          </div>

          <div className="panel" id="events">
            <div className="panel-header">
              <h2>Live events</h2>
              <span>{events.length}</span>
            </div>
            <div className="event-list">
              {events.length ? (
                events.map((event) => (
                  <article key={event.id} className="event-row">
                    <strong>{event.name}</strong>
                    <span>{formatTime(event.receivedAt)}</span>
                  </article>
                ))
              ) : (
                <p className="empty-state">Live events will appear after sensor uploads, fall suspicion, or alert updates.</p>
              )}
            </div>
          </div>
        </section>

        <section className="panel" id="alerts">
          <div className="panel-header">
            <h2>Alerts</h2>
            <button type="button" onClick={() => void handleExportCsv()}>
              <Download aria-hidden="true" />
              Export CSV
            </button>
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
                {alerts.length ? (
                  alerts.map((alert) => (
                    <tr key={alert.id} className={alert.status === "ACTIVE" ? "active-alert-row" : ""}>
                      <td>
                        <span className={`table-badge severity-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                      </td>
                      <td>
                        <span className={`table-badge status-${alert.status.toLowerCase()}`}>{alert.status}</span>
                      </td>
                      <td>
                        <strong>{alert.title}</strong>
                        <small>{alert.message}</small>
                      </td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <span className="table-empty">
                        <ListChecks aria-hidden="true" />
                        No alerts yet. A fall confirmation or no-response scenario will create alerts here.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="settings-layout" id="settings">
          <form className="panel settings-form" onSubmit={handleChangePassword}>
            <div className="panel-header">
              <h2>Account settings</h2>
              <Settings aria-hidden="true" />
            </div>
            <div className="account-card">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
                <small>{user.role}</small>
              </div>
            </div>
            <label>
              Current password
              <input
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                value={newPasswordConfirmation}
                onChange={(event) => setNewPasswordConfirmation(event.target.value)}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button type="submit">Change password</button>
            {settingsError ? <p className="form-error">{settingsError}</p> : null}
            {settingsSuccess ? <p className="form-success">{settingsSuccess}</p> : null}
          </form>

          <div className="panel">
            <div className="panel-header">
              <h2>User management</h2>
              {user.role === "ADMIN" ? (
                <button type="button" onClick={() => void refreshManagedUsers()}>
                  <RefreshCcw aria-hidden="true" />
                  Refresh
                </button>
              ) : null}
            </div>
            {user.role === "ADMIN" ? (
              <div className="user-management-list">
                {managedUsers.map((managedUser) => (
                  <article key={managedUser.id} className="managed-user-row">
                    <div>
                      <strong>{managedUser.fullName}</strong>
                      <span>{managedUser.email}</span>
                      <small>
                        {managedUser.role} / {managedUser.isActive ? "Active" : "Inactive"}
                      </small>
                    </div>
                    <div className="managed-user-actions">
                      <input
                        value={resetPasswords[managedUser.id] ?? ""}
                        onChange={(event) =>
                          setResetPasswords((current) => ({ ...current, [managedUser.id]: event.target.value }))
                        }
                        type="password"
                        minLength={8}
                        placeholder="New password"
                        disabled={!managedUser.isActive}
                      />
                      <button
                        type="button"
                        onClick={() => void handleResetManagedUserPassword(managedUser.id)}
                        disabled={!managedUser.isActive || !(resetPasswords[managedUser.id] ?? "").trim()}
                      >
                        Reset password
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void handleDeactivateUser(managedUser.id)}
                        disabled={!managedUser.isActive || managedUser.id === user.id}
                      >
                        <Trash2 aria-hidden="true" />
                        Deactivate
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReactivateUser(managedUser.id)}
                        disabled={managedUser.isActive}
                      >
                        Reactivate
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void handleRemoveUser(managedUser)}
                        disabled={managedUser.id === user.id}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Sign in as an admin to view and deactivate demo accounts.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
};
