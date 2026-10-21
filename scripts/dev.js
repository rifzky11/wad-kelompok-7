const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const targets = [
  { name: "backend", cwd: path.join(root, "backend") },
  { name: "frontend", cwd: path.join(root, "frontend") },
];

const children = targets.map(({ name, cwd }) => {
  const child = spawn("npm", ["run", "dev"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] berhenti (${signal}).`);
      return;
    }
    if (code !== 0) {
      console.error(`[${name}] keluar dengan kode ${code}.`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
