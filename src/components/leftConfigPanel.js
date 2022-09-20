import React, { useEffect, useRef, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { List } from "react-bootstrap-icons";
import CloseButton from "react-bootstrap/CloseButton";

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

      <Offcanvas show={show} onHide={handleClose} id="configPanel">
        <CloseButton
          variant="white"
          style={{ marginLeft: "92%", marginTop: "1%" }}
          onClick={() => setShow(false)}
        />
      </Offcanvas>
    </>
  );
}

export default ConfigPanel;
