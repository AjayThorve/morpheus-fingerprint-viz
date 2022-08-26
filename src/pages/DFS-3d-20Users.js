
import 'bootstrap/dist/css/bootstrap.min.css';

import React from "react";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import CloseButton from 'react-bootstrap/CloseButton';
import ListGroup from 'react-bootstrap/ListGroup';
import {tableFromIPC} from 'apache-arrow';
import Box from './Box-3d';

async function requestJSON(type='getEventStats', params=null){
    let url = `/api/three/${type}?`;
    if(params!=null){
        url += `${params}`;
    }
    return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json()).catch(e => console.log(e));
}

async function requestData(type='getDF', params=null){
    let url = `/api/three/${type}?`;
    if(params!=null){
      url += `${params}`;
    }
    const result = await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}});
    const table = tableFromIPC(result);
    return table;
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
            range: ["#f73d0a", "#1f1d1d"],
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

// async function drawAxis(svgRef, maxY, hexRadius, offsetY){
//     const svg = d3.select(svgRef.current);
//     const IPs = (await requestJSON('getUniqueIDs'))['userID'];
//     const yScale = d3.scaleBand()
//         .range([offsetY - hexRadius, maxY + hexRadius])
//         .domain(IPs)
//         .padding(0.05)

//         svg
//         .append("g")
//         .attr("transform", `translate(${190 - hexRadius},0)`)
//         .style('font-size', hexRadius-4)
//         .style('color', "white")
//         .call(d3.axisLeft(yScale).tickSize(0))
//         .select(".domain").remove()

//         svg
//         .append("text")
//         .attr("transform", `translate(${190 - hexRadius},0)`)
//         .style('font-size', 16)
//         .style('font-weight', "bold")
//         .style('fill', "white")
//         .attr("text-anchor", "end")
//         .attr("y", 44)
//         .text("USER EVENTS")
        
//         svg
//         .append("text")
//         .attr("transform", `translate(${190 - hexRadius},0)`)
//         .attr("class", "wordWrap")
//         .style('font-size', 16)
//         .style('font-weight', "bold")
//         .style('fill', "white")
//         .attr("text-anchor", "end")
//         .attr("y", 66)
//         .text("BY TIME")

// }

function drawLegend(svgRef){
    let legend = Plot.legend({
        color: {
            type: 'sequential',
            domain: [0,1],
            range: ["#343f42","#f7d0a1","#f78400","#f15a22","#f73d0a"],
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
            currentTime: 0,
            position: [],
            colors:[],
            userIDs:[]
        }
        this.waitTime = 3000;
    }
    async componentDidMount(){
        const totalTime = parseInt(await requestJSON("getTotalTime"));
        drawLegend(this.legendRef);
        let axisAdded = false;
        await timeout(5000); //for 5 sec delay
        for(let i=1; i<=totalTime; i++){
            const data = await requestJSON("getEventStats", `time=${i}`);
            const elevation = await requestData("getDFElevation", `time=${i}`);
            const colors = await requestData("getDFColors", `time=${i}`);
            const userIDs = await requestData("getUniqueIDs", `time=${i}`);
            
            this.setState({
                currentTime: i,
                position: elevation.batches[0].data.children[0].values,
                colors: colors.batches[0].data.children[0].values,
                userIDs: new TextDecoder().decode(userIDs.batches[0].data.children[0].values),        
            });
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
            // if(!axisAdded){
            //     drawAxis(this.svg, data.maxY, this.hexRadius, this.offsetY);
            //     axisAdded = true;
            // }
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
                <div className="customHeader">Malicious Attributes</div>
                )
                anomalyScore = (
                    <ListGroup.Item className="listOfAttributes" variant="dark" key={'anomalyScore'}><span className="selectedEventTitle">
                    anomalyScore: <span className="selectedEvent" style={{"font-size": "18px", color: this.color(this.state.selectedEvent['anomalyScore'])}}>{Math.round(this.state.selectedEvent['anomalyScore']*100)/100}</span></span></ListGroup.Item>
                )
            }
            const conditionalBreakLine = this.state.selectedEvent.anomalousAttributes ? <hr className="partition"></hr>: "";
            selectedEvent = (
                <div id="sidePanel" className="detailsPanel">
                    <ListGroup>
                        <CloseButton variant="white" 
                            onClick={this.resetSelected}
                        />
                        <div className="customHeader">Event Information</div>
                        <ListGroup.Item className="listOfAttributes" variant="dark" key={'userID'}><span className="selectedEventTitle">
                            userID:     <span className="selectedEvent">{IPAddressLookup[this.state.selectedEvent['userID']]}</span></span></ListGroup.Item>
                        <ListGroup.Item className="listOfAttributes" variant="dark" key={'time'}><span className="selectedEventTitle">
                                    Time:     <span className="selectedEvent">{this.state.selectedEvent['time']}</span></span></ListGroup.Item>
                        {conditionalBreakLine}
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
        return (
            <div id="chart">
                <div className="topnav">
                  <a href="#home">DIGITAL FINGER PRINT | NVIDIA MORPHEUS</a>
                  {/* <button id="play-button" className="active" onClick={}>Play</button> */}
                </div>
                <div id="area" ref={this.areaRef}></div>
                <hr className="partition"></hr>
                <Box
                    rows={20} cols={48}
                    apiURL={"three"}
                    waitTime={this.waitTime}
                    currentTime={this.state.currentTime}
                    position={this.state.position}
                    colors={this.state.colors}
                    userIDs={this.state.userIDs}
                    />
                <div id="hexgrid">
                    <svg id="legend" ref={this.legendRef} transform="translate(1620,-990)"></svg>               
                    {/* <div id="sidePanel">
                        {selectedEvent}
                    </div> */}
                </div>
            </div>
        )
    }
}