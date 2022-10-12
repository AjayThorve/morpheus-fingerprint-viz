// Copyright (c) 2022, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require("path");
const fs = require("fs");

const BASE_PATH = path.join(__dirname, "../../../../../");
export default function handler(req, res) {
  const dataPath = JSON.parse(
    fs.readFileSync(path.join(BASE_PATH, "config.json"))
  );
  const dirPath = path.join(BASE_PATH, dataPath.dataset_path);
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
