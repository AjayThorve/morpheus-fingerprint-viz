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

const max_t = 20;
const min_t = 1;

const unique_ips = [
    "10.33.242.x", "10.33.242.y", "10.33.242.z", "10.33.242.a", "10.33.242.b", "10.33.242.c", "10.33.242.d", "10.33.242.e", "10.33.242.f", "10.33.242.g", "10.33.242.h",
    "10.33.242.i", "10.33.242.j", "10.33.242.k", "10.33.242.l", "10.33.242.m", "10.33.242.n", "10.33.242.o", "10.33.242.p", "10.33.242.q", "10.33.242.r", "10.33.242.s"
]

const unique_locations = [
    "Paris", "Bangkok", "Mumbai", "Seattle", "San Jose", "London", "New York", "Dubai", "Istanbul", "Tokyo", "Hyderabad"
]

const data = symmetricDataGrid(
    new DataFrame({
        "ip": [].concat(...Array(120).fill(unique_ips)),
        "location": [].concat(...Array(240).fill(unique_locations)),
        "time": Array.from({length: 120*unique_ips.length}, () => Math.floor(Math.random()*(max_t-min_t+1)+min_t)),
        "anomalyScore": Array.from({length: 120*unique_ips.length}, () => Math.random()),
    })
)

function symmetricDataGrid(df){
    const iptimeGroup = df.groupBy({by: ['ip', 'time']}).count();
    const EventCounts = [...iptimeGroup.get('anomalyScore')];

    let d = {ip:[], time:[], anomalyScore:[]};

    [...iptimeGroup.get('ip_time')].forEach((v, i) => {
        const maxEventCountIP = df.filter(df.get('time').eq(v.time)).groupBy({by: 'ip'}).count().get('time').max();
        let nrows = maxEventCountIP - EventCounts[i];
        if(nrows > 0){
            d.ip.push(...Array(nrows).fill(v.ip));
            d.anomalyScore.push(...Array(nrows).fill(null));
            d.time.push(...Array(nrows).fill(v.time));
        }
    })
    if(d.ip.length > 0){
        df = df.concat(new DataFrame(d));
    }
   
    return df;
}


function createGridCoords(df, hexRadius=30){
    const rows = df.get('ip').encodeLabels().nunique();
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
        for(let i = Math.max(time-2, 1); i<=time; i++){
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