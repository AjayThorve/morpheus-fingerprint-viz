import React from "react";
import * as d3 from "d3";
const d3hex = require("d3-hexbin");
import * as Plot from "@observablehq/plot";
import "bootstrap/dist/css/bootstrap.min.css";
import ListGroup from "react-bootstrap/ListGroup";
import CloseButton from "react-bootstrap/CloseButton";

async function requestJSON(type = "getDF", params = null) {
  let url = `/api/${type}?`;
  if (params != null) {
    url += `${params}`;
  }
  return await fetch(url, {
    method: "GET",
    headers: { "Access-Control-Allow-Origin": "*" },
  }).then((res) => res.json());
}

const IPAddressLookup = [
  "sgonzalez",
  "ccameron",
  "tanderson",
  "jessicabrewer",
  "abigailstanley",
  "patricia32",
  "stewartlucas",
  "sandra54",
  "cmorris",
  "gonzalezjulia",
  "fhenderson",
  "robinsonricky",
  "michaelpatton",
  "veronicalopez",
  "ann22",
  "swilliams",
  "julie57",
  "aberg",
  "richard26",
  "robertsondonna",
];

function drawArea(areaRef, data, maxTime) {
  const chart = Plot.plot({
    marks: [
      Plot.areaY(data, { x: "time", y: "events", fill: "type" }),
      Plot.areaY(data, { x: "time", y0: "events", fill: "type" }),
    ],
    title: "xtz",
    width: 1790,
    height: 140,
    style: {
      "background-color": "black",
      color: "white",
      "font-size": "16px",
      "margin-left": "80px",
      "padding-top": 0,
    },
    y: {
      axis: true,
      label: "TRAFFIC →",
      tickSize: "0",
      tickFormat: (d) => ``,
      labelAnchor: "center",
      // labelOffset: "10",
    },
    x: {
      // axis: false,
      type: "log",
      tickFormat: (d) => ``,
      label: `TIME →`,
      tickSize: "0",
      labelOffset: "24",
      labelAnchor: "left",
      className: "xAxislabel",
      // transform: "'translate(140,0)'",
      // tickRotate: -60,
      reverse: true,
    },
    color: {
      range: ["#b95422", "#1f1d1d"],
      legend: true,
      legendAnchor: "center",
      style: {
        color: "white",
        fontSize: "14px",
        "margin-left": "200px",
      },
    },
  });
  console.log(d3.selectAll(".xAxislabel"));
  d3.selectAll("div > div#area > *").remove();
  if (areaRef.current) {
    areaRef.current.append(chart);
  }
}

async function drawAxis(svgRef, maxY, hexRadius, offsetY) {
  const svg = d3.select(svgRef.current);
  // const IPs = (await requestJSON('getUniqueIDs'))['userID'];
  const yScale = d3
    .scaleBand()
    .range([offsetY - hexRadius, maxY + hexRadius])
    .domain(IPAddressLookup)
    .padding(0.05);

  svg
    .append("g")
    .attr("transform", `translate(${190 - hexRadius},3)`)
    .style("font-size", hexRadius - 6)
    .style("color", "white")
    .call(d3.axisLeft(yScale).tickSize(0))
    .select(".domain")
    .remove();

  svg
    .append("text")
    .attr("transform", `translate(${190 - hexRadius},0)`)
    .style("font-size", 16)
    .style("font-weight", "bold")
    .style("fill", "white")
    .attr("text-anchor", "end")
    .attr("y", 44)
    .text("USER NAME");

  svg
    .append("text")
    .attr("transform", `translate(${190 - hexRadius},20)`)
    .style("font-size", 16)
    .style("font-weight", "bold")
    .style("fill", "white")
    .style("font-style", "italic")
    .attr("text-anchor", "end")
    .attr("y", 44)
    .text("sorted by priority");

  svg
    .append("text")
    .attr("transform", `translate(${265 - hexRadius},0)`)
    .style("font-size", 16)
    .style("font-weight", "bold")
    .style("fill", "white")
    .attr("text-anchor", "end")
    .attr("y", 44)
    .text("TIME →");
}

