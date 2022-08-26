import React, {useEffect} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrthographicCamera, MapControls, OrbitControls } from '@react-three/drei'
import { acceleratedRaycast } from 'three-mesh-bvh';
import { Stats, Text } from "@react-three/drei";

THREE.Mesh.prototype.raycast = acceleratedRaycast;


async function requestJSON(type='getInstanceData', params=null){
  let url = `/api/${type}?`;
  if(params!=null){
      url += `${params}`;
  }
  return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}


class HexGrid extends React.Component{
  constructor(props){
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
      repeatfn: null
    }
    this.set = function(e){
      console.log("clicked", e);
      this.setState({
        selectedInstance: e
      })
    }
    this.highlightColor = new THREE.Color('#ff0000')
  }

  async componentDidUpdate(prevProps, prevState){
    if(prevProps.currentTime !== this.props.currentTime){
      if(this.myMesh.current){
        this.setState({
          position: this.props.position,
          colors: this.props.colors,
          userIDs: this.props.userIDs
        });
        this.myMesh.current.instanceMatrix = new THREE.InstancedBufferAttribute(this.state.position, 16);
      }
    }
  }

  async componentDidMount(){
    if(this.myMesh.current){
      this.myMesh.current.geometry.translate(0, 0.5, 0);
    }
  }

  render(){
    const arr = this.state.colors;
    return (
      <mesh ref={this.globalMesh} position={[200-window.innerWidth/2,0,80-window.innerHeight/2]}>
          <instancedMesh
            ref={this.myMesh}
            args={[null, null, this.state.rows * this.state.cols]}
            onClick={async(e) => {
              e.stopPropagation();
              const id = e.instanceId;
              const result = await requestJSON('getInstanceData', `time=${this.state.event}&id=${id}`);
              console.log(result);
            }}
          >
        <cylinderGeometry  attach="geometry"
          args={[this.state.hexRadius - 4, this.state.hexRadius - 4, 1, 6, 1]}>
              <instancedBufferAttribute attach="attributes-color" args={[this.state.colors, 3]} />
            </cylinderGeometry>
        <meshPhongMaterial vertexColors/>
          <MapControls 
                  screenSpacePanning={true}
                  minDistance={0}
                  maxDistance={5000}
                  maxPolarAngle={Math.PI/2}
                />
        </instancedMesh>
        <Text
            scale={[1, 1, 1]}
            rotation={[-1.57,0,0]}
            color="white" // default
            fontSize={20}
            maxWidth={100}
            anchorY={"right"}
            position-x={-100}
            position-z={-14}
            lineHeight={1.5}
        >
            {this.state.userIDs}
        </Text>
        </mesh>
    );
  }
}

export default class Box extends React.Component{ 
  constructor(props){
    super(props);
    this.state = {
      args:[0,0,0,0,0,0]
    };
    this.hexRef = React.createRef(null);
  }
  async componentDidMount(){
    this.setState({
      args: [window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -5000, 5000]
    });
  }
  render(){
    const camera = <OrthographicCamera makeDefault zoom={1}
    position={[0,1,0]}
    args={this.state.args}
  />
    return (
      <div className="App">
        <Canvas id="xyz" linear={true}>
        {camera}
          <ambientLight color={0x002288}/>
          <directionalLight position={[200,200,-1]} color={0xffffff}/>
          <HexGrid
            currentTime={this.props.currentTime} rows={this.props.rows}
            apiURL={this.props.apiURL} cols={this.props.cols}
            waitTime={this.props.waitTime} hexRadius={20}
            position={this.props.position}
            colors={this.props.colors}
            userIDs={this.props.userIDs}
            />
            {/* <Stats/> */}
        </Canvas>
      </div>
    );
  }
}