/**
 * Performance instrumentation exports
 */

export {
  getRequestContext,
  isPerfDebugEnabled,
  recordTiming,
  recordUpstreamCall,
  memoize,
  memoizeSync,
  getServerTimingHeader,
  getTimingSummary,
  timeAsync,
  timeSync,
  type RequestTimings,
  type RequestContext,
} from "./request-context";

// Note: createAPIHandler was deprecated when API routes moved to Rust backend
// See deprecated/app/frontend/src/lib/perf/api-handler.ts

