/**
 * Ignition Landing Page Worker
 *
 * Serves static landing pages instantly while containers wake up.
 * Provides /_warm endpoint to pre-heat containers in background.
 */

export interface Env {
  FRONTEND_CONTAINER_URL: string;
  BACKEND_API_URL: string;
}

// Static HTML templates
const LANDING_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ignition - Fuel Your Potential</title>
  <meta name="description" content="Ignition helps you focus, plan, and achieve your goals with ADHD-friendly tools.">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🔥%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      --bg: #0a0a0a;
      --text: #fafafa;
      --muted: #888;
      --accent: #f97316;
      --accent-hover: #ea580c;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #222;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent);
      text-decoration: none;
    }
    nav a {
      color: var(--muted);
      text-decoration: none;
      margin-left: 2rem;
      transition: color 0.2s;
    }
    nav a:hover { color: var(--text); }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .hero {
      text-align: center;
      max-width: 600px;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--accent), #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      font-size: 1.25rem;
      color: var(--muted);
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .cta-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 0.875rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid #333;
    }
    .btn-secondary:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    footer {
      padding: 2rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.875rem;
      border-top: 1px solid #222;
    }
    footer a {
      color: var(--muted);
      text-decoration: none;
      margin: 0 1rem;
    }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo">🔥 Ignition</a>
    <nav>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  <main>
    <div class="hero">
      <h1>Fuel Your Potential</h1>
      <p class="tagline">
        Ignition is your ADHD-friendly productivity companion.
        Focus on what matters, celebrate wins, and build momentum that lasts.
      </p>
      <div class="cta-group">
        <a href="/auth/signin" class="btn btn-primary" id="login-btn">Get Started</a>
        <a href="/about" class="btn btn-secondary">Learn More</a>
      </div>
    </div>
  </main>
  <footer>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <span>© 2026 Ignition</span>
  </footer>
  <script>
    // Pre-warm containers when user hovers over login
    const btn = document.getElementById('login-btn');
    let warmed = false;
    btn.addEventListener('mouseenter', () => {
      if (!warmed) {
        warmed = true;
        fetch('/_warm', { method: 'POST' }).catch(() => {});
      }
    });
  </script>
