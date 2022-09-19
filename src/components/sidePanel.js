import React, { useRef } from "react";
import CloseButton from "react-bootstrap/CloseButton";
import ListGroup from "react-bootstrap/ListGroup";

function SidePanel({ allEvents, selectedEvent }) {
  return (
    <div id="sidePanel" className="detailsPanel" style={{ display: "inline" }}>
      <ListGroup>
        <CloseButton variant="white" />
        <select name="events">
          {allEvents.map((event) => (
            <option key={event.index} value={event["index"]}>
              Time = {event.time}, Event[{event["index"]}]
            </option>
          ))}
        </select>
        {/* onClick={this.resetSelected} /> */}
        <div className="customHeader">Event Information</div>
        <ListGroup.Item
          className="listOfAttributes"
          variant="dark"
          key={"userID"}
        >
          <span className="selectedEventTitle">
            userID:{" "}
            <span className="selectedEvent">
              {selectedEvent["userID"]}
              {/* {IPAddressLookup[this.state.selectedEvent["userID"]]} */}
            </span>
          </span>
        </ListGroup.Item>
        <ListGroup.Item
          className="listOfAttributes"
          variant="dark"
          key={"time"}
        >
          <span className="selectedEventTitle">
            Time: <span className="selectedEvent">{selectedEvent["time"]}</span>
          </span>
        </ListGroup.Item>
      </ListGroup>
    </div>
  );
}

export default SidePanel;
