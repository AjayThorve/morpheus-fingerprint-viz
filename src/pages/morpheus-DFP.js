import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "react-bootstrap/Navbar";
import Spinner from "react-bootstrap/Spinner";
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
    this.updateAppSettings = this.updateAppSettings.bind(this);
    this.setLoadingIndicator = this.setLoadingIndicator.bind(this);
    this.loadData = this.loadData.bind(this);
    this.setEvents = this.setEvents.bind(this);
    this.setSelectedEvent = this.setSelectedEvent.bind(this);
    this.offsetX = 200;
    this.offsetY = 100;
    this.hexRadius = 20;
    this.hexgridWidth = 1600;
    this.hexgridHeight = this.hexRadius * 50;
    this.state = {
      selectedEvent: { userID: -1, time: -1 },
      selectedInstance: -1,
      allEvents: [],
      currentTime: 0,
      position: null,
      colors: null,
      userIDs: [],
      totalEvents: [],
      anomalousEvents: [],
      AppSettings: {
        sort: false,
        sortBy: "sumAnomalous",
        anomalousColorThreshold: [0.1, 0.385],
        pauseLiveUpdates: false,
        threeDimensionPerspectiveLock: true,
        visibleUsers: { min: 2, max: 1000, value: 100 },
        lookBackTime: 48,
      },
      notifications: "sample notifications",
      loading: false,
    };
    this.waitTime = 4000;
  }

  async loadData(time) {
    const timeNow = +new Date();
    const data = await requestJSON(
      "getEventStats",
      `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}`
    );
    const elevation = await requestData(
      "getDFElevation",
      `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}&numUsers=${this.state.AppSettings.visibleUsers.value}&lookBackTime=${this.state.AppSettings.lookBackTime}`
    );
    const colors = await requestData(
      "getDFColors",
      `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}&numUsers=${this.state.AppSettings.visibleUsers.value}&lookBackTime=${this.state.AppSettings.lookBackTime}`
    );
    const userIDs = await requestData(
      "getUniqueIDs",
      `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}&numUsers=${this.state.AppSettings.visibleUsers.value}`
    );
    const gridBasedInstanceID = await requestJSON(
      "getGridBasedClickIndex",
      `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}&selectedEventUserID=${this.state.selectedEvent.userID}&selectedEventTime=${this.state.selectedEvent.time}&numUsers=${this.state.AppSettings.visibleUsers.value}&lookBackTime=${this.state.AppSettings.lookBackTime}`
    );

    this.setState({
      position: elevation,
      colors: colors,
      userIDs: userIDs,
      anomalousEvents: this.state.anomalousEvents.concat([
        [timeNow, data.totalAnomalousEvents],
      ]),
      totalEvents: this.state.totalEvents.concat([[timeNow, data.totalEvents]]),
      selectedEvent: {
        ...this.state.selectedEvent,
        instanceId: parseInt(gridBasedInstanceID.index),
      },
    });
  }
  async componentDidMount() {
    const totalTime = parseInt(await requestJSON("getTotalTime"));
    const numUsers = await requestJSON("getNumUsers");
    const visibleUsers = {
      min: this.state.AppSettings.visibleUsers.min,
      max: numUsers.numUsers,
      value: Math.min(100, numUsers.numUsers),
    };
    this.setState({
      AppSettings: { ...this.state.AppSettings, visibleUsers },
    });

    for (let i = 95; i <= totalTime; i += 1) {
      await this.loadData(i);
      this.setState({
        currentTime: i,
      });
      await timeout(this.waitTime); //for 5 sec delay
      // temporary hack, infinite loop
      // if (i == totalTime) {
      //   i = 90;
      // }
    }
  }

  resetSelected() {
    this.setState({
      selectedEvent: -1,
    });
  }

  setEvents(events) {
    this.setState({
      allEvents: events,
    });
  }

  async setSelectedEvent(event) {
    this.setState({
      selectedEvent: event,
    });
    // const elevation = await this.loadElevation(this.state.currentTime, event);
    // this.setState({
    //   position: elevation,
    // });
  }

  setLoadingIndicator(value) {
    this.setState({
      loading: value,
    });
  }

  updateAppSettings(key, value) {
    console.log(key, value);
    this.setState({
      AppSettings: {
        ...this.state.AppSettings,
        [key]: value,
      },
    });
  }

  render() {
    return (
      <div id="chart">
        <div className={styles.topnav}>
          <ConfigPanel
            config={this.state.AppSettings}
            updateConfig={this.updateAppSettings}
          />
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
        <Navbar fixed="bottom" className={styles.bottomnav}>
          <div className={styles.bottomnavCredits}>
            <span>Visualization Powered by Node Rapids</span>
          </div>
          <div className={styles.bottomnavNotifications}>
            <span>{this.state.notifications}</span>
          </div>
          <div className={styles.bottomnavLoading}>
            {this.state.loading ? (
              <Spinner animation="border" variant="light" size="sm" />
            ) : null}
          </div>
        </Navbar>

        <div id={styles.area}>
          <AreaChart
            totalEvents={this.state.totalEvents}
            anomalousEvents={this.state.anomalousEvents}
          />
        </div>
        <div id={styles.hexgrid}>
          <HexGrid3d
            rows={this.state.AppSettings.visibleUsers.value}
            cols={this.state.AppSettings.lookBackTime}
            apiURL={"three"}
            waitTime={this.waitTime}
            currentTime={this.state.currentTime}
            position={this.state.position}
            colors={this.state.colors}
            userIDs={this.state.userIDs}
            setEvents={this.setEvents}
            setSelectedEvent={this.setSelectedEvent}
            selectedEvent={this.state.selectedEvent}
            resetSelected={this.resetSelected}
            threeDimensionPerspectiveLock={
              this.state.AppSettings.threeDimensionPerspectiveLock
            }
            sort={this.state.AppSettings.sort}
            sortBy={this.state.AppSettings.sortBy}
            setLoadingIndicator={this.setLoadingIndicator}
          />

          <SidePanel allEvents={this.state.allEvents}></SidePanel>
        </div>
      </div>
    );
  }
}
