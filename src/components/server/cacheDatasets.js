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
const { DataFrame, Uint32 } = require("@rapidsai/cudf");
const path = require("path");

module.exports = () => {
  let timeout = {};
  let datasets = {};
  // let uberTracts = null;

  function clearCachedGPUData(datasetName) {
    datasets[datasetName] = null;
  }

  return async function loadDataMiddleware(datasetName, req, res, next) {
    if (timeout[datasetName]) {
      clearTimeout(timeout[datasetName]);
    }

    // Set a 10-minute debounce to release server GPU memory
    timeout[datasetName] = setTimeout(
      clearCachedGPUData.bind(null, datasetName),
      10 * 60 * 1000
    );

    req[datasetName] =
      datasets[datasetName] ||
      (datasets[datasetName] = await readDataset(datasets, datasetName));

    next();
  };
};

async function readDataset(datasets, datasetName) {
  let fn = DataFrame.readParquet;
  datasetName = path.join(process.env.dataset_path, datasetName);
  if (path.extname(datasetName) == "csv") {
    fn = DataFrame.readCSV;
  }
  const data = fn({
    sourceType: "files",
    sources: [datasetName],
  });

  return data.assign({
    userID: data.get("userPrincipalName").encodeLabels().cast(new Uint32()),
    elevation: data.get("time"),
    userPrincipalName: data
      .get("userPrincipalName")
      .pad(12, "right", " ")
      .pad(13, "right", "\n"),
  });
}