function drawLegend(svgRef) {
  let legend = Plot.legend({
    color: {
      type: "sequential",
      domain: [0, 1],
      scheme: "viridis",
      tickRotate: 90,
      tickFormat: (d) => {
        if (d == 0.6) {
          return "Anomaly (>0.6)";
        }
        if (d == 0 || d == 1) {
          return d;
        }
        return null;
      },
      label: "Anomaly Score",
    },
    width: 280,
    height: 30,
    marginLeft: 25,
    marginBottom: 5,
    paddingBottom: 0,
    swatchSize: 11,
    style: {
      color: "white",
      fontSize: "14px",
    },
  });
  svgRef.current.append(legend);
}

function timeout(delay) {
  return new Promise((res) => setTimeout(res, delay));
}

export default class CustomD3 extends React.Component {
  constructor(props) {
    super(props);
    this.drawChart = this.drawChart.bind(this);
    this.resetSelected = this.resetSelected.bind(this);
    this.svg = React.createRef();
    this.areaRef = React.createRef();
    this.tooltipRef = React.createRef();
    this.legendRef = React.createRef();
    this.points = [
      { time: 0, events: 0, type: "anomalousEvents" },
      { time: 0, events: 0, type: "totalEvents" },
    ];
    this.offsetX = 200;
    this.offsetY = 100;
    this.hexRadius = 25;
    this.hexgridWidth = 2000;
    this.hexgridHeight = this.hexRadius * 50;
    this.state = {
      selectedEvent: {},
    };
    this.color = null;
  }
  async componentDidMount() {
    const totalTime = parseInt(await requestJSON("getTotalTime"));
    drawLegend(this.legendRef);
    let axisAdded = false;
    await timeout(3000); //for 5 sec delay
    for (let i = 4; i <= totalTime; i++) {
      const data = await requestJSON(
        "getDF",
        `offsetX=${this.offsetX}&offsetY=${this.offsetY}&time=${i}&hexRadius=${this.hexRadius}`
      );
      this.points.push({
        time: i,
        events: data.totalAnomalousEvents,
        type: "anomalousEvents",
      });
      this.points.push({
        time: i,
        events: data.totalEvents,
        type: "totalEvents",
      });
      drawArea(this.areaRef, this.points, i);
      this.drawChart(
        this.svg,
        this.tooltipRef,
        data.data,
        this.hexRadius,
        this.hexgridWidth,
        this.hexgridHeight
      );
      if (!axisAdded) {
        drawAxis(this.svg, data.maxY, this.hexRadius, this.offsetY);
        axisAdded = true;
      }
      await timeout(3000); //for 5 sec delay
    }
  }

  drawChart(
    svgRef,
    tooltipRef,
    points,
    hexRadius = 20,
    width_ = 1800,
    height_ = 1000
  ) {
    let margin = { top: 0, right: 10, bottom: 30, left: 10 },
      width = width_ - margin.left - margin.right,
      height = height_ - margin.top - margin.bottom;
    d3.selectAll("g > path.hexagon").remove();

    const Tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("position", "absolute");

    const mouseover = function (d) {
      Tooltip.style("opacity", 1);
      d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
        .style("cursor", "pointer");
    };
    const mousemove = function (d) {
      Tooltip.html(
        "time: " +
          d.srcElement.__data__.time +
          "</br>anomaly score: " +
          d.srcElement.__data__.anomalyScore +
          "</br>location: " +
          d.srcElement.__data__.locationCity
      )
        .style("left", d.pageX + 35 + "px")
        .style("top", d.pageY + "px");
    };

    const mouseclick = (d) => {
      this.setState({
        selectedEvent: { ...d.srcElement.__data__ },
      });
      console.log(
        "time: " +
          d.srcElement.__data__.time +
          "</br>anomaly score: " +
          d.srcElement.__data__.anomalyScore
      );
    };
    const mouseleave = function (d) {
      Tooltip.style("opacity", 0);
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 1)
        .style("cursor", "");
    };

    let hexbin = d3hex
      .hexbin()
      .size([1000, 1000])
      .radius(hexRadius - 4);

    this.color = d3
      .scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain([0, 1]);

