"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listAuditEntries,
  getAuditEventTypes,
  AuditLogEntry,
  AuditLogQuery,
} from "../../lib/api/admin";
import styles from "../page.module.css";

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventType, setEventType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query: AuditLogQuery = { limit, offset };
      if (eventType) query.event_type = eventType;
      if (status) query.status = status;

      const result = await listAuditEntries(query);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [eventType, status, limit, offset]);

  const loadEventTypes = useCallback(async () => {
    try {
      const types = await getAuditEventTypes();
      setEventTypes(types);
    } catch {
      // Ignore - not critical
    }
  }, []);

  useEffect(() => {
    loadEventTypes();
    loadEntries();
  }, [loadEntries, loadEventTypes]);

  const handleFilterChange = () => {
    setOffset(0);
    loadEntries();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#22c55e";
      case "failure":
        return "#ef4444";
      case "denied":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className={styles.main}>
      <h1>Audit Log</h1>
      <p>Security and admin action audit trail</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            handleFilterChange();
          }}
          style={{ padding: "0.5rem", borderRadius: "4px" }}
        >
          <option value="">All Event Types</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            handleFilterChange();
          }}
          style={{ padding: "0.5rem", borderRadius: "4px" }}
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
        </select>

        <button
          onClick={loadEntries}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Showing {entries.length} of {total} entries
      </p>

      {/* Error */}
      {error && (
        <div style={{ color: "#ef4444", padding: "1rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Time</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Event</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>User</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Action</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Resource</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                    {formatDate(entry.created_at)}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <code style={{ background: "#f3f4f6", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                      {entry.event_type}
                    </code>
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                    {entry.user_email || entry.user_id || "-"}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                    {entry.action}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                    {entry.resource_type ? (
                      <>
                        {entry.resource_type}
                        {entry.resource_id && (
                          <span style={{ color: "#6b7280" }}>:{entry.resource_id.slice(0, 8)}</span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      style={{
                        color: getStatusColor(entry.status),
                        fontWeight: 500,
                      }}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <p style={{ color: "#6b7280" }}>No audit entries found</p>
      )}

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              cursor: offset === 0 ? "not-allowed" : "pointer",
              opacity: offset === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ padding: "0.5rem" }}>
            Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              cursor: offset + limit >= total ? "not-allowed" : "pointer",
              opacity: offset + limit >= total ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
