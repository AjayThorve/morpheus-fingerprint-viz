import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import * as Plot from "@observablehq/plot";
import * as echarts from "echarts";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";
import { Data, tableFromIPC } from "apache-arrow";
import { fire } from "../components/colors";
import ReactCharts from "echarts-for-react";
import Box from "./Box-3d";

async function requestJSON(type = "getEventStats", params = null) {
  let url = `/api/three/${type}?`;
  if (params != null) {
    url += `${params}`;
  }
  return await fetch(url, {
    method: "GET",
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((res) => res.json())
    .catch((e) => console.log(e));
}

const AreaOptions = {
  // left: "5%",
  tooltip: {
    trigger: "axis",
    position: function (pt) {
      return [pt[0], "10%"];
    },
  },
  grid: {
    left: 100,
    right: 50,
  },
  title: {
    textAlign: "left",
    textVerticalAlign: "auto",
    text: "Total Network Traffic Volume",
    textStyle: {
      color: "#ffffff",
      fontSize: "18px",
    },
    top: "5%",
    left: "2%",
  },
  color: ["#f73d0a", "#ffffff"],
  legend: {
    data: [
      {
        name: "Anomalous Traffic",
        icon: "square",
      },
      {
        name: "Network Traffic",
        icon: "square",
      },
    ],
    textStyle: {
      color: "#ffffff",
      fontSize: "14px",
    },
    bottom: "5%",
    left: "5%",
  },
  xAxis: {
    type: "time",
    name: "Time",
    nameLocation: "end",
    nameTextStyle: {
      color: "#ffffff",
      fontWeight: "bold",
      verticalAlign: "top",
      lineHeight: 30,
      fontSize: 14,
    },
    textStyle: {
      color: "#ffffff",
    },
    splitLine: { interval: 2 },
    axisLabel: { color: "#ffffff" },
    inverse: true,
  },
  yAxis: {
    type: "value",
    name: "Events",
    nameLocation: "middle",
    nameTextStyle: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 14,
    },
    axisLabel: { color: "#ffffff", align: "right" },
    splitLine: { lineStyle: { opacity: 0.2 } },
    nameGap: 50,
  },
  // dataZoom: [
  //   {
  //     start: 100,
  //     end: 50,
  //   },
  // ],
  series: [
    {
      name: "Anomalous Traffic",
      type: "line",
      symbol: "none",
      stack: true,
      lineStyle: {
        width: 0.7,
      },
      areaStyle: {
        opacity: 1,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1.5, [
          {
            offset: 0,
            color: "#f73d0a",
          },
          {
            offset: 1,
            color: "#000000",
          },
        ]),
      },
      data: [],
    },
    {
      name: "Network Traffic",
      type: "line",
      symbol: "none",
      stack: true,
      lineStyle: {
        width: 0.7,
        color: "#ffffff",
      },
      areaStyle: {
        opacity: 0.7,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1.5, [
          {
            offset: 0,
            color: "#ffffff",
          },
          {
            offset: 1,
            color: "#000000",
          },
        ]),
      },
      data: [],
    },
  ],
  notMerge: true,
  backgroundColor: "#0f0f0f",
};

async function requestData(type = "getDF", params = null) {
  let url = `/api/three/${type}?`;
  if (params != null) {
    url += `${params}`;
  }
  const result = await fetch(url, {
    method: "GET",
    headers: { "Access-Control-Allow-Origin": "*" },
  });
  const table = tableFromIPC(result);
  return table;
}

function drawLegend(svgRef) {
  let legend = Plot.legend({
    color: {
      type: "sequential",
      domain: [0, 1],
      range: fire,
      tickRotate: 90,
      tickFormat: (d) => {
        if (d == 0.4) {
          return "Anomaly (>0.385)";
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
    marginBottom: 0,
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
    this.svg = React.createRef();
    this.areaRef = React.createRef();
    this.tooltipRef = React.createRef();
    this.legendRef = React.createRef();
    this.totalEvents = [];
    this.anomalousEvents = [];
    this.offsetX = 200;
    this.offsetY = 100;
    this.hexRadius = 20;
    this.hexgridWidth = 1600;
    this.hexgridHeight = this.hexRadius * 50;
    this.state = {
      selectedEvent: {},
      currentTime: 0,
      position: null,
      colors: null,
      userIDs: [],
      sort: true,
    };
    this.waitTime = 1000;
  }
  async componentDidMount() {
    const totalTime = parseInt(await requestJSON("getTotalTime"));
    drawLegend(this.legendRef);
    // let axisAdded = false;
    // await timeout(5000); //for 5 sec delay
    for (let i = 90; i <= totalTime; i += 1) {
      const data = await requestJSON(
        "getEventStats",
        `time=${i}&sort=${this.state.sort}`
      );
      const elevation = await requestData(
        "getDFElevation",
        `time=${i}&sort=${this.state.sort}`
      );
      const colors = await requestData(
        "getDFColors",
        `time=${i}&sort=${this.state.sort}`
      );
      const userIDs = await requestData(
        "getUniqueIDs",
        `time=${i}&sort=${this.state.sort}`
      );

      this.setState({
        currentTime: i,
        position: elevation,
        colors: colors,
        userIDs: userIDs,
      });
      const timeNow = +new Date();
      this.anomalousEvents.push([timeNow, data.totalAnomalousEvents]);
      this.totalEvents.push([timeNow, data.totalEvents]);

      if (this.areaRef.current !== null) {
        this.areaRef.current.getEchartsInstance().setOption({
          series: [
            {
              name: "Network Traffic",
              data: this.totalEvents,
            },
            {
              name: "Anomalous Traffic",
              data: this.anomalousEvents,
            },
          ],
        });
      }

      await timeout(this.waitTime); //for 5 sec delay
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
          <span> MORPHEUS | DFS </span>
          {/* <button id="play-button" className="active" onClick={}>Play</button> */}
        </div>
        <div id="area">
          <ReactCharts
            ref={this.areaRef}
            style={{
              height: "100%",
              width: "100%",
            }}
            option={AreaOptions}
          />
        </div>
        {/* <hr className="partition"></hr> */}
        <div id="hexgrid">
          <Box
            rows={34}
            cols={30}
            apiURL={"three"}
            waitTime={this.waitTime}
            currentTime={this.state.currentTime}
            position={this.state.position}
            colors={this.state.colors}
            userIDs={this.state.userIDs}
          />

          <svg id="legend" ref={this.legendRef}></svg>

          {/* <div id="sidePanel">{selectedEvent}</div> */}
        </div>
      </div>
    );
  }
}
