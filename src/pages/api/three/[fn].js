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

import {
  sendDF,
  getInstances,
  gridBasedClickIndex,
  generateData,
} from "../../../components/server/utils";
const cache = require("../../../components/server/cacheDatasets")();
import runMiddleware from "../../../components/server/runMiddleware";

export default async function handler(req, res) {
  const fn = req.query.fn;
  const datasetName = req.query.dataset;
  await runMiddleware(datasetName, req, res, cache);

  if (fn == "getUniqueIDs") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const tempData = req[datasetName].filter(
      req[datasetName].get("time").le(time)
    );
    sendDF(
      generateData(
        req[datasetName],
        tempData,
        "userIDs",
        sort,
        sortBy,
        numUsers
      ),
      res
    );
  } else if (fn == "getDFElevation") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const lookBackTime = req.query.lookBackTime
      ? parseInt(req.query.lookBackTime)
      : 20;
    const tempData = req[datasetName].filter(
      req[datasetName].get("time").le(time)
    );
    sendDF(
      generateData(
        req[datasetName],
        tempData,
        "elevation",
        sort,
        sortBy,
        numUsers,
        lookBackTime
      ),
      res
    );
  } else if (fn == "getDFColors") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const lookBackTime = req.query.lookBackTime
      ? parseInt(req.query.lookBackTime)
      : 20;
    const colorThreshold = req.query.colorThreshold
      ? req.query.colorThreshold.split(",").map((x) => parseFloat(x))
      : [0.1, 0.385];
    const tempData = req[datasetName].filter(
      req[datasetName].get("time").le(time)
    );

    sendDF(
      generateData(
        req[datasetName],
        tempData,
        "colors",
        sort,
        sortBy,
        numUsers,
        lookBackTime,
        colorThreshold
      ),
      res
    );
  } else if (fn == "getGridBasedClickIndex") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const selectedEventUserID = req.query.selectedEventUserID
      ? parseInt(req.query.selectedEventUserID)
      : -1;
    const selectedEventTime = req.query.selectedEventTime
      ? parseInt(req.query.selectedEventTime)
      : -1;
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const lookBackTime = req.query.lookBackTime
      ? parseInt(req.query.lookBackTime)
      : 20;
    const tempData = req[datasetName].filter(
      req[datasetName].get("time").le(time)
    );
    res.send({
      index: gridBasedClickIndex(
        req[datasetName],
        tempData,
        sort,
        sortBy,
        {
          selectedEventUserID,
          selectedEventTime,
        },
        numUsers,
        lookBackTime
      ),
    });
  } else if (fn == "getTotalTime") {
    res.send(req[datasetName].get("time").max() - 1);
  } else if (fn == "getNumUsers") {
    res.send({ numUsers: req[datasetName].get("userID").nunique() });
  } else if (fn == "getEventStats") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").min();
    const events = req[datasetName].filter(
      req[datasetName].get("time").eq(time)
    );
    res.send({
      totalEvents: events.numRows - events.get("anomaly_score").nullCount,
      totalAnomalousEvents: events.filter(events.get("anomaly_score").ge(0.385))
        .numRows,
    });
  } else if (fn == "getInstances") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : req[datasetName].get("time").min();
    const id = req.query.id ? parseInt(req.query.id) : -1;
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";

    const tempData = req[datasetName].filter(
      req[datasetName].get("time").le(time)
    );

    if (id >= 0) {
      res.send({
        result: getInstances(req[datasetName], id, tempData, sort, sortBy)
          .toArrow()
          .toArray(),
      });
    } else {
      res.send({
        result: null,
      });
    }
  } else if (fn == "getEventByIndex") {
    const index = parseInt(req.query.index);
    const tempData = req[datasetName].filter(
      req[datasetName].get("index").eq(index)
    );

    if (index >= 0) {
      res.send({
        result: tempData.toArrow().toArray(),
      });
    } else {
      res.send({
        result: null,
      });
    }
  }
}
