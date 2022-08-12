import React, { useRef } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';

import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

extend({ MapControls })

function Controls(props) {
  const controls = useRef()
  const { camera, gl } = useThree()
  useFrame(() => {
    controls.current.update()
  })
  return (
    <mapControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping={false}
      dampingFactor={0}
      minDistance={0}
      maxDistance={1500}
      maxPolarAngle={Math.PI / 2}
      {...props}
    />
  )
}

export default Controls;