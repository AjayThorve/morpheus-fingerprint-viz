const {
  DataFrame,
  Uint64,
  Int32,
  Uint8,
  Uint16,
  Series,
  Float32,
  Utf8String,
} = require("@rapidsai/cudf");
let data = DataFrame.readParquet({
  sourceType: "files",
  sources: ["./public/data/dfp_20_users.parquet"],
});

function print(df) {
  console.log(df.toArrow().toArray());
}
const maxCols = 30;

function offsetBasedGridData(df, hexRadius) {
  const size = df.get("userID").encodeLabels().nunique();
  console.log(size);
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

    sortIndex = sortIndex
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t * size,
          step: 2,
          size: size / 2,
        })
      )
      .concat(
        Series.sequence({
          type: new Int32(),
          init: t * size + 1,
          step: 2,
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
  return new DataFrame({
    x,
    y,
    time,
    index,
    userID,
    sortIndex,
  }).sortValues({
    sortIndex: { ascending: true },
  });
}

const tempData = offsetBasedGridData(data, 20);

print(tempData.select(["x", "y", "sortIndex"]));
console.log(tempData.get("sortIndex").nunique());
