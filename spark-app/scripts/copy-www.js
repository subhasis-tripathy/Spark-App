const fs = require("fs");
fs.mkdirSync("www", { recursive: true });
fs.copyFileSync("app/index.html", "www/index.html");
fs.rmSync("www/fonts", { recursive: true, force: true });
fs.cpSync("app/fonts", "www/fonts", { recursive: true });
console.log("Copied app/index.html and app/fonts -> www/");
