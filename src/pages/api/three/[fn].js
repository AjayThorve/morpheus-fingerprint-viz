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

const { RecordBatchStreamWriter } = require("apache-arrow");
const pipeline = require("util").promisify(require("stream").pipeline);
const { DataFrame, Int32, Uint32, Series, Float32 } = require("@rapidsai/cudf");
const { mapValuesToColorSeries } = require("../../../components/utils");

async function sendDF(df, res) {
  await pipeline(
    RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
    res.writeHead(200, "Ok", { "Content-Type": "application/octet-stream" })
  );
}

let data = DataFrame.readParquet({
  sourceType: "files",
  sources: ["./public/data/interesting-users-34-enriched.parquet"],
}).rename({ anomaly_score: "anomalyScore" });

data = data.assign({
  userID: data.get("userPrincipalName").encodeLabels().cast(new Uint32()),
  elevation: data.get("time"),
  userPrincipalName: data
    .get("userPrincipalName")
    .pad(12, "right", " ")
    .pad(13, "right", "\n"),
});

const names = data
  .sortValues({ userID: { ascending: true } })
  .get("userPrincipalName")
  .unique();

const paddingDF = new DataFrame({
  userID: data
    .sortValues({ userID: { ascending: true } })
    .get("userID")
    .unique(),
  names: names,
});

function offsetBasedGridData(df, hexRadius, numUsers, lookBackTime) {
  const size = Math.min(df.get("userID").nunique(), numUsers);
  let x = Series.new([]).cast(new Float32());
  let sortIndex = Series.new([]).cast(new Int32());
  let index = Series.new([]).cast(new Int32());
  let y = Series.new([]).cast(new Float32());
  let time = Series.new([]).cast(new Int32());
  let userID = Series.new([]).cast(new Int32());

  for (var t = 0; t < lookBackTime; t++) {
    x = x
      .concat(
        Series.sequence({
          type: new Float32(),
          init: hexRadius * t * Math.sqrt(3),
          step: 0,
          size: Math.ceil(size / 2),
        })
      )
      .concat(
        Series.sequence({
          type: new Float32(),
          init: hexRadius * t * Math.sqrt(3) + (hexRadius * Math.sqrt(3)) / 2,
          step: 0,
          size: Math.floor(size / 2),
        })
      );

    index = index
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t,
          step: lookBackTime * 2,
          size: Math.ceil(size / 2),
        })
      )
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t + lookBackTime,
          step: lookBackTime * 2,
          size: Math.floor(size / 2),
        })
      );

    sortIndex = sortIndex
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t * size,
          step: 2,
          size: Math.ceil(size / 2),
        })
      )
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t * size + 1,
          step: 2,
          size: Math.floor(size / 2),
        })
      );

    y = y
      .concat(
        Series.sequence({
          type: new Float32(),
          init: 0,
          step: hexRadius * 3,
          size: Math.ceil(size / 2),
        })
      )
      .concat(
        Series.sequence({
          type: new Float32(),
          init: hexRadius * 1.5,
          step: hexRadius * 3,
          size: Math.floor(size / 2),
        })
      );

    time = time.concat(
      Series.sequence({
        type: new Int32(),
        init: t,
        step: 0,
        size: size,
      })
    );

    userID = userID.concat(
      Series.sequence({
        type: new Int32(),
        init: 0,
        step: 1,
        size: size,
      })
    );
  }
  let coords = new DataFrame({
    x,
    y,
    time,
    index,
    userID,
    sortIndex,
  }).sortValues({
    sortIndex: { ascending: true },
  });

  coords = coords.assign({
    offset_0: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_1: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_2: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_3: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_4: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    elevation: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_6: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_7: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_8: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_9: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_10: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_11: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_13: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    offset_15: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    color_r: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    color_g: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    color_b: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * lookBackTime,
    }),
    anomalyScoreMax: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * lookBackTime,
    }),
  });
  return coords.assign({
    row: userID,
  });
}

const namesPosition = [
  "offset_0",
  "offset_1",
  "offset_2",
  "offset_3",
  "offset_4",
  "elevation",
  "offset_6",
  "offset_7",
  "offset_8",
  "offset_9",
  "offset_10",
  "offset_11",
  "x",
  "offset_13",
  "y",
  "offset_15",
];

