import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats, Text } from "@react-three/drei";
// import "./styles.css";

let names = [
  "sgonzalez\n",
  "ccameron\n",
  "tanderson\n",
  "jessicabrewer\n",
  "abigailstanley\n",
  "patricia32\n",
  "stewartlucas\n",
  "sandra54\n",
  "cmorris\n",
  "gonzalezjulia\n",
  "fhenderson\n",
  "robinsonricky\n",
  "michaelpatton\n",
  "veronicalopez\n",
  "ann22\n",
  "swilliams\n",
  "julie57\n",
  "aberg\n",
  "richard26\n",
  "robertsondonna\n",
];

let names1 = [
  "ajay\n",
  "ccameron\n",
  "tanderson\n",
  "jessicabrewer\n",
  "abigailstanley\n",
  "patricia32\n",
  "stewartlucas\n",
  "sandra54\n",
  "cmorris\n",
  "gonzalezjulia\n",
  "fhenderson\n",
  "robinsonricky\n",
  "michaelpatton\n",
  "veronicalopez\n",
  "ann22\n",
  "swilliams\n",
  "julie57\n",
  "aberg\n",
  "richard26\n",
  "robertsondonna\n",
];

// names = Array(10000/20).fill(names);

export default function App() {
  const ref = useRef(null);
  const mesh = useRef(null);
  const [name, setName] = useState(names);

  function handleClick(e) {
    console.log(mesh.current);
    setName(names1);
  }
  return (
    <div>
      <Canvas style={{ height: "800px" }}>
        <mesh ref={mesh}>
          <Text
            ref={ref}
            scale={[1, 1, 1]}
            position={[-4, 0, 0]}
            color="white" // default
          >
            {name}
          </Text>
          <OrbitControls />
          <Stats />
        </mesh>
      </Canvas>
      <button onClick={handleClick}>print</button>
    </div>
  );
}