    const svg = d3.select(svgRef.current);

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg
      .append("g")
      .selectAll(".hex")
      .data(points)
      .enter()
      .append("path")
      .attr("class", "hexagon")
      .attr("d", hexbin.hexagon())
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .style("fill", (d) =>
        d.anomalyScore === null ? "#1f1d1d" : this.color(d.anomalyScore)
      )
      .on("mouseover", mouseover)
      .on("click", mouseclick)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);
  }

  resetSelected() {
    if (this.state.selectedEvent !== {}) {
      this.setState({
        selectedEvent: {},
      });
    }
  }

  render() {
    let selectedEvent;
    let anomalyScore;
    let maliciousHeader;
    let maliciousFooter;
    if (
      this.state.selectedEvent.anomalyScore ||
      this.state.selectedEvent.anomalyScore == 0
    ) {
      const events = [];
      if (this.state.selectedEvent.anomalousAttributes) {
        this.state.selectedEvent.anomalousAttributes
          .split(",")
          .forEach((key) => {
            events.push(key);
          });
        maliciousHeader = (
          <div className="customHeader">Malicious Attributes</div>
        );
        anomalyScore = (
          <ListGroup.Item
            className="listOfAttributes"
            variant="dark"
            key={"anomalyScore"}
          >
            <span className="selectedEventTitle">
              anomalyScore:{" "}
              <span
                className="selectedEvent"
                style={{
                  "font-size": "18px",
                  color: this.color(this.state.selectedEvent["anomalyScore"]),
                }}
              >
                {Math.round(this.state.selectedEvent["anomalyScore"] * 100) /
                  100}
              </span>
            </span>
          </ListGroup.Item>
        );
      }
      const conditionalBreakLine = this.state.selectedEvent
        .anomalousAttributes ? (
        <hr className="partition"></hr>
      ) : (
        ""
      );
      selectedEvent = (
        <div id="sidePanel" className="detailsPanel">
          <ListGroup>
            <CloseButton variant="white" onClick={this.resetSelected} />
            <div className="customHeader">Event Information</div>
            <ListGroup.Item
              className="listOfAttributes"
              variant="dark"
              key={"userID"}
            >
              <span className="selectedEventTitle">
                userID:{" "}
                <span className="selectedEvent">
                  {IPAddressLookup[this.state.selectedEvent["userID"]]}
                </span>
              </span>
            </ListGroup.Item>
            <ListGroup.Item
              className="listOfAttributes"
              variant="dark"
              key={"time"}
            >
              <span className="selectedEventTitle">
                Time:{" "}
                <span className="selectedEvent">
                  {this.state.selectedEvent["time"]}
                </span>
              </span>
            </ListGroup.Item>
            {conditionalBreakLine}
            {maliciousHeader}
            {anomalyScore}
            {events.map((key) => (
              <ListGroup.Item
                className="listOfAttributes"
                variant="dark"
                key={key}
              >
                <span className="selectedEventTitle">
                  {key}:{" "}
                  <span className="selectedEvent">
                    {this.state.selectedEvent[key]}
                  </span>
                </span>
              </ListGroup.Item>
            ))}
            {maliciousFooter}
          </ListGroup>
        </div>
      );
      anomalyScore = (
        <span className="selectedEvent" id="anomalyNumber">
          {parseFloat(this.state.selectedEvent.anomalyScore).toFixed(2)}{" "}
        </span>
      );
    }
    return (
      <div id="chart">
        <div className="topnav">
          <a href="#home">DIGITAL FINGER PRINT | NVIDIA MORPHEUS</a>
          {/* <button id="play-button" className="active" onClick={}>Play</button> */}
        </div>
        <div id="area" ref={this.areaRef}></div>
        <hr className="partition"></hr>
        <div id="hexgrid">
          <svg ref={this.svg}></svg>
          <div id="tooltip" ref={this.tooltipRef}></div>
          <svg
            id="legend"
            ref={this.legendRef}
            transform="translate(1620,-1260)"
          ></svg>
        </div>
        <div>{selectedEvent}</div>
      </div>
    );
  }
}
