const {DataFrame, Uint64, Int32, Uint8, Uint16, Series, Float32, Utf8String} = require('@rapidsai/cudf');
let data = DataFrame.readParquet({
    sourceType: 'files',
    sources: ['./public/data/dfp_20_users.parquet']
});

function offsetBasedGridData(df, hexRadius){
    const size = df.get('userID').encodeLabels().nunique();
    let max = df.get('time').max();
    console.log(size, max);
    var points = {
        x: [],
        y: [],
        time:[],
        row: [], //Array(max).fill([...data.get('userID').unique().sortValues(true)]).flat()
    };
    let x = Series.new([]).cast(new Float32);
    let index = Series.new([]).cast(new Int32);
    let y = Series.new([]).cast(new Float32);
    let time = Series.new([]).cast(new Int32);

    for(var t=0;t<max; t++){
        x = x.concat(
            Series.sequence({
                type: new Float32,
                init: hexRadius * t * Math.sqrt(3),
                step: 0,
                size: size/2
            })
            ).concat(Series.sequence({
                type: new Float32,
                init: hexRadius * t * Math.sqrt(3) + (hexRadius * Math.sqrt(3))/2,
                step: 0,
                size: size/2
            }));
        
        index = index.concat(Series.sequence({
                type: new Int32,
                init: t,
                step: size,
                size: size/2
            })).concat(Series.sequence({
                type: new Int32,
                init: t+(size/2),
                step: size,
                size: size/2
            }));

        y = y.concat(
            Series.sequence({
                type: new Float32,
                init: 0,
                step: hexRadius * 3,
                size: size/2
            })).concat(Series.sequence({
                type: new Float32,
                init: hexRadius * 1.5,
                step: hexRadius * 3,
                size: size/2
            }));

        time = time.concat(Series.sequence({
            type: new Int32,
            init: t+1,
            step: 0,
            size: size
        }))
    }
    let coords = (new DataFrame({x, y, time, index})).sortValues({index: {ascending: true}})

    const tempDF = coords.assign({
        "x": coords.get('x').mul(100),
        "y": coords.get('y').mul(100),
        "offset_0": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "offset_1": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_2": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_3": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_4": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "elevation": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_6": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_7": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_8": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_9": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_10": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "offset_11": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
        "offset_13": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "offset_15": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_r": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_g": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_b": Series.sequence({step:0, init: 1, type: new Float32, size: size*max})
    });
    return tempDF;
    // .assign({
    //     "row": Series.new({type: new Utf8String, data: points.row}),
    // });
}


let dataGrid = offsetBasedGridData(data, 20);

function print(df){
    console.log(df.toArrow().toArray());
}
data = data.assign({
    'elevation': data.get('time')
});

let x = data.select(['userID', 'time', 'anomalyScore', 'elevation']).groupBy({by: ['userID', 'time']}).sum();
x = x.assign({
    userID: x.get('userID_time').getChild('userID'),
    time: x.get('userID_time').getChild('time')
    }).drop(['userID_time']).sortValues({'anomalyScore': {ascending: true}}).sortValues({'userID': {ascending: true}, 'time': {ascending: true}});

let tempx = x.filter(x.get('time').eq(1));
// print(tempx.get('time').logicalAnd());

// [...data.get('time').unique()].forEach((t) => {
//     console.log("time", t);
//     let grp_temp = data.filter(data.get('time').eq(t)).select(['userID', 'anomalyScore', 'time']).groupBy({by: 'userID'});
//     let a = grp_temp.sum().sortValues({anomalyScore: {ascending: false}});
//     // let b = grp_temp.max();
//     let elevation = a.get('time').div(t);
//     let gridIndex = dataGrid.filter(dataGrid.get('time').eq(t)).get('index');
//     print(elevation);
//     print(gridIndex);
//     dataGrid = dataGrid.assign({elevation: dataGrid.get('elevation').scatter(elevation,gridIndex)});
//     print(dataGrid.gather(gridIndex).get('elevation'));
//     // print(b.gather(a.get('userID')));
// })

// print(b.get('userID').gather(a.get('userID')));

// let row = 0;
// [...a.get('userID').unique()].forEach((val) => {
//     // for color
//     const df = data.filter(data.get('userID').eq(val));
    
//     // for elevation
//     const group = df.groupBy({by: 'time'}).count().select(['userID', 'time']).sortValues({time: {ascending: true}});

//     const index = group.get('time').mul(row).cast(new Uint16);
//     row+=1;
//     // console.log([...group.toArrow()], [...index]);
//     dataGrid = dataGrid.assign({
//         'elevation': dataGrid.get('elevation').scatter(group.get('userID'), index)
//     })
// })

// print(dataGrid);



// // const group = data.groupBy({by: ['userID', 'time']}).count();
// // const index = dataGrid.head(group.numRows).get('index').cast(new Int32);
// // console.log("final",[...group.toArrow()], [...index]);

// // console.log(dataGrid.get('elevation').toArrow().toArray());

for(let i =0; i<=1000000; i++){
console.log(i);
}