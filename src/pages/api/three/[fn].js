const { RecordBatchStreamWriter, Uint32 } = require("apache-arrow");
const pipeline = require("util").promisify(require("stream").pipeline);
const { DataFrame, Int32, Series, Float32 } = require("@rapidsai/cudf");
const { mapValuesToColorSeries } = require("../../../components/utils");
const maxCols = 20;

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

const dataGrid = offsetBasedGridData(data, 20);

function offsetBasedGridData(df, hexRadius) {
  const size = df.get("userID").nunique();
  let max = maxCols; //df.get('time').max();
  var points = {
    x: [],
    y: [],
    time: [],
    row: [], //Array(max).fill([...data.get('userID').unique().sortValues(true)]).flat()
  };
  let x = Series.new([]).cast(new Float32());
  let sortIndex = Series.new([]).cast(new Int32());
  let index = Series.new([]).cast(new Int32());
  let y = Series.new([]).cast(new Float32());
  let time = Series.new([]).cast(new Int32());
  let userID = Series.new([]).cast(new Int32());

  for (var t = 0; t < max; t++) {
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
          step: max * 2,
          size: Math.ceil(size / 2),
        })
      )
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t + max,
          step: max * 2,
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
      size: size * max,
    }),
    offset_1: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_2: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_3: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_4: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    elevation: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_6: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_7: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_8: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_9: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_10: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    offset_11: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
    }),
    offset_13: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    offset_15: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    color_r: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    color_g: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    color_b: Series.sequence({
      step: 0,
      init: 1,
      type: new Float32(),
      size: size * max,
    }),
    anomalyScoreMax: Series.sequence({
      step: 0,
      init: 0,
      type: new Float32(),
      size: size * max,
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

function getInstances(instanceID, df, sort = false) {
  let order = sort
    ? df
        .select(["userID", "anomalyScore"])
        .groupBy({ by: "userID" })
        .sum()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID")
    : df.get("userID").unique();
  const totalUsers = data.get("userID").nunique();
  const time = parseInt(df.get("time").max() - instanceID / totalUsers);
  const userID = order.getValue(parseInt(instanceID % totalUsers));

  console.log(time, userID);

  const resultMask = data
    .get("userID")
    .eq(userID)
    .logicalAnd(data.get("time").eq(time));
  return data
    .filter(resultMask)
    .select(["userID", "time", "index", "anomalyScore"])
    .sortValues({ anomalyScore: { ascending: false } });
}

function gridBasedClickIndex(df, sort = false, selectedEvent) {
  console.log("fn called", selectedEvent);
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
  const selectedGridTime = (df.get("time").max() - selectedTime) % maxCols;

  let order = new DataFrame({
    userID: sort
      ? df
          .select(["userID", "anomalyScore"])
          .groupBy({ by: "userID" })
          .sum()
          .sortValues({ anomalyScore: { ascending: false } })
          .get("userID")
      : df.get("userID").unique(),
    index: Series.sequence({
      size: totalUsers,
      init: 0,
      step: 1,
      type: new Uint32(),
    }),
  });

  const orderselectedUserID = order
    .filter(order.get("userID").eq(selectedUserID))
    .get("index")
    .getValue(0);

  if (selectedUserID == 0) {
    return orderselectedUserID + totalUsers * selectedGridTime; // instanceID
  }
  return orderselectedUserID + totalUsers * selectedGridTime - totalUsers; // instanceID
}

function generateData(df, type = "elevation", sort = false) {
  let order = sort
    ? df
        .select(["userID", "anomalyScore"])
        .groupBy({ by: "userID" })
        .sum()
        .sortValues({ anomalyScore: { ascending: false } })
        .get("userID")
    : df.get("userID").unique();

  const maxRows = data.get("userID").nunique();

  if (type == "userIDs") {
    return new DataFrame({
      userID: order,
      names: names.gather(order),
    })
      .join({ other: paddingDF, on: ["userID"], how: "outer", lsuffix: "_r" })
      .select(["names"]);
  }

  let tempData = dataGrid;
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
  [...df.get("time").unique().sortValues(false).head(maxCols)].forEach((t) => {
    let sortedResults = finData.filter(finData.get("time").eq(t));
    sortedResults = sortedResults
      .join({ other: paddingDF, on: ["userID"], how: "outer", rsuffix: "_r" })
      .drop(["userID_r"])
      .sortValues({ userID: { ascending: true } });

    sortedResults = sortedResults.gather(order);
    const gridTime = (df.get("time").max() - t) % maxCols;
    const gridIndex = df
      .get("userID")
      .unique()
      .add(maxRows * gridTime)
      .cast(new Int32());

    if (type == "elevation") {
      const elevation = sortedResults.get("elevation").replaceNulls(-1).div(t);
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
  });

  if (type == "colors") {
    const colors = mapValuesToColorSeries(
      tempData.get("anomalyScoreMax"),
      [0.1, 0.385, 0.01],
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
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "userIDs", sort), res);
  } else if (fn == "getDFElevation") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "elevation", sort), res);
  } else if (fn == "getGridBasedClickIndex") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;

    const selectedEventUserID = req.query.selectedEventUserID
      ? parseInt(req.query.selectedEventUserID)
      : -1;
    const selectedEventTime = req.query.selectedEventTime
      ? parseInt(req.query.selectedEventTime)
      : -1;
    const tempData = data.filter(data.get("time").le(time));
    res.send({
      index: gridBasedClickIndex(tempData, sort, {
        selectedEventUserID,
        selectedEventTime,
      }),
    });
  } else if (fn == "getDFColors") {
    const time = req.query.time
      ? parseInt(req.query.time)
      : data.get("time").max();
    const sort = req.query.sort ? req.query.sort === "true" : false;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "colors", sort), res);
  } else if (fn == "getTotalTime") {
    res.send(data.get("time").max() - 1);
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
    const tempData = data.filter(data.get("time").le(time));

    if (id >= 0) {
      res.send({
        result: getInstances(id, tempData, sort).toArrow().toArray(),
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
