import React, { useEffect, useRef, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { List } from "react-bootstrap-icons";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import styles from "../../styles/components/sidePanels.module.css";

function ConfigPanel() {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <a href={"#"} onClick={handleShow}>
        {" "}
        <List color={"white"} size={22} />
      </a>

      <Offcanvas show={show} onHide={handleClose} id={styles.configPanel}>
        <CloseButton
          variant="white"
          style={{ marginLeft: "92%", marginTop: "1%" }}
          onClick={() => setShow(false)}
        />
        <ListGroup>
          <ListGroup.Item
            className={styles.listOfAttributes}
            // variant="dark"
            key={"sort"}
          >
            <div className={styles.configTitle}>Sort By</div>
            <select
              name="sortEvents"
              className={styles.configTools}
              onChange={(e) => {
                console.log("event", e.target.value);
                // setSelectedEvent(e.target.value);
              }}
              //   value={selectedEvent}
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
              max={300}
              defaultValue={[0, 25]}
              onChange={(e) => console.log(e)}
              handleStyle={[
                {
                  borderColor: "white",
                  boxShadow: "white",
                  height: 15,
                  marginTop: -3,
                  opacity: 1,
                },
                {
                  borderColor: "white",
                  boxShadow: "white",
                  height: 15,
                  marginTop: -3,
                  opacity: 1,
                },
              ]}
              trackStyle={[{ backgroundColor: "gray", height: 10 }]}
              railStyle={{
                backgroundColor: "#0f0f0f",
                border: "solid 1px white",
                height: 10,
              }}
            />
          </ListGroup.Item>
        </ListGroup>
      </Offcanvas>
    </>
  );
}

export default ConfigPanel;
