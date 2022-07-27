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
  
async function drawChart(svgRef, tooltipRef, points) {
    let margin = {top: 10, right: 10, bottom: 30, left: 80},
    width = 2000 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;

    console.log(points);
    const Tooltip = d3.select(tooltipRef.current)
        .append('div')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")


    const mouseover = function(d) {
        Tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
      }
    const mousemove = function(d) {
        Tooltip
            .html("time: " + d.srcElement.__data__.time + " ip: " + d.srcElement.__data__.ip + "\n anomaly score: " + d.srcElement.__data__.anomalyScore)
            .style('left', d.pageX + 'px')
            .style('top', d.pageY + 'px')
        }
    const mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1)
        }
    
    
    let hexbin = d3hex.hexbin()
    .size([1000, 1000])
    .radius(20);


    const color = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0,1])


    const svg = d3.select(svgRef.current);
     
    svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg
    .append("g")
    .attr("clip-path", "url(#clip)")
    .selectAll(".hexagon")
    .data(points)
    .enter().append("path")
    .attr("class", "hexagon")
    .attr("d", hexbin.hexagon())
    .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    })  
    .style("fill", function(d) { 
          return color(d.anomalyScore); 
        })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    

    // add yaxis ip address
    const yAxis = d3.scaleBand()
    .range([height, 0])
    .domain(Array())
    .padding(0.05);

    svg
    .append("g")
    .style('font-size', 15)
    .call(d3.axisLeft(yAxis).tickSize(0))
    .select(".domain").remove()
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
        this.offsetX = 300;
    }
    async componentDidMount(){
        for(let i=1; i<=6; i++){
            this.points.push(...await requestJSON("getDF", `offsetX=${this.offsetX}&offsetY=150&time=${i}`));
            drawChart(this.svg, this.tooltipRef, this.points);
            this.offsetX = 34 + this.points[this.points.length - 1].x;
            await timeout(1000); //for 1 sec delay
        }
    }
    render() {
        return (
            <div id="chart">
                <div id="div_template" >
                    <svg ref={this.svg}></svg>
                    <div ref={this.tooltipRef}></div>
                </div>
            </div>
        )
    }
}