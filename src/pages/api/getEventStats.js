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

const cache = require("../../components/server/cacheDatasets")();
import runMiddleware from "../../components/server/runMiddleware";

export default async function handler(req, res) {
  const datasetName = req.query.dataset;
  await runMiddleware(datasetName, req, res, cache);
  const time = req[datasetName].get("time").max();
  const anomalyThreshold = req.query.anomalyThreshold
    ? parseFloat(req.query.anomalyThreshold)
    : 0.385;

  res.send({
    totalEvents:
      req[datasetName].numRows -
      req[datasetName].get("anomaly_score").nullCount,
    totalAnomalousEvents: req[datasetName].filter(
      req[datasetName].get("anomaly_score").ge(anomalyThreshold)
    ).numRows,
    time: req[datasetName].get("createdTime").getValue(0),
  });
}
