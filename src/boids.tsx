import React, { useCallback, useMemo, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import "./App.css";
import { Boid, updateBoids } from "./boid";
import BoidPresenter from "./boid-presenter";

const randomNum = (num: number) => {
  return Math.random() * num * 2 - num;
};

const CHANGE_PREY_TIME = 10;
const PREY_RANGE = 5;
const BOID_NUM = 50;

const makeBoids = () => {
  const boids: Boid[] = [];
  for (let i = 0; i < BOID_NUM; i++) {
    boids.push({
      position: new Vector3(randomNum(3), randomNum(3), randomNum(3)),
      speed: new Vector3(randomNum(1), randomNum(1), randomNum(1)),
    });
  }
  return boids;
};

type Props = {
  debug?: boolean;
};

const Boids = ({ debug = false }: Props) => {
  const ref = useRef<Mesh>(null);
  const boids = useMemo(makeBoids, []);
  const prey = useMemo(() => new Vector3(0, 0, 0), []);
  const counter = useMemo(() => ({ count: 0 }), []);
  const updatePrey = useCallback(() => {
    prey.x = randomNum(PREY_RANGE);
    prey.y = randomNum(PREY_RANGE);
    prey.z = randomNum(PREY_RANGE);
    if (ref.current) {
      ref.current.position.x = prey.x;
      ref.current.position.y = prey.y;
      ref.current.position.z = prey.z;
    }
  }, [prey]);
  useFrame((_, delta) => {
    let newCount = counter.count + delta;
    let updated = false;
    for (const boid of boids) {
      if (boid.position.distanceToSquared(prey) < 0.01) {
        updatePrey();
        updated = true;
        newCount = 0;
      }
    }
    if (!updated && newCount > CHANGE_PREY_TIME) {
      updatePrey();
    }
    while (newCount > CHANGE_PREY_TIME) {
      newCount -= CHANGE_PREY_TIME;
    }
    counter.count = newCount;
    updateBoids(boids, prey, delta);
  });
  return (
    <>
      {boids.map((boid, index) => (
        <BoidPresenter scale={0.1} boid={boid} key={`boid-${index}`} />
      ))}
      {debug && (
        <Sphere ref={ref} scale={0.1}>
          <meshStandardMaterial color={"green"} />
        </Sphere>
      )}
    </>
  );
};

export default Boids;
