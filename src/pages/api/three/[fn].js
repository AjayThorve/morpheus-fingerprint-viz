const { RecordBatchStreamWriter } = require('@rapidsai/apache-arrow');
const pipeline = require('util').promisify(require('stream').pipeline);
const d3 = require('d3-hexbin');
const {DataFrame, Uint64,Int32, Uint8, Series, Float32, Utf8String} = require('@rapidsai/cudf');
const {mapValuesToColorSeries} = require('../../../../components/utils');

async function sendDF(df, res){

    await pipeline(
        RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
        res.writeHead(200, 'Ok', { 'Content-Type': 'application/octet-stream' })
    );
}

const data = DataFrame.readParquet({
    sourceType: 'files',
    sources: ['./public/data/test.parquet']
});

const dataGrid = offsetBasedGridData(data, 20);

function offsetBasedGridData(df, hexRadius=20){
    const size = df.get('ip').encodeLabels().nunique();
    let max = df.get('time').max();
    var points = {
        x: [],
        y: [],
        time:[],
        ip: Array(max).fill([...data.get('ip').unique().sortValues(true)]).flat(),
    };
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < max; j++) {
            let x = hexRadius * j * Math.sqrt(3);
            //Offset each uneven row by half of a "hex-width" to the right
            if(i%2 === 1){
                 x = x + (hexRadius * Math.sqrt(3))/2
            }
            var y = hexRadius * i * 1.5;
            points.x.push(x);
            points.y.push(y);
            points.time.push(j+1);
        }//for j
    }

    const tempDF = new DataFrame({
        "index": Series.sequence({step:1, init: 0, type: new Int32, size: size*max}),
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
        "x": Series.new({type: new Float32, data: points.x}),
        "offset_13": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "y": Series.new({type: new Float32, data: points.y}),
        "offset_15": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_r": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_g": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "color_b": Series.sequence({step:0, init: 1, type: new Float32, size: size*max})
    });
    return tempDF.assign({
        "time": Series.new({type: new Int32, data: points.time}),
        "ip": Series.new({type: new Utf8String, data: points.ip}),
    })
};

const namesPosition = ["offset_0", "offset_1","offset_2","offset_3","offset_4","elevation","offset_6","offset_7","offset_8","offset_9",
"offset_10","offset_11", "x","offset_13", "y", "offset_15"]

const namesColor = ["color_r", "color_g", "color_b"]

// console.log([...dataGrid.select(namesPosition).head().interleaveColumns()]);
// console.log(dataGrid.head(10).toArrow().toArray());
// console.log(data.select(names).groupBy({by: 'time'}).count().toArrow().toArray());


function generateElevation(df){
    let tempData = dataGrid;
    [...df.get('time').unique()].forEach((val) => {
        const df_t = data.filter(data.get('time').eq(val));
        const group = df_t.groupBy({by: 'ip'}).count().select(['ip', 'time']).sortValues({time: {ascending: false}});
        const index = dataGrid.filter(dataGrid.get('time').eq(val)).head(group.numRows).get('index').cast(new Int32);
        tempData = tempData.assign({
            'elevation': tempData.get('elevation').scatter(group.get('time').mul(50), index)
        })
    });
    return new DataFrame({
        position: tempData.select(namesPosition).interleaveColumns()
    });
}

function generateColors(df){
    let tempData = dataGrid;
    [...df.get('time').unique()].forEach((val) => {
        const df_t = data.filter(data.get('time').eq(val));
        const anomalyScores = df_t.groupBy({by: 'ip'}).min().get('anomalyScore');
        const index = dataGrid.filter(dataGrid.get('time').eq(val)).head(anomalyScores.numRows).get('index').cast(new Int32);

        const colors = mapValuesToColorSeries(
            anomalyScores,
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            ["#000154","#004487","#00788e","#22a884","#7ad151","#fde725"]
        );
        tempData = tempData.assign({
            'color_r': tempData.get('color_r').scatter(colors.color_r, index),
            'color_g': tempData.get('color_g').scatter(colors.color_g, index),
            'color_b': tempData.get('color_b').scatter(colors.color_b, index)
        })
    });
    return new DataFrame({
        colors: tempData.select(namesColor).interleaveColumns()
    });
}



export default async function handler(req, res) {
    const fn = req.query.fn;
    if(fn == "getUniqueIPs") {
        res.send({'ip': [...data.get('ip').unique().sortValues(true)]});
    }else if(fn == "getDFElevation"){
        const time = req.query.time ? parseInt(req.query.time) : null;
        const tempData = data.filter(data.get('time').le(time));
        sendDF(generateElevation(tempData), res);
    
    }else if(fn == "getDFColors"){
        const time = req.query.time ? parseInt(req.query.time) : null;
        const tempData = data.filter(data.get('time').le(time));
        sendDF(generateColors(tempData), res);
    
    }else if(fn == "getTotalTime"){
        res.send(data.get('time').unique().length);
    }
}