const namesColor = ["color_r", "color_g", "color_b"];

function print(df) {
  console.log(df.toArrow().toArray());
}

function compAggregate(df, aggregateFn = "sum") {
  switch (aggregateFn) {
    case "sum":
      return df
        .sum()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
    case "mean":
      return df
        .mean()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
    case "max":
      return df
        .max()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
    case "min":
      return df
        .min()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
    case "count":
      return df
        .count()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
    default:
      return df
        .sum()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID");
  }
}

function getInstances(instanceID, df, sort = false, sortBy = "sum") {
  let order = sort
    ? compAggregate(
        df.select(["userID", "anomalyScore"]).groupBy({ by: "userID" }),
        sortBy
      )
    : df.get("userID").unique();
  const totalUsers = data.get("userID").nunique();
  const time = parseInt(df.get("time").max() - instanceID / totalUsers);
  const userID = order.getValue(parseInt(instanceID % totalUsers));

  const resultMask = data
    .get("userID")
    .eq(userID)
    .logicalAnd(data.get("time").eq(time));
  return data
    .filter(resultMask)
    .select(["userID", "time", "index", "anomalyScore"])
    .sortValues({ anomalyScore: { ascending: false } });
}

function gridBasedClickIndex(
  df,
  sort = false,
  sortBy = "sum",
  selectedEvent = {},
  numUsers = -1,
  lookBackTime = 20
) {
  const selectedUserID = selectedEvent.selectedEventUserID;
  if (
    selectedUserID == "undefined" ||
    isNaN(selectedUserID) ||
    selectedUserID == -1
  ) {
    return -1;
  }
  const totalUsers = data.get("userID").nunique();
  const selectedTime = selectedEvent.selectedEventTime;
  const selectedGridTime = (df.get("time").max() - selectedTime) % lookBackTime;

  let order = new DataFrame({
    userID: sort
      ? compAggregate(
          df.select(["userID", "anomalyScore"]).groupBy({ by: "userID" }),
          sortBy
        )
      : df.get("userID").unique(),
    index: Series.sequence({
      size: totalUsers,
      init: 0,
      step: 1,
      type: new Uint32(),
    }),
  });

  if (numUsers != -1) {
    order = order.head(numUsers);
  }

  const orderselectedUserID = order
    .filter(order.get("userID").eq(selectedUserID))
    .get("index")
    .getValue(0);

  if (selectedUserID == 0) {
    return orderselectedUserID + totalUsers * selectedGridTime; // instanceID
  }
  return orderselectedUserID + totalUsers * selectedGridTime - totalUsers; // instanceID
}

