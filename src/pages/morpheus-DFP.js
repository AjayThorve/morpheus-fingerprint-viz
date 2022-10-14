// Copyright (c) 2022, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
  let url = `/api/${type}?dataset=interesting-users-34-enriched.parquet&`;
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
  let url = `/api/${type}?dataset=interesting-users-34-enriched.parquet&`;
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
    this.appendPayload = this.appendPayload.bind(this);
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
        sort: true,
        sortBy: "sum",
        anomalousColorThreshold: [0.1, 0.385],
        liveUpdates: true,
        threeDimensionPerspectiveLock: true,
        visibleUsers: { min: 2, max: 1000, value: 100 },
        lookBackTime: parseInt(process.env.NEXT_PUBLIC_look_back_time),
        timePerHex: parseInt(process.env.NEXT_PUBLIC_time_bin_per_hex),
      },
      notifications: "",
      loading: false,
    };
    this.waitTime = 4000;
  }

  appendPayload(time) {
    return `time=${time}&sort=${this.state.AppSettings.sort}&sortBy=${this.state.AppSettings.sortBy}&numUsers=${this.state.AppSettings.visibleUsers.value}&lookBackTime=${this.state.AppSettings.lookBackTime}`;
  }

  async loadData(time) {
    const timeNow = +new Date();
    const data = await requestJSON(
      "getEventStats",
      `${this.appendPayload(time)}&anomalyThreshold=${
        this.state.AppSettings.anomalousColorThreshold[1]
      }`
    );
    const elevation = await requestData(
      "getDFElevation",
      this.appendPayload(time)
    );
    const colors = await requestData(
      "getDFColors",
      `${this.appendPayload(time)}&colorThreshold=${
        this.state.AppSettings.anomalousColorThreshold
      }`
    );
    const userIDs = await requestData("getUniqueIDs", this.appendPayload(time));
    const gridBasedInstanceID = await requestJSON(
      "getGridBasedClickIndex",
      `${this.appendPayload(time)}&selectedEventUserID=${
        this.state.selectedEvent.userID
      }&selectedEventTime=${this.state.selectedEvent.time}`
    );

    this.setState({
      position: elevation,
      colors: colors,
      userIDs: userIDs,
      anomalousEvents: this.state.anomalousEvents.concat([
        [new Date(data.time), data.totalAnomalousEvents],
      ]),
      totalEvents: this.state.totalEvents.concat([
        [new Date(data.time), data.totalEvents],
      ]),
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

    for (
      let i = 50; // totalTime - this.state.AppSettings.lookBackTime;
      i <= totalTime;
      i += 1
    ) {
      await this.loadData(i);
      this.setState({
        currentTime: i,
      });
      await timeout(this.waitTime); //for 5 sec delay
    }
  }

  resetSelected() {
    this.setState({
      selectedEvent: -1,
    });
    this.setState({
      notifications: "selections reset",
    });
  }

  setEvents(events) {
    this.setState({
      allEvents: events,
    });
    if (events.length == 0) {
      this.setState({
        notifications: "No events found",
      });
    } else {
      this.setState({
        notifications: "Events retrieved",
      });
    }
  }

  async setSelectedEvent(event) {
    this.setState({
      selectedEvent: event,
    });
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
            appSettings={this.state.AppSettings}
            setLoadingIndicator={this.setLoadingIndicator}
          />

          <SidePanel
            allEvents={this.state.allEvents}
            anomalousColorThreshold={
              this.state.AppSettings.anomalousColorThreshold
            }
          ></SidePanel>
        </div>
      </div>
    );
  }
}
