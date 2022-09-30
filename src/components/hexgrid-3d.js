import React, { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrthographicCamera, MapControls } from "@react-three/drei";
import { acceleratedRaycast } from "three-mesh-bvh";
import { Text } from "@react-three/drei";
import styles from "../styles/components/hexgrid.module.css";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

async function requestJSON(type = "getInstances", params = null) {
  let url = `/api/three/${type}?`;
  if (params != null) {
    url += `${params}`;
  }
  return await fetch(url, {
    method: "GET",
    headers: { "Access-Control-Allow-Origin": "*" },
  }).then((res) => res.json());
}

class HexGrid extends React.Component {
  constructor(props) {
    super(props);
    this.myMesh = React.createRef();
    this.globalMesh = React.createRef();
    this.colorRef = React.createRef();
    this.state = {
      rows: props.rows || 20,
      cols: props.cols || 13,
      hexRadius: props.hexRadius || 20,
      position: new Float32Array([]),
      colors: new Float32Array([]),
      selectedInstance: null,
      repeatfn: null,
    };
    this.highlightColor = new THREE.Color("#ff0000");
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.currentTime !== this.props.currentTime) {
      if (this.myMesh.current) {
        this.setState({
          position: this.props.position.batches[0].data.children[0].values,
          colors: this.props.colors.batches[0].data.children[0].values,
          userIDs: new TextDecoder().decode(
            this.props.userIDs.batches[0].data.children[0].values
          ),
        });
        console.log(this.props.selectedEvent);
        if (this.props.selectedEvent != -1) {
          const positionsTemp = new Float32Array(this.state.position);
          positionsTemp[this.props.selectedEvent * 16 + 0] = 0.7;
          positionsTemp[this.props.selectedEvent * 16 + 10] = 0.7;

          this.myMesh.current.instanceMatrix =
            new THREE.InstancedBufferAttribute(positionsTemp, 16);
        } else {
          this.myMesh.current.instanceMatrix =
            new THREE.InstancedBufferAttribute(this.state.position, 16);
        }
      }
    }
    if (prevProps.selectedEvent !== this.props.selectedEvent) {
      if (this.props.selectedEvent != -1) {
        const positionsTemp = new Float32Array(this.state.position);
        positionsTemp[this.props.selectedEvent * 16 + 0] = 0.7;
        positionsTemp[this.props.selectedEvent * 16 + 10] = 0.7;

        this.myMesh.current.instanceMatrix = new THREE.InstancedBufferAttribute(
          positionsTemp,
          16
        );
      } else {
        this.myMesh.current.instanceMatrix = new THREE.InstancedBufferAttribute(
          this.state.position,
          16
        );
      }
    }
  }

  async componentDidMount() {
    if (this.myMesh.current) {
      this.myMesh.current.geometry.translate(0, 0.5, 0);
      if (this.props.position) {
        this.setState({
          position: this.props.position.batches[0].data.children[0].values,
          colors: this.props.colors.batches[0].data.children[0].values,
          userIDs: new TextDecoder().decode(
            this.props.userIDs.batches[0].data.children[0].values
          ),
        });
        this.myMesh.current.instanceMatrix = new THREE.InstancedBufferAttribute(
          this.props.position.batches[0].data.children[0].values,
          16
        );
      }
    }
  }

  render() {
    return (
      <mesh
        ref={this.globalMesh}
        position={[200 - window.innerWidth / 2, 0, 80 - window.innerHeight / 2]}
      >
        <instancedMesh
          ref={this.myMesh}
          args={[null, null, this.state.rows * this.state.cols]}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
          }}
          onClick={async (e) => {
            e.stopPropagation();
            this.props.setLoadingIndicator(true);
            const id = e.instanceId;
            if (id !== this.props.selectedEvent) {
              this.props.setSelectedEvent(id);
              const result = await requestJSON(
                "getInstances",
                `time=${this.props.currentTime}&id=${id}&sort=${
                  this.props.sortBy != "none"
                }`
              );
              this.props.setEvents(result["result"]);
            } else {
              this.props.setSelectedEvent(-1);
            }
            this.props.setLoadingIndicator(false);
          }}
        >
          <cylinderGeometry
            attach="geometry"
            args={[this.state.hexRadius - 4, this.state.hexRadius - 4, 1, 6, 1]}
          >
            <instancedBufferAttribute
              ref={this.colorRef}
              attach="attributes-color"
              args={[this.state.colors, 3]}
            />
          </cylinderGeometry>
          <meshPhongMaterial vertexColors />
        </instancedMesh>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={20}
          maxWidth={140}
          anchorY={"right"}
          position-x={-100}
          position-z={-14}
          lineHeight={1.5}
        >
          {this.state.userIDs}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={20}
          maxWidth={1800}
          anchorY={"right"}
          position-x={812}
          position-z={-50}
          lineHeight={1.5}
        >
          {Array(48).fill("|      ").join("")}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={18}
          maxWidth={1800}
          anchorY={"right"}
          position-x={0}
          position-z={-75}
          lineHeight={1.5}
        >
          {"Now"}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={18}
          maxWidth={1800}
          anchorY={"right"}
          position-x={400}
          position-z={-75}
          lineHeight={1.5}
        >
          {new Date(+new Date() - 10000).toLocaleTimeString("en-US", {
            hour12: false,
          })}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={18}
          maxWidth={1800}
          anchorY={"right"}
          position-x={800}
          position-z={-75}
          lineHeight={1.5}
        >
          {new Date(+new Date() - 20000).toLocaleTimeString("en-US", {
            hour12: false,
          })}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={18}
          maxWidth={1800}
          anchorY={"right"}
          position-x={1200}
          position-z={-75}
          lineHeight={1.5}
        >
          {new Date(+new Date() - 30000).toLocaleTimeString("en-US", {
            hour12: false,
          })}
        </Text>
        <Text
          scale={[1, 1, 1]}
          rotation={[-1.57, 0, 0]}
          color="white" // default
          fontSize={18}
          maxWidth={1800}
          anchorY={"right"}
          position-x={1600}
          position-z={-75}
          lineHeight={1.5}
        >
          {new Date(+new Date() - 40000).toLocaleTimeString("en-US", {
            hour12: false,
          })}
        </Text>
      </mesh>
    );
  }
}

