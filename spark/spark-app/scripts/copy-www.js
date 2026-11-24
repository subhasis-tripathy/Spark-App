// Copies everything in app/ (index.html, fonts/, assets/, ...) into www/, which Capacitor packages into the APK.
const fs = require("fs");
fs.rmSync("www", { recursive: true, force: true });
fs.cpSync("app", "www", { recursive: true });
console.log("Copied app/ -> www/:", fs.readdirSync("www").join(", "));
