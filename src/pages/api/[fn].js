import { PassThrough } from 'stream';

const { RecordBatchStreamWriter } = require('@rapidsai/apache-arrow');
const pipeline = require('util').promisify(require('stream').pipeline);
const d3 = require('d3-hexbin');
const {DataFrame, Uint64,Int32, Uint8, Series, Float32} = require('@rapidsai/cudf');


async function sendDF(df, res){
    await pipeline(
        RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
        res.writeHead(200, 'Ok', { 'Content-Type': 'application/octet-stream' })
    );
}

const data = symmetricDataGrid(
    DataFrame.readParquet({
        sourceType: 'files',
        sources: ['./public/data/test.parquet']
    })
)

function symmetricDataGrid(df){
    let d = {ip:[], time:[]};

    [...df.get('ip').unique()].forEach((v) => {
        [...df.get('time').unique()].forEach((i) => {
            const maxEventCountIP = df.filter(df.get('time').eq(i)).groupBy({by: 'ip'}).count().get('time').max();
            const EventCount = df.filter(df.get('time').eq(i).logicalAnd(df.get('ip').matchesRe(v))).numRows;
            let nrows = maxEventCountIP - EventCount;
            if(nrows > 0){
                d.ip.push(...Array(nrows).fill(v));
                d.time.push(...Array(nrows).fill(i));
            }
        });
    });
    if(d.ip.length > 0){
        df = df.concat(new DataFrame(d));
    }
   
    return df;
}


function createGridCoords(df, hexRadius=30){
    const rows = data.get('ip').encodeLabels().nunique();
    let max = df.groupBy({by: 'ip'}).count().get('time').max();

    df = df.sortValues({ip: {ascending: true, null_order: 'after'}});
    var points = {
        x: [],
        y: []
    };
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < max; j++) {
            let x = hexRadius * j * Math.sqrt(3);
            //Offset each uneven row by half of a "hex-width" to the right
            if(i%2 === 1){
                 x = x + (hexRadius * Math.sqrt(3))/2
            }
            var y = hexRadius * i * 1.5;
            points.x.push(x);
            points.y.push(y);
        }//for j
    }
    return df.assign(points);
}



export default async function handler(req, res) {
    const fn = req.query.fn;
    if(fn == "getUniqueIPs") {
        res.send({'ip': [...data.get('ip').unique().sortValues(true)]});
    }else if(fn == "getDF"){
        let offsetX = req.query.offsetX ? parseInt(req.query.offsetX) : 0;
        const offsetY = req.query.offsetY ? parseInt(req.query.offsetY) : 0;
        const time = req.query.time ? parseInt(req.query.time) : null;
        const hexRadius = req.query.hexRadius ? parseInt(req.query.hexRadius) : 30;
        let finalData = null;
        for(let i = Math.max(time-7, 1); i<=time; i++){
            let tempDataMask = data.get('time').eq(i);
            let tempData = data.filter(tempDataMask);

            if(tempData.numRows == 0){
                continue;
            }
            if(!finalData){
                finalData = tempData;
            }else{
                finalData = finalData.concat(tempData);
            }
        }
        if(finalData.numRows > 0){
            finalData = createGridCoords(finalData, hexRadius);
            finalData = finalData.assign({'x': finalData.get('x').add(offsetX), 'y': finalData.get('y').add(offsetY)});
        }
        
        const events = data.filter(data.get('time').eq(time));
        res.send(
            {
                data: finalData.toArrow().toArray(),
                maxY: finalData.get('y').max(),
                totalEvents: events.numRows - events.get('anomalyScore').nullCount,
                totalAnomalousEvents: events.filter(events.get('anomalyScore').ge(0.75)).numRows
            }
        )
    }else if(fn == "getTotalTime"){
        res.send(data.get('time').unique().length);
    }
}