const { RecordBatchStreamWriter } = require('apache-arrow');
const pipeline = require('util').promisify(require('stream').pipeline);
const d3 = require('d3-hexbin');
const {DataFrame, Uint64,Int32,Uint8, Uint32, Uint16, Series, Float32, Utf8String} = require('@rapidsai/cudf');
const {mapValuesToColorSeries} = require('../../../../components/utils');

async function sendDF(df, res){

    await pipeline(
        RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
        res.writeHead(200, 'Ok', { 'Content-Type': 'application/octet-stream' })
    );
}

let data = DataFrame.readParquet({
    sourceType: 'files',
    sources: ['./public/data/dfp_20_users.parquet']
});

data = data.assign({'elevation': data.get('time')})

const paddingDF = new DataFrame({
    userID: data.get('userID').unique()
})
const dataGrid = offsetBasedGridData(data, 20);

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
    let userID = Series.new([]).cast(new Int32);

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
                step: max*2,
                size: size/2
            })).concat(Series.sequence({
                type: new Int32,
                init: t+max,
                step: max*2,
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
            init: max-t,
            step: 0,
            size: size
        }))

        userID = userID.concat(Series.sequence({
            type: new Int32,
            init: 0,
            step: 1,
            size: size
        }))
    }
    let coords = (new DataFrame({x, y, time, index, userID})).sortValues({index: {ascending: true}});

    coords = coords.assign({
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
        "color_b": Series.sequence({step:0, init: 1, type: new Float32, size: size*max}),
        "anomalyScoreMax": Series.sequence({step:0, init: 0, type: new Float32, size: size*max}),
    });
    return coords.assign({
        "row": userID,
    });
}

const namesPosition = ["offset_0", "offset_1","offset_2","offset_3","offset_4","elevation","offset_6","offset_7","offset_8","offset_9",
"offset_10","offset_11", "x","offset_13", "y", "offset_15"]

const namesColor = ["color_r", "color_g", "color_b"]

// console.log([...dataGrid.select(namesPosition).head().interleaveColumns()]);
// console.log(dataGrid.head(10).toArrow().toArray());
// console.log(data.select(names).groupBy({by: 'time'}).count().toArrow().toArray());
function print(df){
    console.log(df.toArrow().toArray());
}

function getData(instanceID, df){
    let tempData = dataGrid;

    [...df.get('time').unique()].forEach((t) => {
        const grp_temp = data.filter(data.get('time').eq(t)).select(['userID', 'anomalyScore', 'time']).groupBy({by: 'userID'});
        const sortedResults = grp_temp.sum();
        
        const elevation = sortedResults.get('time').div(t);
        const gridIndex = tempData.filter(tempData.get('time').eq(t)).head(elevation.length).get('index');
        tempData = tempData.assign({
            elevation: tempData.get('elevation').scatter(elevation.mul(50),gridIndex),
            // userID: tempData.get('userID').scatter(sortedResults.get('userID'),gridIndex),
        });
    });
    let userDetails = tempData.filter(tempData.get('index').eq(instanceID));
    const resultMask = data.get('userID').eq(userDetails.get('userID').max()).logicalAnd(data.get('time').eq(userDetails.get('time').max()));
    return data.filter(resultMask);
}

