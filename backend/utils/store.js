const fs = require("fs");
const path = require("path");

function readJSON(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function appendJSON(fileName, entry) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  const list = readJSON(fileName);
  list.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  return list;
}

module.exports = { readJSON, appendJSON };
