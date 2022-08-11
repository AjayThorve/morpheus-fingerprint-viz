import React, {useEffect} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrthographicCamera, MapControls, OrbitControls } from '@react-three/drei'
import { acceleratedRaycast } from 'three-mesh-bvh';
import {tableFromIPC} from 'apache-arrow';

THREE.Mesh.prototype.raycast = acceleratedRaycast;

async function requestData(type='getDF', params=null){
  let url = `/api/three/${type}?`;
  if(params!=null){
    url += `${params}`;
  }
  const result = await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}});
  const table = tableFromIPC(result);
  return table;
}

class HexGrid extends React.Component{ 
  constructor(props){
    super(props);
    this.myMesh = React.createRef();
    this.colorRef = React.createRef();
    this.state = {
      rows: props.rows,
      cols: props.cols,
      hexRadius: props.hexRadius,
      position: new Float32Array([]),
      colors: new Float32Array([
        1 * Math.random(), 0.0039 * Math.random(), 1 * Math.random(),
        1 * Math.random(), 1 * Math.random(), 1 * Math.random(),
        1 * Math.random(), 1 * Math.random(), 1 * Math.random(),
    ]),
      selectedInstance: null,
      event: 1,
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

  async resetData(){  
    if(this.state.repeatfn && this.state.event > 13){
      clearInterval(this.state.repeatfn);
    }
  
    if(this.myMesh.current){
      const data = await requestData('getDFElevation', `time=${this.state.event}`);
      const colors = await requestData('getDFColors', `time=${this.state.event}`);
      this.setState({
        position: data.batches[0].data.children[0].values,
        colors: colors.batches[0].data.children[0].values,
        event: this.state.event + 1
      });
      // this.myMesh.current.instanceColor = new THREE.InstancedBufferAttribute(this.state.colors, 3);
      // this.myMesh.current.setColorAt(0, new THREE.Color("orange"));
      // this.myMesh.current.instanceColor.needsUpdate = true;

      this.myMesh.current.instanceMatrix = new THREE.InstancedBufferAttribute(this.state.position, 16);

    }
  }

  async componentDidMount(){
    this.state.repeatfn = setInterval(() => this.resetData(), 1000);

    if(this.myMesh.current){
      this.myMesh.current.geometry.translate(200 - window.innerWidth/2,0.5,200 - window.innerHeight/2);
    }
  }

  render(){
    const arr = this.state.colors;
    return (
      <instancedMesh
        ref={this.myMesh}
        args={[null, null, 260]}
        onClick={(e) => console.log(e)}
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = e.instanceId;
          
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
    );
  }
}

function timeout(delay) {
  return new Promise( res => setTimeout(res, delay) );
}


export default class Box extends React.Component{ 
  constructor(props){
    super(props);
    this.state = {
      args:[0,0,0,0,0,0]
    };
  }
  async componentDidMount(){
    this.setState({
      args: [window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -5000, 5000]
    })
    await timeout(1000); //for 5 sec delay
  }
  render(){
    const camera = <OrthographicCamera makeDefault zoom={1}
    position={[0,200,200]}
    args={this.state.args}
  />
    return (
      <div className="App">
        <Canvas id="xyz">
        {camera}
          <ambientLight color={0x002288}/>
          <directionalLight position={[200,200,-1]} color={0xffffff}/>
          <HexGrid rows={10} cols={5} hexRadius={20} />
          {/* <OrbitControls></OrbitControls> */}
          {/* <MapControls 
            screenSpacePanning={true}
            minDistance={0}
            maxDistance={5000}
            maxPolarAngle={Math.PI/2}
          /> */}
        </Canvas>
      </div>
    );
  
  }
}