</body>
</html>`;

const ABOUT_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>About Ignition</h1>
    <p>Ignition is built for minds that work differently. We understand that traditional productivity tools don't always fit the way ADHD brains operate.</p>
    <p>Our approach combines gamification, dopamine-friendly feedback loops, and flexible planning to help you stay focused and celebrate every win along the way.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const CONTACT_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Contact Us</h1>
    <p>Have questions or feedback? We'd love to hear from you.</p>
    <p>Email: <a href="mailto:hello@ecent.online">hello@ecent.online</a></p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const PRIVACY_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Privacy Policy</h1>
    <p>Last updated: January 2026</p>
    <h2>Data We Collect</h2>
    <p>We collect only the data necessary to provide our service: your email (via OAuth), and your productivity data (tasks, goals, habits).</p>
    <h2>How We Use Your Data</h2>
    <p>Your data is used solely to power your Ignition experience. We do not sell or share your personal data with third parties.</p>
    <h2>Data Storage</h2>
    <p>Your data is stored securely using industry-standard encryption and hosted on Cloudflare infrastructure.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const TERMS_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Terms of Service</h1>
    <p>Last updated: January 2026</p>
    <h2>Acceptance of Terms</h2>
    <p>By using Ignition, you agree to these terms of service.</p>
    <h2>User Responsibilities</h2>
    <p>You are responsible for maintaining the security of your account and for all activities under your account.</p>
    <h2>Service Availability</h2>
    <p>We strive for high availability but do not guarantee uninterrupted service.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

// Static pages map
const STATIC_PAGES: Record<string, string> = {
  "/": LANDING_PAGE,
  "/about": ABOUT_PAGE,
  "/contact": CONTACT_PAGE,
  "/privacy": PRIVACY_PAGE,
  "/terms": TERMS_PAGE,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/_health") {
      return new Response(JSON.stringify({ status: "ok", service: "landing" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Warm-up endpoint - fires container fetches in background
    if (path === "/_warm" && request.method === "POST") {
      // Fire and forget - warm up both containers
      const warmPromises = [
        fetch(`${env.FRONTEND_CONTAINER_URL}/_health`).catch(() => null),
        fetch(`${env.BACKEND_API_URL}/health`).catch(() => null),
      ];
      
      // Don't await - let them run in background
      Promise.all(warmPromises);
      
      return new Response(JSON.stringify({ status: "warming" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static pages
    const staticPage = STATIC_PAGES[path];
    if (staticPage) {
      return new Response(staticPage, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300", // 5 min cache
        },
      });
    }

    // Auth signin redirect - show loading screen and wake containers
    if (path === "/auth/signin" || path.startsWith("/auth/signin/")) {
      // Extract provider from path if present
      const provider = path.replace("/auth/signin/", "").replace("/auth/signin", "") || "google";
      
      // Show loading screen that wakes containers and redirects
      const authUrl = `${env.BACKEND_API_URL}/auth/signin/${provider}`;
      const containerUrl = env.FRONTEND_CONTAINER_URL;
      
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing In - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; --success: #22c55e; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; max-width: 420px; padding: 2rem; }
    .logo { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--text); }
    .subtitle { color: var(--muted); margin-bottom: 2rem; font-size: 0.95rem; }
    
    /* Progress container */
    .progress-container { margin: 2rem 0; }
    .progress-label { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .progress-label .step { color: var(--muted); }
    .progress-label .time { color: var(--accent); font-weight: 600; }
    .progress { width: 100%; height: 8px; background: #1a1a1a; border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }
    .progress-bar { height: 100%; background: linear-gradient(90deg, var(--accent), #fbbf24); width: 0%; transition: width 0.3s ease-out; border-radius: 4px; }
    .progress-bar.complete { background: var(--success); width: 100% !important; }
    
    /* Status steps */
    .steps { margin: 2rem 0; text-align: left; }
    .step-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; font-size: 0.9rem; color: var(--muted); }
    .step-item.active { color: var(--text); }
    .step-item.done { color: var(--success); }
    .step-item .icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
    .step-item.pending .icon::before { content: '○'; }
    .step-item.active .icon::before { content: '◐'; animation: pulse 1s ease-in-out infinite; }
    .step-item.done .icon::before { content: '✓'; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    
    /* Estimated time */
    .estimate { margin-top: 1.5rem; padding: 1rem; background: #111; border-radius: 8px; border: 1px solid #222; }
    .estimate-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.25rem; }
    .estimate-time { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .estimate-time.ready { color: var(--success); }
    
    /* Login button */
    .login-btn { 
      margin-top: 2rem; 
      display: inline-block; 
      padding: 1rem 2.5rem; 
      background: #333; 
      color: #666; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 1rem;
      text-decoration: none; 
      cursor: not-allowed;
      transition: all 0.3s;
      pointer-events: none;
    }
    .login-btn.ready { 
      background: var(--accent); 
      color: white; 
      cursor: pointer; 
      pointer-events: auto;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
    }
    .login-btn.ready:hover { 
      background: #ea580c; 
      transform: translateY(-2px); 
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
    }
    
    /* Error state */
    .error-msg { margin-top: 1rem; padding: 0.75rem 1rem; background: #1a0a0a; border: 1px solid #3a1a1a; border-radius: 6px; color: #f87171; font-size: 0.875rem; display: none; }
    .error-msg.show { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔥</div>
    <h1>Preparing Ignition</h1>
    <p class="subtitle">Getting everything ready for your session</p>
    
    <div class="progress-container">
      <div class="progress-label">
        <span class="step" id="step-text">Initializing...</span>
        <span class="time" id="time-remaining">~15s</span>
      </div>
      <div class="progress">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
    </div>
    
    <div class="steps">
      <div class="step-item pending" id="step-1">
        <span class="icon"></span>
        <span>Waking up services</span>
      </div>
      <div class="step-item pending" id="step-2">
        <span class="icon"></span>
        <span>Connecting to backend</span>
      </div>
      <div class="step-item pending" id="step-3">
        <span class="icon"></span>
        <span>Loading frontend</span>
      </div>
      <div class="step-item pending" id="step-4">
        <span class="icon"></span>
        <span>Ready to sign in</span>
      </div>
    </div>
    
    <div class="estimate">
      <div class="estimate-label">Estimated time</div>
      <div class="estimate-time" id="estimate">~15 seconds</div>
    </div>
    
    <a href="#" class="login-btn" id="login-btn">Continue to Sign In</a>
    
    <div class="error-msg" id="error-msg">
      Services are taking longer than expected. You can still try to sign in.
    </div>
  </div>
  
  <script>
    const authUrl = "${authUrl}";
    const containerUrl = "${containerUrl}";
    const backendUrl = "${env.BACKEND_API_URL}";
    
    const progressBar = document.getElementById('progress-bar');
    const stepText = document.getElementById('step-text');
    const timeRemaining = document.getElementById('time-remaining');
    const estimate = document.getElementById('estimate');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('error-msg');
    
    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4'),
    ];
    
    function setStep(index, state) {
      steps[index].className = 'step-item ' + state;
    }
    
    function updateProgress(percent, text, timeLeft) {
      progressBar.style.width = percent + '%';
      stepText.textContent = text;
      timeRemaining.textContent = timeLeft;
    }
    
    async function checkHealth(url) {
      try {
        const res = await fetch(url, { method: 'GET', mode: 'cors' });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
    
    async function warmAndReady() {
      const startTime = Date.now();
      const maxWait = 25000; // 25 seconds max
      let backendReady = false;
      let frontendReady = false;
      
      // Step 1: Waking up
      setStep(0, 'active');
      updateProgress(10, 'Waking up services...', '~15s');
      estimate.textContent = '~15 seconds';
      
      // Initial warm-up pings (fire and forget)
      fetch(containerUrl + '/_health').catch(() => {});
      fetch(backendUrl + '/health').catch(() => {});
      
      await new Promise(r => setTimeout(r, 1000));
      setStep(0, 'done');
      
      // Step 2: Backend check
      setStep(1, 'active');
      updateProgress(25, 'Connecting to backend...', '~12s');
      estimate.textContent = '~12 seconds';
      
      let attempts = 0;
      while (attempts < 15 && !backendReady) {
        backendReady = await checkHealth(backendUrl + '/health');
        if (backendReady) break;
        attempts++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(1, 15 - elapsed);
        updateProgress(25 + (attempts * 2), 'Connecting to backend...', '~' + remaining + 's');
        estimate.textContent = '~' + remaining + ' seconds';
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (backendReady) {
        setStep(1, 'done');
      } else {
        setStep(1, 'active'); // Still trying
      }
      
      // Step 3: Frontend check
      setStep(2, 'active');
      updateProgress(55, 'Loading frontend...', '~8s');
      estimate.textContent = '~8 seconds';
      
      attempts = 0;
      while (attempts < 10 && !frontendReady) {
        frontendReady = await checkHealth(containerUrl + '/_health');
        if (frontendReady) break;
        attempts++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(1, 20 - elapsed);
        updateProgress(55 + (attempts * 3), 'Loading frontend...', '~' + remaining + 's');
        estimate.textContent = '~' + remaining + ' seconds';
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (frontendReady) {
        setStep(2, 'done');
      }
      
      // Step 4: Ready state
      setStep(3, 'active');
      
      if (backendReady && frontendReady) {
        // All systems go!
        setStep(3, 'done');
        progressBar.classList.add('complete');
        updateProgress(100, 'All systems ready!', '✓');
        estimate.textContent = 'Ready!';
        estimate.classList.add('ready');
        
        // Enable login button
        loginBtn.classList.add('ready');
        loginBtn.href = authUrl;
        loginBtn.textContent = 'Continue to Sign In →';
        
      } else if (backendReady) {
        // Backend ready, frontend still loading - allow proceed with warning
        setStep(3, 'done');
        updateProgress(90, 'Almost ready...', '~5s');
        estimate.textContent = 'Almost ready';
        
        loginBtn.classList.add('ready');
        loginBtn.href = authUrl;
        loginBtn.textContent = 'Continue to Sign In →';
        errorMsg.textContent = 'Frontend is still warming up, but you can sign in now.';
        errorMsg.classList.add('show');
        
      } else {
        // Timeout - show error but allow manual proceed
        updateProgress(85, 'Taking longer than expected', '—');
        estimate.textContent = 'Please wait...';
        
        loginBtn.classList.add('ready');
        loginBtn.href = authUrl;
        loginBtn.textContent = 'Try Signing In Anyway →';
        errorMsg.classList.add('show');
      }
    }
    
    warmAndReady();
  </script>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // For all other paths, proxy to frontend container
    const containerUrl = `${env.FRONTEND_CONTAINER_URL}${path}${url.search}`;
    
    try {
      const response = await fetch(containerUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return response;
    } catch (error) {
      // Container not ready - show loading page with estimate
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; --success: #22c55e; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; max-width: 400px; padding: 2rem; }
    .logo { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text); }
    .subtitle { color: var(--muted); margin-bottom: 2rem; font-size: 0.9rem; }
    
    .spinner { 
      width: 56px; 
      height: 56px; 
      border: 4px solid #1a1a1a; 
      border-top-color: var(--accent); 
      border-radius: 50%; 
      animation: spin 0.8s linear infinite; 
      margin: 1.5rem auto; 
      box-shadow: 0 0 20px rgba(249, 115, 22, 0.2);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .progress-container { margin: 1.5rem 0; }
    .progress { width: 100%; height: 6px; background: #1a1a1a; border-radius: 3px; overflow: hidden; }
    .progress-bar { 
      height: 100%; 
      background: linear-gradient(90deg, var(--accent), #fbbf24); 
      width: 0%; 
      border-radius: 3px;
      animation: loading 12s ease-out forwards;
    }
    @keyframes loading { 
      0% { width: 0%; } 
      30% { width: 40%; } 
      60% { width: 70%; }
      90% { width: 88%; }
      100% { width: 92%; }
    }
    
    .estimate { 
      margin-top: 1rem;
      padding: 0.75rem 1rem; 
      background: #111; 
      border-radius: 6px; 
      border: 1px solid #222;
      display: inline-block;
    }
    .estimate-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .estimate-time { font-size: 1.25rem; font-weight: 600; color: var(--accent); margin-top: 0.25rem; }
    
    .status { 
      font-size: 0.8rem; 
      color: var(--muted); 
      margin-top: 1.5rem; 
      padding: 0.5rem 1rem;
      background: rgba(249, 115, 22, 0.1);
      border-radius: 4px;
    }
  </style>
  <meta http-equiv="refresh" content="3">
</head>
<body>
  <div class="container">
    <div class="logo">🔥</div>
    <h1>Starting Ignition</h1>
    <p class="subtitle">The app is waking up — this only takes a moment</p>
    <div class="spinner"></div>
    <div class="progress-container">
      <div class="progress"><div class="progress-bar"></div></div>
    </div>
    <div class="estimate">
      <div class="estimate-label">Estimated wait</div>
      <div class="estimate-time">~10 seconds</div>
    </div>
    <p class="status">This page will refresh automatically</p>
  </div>
</body>
</html>`,
        {
          status: 503,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Retry-After": "3",
          },
        }
      );
    }
  },
};
