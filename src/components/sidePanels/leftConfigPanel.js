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

import React, { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { List } from "react-bootstrap-icons";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Form from "react-bootstrap/Form";
import styles from "../../styles/components/sidePanels.module.css";

const handleStyle = {
  borderColor: "white",
  boxShadow: "white",
  height: 13,
  width: 13,
  marginTop: -2,
  opacity: 1,
  radius: 1,
};

const trackStyle = { backgroundColor: "gray", height: 10 };

const railStyle = {
  backgroundColor: "#0f0f0f",
  border: "solid 1px white",
  height: 10,
};

function ConfigPanel({ config, updateConfig }) {
  const [show, setShow] = useState(false);
  const [configValues, setConfigValues] = useState({
    colorThreshold: config.anomalousColorThreshold.map((x) => x * 100),
    visibleUsers: [config.visibleUsers.value],
    sortFrequency: [1], //seconds
    updateFrequency: [1], //seconds
    timePerHex: [5], //seconds
    lookBackTime: [config.lookBackTime], //seconds
  });

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <a href={"#"} onClick={handleShow}>
        <List color={"white"} size={22} />
      </a>

      <Offcanvas
        show={show}
        onHide={handleClose}
        scroll={true}
        backdrop={false}
        id={styles.configPanel}
      >
        <Offcanvas.Header>
          <Offcanvas.Title>Settings</Offcanvas.Title>
          <CloseButton variant="white" onClick={() => setShow(false)} />
        </Offcanvas.Header>
        <br></br>

        <ListGroup>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"sortUpdates"}
          >
            <div className={styles.configTitle}>Sort Updates</div>
            <Form.Switch
              className={`${styles.configSwitch} configSwitch`}
              checked={config.sort}
              onChange={(e) => {
                updateConfig("sort", e.target.checked);
              }}
              label={config.sort ? "on" : "off"}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item className={styles.listOfAttributes} key={"sort"}>
            <div className={styles.configTitle}>Sort By (Highest on Top)</div>
            <select
              name="sortEvents"
              className={styles.configTools}
              value={config.sortBy}
              onChange={(e) => {
                updateConfig("sortBy", e.target.value);
              }}
            >
              <option value={"mean"}>Mean Anomalous Score</option>
              <option value={"sum"}>Sum of Anomalous Scores</option>
              <option value={"max"}>Max Anomalous Score</option>
              <option value={"min"}>Min Anomalous Score</option>
              <option value={"count"}>No. of Events</option>
            </select>
          </ListGroup.Item>
          <br></br>
          <br></br>

          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"colorThreshold"}
          >
            <div className={styles.configTitle}>Anomalous Color Threshold</div>
            <Slider
              className={`${styles.configSliders}`}
              range
              min={0}
              max={100}
              defaultValue={configValues.colorThreshold}
              onChange={(e) => {
                setConfigValues({ ...configValues, colorThreshold: e });
                updateConfig(
                  "anomalousColorThreshold",
                  e.map((x) => x / 100)
                );
              }}
              handleStyle={[handleStyle, handleStyle]}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [configValues.colorThreshold[0]]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.colorThreshold[0] / 100}</span>,
                },
                [configValues.colorThreshold[1]]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.colorThreshold[1] / 100}</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"visibleUsers"}
          >
            <div className={styles.configTitle}>Visible Users (Rows)</div>
            <Slider
              className={`${styles.configSliders}`}
              min={config.visibleUsers.min}
              max={config.visibleUsers.max}
              defaultValue={config.visibleUsers.value}
              onChange={(e) => {
                setConfigValues({ ...configValues, visibleUsers: e });
                updateConfig("visibleUsers", {
                  ...config.visibleUsers,
                  value: e,
                });
              }}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [config.visibleUsers.value]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{config.visibleUsers.value}</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>
          {/* <ListGroup.Item
            className={styles.listOfAttributes}
            key={"sortFrequency"}
          >
            <div className={styles.configTitle}>Sort Frequency</div>
            <Slider
              className={`${styles.configSliders}`}
              min={0}
              max={60}
              defaultValue={configValues.sortFrequency}
              onChange={(e) =>
                setConfigValues({ ...configValues, sortFrequency: e })
              }
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [configValues.sortFrequency]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.sortFrequency} sec</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"updateFrequency"}
          >
            <div className={styles.configTitle}>Update Frequency</div>
            <Slider
              className={`${styles.configSliders}`}
              min={0}
              max={300}
              defaultValue={configValues.updateFrequency}
              onChange={(e) =>
                setConfigValues({ ...configValues, updateFrequency: e })
              }
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [configValues.updateFrequency]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.updateFrequency} sec</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>*/}
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"timeBinPerHexagon"}
          >
            <div className={styles.configTitle}>Time Bin Per Hexagon</div>
            <Slider
              className={`${styles.configSliders}`}
              min={1}
              max={100}
              defaultValue={configValues.timePerHex}
              onChange={(e) =>
                setConfigValues({ ...configValues, timePerHex: e })
              }
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [configValues.timePerHex]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.timePerHex} sec</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"lookBackTime"}
          >
            <div className={styles.configTitle}>Look Back Time</div>
            <Slider
              className={`${styles.configSliders}`}
              min={0}
              max={1000}
              defaultValue={configValues.lookBackTime}
              onChange={(e) => {
                setConfigValues({ ...configValues, lookBackTime: e });
                updateConfig("lookBackTime", e);
              }}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
              marks={{
                [configValues.lookBackTime]: {
                  style: {
                    color: "white",
                  },
                  label: <span>{configValues.lookBackTime} sec</span>,
                },
              }}
            />
          </ListGroup.Item>
          <br></br>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"pauseLiveUpdates"}
          >
            <div className={styles.configTitle}>Pause Live Updates</div>
            <Form.Switch
              className={`${styles.configSwitch} configSwitch`}
              checked={config.pauseLiveUpdates}
              onChange={(e) => {
                updateConfig("pauseLiveUpdates", e.target.checked);
              }}
              label={config.pauseLiveUpdates ? "on" : "off"}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"3dPerspectiveLock"}
          >
            <div className={styles.configTitle}>3d Perspective Lock</div>
            <Form.Switch
              className={`${styles.configSwitch} configSwitch`}
              checked={config.threeDimensionPerspectiveLock}
              onChange={(e) => {
                updateConfig("threeDimensionPerspectiveLock", e.target.checked);
              }}
              label={config.threeDimensionPerspectiveLock ? "on" : "off"}
            />
          </ListGroup.Item>
        </ListGroup>
      </Offcanvas>
    </>
  );
}

export default ConfigPanel;
