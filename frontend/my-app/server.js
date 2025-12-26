// =============================================
// ✅ Next.js Custom Server (Production Only)
// =============================================

const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const path = require("path");
const fs = require("fs");

// -----------------------------
// ⚙️ Force Production Mode
// -----------------------------
process.env.NODE_ENV = "production";

const port = parseInt(process.env.PORT || "5002", 10);
const app = next({ dev: false }); // 👈 production only
const handle = app.getRequestHandler();

// -----------------------------
// 🧹 Clean up stale lock if exists (just in case)
// -----------------------------
const lockFile = path.join(".next", "dev", "lock");
try {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log("🧹 Removed old .next/dev/lock file (safety cleanup)");
  }
} catch (err) {
  console.warn("⚠️ Cleanup warning:", err.message);
}

// -----------------------------
// � SSL Certificates
// -----------------------------
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certificates", "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "certificates", "server.crt")),
};

// -----------------------------
// �🚀 Start Server
// -----------------------------
app
  .prepare()
  .then(() => {
    createServer(httpsOptions, (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error("❌ Server error:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, "0.0.0.0", () => {
      console.log("=============================================");
      console.log(`✅ Next.js Production Server Started (HTTPS)`);
      console.log(`🌐 URL: https://localhost:${port}`);
      console.log(`🔧 Mode: production`);
      console.log("=============================================");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
