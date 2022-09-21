import React, { useEffect, useRef, useState } from "react";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";
import Ruler from "../ruler";
import Offcanvas from "react-bootstrap/Offcanvas";
import styles from "../../styles/components/sidePanels.module.css";

async function requestJSON(type = "getEventByIndex", params = null) {
  let url = `/api/three/${type}?`;
  if (params != null) {
    url += `${params}`;
  }
  return await fetch(url, {
    method: "GET",
    headers: { "Access-Control-Allow-Origin": "*" },
  }).then((res) => res.json());
}

function SidePanel({ allEvents }) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedEventData, setSelectedEventData] = useState({});
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);

  useEffect(() => {
    const fetchData = async () => {
      const result = await requestJSON(
        "getEventByIndex",
        `index=${selectedEvent}`
      );
      setSelectedEventData(result.result[0]);
    };
    fetchData().catch((e) => console.log(e));
  }, [selectedEvent]);

  useEffect(() => {
    if (allEvents.length > 0) {
      setSelectedEvent(allEvents[0].index);
      setShow(true);
    }
  }, [allEvents]);

  return (
    <div style={{ display: show ? "inline" : "none" }}>
      <Offcanvas
        id={styles.infoPanel}
        show={show}
        onHide={handleClose}
        placement={"end"}
      >
        <ListGroup>
          <label>
            <CloseButton variant="white" onClick={() => setShow(false)} />
            <select
              name="events"
              id={styles.eventsDropDown}
              onChange={(e) => {
                console.log("event", e.target.value);
                setSelectedEvent(e.target.value);
              }}
              value={selectedEvent}
            >
              {allEvents.map((event) => (
                <option key={event.index} value={event.index}>
                  {parseFloat(event.anomalyScore).toFixed(3)} @ time:
                  {event.time}, Event[{event["index"]}]
                </option>
              ))}
            </select>
          </label>
          <div className={styles.customHeader}>Anomalous Scale</div>
          <div id={styles.colorBarAnomalousScale}></div>
          <div>
            <p className={styles.colorBarAxis}>0.0</p>{" "}
            <p className={styles.colorBarAxis} style={{ marginLeft: "40%" }}>
              0.5
            </p>{" "}
            <p className={styles.colorBarAxis} style={{ marginLeft: "35%" }}>
              1.0
            </p>
          </div>
          <div className={`${styles.customHeader} ${styles.underline}`}>
            Attributes
          </div>
          {["userPrincipalName", "time", "anomalyScore"].map((attr) => (
            <ListGroup.Item
              className={styles.listOfAttributes}
              variant="dark"
              key={attr}
            >
              <span className={styles.selectedEventTitle}>
                {attr.charAt(0).toUpperCase() + attr.slice(1)}:{" "}
                <span
                  style={{
                    color: attr == "anomalyScore" ? "#b95422" : "#f2f2f2",
                  }}
                >
                  {attr == "anomalyScore"
                    ? parseFloat(selectedEventData[attr]).toFixed(3)
                    : selectedEventData[attr]}
                </span>
              </span>
            </ListGroup.Item>
          ))}
          <br></br>
          {[
            "appDisplayName",
            "appincrement",
            "clientAppUsed",
            "deviceDetailbrowser",
            "locationcity",
            "locationcountryOrRegion",
          ].map((attr) => (
            <ListGroup.Item
              className={styles.listOfAttributes}
              variant="dark"
              key={attr}
            >
              <span className={styles.selectedEventTitle}>
                {attr}:{" "}
                <span className={styles.selectedEvent}>
                  {attr == "anomalyScore"
                    ? parseFloat(selectedEventData[attr]).toFixed(3)
                    : selectedEventData[attr]}
                </span>
                <Ruler
                  mean={selectedEventData[attr + "_score_mean"]}
                  score={selectedEventData[attr + "_score"]}
                />
              </span>
              <br></br>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Offcanvas>
    </div>
  );
}

export default SidePanel;
