import React from "react";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import 'bootstrap/dist/css/bootstrap.min.css';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import Box from './Box-3d';

async function requestJSON(type='getDF', params=null){
    let url = `/api/three-60k/${type}?`;
    if(params!=null){
        url += `${params}`;
    }
    return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}

function drawArea(areaRef, data, maxTime){
    const chart = Plot.plot({
        marks: [
          Plot.areaY(data, {x: "time", y: "events", fill: "type"}),
          Plot.areaY(data, {x: "time", y0: "events", fill: "type"})
        ],
        title: "xtz",
        width: 1790,
        height: 140,
        style: {
            "background-color": "black",
            "color": "white",
            "font-size": 13,
            "margin-left": "80px",
            "padding-top": 0,
        },
        y: {
            axis: true,
            label: "NETWORK TRAFFIC",
            labelAnchor: "center",
            line: true,
        },
        x: {
            type: "point",
            tickFormat: d => `T-${(maxTime-d)*5}`,
            label: null,
            // tickRotate: -60,
            reverse: true
        },
        color: {
            range: ["#440154", "#1f1d1d"],
            legend: true, 
            legendAnchor: "center",
            style: {
                "color": "white",
                fontSize: "14px",
                "margin-left": "200px"
            }
        }
      });
      d3.selectAll("div > div#area > *").remove();
      if(areaRef.current){
        areaRef.current.append(chart);
      }
 }

async function drawAxis(svgRef, maxY, hexRadius, offsetY){
    const svg = d3.select(svgRef.current);
    const IPs = (await requestJSON('getUniqueIDs'))['userID'];
    const yScale = d3.scaleBand()
        .range([offsetY - hexRadius, maxY + hexRadius])
        .domain(IPs)
        .padding(0.05)

        svg
        .append("g")
        .attr("transform", `translate(${190 - hexRadius},0)`)
        .style('font-size', hexRadius-4)
        .style('color', "white")
        .call(d3.axisLeft(yScale).tickSize(0))
        .select(".domain").remove()

        svg
        .append("text")
        .attr("transform", `translate(${190 - hexRadius},0)`)
        .style('font-size', 16)
        .style('font-weight', "bold")
        .style('fill', "white")
        .attr("text-anchor", "end")
        .attr("y", 44)
        .text("USER EVENTS")
        
        svg
        .append("text")
        .attr("transform", `translate(${190 - hexRadius},0)`)
        .attr("class", "wordWrap")
        .style('font-size', 16)
        .style('font-weight', "bold")
        .style('fill', "white")
        .attr("text-anchor", "end")
        .attr("y", 66)
        .text("BY TIME")

}

function drawLegend(svgRef){
    let legend = Plot.legend({
        color: {
            type: 'sequential',
            domain: [0,1],
            scheme: 'viridis',
            tickRotate: 90,
            tickFormat: d => {
                if(d == 0.6){return "Anomaly (>0.6)";}
                if(d == 0 || d == 1){ return d;}
                return null;
            },
            label: "Anomaly Score"
        },
        width: 280,
        height: 30,
        marginLeft: 25,
        marginBottom: 0,
        paddingBottom: 0,
        swatchSize: 11,
        style: {
            "color": "white",
            fontSize: "14px",
        }
    });
    svgRef.current.append(legend);
}

function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
}

export default class CustomD3 extends React.Component{
    constructor(props){
        super(props);
        this.svg = React.createRef();
        this.areaRef = React.createRef();
        this.tooltipRef = React.createRef();
        this.legendRef = React.createRef();
        this.points = [{time: 0,
            events: 0,
            type: 'anomalousEvents'}, {time: 0,
                events: 0,
                type: 'totalEvents'},];
        this.offsetX = 200;
        this.offsetY = 100;
        this.hexRadius = 20;
        this.hexgridWidth = 1600;
        this.hexgridHeight = this.hexRadius * 50;
        this.state = {
            selectedEvent: {},
        }
        this.waitTime = 3000;
    }
    async componentDidMount(){
        const totalTime = parseInt(await requestJSON("getTotalTime"));
        drawLegend(this.legendRef);
        let axisAdded = false;
        await timeout(this.waitTime); //for 5 sec delay
        for(let i=1; i<=totalTime; i++){
            const data = await requestJSON("getDF", `offsetX=${this.offsetX}&offsetY=${this.offsetY}&time=${i}&hexRadius=${this.hexRadius}`);
            this.points.push({
                time: i,
                events: data.totalAnomalousEvents,
                type: 'anomalousEvents'
            });
            this.points.push({
                time: i,
                events: data.totalEvents,
                type: 'totalEvents'
            });
            drawArea(this.areaRef, this.points, i);
            if(!axisAdded){
                drawAxis(this.svg, data.maxY, this.hexRadius, this.offsetY);
                axisAdded = true;
            }
            await timeout(this.waitTime); //for 5 sec delay
        }
    }

    render() {
        let selectedEvent;
        let anomalyScore;
        let maliciousHeader;
        let maliciousFooter;
        if(this.state.selectedEvent.anomalyScore || this.state.selectedEvent.anomalyScore == 0){
            const events = []
            if(this.state.selectedEvent.anomalousAttributes){
                this.state.selectedEvent.anomalousAttributes.split(',').forEach(key => {
                    events.push(key);
                });
                maliciousHeader =  (
                <span><span className="customHeader">Malicious Attributes</span>
                </span>
                )
                anomalyScore = (
                    <ListGroup.Item className="listOfAttributes" variant="dark" key={'anomalyScore'}><span className="selectedEventTitle">
                    anomalyScore: <span className="selectedEvent">{Math.round(this.state.selectedEvent['anomalyScore']*100)/100}</span></span></ListGroup.Item>
                )
                maliciousFooter = <hr className="partition"></hr>
            }
            selectedEvent = (
                <div>
                    <hr className="partition"></hr>
                    <ListGroup>
                        {['userID', 'time'].map(
                            key => <ListGroup.Item className="listOfAttributes" variant="dark" key={key}><span className="selectedEventTitle">
                                    {key}:     <span className="selectedEvent">{this.state.selectedEvent[key]}</span></span></ListGroup.Item>)
                        }
                        <hr className="partition"></hr>
                        {maliciousHeader}
                        {anomalyScore}
                        {events.map(
                            key => <ListGroup.Item className="listOfAttributes" variant="dark" key={key}><span className="selectedEventTitle">
                                    {key}:     <span className="selectedEvent">{this.state.selectedEvent[key]}</span></span></ListGroup.Item>)
                        }
                        {maliciousFooter}
                    </ListGroup>
                </div>
            )
            anomalyScore = <span className="selectedEvent" id="anomalyNumber">{parseFloat(this.state.selectedEvent.anomalyScore).toFixed(2)} </span>
        }
        console.log(this.stats);
        return (
            <div id="chart">
                <div className="topnav">
                  <a href="#home">DIGITAL FINGER PRINT | NVIDIA MORPHEUS</a>
                  {/* <button id="play-button" className="active" onClick={}>Play</button> */}
                </div>
                <div id="area" ref={this.areaRef}></div>
                <hr className="partition"></hr>
                <Stack direction="horizontal" gap={1}>
                    {/** Renders only 20k, but all 60k are processed and sorted on backend */}
                    <Box rows={20000} cols={13} apiURL={"three-60k"} waitTime={this.waitTime} />                
                    <div id="sidePanel">
                            <svg id="legend" ref={this.legendRef}></svg>
                        {selectedEvent}
                    </div>
                </Stack>
            </div>
        )
    }
}