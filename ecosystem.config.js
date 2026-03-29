const path = require("path");

/**
 * PM2 — flight tracker push worker (5 min polling via setInterval in script).
 * Install: npm i -g pm2
 * Start:   pm2 start ecosystem.config.js
 * Logs:   pm2 logs flight-tracker-worker
 */
module.exports = {
  apps: [
    {
      name: "flight-tracker-worker",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules", "tsx", "dist", "cli.mjs"),
      args: [path.join(__dirname, "scripts", "checkFlightChanges.ts")],
      interpreter: "node",
      autorestart: true,
      max_restarts: 100,
      min_uptime: 5_000,
      exp_backoff_restart_delay: 2_000,
    },
  ],
};
