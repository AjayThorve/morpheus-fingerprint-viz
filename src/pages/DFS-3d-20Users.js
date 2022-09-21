import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { tableFromIPC } from "apache-arrow";
import Image from "next/image";
import HexGrid3d from "../components/hexgrid-3d";
import AreaChart from "../components/area";
import SidePanel from "../components/sidePanels/rightInfoPanel";
import ConfigPanel from "../components/sidePanels/leftConfigPanel";
import styles from "../styles/DFS-3d.module.css";

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
    this.resetSelected = this.resetSelected.bind(this);
    this.setEvents = this.setEvents.bind(this);
    this.setSelectedEvent = this.setSelectedEvent.bind(this);
    this.offsetX = 200;
    this.offsetY = 100;
    this.hexRadius = 20;
    this.hexgridWidth = 1600;
    this.hexgridHeight = this.hexRadius * 50;
    this.state = {
      selectedEvent: {},
      allEvents: [],
      currentTime: 0,
      position: null,
      colors: null,
      userIDs: [],
      sort: true,
      totalEvents: [],
      anomalousEvents: [],
    };
    this.waitTime = 1000;
  }
  async componentDidMount() {
    const totalTime = parseInt(await requestJSON("getTotalTime"));
    // drawLegend(this.legendRef);
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
      const timeNow = +new Date();

      this.setState({
        currentTime: i,
        position: elevation,
        colors: colors,
        userIDs: userIDs,
        anomalousEvents: this.state.anomalousEvents.concat([
          [timeNow, data.totalAnomalousEvents],
        ]),
        totalEvents: this.state.totalEvents.concat([
          [timeNow, data.totalEvents],
        ]),
      });
      await timeout(this.waitTime); //for 5 sec delay
    }
  }

  resetSelected() {
    if (this.state.selectedEvent !== {}) {
      this.setState({
        selectedEvent: {},
      });
    }
  }

  setEvents(events) {
    this.setState({
      allEvents: events,
    });
  }

  setSelectedEvent(event) {
    this.setState({
      selectedEvent: event,
    });
  }

  render() {
    return (
      <div id="chart">
        <div className={styles.topnav}>
          <ConfigPanel />
          <span> MORPHEUS | Digital Fingerprint </span>
          <div style={{ float: "right", margin: "0" }}>
            <Image
              alt="nv_logo"
              src="/nvidia-logo-final.png"
              height={50}
              width={75}
            ></Image>
          </div>
        </div>
        <div id={styles.area}>
          <AreaChart
            totalEvents={this.state.totalEvents}
            anomalousEvents={this.state.anomalousEvents}
          />
        </div>
        <div id={styles.hexgrid}>
          <HexGrid3d
            rows={34}
            cols={48}
            apiURL={"three"}
            waitTime={this.waitTime}
            currentTime={this.state.currentTime}
            position={this.state.position}
            colors={this.state.colors}
            userIDs={this.state.userIDs}
            setEvents={this.setEvents}
            setSelectedEvent={this.setSelectedEvent}
            resetSelected={this.resetSelected}
          />

          <SidePanel
            selectedEvent={this.state.selectedEvent}
            allEvents={this.state.allEvents}
          ></SidePanel>
        </div>
      </div>
    );
  }
}
