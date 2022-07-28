import React from "react";
import * as d3 from "d3";
const d3hex = require("d3-hexbin");

async function requestJSON(type='getDF', params=null){
    let url = `/api/${type}?`;
    if(params!=null){
        url += `${params}`;
    }
    return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}

async function drawAxis(svgRef, maxY, hexRadius){
    const svg = d3.select(svgRef.current);
    const IPs = (await requestJSON('getUniqueIPs'))['ip'];
    const yAxis = d3.scaleBand()
        .range([200 + hexRadius, maxY+30])
        .domain(IPs)
        .padding(0.05)

        svg
        .append("g")
        .style('font-size', hexRadius-4)
        .style('color', "white")
        .call(d3.axisRight(yAxis).tickSize(0))
        .select(".domain").remove()
}
  
async function drawChart(svgRef, tooltipRef, points, hexRadius=20, width_=1800, height_=1000) {
    let margin = {top: 10, right: 10, bottom: 30, left: 80},
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
            .html("time: " + d.srcElement.__data__.time + "</br>ip: " + d.srcElement.__data__.ip + "</br>anomaly score: " + d.srcElement.__data__.anomalyScore)
            .style('left', d.pageX + 35 + 'px')
            .style('top', d.pageY + 'px')
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
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    svg
    .append("g")
    // .attr("clip-path", "url(#clip)")
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
    .on("click", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)    
  }

function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
}

export default class CustomD3 extends React.Component{
    constructor(props){
        super(props);
        this.svg = React.createRef();
        this.tooltipRef = React.createRef();
        this.points = [];
        this.offsetX = 200;
        this.hexRadius = 20;
        this.hexgridWidth = 1800;
        this.hexgridHeight = this.hexRadius * 50;
    }
    async componentDidMount(){
        let legendAdded = false;
        for(let i=1; i<=2; i++){
            const data = await requestJSON("getDF", `offsetX=${this.offsetX}&offsetY=250&time=${i}&hexRadius=${this.hexRadius}`);
            // this.points.push(...data.data);
            drawChart(this.svg, this.tooltipRef, data.data, this.hexRadius, this.hexgridWidth, this.hexgridHeight);
            if(!legendAdded){
                drawAxis(this.svg, data.maxY, this.hexRadius);
                legendAdded = true;
            }
            // this.offsetX = this.hexRadius*2 + data.data[data.data.length - 1].x;
            await timeout(5000); //for 1 sec delay
        }
    }
    render() {
        return (
            <div id="chart">
                <div id="div_template">
                    <svg ref={this.svg}></svg>
                    <div id="tooltip" ref={this.tooltipRef}></div>
                </div>
            </div>
        )
    }
}