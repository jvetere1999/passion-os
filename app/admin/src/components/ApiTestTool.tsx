"use client";

/**
 * Admin API Test Tool Component
 * Visual interface for testing API endpoints from the admin console
 */

import { useState, useCallback } from "react";
import {
  API_ENDPOINTS,
  groupEndpointsByModule,
  type ApiEndpoint,
} from "@/lib/api-endpoints";
import styles from "./ApiTestTool.module.css";

interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  timing: number;
  error?: string;
}

export function ApiTestTool() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    ApiEndpoint | undefined
  >(API_ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState<string>("{}");
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ endpoint: ApiEndpoint; timestamp: Date; status: number }>
  >([]);

  const buildPath = useCallback(
    (endpoint: ApiEndpoint): string => {
      let path = endpoint.path;
      if (endpoint.params) {
        endpoint.params.forEach((param) => {
          path = path.replace(`:${param.name}`, params[param.name] || "");
        });
      }
      return path;
    },
    [params]
  );

  const executeTest = useCallback(async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    const startTime = performance.now();

    try {
      const path = buildPath(selectedEndpoint);
      const url = `${process.env.NEXT_PUBLIC_API_URL || ""}${path}`;

      const options: RequestInit = {
        method: selectedEndpoint.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (selectedEndpoint.method !== "GET") {
        try {
          options.body = body;
          JSON.parse(body); // Validate JSON
        } catch (parseError) {
          setResult({
            status: 0,
            statusText: "Invalid JSON",
            headers: {},
            body: null,
            timing: 0,
            error: `Invalid request body: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
          });
          setLoading(false);
          return;
        }
      }

      const response = await fetch(url, options);
      const timing = performance.now() - startTime;

      let responseBody: unknown;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }
      } catch {
        responseBody = null;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const testResult: TestResult = {
        status: response.status,
        statusText: response.statusText,
        headers,
        body: responseBody,
        timing: Math.round(timing),
      };

      setResult(testResult);

      // Add to history
      setHistory((prev) => [
        {
          endpoint: selectedEndpoint,
          timestamp: new Date(),
          status: response.status,
        },
        ...prev.slice(0, 19), // Keep last 20
      ]);
    } catch (error) {
      setResult({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: null,
        timing: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
}, [selectedEndpoint, body, buildPath]);

  const groupedEndpoints = groupEndpointsByModule();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>API Test Tool</h1>
        <p>Test endpoints directly from the admin console</p>
      </div>

      <div className={styles.content}>
        {/* Left Panel: Request Builder */}
        <div className={styles.requestPanel}>
          <h2>Request Builder</h2>

          {/* Endpoint Selector */}
          <div className={styles.section}>
            <label htmlFor="endpoint-select">Endpoint</label>
            <select
              id="endpoint-select"
              value={selectedEndpoint?.id || ""}
              onChange={(e) => {
                const ep = API_ENDPOINTS.find((ep) => ep.id === e.target.value);
                setSelectedEndpoint(ep);
                setParams({});
              }}
              className={styles.select}
            >
              {Object.entries(groupedEndpoints).map(([module, endpoints]) => (
                <optgroup key={module} label={module}>
                  {endpoints.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.method} {ep.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {selectedEndpoint && (
              <div className={styles.endpointInfo}>
                <div className={`${styles.methodBadge} ${selectedEndpoint.method}`}>
                  {selectedEndpoint.method}
                </div>
                <code className={styles.path}>{selectedEndpoint.path}</code>
                <p className={styles.description}>
                  {selectedEndpoint.description}
                </p>
              </div>
            )}
          </div>

          {/* URL Path Parameters */}
          {selectedEndpoint?.params && selectedEndpoint.params.length > 0 && (
            <div className={styles.section}>
              <h3>Path Parameters</h3>
              {selectedEndpoint.params.map((param) => (
                <div key={param.name} className={styles.paramGroup}>
                  <label htmlFor={param.name}>
                    {param.name}
                    {param.required && <span className={styles.required}>*</span>}
                  </label>
                  <input
                    id={param.name}
                    type="text"
                    placeholder={param.example}
                    value={params[param.name] || ""}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        [param.name]: e.target.value,
                      }))
                    }
                    className={styles.input}
                  />
                  <small className={styles.hint}>Example: {param.example}</small>
                </div>
              ))}
            </div>
          )}

          {/* Request Body */}
          {selectedEndpoint?.method !== "GET" && (
            <div className={styles.section}>
              <h3>Request Body (JSON)</h3>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={styles.textarea}
                placeholder={'{\n  "key": "value"\n}'}
                rows={8}
              />
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={executeTest}
            disabled={loading}
            className={styles.executeButton}
          >
            {loading ? "Testing..." : "Execute Request"}
          </button>
        </div>

        {/* Right Panel: Response Viewer */}
        <div className={styles.responsePanel}>
          <h2>Response</h2>

          {result ? (
            <div className={styles.resultContainer}>
              {/* Status Line */}
              <div className={styles.statusLine}>
                <span
                  className={`${styles.statusBadge} ${
                    result.status >= 200 && result.status < 300
                      ? "success"
                      : result.status >= 400
                        ? "error"
                        : "info"
                  }`}
                >
                  {result.status} {result.statusText}
                </span>
                <span className={styles.timing}>{result.timing}ms</span>
              </div>

              {/* Error Message */}
              {result.error && (
                <div className={styles.errorBox}>
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              {/* Response Headers */}
              <details className={styles.section}>
                <summary>Headers ({Object.keys(result.headers).length})</summary>
                <div className={styles.headers}>
                  {Object.entries(result.headers).map(([key, value]) => (
                    <div key={key} className={styles.headerRow}>
                      <span className={styles.key}>{key}:</span>
                      <span className={styles.value}>{value}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Response Body */}
              <details className={styles.section} open>
                <summary>Body</summary>
                <pre className={styles.responseBody}>
                  {typeof result.body === "string"
                    ? result.body
                    : JSON.stringify(result.body, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className={styles.placeholder}>
              Execute a request to see response here
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      {history.length > 0 && (
        <div className={styles.historyPanel}>
          <h3>Recent Tests ({history.length})</h3>
          <div className={styles.historyList}>
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedEndpoint(item.endpoint);
                  setParams({});
                }}
                className={styles.historyItem}
              >
                <span className={styles.historyMethod}>{item.endpoint.method}</span>
                <span className={styles.historyName}>{item.endpoint.name}</span>
                <span
                  className={`${styles.historyStatus} ${
                    item.status >= 200 && item.status < 300
                      ? "success"
                      : "error"
                  }`}
                >
                  {item.status}
                </span>
                <span className={styles.historyTime}>
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
