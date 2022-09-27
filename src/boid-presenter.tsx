import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Mesh } from "three";
import { Boid } from "./boid";

type Props = {
  scale: number;
  boid: Boid;
};

const BoidPresenter = ({ scale, boid }: Props) => {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = boid.position.x;
      ref.current.position.y = boid.position.y;
      ref.current.position.z = boid.position.z;
    }
  });
  return (
    <Sphere ref={ref} scale={[scale, scale, scale]}>
      <meshStandardMaterial color={"pink"} />
    </Sphere>
  );
};

export default BoidPresenter;
