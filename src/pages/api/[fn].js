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

function createGridCoords(df, hexRadius=20){
    const rows = df.get('ip').encodeLabels().nunique();
    const columns = df.groupBy({by: 'ip'}).count();
    let max = columns.get('time').max();
    let d = {ip:[], anomalyScore: [], time: []};
    
    let columnsArr = columns.get('ip');
    [...columnsArr].forEach((v, i) => {
        if(max > columns.get('time').getValue(i)){
            let nrows = max - columns.get('time').getValue(i);
            d.ip.push(...Array(nrows).fill(v));
            d.anomalyScore.push(...Array(nrows).fill(0));
            d.time.push(...Array(nrows).fill(0));
        }
    })

    if(d.ip.length > 0){
        df = df.concat(new DataFrame(d));
    }
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

const max_t = 5;
const min_t = 1;
let tx = [];
d3.hexbin().extent([[0,0],[1,98]]).radius(1).centers().map(([x,y], i)=> {
    tx.push(y);
});

console.log(tx);
const data = new DataFrame({
    "ip": [].concat(...Array(33).fill(["10.33.x", "10.33.y", "10.33.z"])),
    "time": Array.from({length: 99}, () => Math.floor(Math.random()*(max_t-min_t+1)+min_t)),
    "anomalyScore": Array.from({length: 99}, () => Math.random()),
});


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
    }else if(fn == "readIP") {
        const df = data.select(['ip', 'ipPosX', 'ipPosY']);
        res.send(df.toArrow().toArray());
    }else if(fn == "getDF"){
        const offsetX = req.query.offsetX ? parseInt(req.query.offsetX) : 0;
        const offsetY = req.query.offsetY ? parseInt(req.query.offsetY) : 0;
        const time = req.query.time ? parseInt(req.query.time) : null;
        let tempData = data;
        if(time){
            const tempDataMask = tempData.get('time').eq(time).logicalOr(tempData.get('time').eq(0));
            tempData = tempData.filter(tempDataMask);
        }
        console.log(tempData.toArrow().toArray(), tempData.numRows, createGridCoords(data));
        tempData = createGridCoords(tempData);
        console.log(tempData);
        tempData = tempData.assign({'x': tempData.get('x').add(offsetX), 'y': tempData.get('y').add(offsetY)})

        res.send(tempData.toArrow().toArray())
    }
}