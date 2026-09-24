const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8080;

const buildPath = fs.existsSync(path.join(__dirname, "build"))
  ? path.join(__dirname, "build")
  : __dirname;

app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Esigniva React App server running on port ${port}`);
});
