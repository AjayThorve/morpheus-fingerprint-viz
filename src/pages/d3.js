import React from "react";
import * as d3 from "d3";
const d3hex = require("d3-hexbin");
import * as Plot from "@observablehq/plot";
import 'bootstrap/dist/css/bootstrap.min.css';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';

async function requestJSON(type='getDF', params=null){
    let url = `/api/${type}?`;
    if(params!=null){
        url += `${params}`;
    }
    return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}

function drawArea(areaRef, data){
    const chart = Plot.plot({
        marks: [
          Plot.areaY(data, {x: "time", y: "events", fill: "type"}),
          Plot.areaY(data, {x: "time", y0: "events", fill: "type"})
        ],
        title: "xtz",
        width: 1900,
        height: 110,
        style: {
            "background-color": "black",
            "color": "white",
            "font-size": 13,
            "margin-left": "20px",
            "padding-top": 0,
        },
        y: {
            axis: true,
            label: null
        },
        x: {
            type: "point",
            tickFormat: d => `T-${d*5}`,
            label: null,
            tickRotate: -90
        },
        color: {
            range: ["#21918c", "#440154"],
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
    const IPs = (await requestJSON('getUniqueIPs'))['ip'];
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
        this.drawChart = this.drawChart.bind(this);
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
            selectedEvent: {}
        }
    }
    async componentDidMount(){
        const totalTime = parseInt(await requestJSON("getTotalTime"));
        drawLegend(this.legendRef);
        let axisAdded = false;
        await timeout(5000); //for 5 sec delay
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
            drawArea(this.areaRef, this.points);
            this.drawChart(this.svg, this.tooltipRef, data.data, this.hexRadius, this.hexgridWidth, this.hexgridHeight);
            if(!axisAdded){
                drawAxis(this.svg, data.maxY, this.hexRadius, this.offsetY);
                axisAdded = true;
            }
            await timeout(1000); //for 5 sec delay
        }
    }

    drawChart(svgRef, tooltipRef, points, hexRadius=20, width_=1800, height_=1000) {
        let margin = {top: 0, right: 10, bottom: 30, left: 10},
        width = width_ - margin.left - margin.right,
        height = height_ - margin.top - margin.bottom;
        d3.selectAll("g > path.hexagon").remove();
    
    
        const Tooltip = d3.select(tooltipRef.current)
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")
    
    
    
        const mouseover = function(d) {
            Tooltip
              .style("opacity", 1)
            d3.select(this)
              .style("stroke", "black")
              .style("opacity", 1)
              .style("cursor", "pointer")
    
          }
        const mousemove = function(d) {
            Tooltip
                .html("time: " + d.srcElement.__data__.time + "</br>anomaly score: " + d.srcElement.__data__.anomalyScore + "</br>location: " + d.srcElement.__data__.locationCity)
                .style('left', d.pageX + 35 + 'px')
                .style('top', d.pageY + 'px')
            }
    
        const mouseclick = (d) => {
            this.setState({
                selectedEvent: {...d.srcElement.__data__}
            });
            console.log("time: " + d.srcElement.__data__.time + "</br>anomaly score: " + d.srcElement.__data__.anomalyScore);
        }
        const mouseleave = function(d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 1)
                .style("cursor", "")
            }
        
        
        let hexbin = d3hex.hexbin()
        .size([1000, 1000])
        .radius(hexRadius-2);
    
    
        const color = d3.scaleSequential()
            .interpolator(d3.interpolateViridis)
            .domain([0,1])
    
    
        const svg = d3.select(svgRef.current);
    
    
        svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
            
        svg
        .selectAll(".hex")
        .data(points)
        .enter().append("path")
        .attr("class", "hexagon")
        .attr("d", hexbin.hexagon())
        .attr("transform", function(d) { 
          return "translate(" + d.x + "," + d.y + ")"; 
        })  
        .style("fill", (d) => d.anomalyScore === null ? 'grey' : color(d.anomalyScore))
        .on("mouseover", mouseover)
        .on("click", mouseclick)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)    
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
                maliciousHeader =  <div><span className="customHeader">Malicious Attributes</span></div>
                maliciousFooter = <hr className="partition"></hr>
            }
            selectedEvent = (
                <div>
                    <hr className="partition"></hr>
                    <ListGroup>
                        {['ip', 'time'].map(
                            key => <ListGroup.Item className="listOfAttributes" variant="dark" key={key}><span className="selectedEventTitle">
                                    {key}:     <span className="selectedEvent">{this.state.selectedEvent[key]}</span></span></ListGroup.Item>)
                        }
                        <hr className="partition"></hr>
                        {maliciousHeader}
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
                  <a href="#home">DIGITAL FINGER PRINT | MORPHEUS</a>
                  {/* <button id="play-button" className="active" onClick={}>Play</button> */}
                </div>
                <div id="area" ref={this.areaRef}></div>
                <Stack direction="horizontal" gap={1}>
                    <div id="hexgrid">
                        <svg ref={this.svg}></svg>
                        <div id="tooltip" ref={this.tooltipRef}></div>
                    </div>
                
                    <div id="sidePanel">
                            <svg id="legend" ref={this.legendRef}></svg>
                        {selectedEvent}
                    </div>
                </Stack>
            </div>
        )
    }
}