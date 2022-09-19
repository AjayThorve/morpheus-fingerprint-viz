import React, { useEffect, useRef, useState } from "react";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import Ruler from "./ruler";

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
    }
  }, [allEvents]);

  return (
    <div id="sidePanel" className="detailsPanel" style={{ display: "inline" }}>
      <ListGroup>
        <label>
          <CloseButton variant="white" />
          <select
            name="events"
            id="eventsDropDown"
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
        <div className="customHeader">Anomalous Scale</div>
        <div id="colorBarAnomalousScale"></div>
        <div>
          <p className="colorBarAxis">0.0</p>{" "}
          <p className="colorBarAxis" style={{ marginLeft: "40%" }}>
            0.5
          </p>{" "}
          <p className="colorBarAxis" style={{ marginLeft: "35%" }}>
            1.0
          </p>
        </div>
        <div className="customHeader underline">Attributes</div>
        {["userPrincipalName", "time", "anomalyScore"].map((attr) => (
          <ListGroup.Item
            className="listOfAttributes"
            variant="dark"
            key={attr}
          >
            <span className="selectedEventTitle">
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
            className="listOfAttributes"
            variant="dark"
            key={attr}
          >
            <span className="selectedEventTitle">
              {attr}:{" "}
              <span className="selectedEvent">
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
    </div>
  );
}

export default SidePanel;
