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

const max_t = 10;
const min_t = 1;

const unique_ips = [
    "10.33.x", "10.33.y", "10.33.z", "10.33.a", "10.33.b", "10.33.c", "10.33.d", "10.33.e", "10.33.f", "10.33.g", "10.33.h",
    "10.33.i", "10.33.j", "10.33.k", "10.33.l", "10.33.m", "10.33.n", "10.33.o", "10.33.p", "10.33.q", "10.33.r", "10.33.s"
]

const data = symmetricDataGrid(
    new DataFrame({
        "ip": [].concat(...Array(60).fill(unique_ips)),
        "time": Array.from({length: 60*unique_ips.length}, () => Math.floor(Math.random()*(max_t-min_t+1)+min_t)),
        "anomalyScore": Array.from({length: 60*unique_ips.length}, () => Math.random()),
    })
)

function symmetricDataGrid(df){
    const iptimeGroup = df.groupBy({by: ['ip', 'time']}).count();
    const EventCounts = [...iptimeGroup.get('anomalyScore')];

    let d = {ip:[], time:[], anomalyScore:[]};

    [...iptimeGroup.get('ip_time')].forEach((v, i) => {
        if(v.ip == "10.33.z"){
            console.log(v, i);
        }
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
    if(fn == "readCoordinates"){
        const data = {
            "x": [],
            "y": [],
        }        
        const event = req.query.event ? parseInt(req.query.event) : 1;
        d3.hexbin().extent([[0,0],[event,100]]).radius(1).centers().map(([x,y], i)=> {
            data.x.push(x);
            data.y.push(y);
        });
        const df = new DataFrame({'positions': new DataFrame(data).interleaveColumns()});
        await sendDF(df, res);
    }else if(fn == "getUniqueIPs") {
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
            if(!finalData){
                finalData = tempData;
            }else{
                finalData = finalData.concat(tempData);
            }
        }
        finalData = createGridCoords(finalData, hexRadius);
        finalData = finalData.assign({'x': finalData.get('x').add(offsetX), 'y': finalData.get('y').add(offsetY)});
        res.send({data: finalData.toArrow().toArray(), maxY: finalData.get('y').max()})
    }
}