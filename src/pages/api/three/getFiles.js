const path = require("path");
const fs = require("fs");

const BASE_PATH = path.join(__dirname, "../../../../../");
export default function handler(req, res) {
  const dataPath = JSON.parse(
    fs.readFileSync(path.join(BASE_PATH, "config.json"))
  );
  const dirPath = path.join(BASE_PATH, dataPath.datasetPath);
  let fileNames = [];
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      res.send(err);
    }
    files.forEach((file) => {
      if (path.extname(file) == ".csv") {
        fileNames.push(file);
      }
    });
    res.send(fileNames);
  });
}