function generateElevation(df){
    let tempData = dataGrid;

    let finData = df.select(['userID', 'time', 'anomalyScore', 'elevation']).groupBy({by: ['userID', 'time']}).sum();
    finData = finData.assign({
        userID: finData.get('userID_time').getChild('userID'),
        time: finData.get('userID_time').getChild('time')
        }).drop(['userID_time']).sortValues({'userID': {ascending: true}, 'time': {ascending: true}}).sortValues({'anomalyScore': {ascending: false}});
    let order = df.select(['userID', 'anomalyScore']).groupBy({by: 'userID'}).sum().sortValues({anomalyScore: {ascending: false}}).get('userID');

    [...df.get('time').unique()].forEach((t) => {
        let sortedResults = finData.filter(finData.get('time').eq(t));
        sortedResults = sortedResults.join({other: paddingDF, on:['userID'], how:'outer', rsuffix:'_r'}).drop(['userID_r']).sortValues({userID: {ascending: true}});
        sortedResults = sortedResults.gather(order);
        console.log("time------", t);
        print(sortedResults);
    
        const elevation = sortedResults.get('elevation').replaceNulls(0).div(t);
        const gridIndex = tempData.filter(tempData.get('time').eq(t)).get('index').head(sortedResults.numRows);
        tempData = tempData.assign({elevation: tempData.get('elevation').scatter(elevation.mul(50),gridIndex)});
    });
    return new DataFrame({
        position: tempData.select(namesPosition).interleaveColumns()
    });
}

function generateColors(df){

    let tempData = dataGrid;

    let finData = df.select(['userID', 'time', 'anomalyScore', 'elevation']).groupBy({by: ['userID', 'time']}).sum();
    finData = finData.assign({
        userID: finData.get('userID_time').getChild('userID'),
        time: finData.get('userID_time').getChild('time')
        }).drop(['userID_time']).sortValues({'userID': {ascending: true}, 'time': {ascending: true}});

    let order = df.select(['userID', 'anomalyScore']).groupBy({by: 'userID'}).sum().sortValues({anomalyScore: {ascending: false}}).get('userID');

    [...df.get('time').unique()].forEach((t) => {
        let sortedResults = finData.filter(finData.get('time').eq(t));
        sortedResults = sortedResults.join({other: paddingDF, on:['userID'], how:'outer', rsuffix:'_r'}).drop(['userID_r']).sortValues({userID: {ascending: true}});
        sortedResults = sortedResults.gather(order);
        console.log("time------", t);
        print(sortedResults);
        const gridIndex = tempData.filter(tempData.get('time').eq(t)).get('index').head(sortedResults.numRows);

        const colors = mapValuesToColorSeries(
            sortedResults.get('anomalyScore'),
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            ["#440154","#414487","#2a788e","#22a884","#7ad151","#fde725"]
        );
        tempData = tempData.assign({
            'anomalyScoreMax': tempData.get('anomalyScoreMax').scatter(sortedResults.get('anomalyScore'), gridIndex),
            'color_r': tempData.get('color_r').scatter(colors.color_r, gridIndex),
            'color_g': tempData.get('color_g').scatter(colors.color_g, gridIndex),
            'color_b': tempData.get('color_b').scatter(colors.color_b, gridIndex)
        });
    });
    return new DataFrame({
        colors: tempData.select(namesColor).interleaveColumns()
    });
}



export default async function handler(req, res) {
    const fn = req.query.fn;
    if(fn == "getUniqueIDs") {
        res.send({'userID': [...data.get('userID').unique().sortValues(true)]});
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
    }else if(fn == "getInstanceData"){
        const id = req.query.id ? parseInt(req.query.id) : null;
        const time = req.query.time ? parseInt(req.query.time) : null;
        if(id){
            const tempData = data.filter(data.get('time').le(time));
            res.send(getData(id, tempData).toArrow().toArray())
        }
    }else if(fn == "getDF"){
        const time = req.query.time ? parseInt(req.query.time) : null;
        const events = data.filter(data.get('time').eq(time));
        res.send(
            {
                totalEvents: events.numRows - events.get('anomalyScore').nullCount,
                totalAnomalousEvents: events.filter(events.get('anomalyScore').ge(0.6)).numRows
            }
        )
    }else if(fn == "getCoords"){
        const time = req.query.time ? parseInt(req.query.time) : null;
        res.send(
            {
                users: data.get('userID').nunique(),
                timeEvents: data.get('time').max()
            }
        );
    }else if(fn == "getTotalTime"){
        res.send(data.get('time').unique().length);
    }else if(fn == "getUniqueIDs") {
        res.send({'userID': [...data.get('userID').unique().sortValues(true)]});
    }
}