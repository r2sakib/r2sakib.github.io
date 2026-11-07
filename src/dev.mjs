// Local preview: serves dist/ and rebuilds whenever a source file is saved.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const port = Number(process.env.PORT) || 4321;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

const build = () => spawnSync(process.execPath, [join(root, "src/build.mjs")], { stdio: "inherit" });

let timer;
for (const folder of ["content", "public", "src"]) {
  watch(join(root, folder), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 100);
  });
}

function resolve(url) {
  const path = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const file = normalize(join(dist, path));
  if (!file.startsWith(dist + sep) && file !== dist) return null;
  if (existsSync(file) && statSync(file).isDirectory()) return join(file, "index.html");
  return file;
}

createServer((request, response) => {
  const file = resolve(request.url);
  if (file && existsSync(file)) {
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
    return;
  }
  const notFound = join(dist, "404.html");
  response.writeHead(404, { "Content-Type": types[".html"] });
  response.end(existsSync(notFound) ? readFileSync(notFound) : "Not built yet. Check the terminal for errors.");
}).listen(port, () => {
  console.log(`Preview: http://localhost:${port}  (saves rebuild automatically, then refresh)`);
});

build();