export default class HexGrid3d extends React.Component {
  constructor(props) {
    super(props);
    this.controlsRef = React.createRef(null);
    this.cameraRef = React.createRef(null);
    this.resetControls = this.resetControls.bind(this);
    this.state = {
      args: [0, 0, 0, 0, 0, 0],
      cameraPostion: [0, 500, 4],
    };
    this.hexRef = React.createRef(null);
  }
  resetControls() {
    this.controlsRef && this.controlsRef.current.reset();
    this.cameraRef && (this.cameraRef.current.zoom = 1);
    this.props.resetSelected();
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.threeDimensionPerspectiveLock !==
        this.props.threeDimensionPerspectiveLock &&
      this.props.threeDimensionPerspectiveLock == true
    ) {
      this.resetControls();
    }
  }

  async componentDidMount() {
    this.setState({
      args: [
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        -5000,
        5000,
      ],
    });
  }
  render() {
    return (
      <div id={styles.hexBox}>
        <Canvas
          id={styles.hexgridCanvas}
          linear={true}
          onDoubleClick={this.resetControls}
        >
          <color attach="background" args={["#000"]} />
          <ambientLight color={0xffffff} />
          <directionalLight position={[300, 200, 1]} color={0xffffff} />
          <directionalLight position={[300, 1, 1]} color={0xffffff} />
          <directionalLight position={[1, 200, 1]} color={0xffffff} />

          <HexGrid
            currentTime={this.props.currentTime}
            rows={this.props.rows}
            apiURL={this.props.apiURL}
            cols={this.props.cols}
            waitTime={this.props.waitTime}
            hexRadius={20}
            position={this.props.position}
            colors={this.props.colors}
            userIDs={this.props.userIDs}
            setEvents={this.props.setEvents}
            setSelectedEvent={this.props.setSelectedEvent}
            selectedEvent={this.props.selectedEvent}
            resetSelected={this.props.resetSelected}
            sortBy={this.props.sortBy}
            setLoadingIndicator={this.props.setLoadingIndicator}
          />
          <MapControls
            makeDefault
            screenSpacePanning={true}
            ref={this.controlsRef}
            minDistance={0}
            maxDistance={5000}
            maxPolarAngle={Math.PI / 2}
            minAzimuthAngle={
              this.props.threeDimensionPerspectiveLock ? 0 : Math.PI / 2
            }
            maxAzimuthAngle={0}
          />
          <OrthographicCamera
            makeDefault
            ref={this.cameraRef}
            zoom={1}
            position={this.state.cameraPostion}
            args={this.state.args}
          />
        </Canvas>
      </div>
    );
  }
}
