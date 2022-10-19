import React, { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Boid } from "./boid";
import { Mesh } from "three";

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
  colorData: { color: string };
};

const BoidPresenter = ({ scale, boid, colorData }: Props) => {
  const ref = useRef<Mesh & { strokeColor: string; color: string }>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = boid.position.x;
      ref.current.position.y = boid.position.y;
      ref.current.position.z = boid.position.z;
      ref.current.strokeColor = colorData.color;
      ref.current.color = colorData.color;
    }
  });
  return (
    <Text
      font="./NotoSansJP-Regular.otf"
      anchorX={"center"}
      anchorY={"middle"}
      fontSize={1}
      strokeWidth={0.01}
      ref={ref}
      scale={[scale, scale, scale]}
    >
      {boid.text}
    </Text>
  );
};

export default BoidPresenter;
