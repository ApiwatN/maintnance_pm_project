// =============================================
// ✅ Next.js Custom Server (HTTPS Support + Force Production)
// =============================================

const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

// -----------------------------
// ⚙️ Configuration
// -----------------------------
// Force Production Mode
process.env.NODE_ENV = "production";
const dev = false;

const port = parseInt(process.env.PORT || "5007", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// SSL Certificates Paths
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certificates", "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "certificates", "server.crt")),
};

// -----------------------------
// 🚀 Start Server
// -----------------------------
app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log("=============================================");
    console.log(`✅ Next.js Server Started (HTTPS)`);
    console.log(`🌐 URL: https://localhost:${port}`);
    console.log(`🔧 Mode: Production (Forced)`);
    console.log("=============================================");
  });
});
