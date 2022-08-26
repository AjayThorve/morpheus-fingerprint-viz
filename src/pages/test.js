import React, { useRef } from "react";
import ReactDOM from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats, Text } from "@react-three/drei";
// import "./styles.css";

let names = ['sgonzalez\n',
'ccameron\n',
'tanderson\n',
'jessicabrewer\n',
'abigailstanley\n',
'patricia32\n',
'stewartlucas\n',
'sandra54\n',
'cmorris\n',
'gonzalezjulia\n',
'fhenderson\n',
'robinsonricky\n',
'michaelpatton\n',
'veronicalopez\n',
'ann22\n',
'swilliams\n',
'julie57\n',
'aberg\n',
'richard26\n',
'robertsondonna\n']

// names = Array(10000/20).fill(names);

export default function App() {
    const ref = useRef(null);

    function handleClick(e){
        console.log(ref.current);
    }
    return (
        <div>
        <Canvas>
                <Text
                    ref={ref}
                    scale={[1, 1, 1]}
                    color="white" // default
                >
                    {names}
                </Text>
                <OrbitControls />
                <Stats />
        </Canvas>
        <button onClick={handleClick}>print</button>
        </div>
  );
};