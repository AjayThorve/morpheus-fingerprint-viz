import React, { useEffect, useRef, useState } from "react";
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

function ConfigPanel() {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <a href={"#"} onClick={handleShow}>
        <List color={"white"} size={22} />
      </a>

      <Offcanvas show={show} onHide={handleClose} id={styles.configPanel}>
        <Offcanvas.Header>
          <Offcanvas.Title>Settings</Offcanvas.Title>
          <CloseButton variant="white" onClick={() => setShow(false)} />
        </Offcanvas.Header>

        <ListGroup>
          <ListGroup.Item className={styles.listOfAttributes} key={"sort"}>
            <div className={styles.configTitle}>Sort By</div>
            <select
              name="sortEvents"
              className={styles.configTools}
              onChange={(e) => {
                console.log("event", e.target.value);
                // setSelectedEvent(e.target.value);
              }}
            >
              <option>Average Anomalous Score</option>
              <option>Sum of Anomalous Score</option>
              <option>No Sorting</option>
            </select>
          </ListGroup.Item>
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
              defaultValue={[20, 38.5]}
              onChange={(e) => console.log(e)}
              handleStyle={[handleStyle, handleStyle]}
              trackStyle={trackStyle}
              railStyle={railStyle}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"visibleUsers"}
          >
            <div className={styles.configTitle}>Visible Users (Rows)</div>
            <Slider
              className={`${styles.configSliders}`}
              min={30}
              max={50000}
              defaultValue={[25000]}
              onChange={(e) => console.log(e)}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"sortFrequency"}
          >
            <div className={styles.configTitle}>Sort Frequency</div>
            <Slider
              className={`${styles.configSliders}`}
              min={0}
              max={60}
              defaultValue={[1]}
              onChange={(e) => console.log(e)}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
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
              defaultValue={[1]}
              onChange={(e) => console.log(e)}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
            />
          </ListGroup.Item>
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
              defaultValue={[5]}
              onChange={(e) => console.log(e)}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
            />
          </ListGroup.Item>
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
              defaultValue={[600]}
              onChange={(e) => console.log(e)}
              handleStyle={handleStyle}
              trackStyle={trackStyle}
              railStyle={railStyle}
            />
          </ListGroup.Item>
          <br></br>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"pauseLiveUpdates"}
          >
            <div className={styles.configTitle}>Pause Live Updates</div>
            <Form.Switch className={`${styles.configSwitch} configSwitch`} />
          </ListGroup.Item>
          <ListGroup.Item
            className={styles.listOfAttributes}
            key={"3dPerspectiveLock"}
          >
            <div className={styles.configTitle}>3d Perspective Lock</div>
            <Form.Switch className={`${styles.configSwitch} configSwitch`} />
          </ListGroup.Item>
        </ListGroup>
      </Offcanvas>
    </>
  );
}

export default ConfigPanel;
