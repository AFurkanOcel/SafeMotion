import { Activity, AlertTriangle, Database, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getHealthStatus } from "./api/health";

type HealthState = "idle" | "loading" | "online" | "offline";

export const App = () => {
  const [healthState, setHealthState] = useState<HealthState>("idle");
  const [healthMessage, setHealthMessage] = useState("Health check has not run yet.");

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1", []);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      setHealthState("loading");

      try {
        const result = await getHealthStatus();

        if (!cancelled) {
          setHealthState("online");
          setHealthMessage(`${result.service} responded at ${result.timestamp}`);
        }
      } catch {
        if (!cancelled) {
          setHealthState("offline");
          setHealthMessage("Backend health check is unavailable.");
        }
      }
    };

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    healthState === "online" ? "Backend online" : healthState === "loading" ? "Checking backend" : "Backend offline";

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
          <a href="#devices">Devices</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Caregiver dashboard</p>
            <h1>Live safety monitoring</h1>
          </div>
          <div className={`status-pill status-${healthState}`}>
            <span aria-hidden="true" />
            {statusLabel}
          </div>
        </header>

        <section className="summary-grid" id="overview" aria-label="Dashboard summary">
          <article className="metric">
            <Activity aria-hidden="true" />
            <div>
              <p>Sensor stream</p>
              <strong>Ready</strong>
            </div>
          </article>
          <article className="metric">
            <AlertTriangle aria-hidden="true" />
            <div>
              <p>Active alerts</p>
              <strong>0</strong>
            </div>
          </article>
          <article className="metric">
            <Database aria-hidden="true" />
            <div>
              <p>API endpoint</p>
              <strong>{apiBaseUrl}</strong>
            </div>
          </article>
        </section>

        <section className="workspace" id="monitoring">
          <div className="panel">
            <div className="panel-header">
              <h2>Backend connection</h2>
              <span>{healthState}</span>
            </div>
            <p>{healthMessage}</p>
          </div>

          <div className="panel" id="alerts">
            <div className="panel-header">
              <h2>Next dashboard phase</h2>
              <span>Step 12</span>
            </div>
            <p>Live monitoring charts, alert list, alert resolution, and Socket.IO updates will be implemented next.</p>
          </div>
        </section>
      </section>
    </main>
  );
};

