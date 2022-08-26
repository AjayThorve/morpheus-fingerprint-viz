const { RecordBatchStreamWriter } = require("apache-arrow");
const pipeline = require("util").promisify(require("stream").pipeline);
const d3 = require("d3-hexbin");
const {
  DataFrame,
  Uint64,
  Int32,
  Uint8,
  Uint32,
  Uint16,
  Series,
  Float32,
  Utf8String,
} = require("@rapidsai/cudf");
const { mapValuesToColorSeries } = require("../../../../components/utils");

const maxCols = 40;
const names = Series.new(
  Array(60000 / 20)
    .fill([
      "sgonzalez\n",
      "ccameron\n",
      "tanderson\n",
      "jessicabrewer\n",
      "abigailstanley\n",
      "patricia32\n",
      "stewartlucas\n",
      "sandra54\n",
      "cmorris\n",
      "gonzalezjulia\n",
      "fhenderson\n",
      "robinsonricky\n",
      "michaelpatton\n",
      "veronicalopez\n",
      "ann22\n",
      "swilliams\n",
      "julie57\n",
      "aberg\n",
      "richard26\n",
      "robertsondonna\n",
    ])
    .flat()
);

async function sendDF(df, res) {
  await pipeline(
    RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
    res.writeHead(200, "Ok", { "Content-Type": "application/octet-stream" })
  );
}

let data = DataFrame.readParquet({
  sourceType: "files",
  sources: ["./public/data/dfp_60k_users.parquet"],
});

data = data.assign({ elevation: data.get("time") });

const paddingDF = new DataFrame({
  userID: data.get("userID").unique(),
});
const dataGrid = offsetBasedGridData(data, 20);

function offsetBasedGridData(df, hexRadius) {
  const size = df.get("userID").encodeLabels().nunique();
  let max = maxCols; //df.get('time').max();
  console.log(size, max);
  var points = {
    x: [],
    y: [],
    time: [],
    row: [], //Array(max).fill([...data.get('userID').unique().sortValues(true)]).flat()
  };
  let x = Series.new([]).cast(new Float32());
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
          size: size / 2,
        })
      )
      .concat(
        Series.sequence({
          type: new Float32(),
          init: hexRadius * t * Math.sqrt(3) + (hexRadius * Math.sqrt(3)) / 2,
          step: 0,
          size: size / 2,
        })
      );

    index = index
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t,
          step: max * 2,
          size: size / 2,
        })
      )
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t + max,
          step: max * 2,
          size: size / 2,
        })
      );

    y = y
      .concat(
        Series.sequence({
          type: new Float32(),
          init: 0,
          step: hexRadius * 3,
          size: size / 2,
        })
      )
      .concat(
        Series.sequence({
          type: new Float32(),
          init: hexRadius * 1.5,
          step: hexRadius * 3,
          size: size / 2,
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
  let coords = new DataFrame({ x, y, time, index, userID }).sortValues({
    index: { ascending: true },
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

function getData(instanceID, df) {
  let tempData = dataGrid;

  [...df.get("time").unique()].forEach((t) => {
    const grp_temp = data
      .filter(data.get("time").eq(t))
      .select(["userID", "anomalyScore", "time"])
      .groupBy({ by: "userID" });
    const sortedResults = grp_temp.sum();

    const elevation = sortedResults.get("time").div(t);
    const gridIndex = tempData
      .filter(tempData.get("time").eq(t))
      .head(elevation.length)
      .get("index");
    tempData = tempData.assign({
      elevation: tempData
        .get("elevation")
        .scatter(elevation.mul(50), gridIndex),
      // userID: tempData.get('userID').scatter(sortedResults.get('userID'),gridIndex),
    });
  });
  let userDetails = tempData.filter(tempData.get("index").eq(instanceID));
  const resultMask = data
    .get("userID")
    .eq(userDetails.get("userID").max())
    .logicalAnd(data.get("time").eq(userDetails.get("time").max()));
  return data.filter(resultMask);
}

function generateData(df, type = "elevation") {
  let order = df
    .select(["userID", "anomalyScore"])
    .groupBy({ by: "userID" })
    .sum()
    .sortValues({ anomalyScore: { ascending: false } })
    .get("userID");

  if (type == "userIDs") {
    return new DataFrame({
      userID: order,
      names: names.gather(order),
    })
      .join({ other: paddingDF, on: ["userID"], how: "outer", lsuffix: "_r" })
      .select(["names"])
      .head(2000);
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

  [...df.get("time").unique().sortValues({ ascending: false })].forEach((t) => {
    let sortedResults = finData.filter(finData.get("time").eq(t));
    sortedResults = sortedResults
      .join({ other: paddingDF, on: ["userID"], how: "outer", rsuffix: "_r" })
      .drop(["userID_r"])
      .sortValues({ userID: { ascending: true } });
    sortedResults = sortedResults.gather(order);
    const gridTime = df.get("time").max() - (t % maxCols);
    const gridIndex = tempData
      .filter(tempData.get("time").eq(gridTime))
      .get("index")
      .head(sortedResults.numRows);

    if (type == "elevation") {
      const elevation = sortedResults.get("elevation").replaceNulls(0).div(t);
      tempData = tempData.assign({
        elevation: tempData
          .get("elevation")
          .scatter(elevation.mul(50), gridIndex),
      });
    } else if (type == "colors") {
      const colors = mapValuesToColorSeries(
        sortedResults.get("anomalyScoreMax"),
        [0, 0.2, 0.4, 0.6, 0.8, 1],
        ["#343f42", "#f7d0a1", "#f78400", "#f15a22", "#f73d0a"]
      );
      tempData = tempData.assign({
        color_r: tempData.get("color_r").scatter(colors.color_r, gridIndex),
        color_g: tempData.get("color_g").scatter(colors.color_g, gridIndex),
        color_b: tempData.get("color_b").scatter(colors.color_b, gridIndex),
      });
    }
  });
  if (type == "colors") {
    tempData = tempData.assign({
      color_r: tempData.get("color_r").div(255),
      color_g: tempData.get("color_g").div(255),
      color_b: tempData.get("color_b").div(255),
    });
  }
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
    const time = req.query.time ? parseInt(req.query.time) : null;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "userIDs"), res);
  } else if (fn == "getDFElevation") {
    const time = req.query.time ? parseInt(req.query.time) : null;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "elevation"), res);
  } else if (fn == "getDFColors") {
    const time = req.query.time ? parseInt(req.query.time) : null;
    const tempData = data.filter(data.get("time").le(time));
    sendDF(generateData(tempData, "colors"), res);
  } else if (fn == "getTotalTime") {
    res.send(data.get("time").unique().length);
  } else if (fn == "getEventStats") {
    const time = req.query.time ? parseInt(req.query.time) : null;
    const events = data.filter(data.get("time").eq(time));
    res.send({
      totalEvents: Math.min(
        2000,
        events.numRows - events.get("anomalyScore").nullCount
      ),
      totalAnomalousEvents: events.filter(events.get("anomalyScore").ge(0.6))
        .numRows,
    });
  }
}
