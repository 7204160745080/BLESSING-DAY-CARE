const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const publicDirectory = __dirname;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  if (relativePath.split("/").some((segment) => segment.startsWith("."))) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const filePath = path.resolve(publicDirectory, relativePath);
  const pathFromRoot = path.relative(publicDirectory, filePath);

  if (pathFromRoot.startsWith("..") || path.isAbsolute(pathFromRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", () => {
      if (!response.headersSent) {
        response.writeHead(500);
      }
      response.end("Internal server error");
    });
    fileStream.pipe(response);
  });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Blessing Day Care is listening on port ${port}`);
});
