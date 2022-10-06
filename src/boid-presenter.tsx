import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Mesh } from "three";
import { Boid } from "./boid";

/**
 * テキストを表示させるBoid
 */
export type WordBoid = Boid & {
  /**
   * 表示させるテキスト
   */
  text: string;
};

type Props = {
  scale: number;
  boid: WordBoid;
  color: string;
};

const BoidPresenter = ({ scale, boid, color }: Props) => {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = boid.position.x;
      ref.current.position.y = boid.position.y;
      ref.current.position.z = boid.position.z;
    }
  });
  return (
    <Text
      font="./NotoSansJP-Regular.otf"
      anchorX={"center"}
      anchorY={"middle"}
      fontSize={1}
      strokeColor={color}
      strokeWidth={0.01}
      ref={ref}
      scale={[scale, scale, scale]}
      color={color}
    >
      {boid.text}
    </Text>
  );
};

export default BoidPresenter;
