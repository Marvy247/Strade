#!/usr/bin/env tsx
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const PORT = parseInt(process.env.PORT || "3456", 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, "..");

let childProcess: ReturnType<typeof spawn> | null = null;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Strade Auto-Activity</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;background:#0f172a;color:#e2e8f0}
.container{text-align:center;padding:2rem;width:100%;max-width:400px}
h1{font-size:1.5rem;margin-bottom:.5rem;color:#f8fafc}
p{font-size:.875rem;color:#94a3b8;margin-bottom:2rem}
.btn{display:block;width:100%;padding:1rem;font-size:1.25rem;font-weight:600;border:none;border-radius:12px;cursor:pointer;margin-bottom:1rem;transition:opacity .2s}
.btn:active{opacity:.7}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-start{background:#22c55e;color:#052e16}
.btn-stop{background:#ef4444;color:#450a0a}
#status{margin-top:1rem;padding:.75rem 1rem;border-radius:8px;font-weight:600;font-size:1rem}
.running{background:#166534;color:#86efac}
.idle{background:#1e293b;color:#94a3b8}
.error{background:#7f1d1d;color:#fca5a5}
.log{background:#1e293b;border-radius:8px;padding:.75rem;margin-top:1rem;max-height:200px;overflow-y:auto;text-align:left;font-family:monospace;font-size:.75rem;line-height:1.4;color:#94a3b8}
</style>
</head>
<body>
<div class="container">
<h1>Strade Auto-Activity</h1>
<p>Start or stop the auto-activity loop</p>
<button class="btn btn-start" id="startBtn" onclick="run('/start')">▶ Start</button>
<button class="btn btn-stop" id="stopBtn" onclick="run('/stop')">■ Stop</button>
<div id="status" class="idle">Idle</div>
<div class="log" id="log">Ready.</div>
</div>
<script>
function log(msg){const el=document.getElementById('log');el.textContent+=msg;el.scrollTop=el.scrollHeight}
async function run(path){const btn=event.target;btn.disabled=true;try{const r=await fetch(path,{method:'POST'});log(await r.text()+'. ')}catch(e){log('Error: '+e.message+'. ')}finally{btn.disabled=false;poll()}}
async function poll(){try{const r=await fetch('/status');const d=await r.json();const el=document.getElementById('status');if(d.running){el.textContent='Running';el.className='running'}else if(d.error){el.textContent='Error';el.className='error';log('['+d.error+'] ')}else{el.textContent='Idle';el.className='idle'}}catch(e){const el=document.getElementById('status');el.textContent='Offline';el.className='error'}}
setInterval(poll,3000);poll()
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/start") {
    if (childProcess) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Already running");
      return;
    }
    const scriptPath = join(REPO_DIR, "scripts", "auto-activity.sh");
    childProcess = spawn("bash", [scriptPath], {
      cwd: REPO_DIR,
      stdio: "inherit",
    });
    childProcess.on("exit", (code) => {
      childProcess = null;
    });
    childProcess.on("error", () => {
      childProcess = null;
    });
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Started");
    return;
  }

  if (req.method === "POST" && req.url === "/stop") {
    if (childProcess) {
      childProcess.kill("SIGTERM");
      childProcess = null;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Stopped");
    return;
  }

  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ running: childProcess !== null }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  const ifaces = networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  console.log(`Mobile control server running:`);
  console.log(`  Local:    http://localhost:${PORT}`);
  for (const ip of ips) {
    console.log(`  Network:  http://${ip}:${PORT}`);
  }
  console.log(`Open one of the Network URLs on your phone's browser.`);
});