function generateData(
  df,
  type = "elevation",
  sort = false,
  sortBy = "sum",
  numUsers = -1,
  lookBackTime = 20,
  colorThreshold = [0.1, 0.385]
) {
  let order = sort
    ? compAggregate(
        df.select(["userID", "anomalyScore"]).groupBy({ by: "userID" }),
        sortBy
      )
    : df.get("userID").unique();

  if (numUsers != -1) {
    order = order.head(numUsers);
    df = df.join({
      other: new DataFrame({ userID: order }),
      on: ["userID"],
      how: "right",
    });
    // print(df.get("userID").unique());
    // print(df.get("time").unique());
  }

  if (type == "userIDs") {
    return (
      new DataFrame({
        userID: order,
        names: names.gather(order),
      })
        // .join({ other: paddingDF, on: ["userID"], how: "outer", lsuffix: "_r" })
        .select(["names"])
    );
  }
  const maxRows = Math.min(data.get("userID").nunique(), numUsers);
  let tempData = offsetBasedGridData(df, 20, maxRows, lookBackTime);

  const group = df
    .select(["userID", "time", "anomalyScore", "elevation"])
    .groupBy({ by: ["userID", "time"] });
  let finData = group.sum();

  finData = finData
    .assign({
      anomalyScoreMax: group.max().get("anomalyScore"),
      userID: finData.get("userID_time").getChild("userID"),
      time: finData.get("userID_time").getChild("time"),
    })
    .drop(["userID_time"])
    .sortValues({ userID: { ascending: true }, time: { ascending: true } })
    .sortValues({ anomalyScore: { ascending: false } });

  console.time(`compute${type}${df.get("time").max()}`);
  [...df.get("time").unique().sortValues(false).head(lookBackTime)].forEach(
    (t) => {
      let sortedResults = finData.filter(finData.get("time").eq(t));
      sortedResults = sortedResults
        .join({ other: paddingDF, on: ["userID"], how: "outer", rsuffix: "_r" })
        .drop(["userID_r"])
        .sortValues({ userID: { ascending: true } });

      sortedResults = sortedResults.gather(order);

      const gridTime = (df.get("time").max() - t) % lookBackTime;
      const gridIndex = Series.sequence({
        size: order.length,
        init: 0,
        step: 1,
        type: new Uint32(),
      })
        .add(maxRows * gridTime)
        .cast(new Int32());

      if (type == "elevation") {
        const elevation = sortedResults
          .get("elevation")
          .replaceNulls(-1)
          .div(t);
        tempData = tempData.assign({
          elevation: tempData.get("elevation").scatter(elevation, gridIndex),
          userID: tempData
            .get("userID")
            .scatter(sortedResults.get("userID"), gridIndex),
        });
      } else if (type == "colors") {
        const anomalyScoreMax = sortedResults.get("anomalyScoreMax");
        tempData = tempData.assign({
          anomalyScoreMax: tempData
            .get("anomalyScoreMax")
            .scatter(anomalyScoreMax, gridIndex),
          userID: tempData
            .get("userID")
            .scatter(sortedResults.get("userID"), gridIndex),
        });
      }
    }
  );

  if (type == "colors") {
    const colors = mapValuesToColorSeries(
      tempData.get("anomalyScoreMax"),
      [colorThreshold[0], colorThreshold[1], 0.01],
      ["#f00", "#ff0"]
    );
    tempData = tempData.assign({
      color_r: colors.color_r,
      color_g: colors.color_g,
      color_b: colors.color_b,
    });
  }
  console.timeEnd(`compute${type}${df.get("time").max()}`);

  return new DataFrame({
    [type]: tempData
      .select(type == "elevation" ? namesPosition : namesColor)
      .interleaveColumns()
      .cast(new Float32()),
  });
}

export default async function handler(req, res) {
  const fn = req.query.fn;
  if (fn == "getUniqueIDs") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "userIDs", sort, sortBy, numUsers), res);
  } else if (fn == "getDFElevation") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const lookBackTime = req.query.lookBackTime
      ? parseInt(req.query.lookBackTime)
      : 20;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(
      generateData(tempData, "elevation", sort, sortBy, numUsers, lookBackTime),
      res
    );
  } else if (fn == "getDFColors") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";
    const numUsers = req.query.numUsers ? parseInt(req.query.numUsers) : -1;
    const lookBackTime = req.query.lookBackTime
      ? parseInt(req.query.lookBackTime)
      : 20;
    const colorThreshold = req.query.colorThreshold
      ? req.query.colorThreshold.split(",").map((x) => parseFloat(x))
      : [0.1, 0.385];
    const tempData = data.filter(data.get("time").le(time));

    sendDF(
      generateData(
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
      : data.get("time").max();
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
    const tempData = data.filter(data.get("time").le(time));
    res.send({
      index: gridBasedClickIndex(
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
    res.send(data.get("time").max() - 1);
  } else if (fn == "getNumUsers") {
    res.send({ numUsers: data.get("userID").nunique() });
  } else if (fn == "getEventStats") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").min();
    const events = data.filter(data.get("time").eq(time));
    res.send({
      totalEvents: events.numRows - events.get("anomalyScore").nullCount,
      totalAnomalousEvents: events.filter(events.get("anomalyScore").ge(0.385))
        .numRows,
    });
  } else if (fn == "getInstances") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").min();
    const id = req.query.id ? parseInt(req.query.id) : -1;
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const sortBy = req.query.sortBy ? req.query.sortBy : "sum";

    const tempData = data.filter(data.get("time").le(time));

    if (id >= 0) {
      res.send({
        result: getInstances(id, tempData, sort, sortBy).toArrow().toArray(),
      });
    } else {
      res.send({
        result: null,
      });
    }
  } else if (fn == "getEventByIndex") {
    const index = parseInt(req.query.index);
    const tempData = data.filter(data.get("index").eq(index));

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
