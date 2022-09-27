import { Vector3 } from "three"

export type Boid = {
    position: Vector3;
    speed: Vector3;
}

const COHESION_FORCE = 0.08;
const SEPARATION_FORCE = 0.8;
const ALIGNMENT_FORCE = 0.06;

const COHESION_DISTANCE = 4;
const SEPARATION_DISTANCE = 0.8;
const ALIGNMENT_DISTANCE = 1.2;

const COHESIION_ANGLE = Math.PI / 2;
const SEPARATION_ANGLE = Math.PI / 2;
const ALIGNMENT_ANGLE = Math.PI / 3;

const MIN_VEL = 0.1;
const MAX_VEL = 0.6;

const BOUNDARY_FORCE = 0.001;
const BOUNDARY_DISTANCE = 1;

const PREY_FORCE = 0.8;

const mapDistances = (boid: Boid, boids: Boid[]): number[] => 
    boids.map((other) => other.position.distanceTo(boid.position));

const mapAngles = (boid: Boid, boids: Boid[]): number[] => 
    boids.map((other) => {
        const diff = other.position.clone().sub(boid.position);
        return Math.acos(boid.speed.dot(diff) / (boid.speed.length() * diff.length()));
    });

export const updateBoids = (boids: Boid[], prey: Vector3, delta: number) => {
    if (delta === 0) {
        return boids;
    }
    const forces = [] as Vector3[];
    for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        const distances = mapDistances(boid, boids);
        const angles = mapAngles(boid, boids);
        let cohesionNum = 0;
        let alignmentNum = 0;
        const cohesionForce = new Vector3(0, 0, 0);
        const separationForce = new Vector3(0, 0, 0);
        const alignmentForce = new Vector3(0, 0, 0);
        for (let j = 0; j < boids.length; j++) {
            const other = boids[j];
            if (i === j) {
                continue;
            }
            const distance = distances[j];
            if (distance === 0) {
                continue;
            }
            const angle = angles[j];
            if (isNaN(angle)) {
                continue;
            }
            if (distance < COHESION_DISTANCE && angle < COHESIION_ANGLE) {
                cohesionForce.add(other.position);
                cohesionNum++;
            }
            if (distance < SEPARATION_DISTANCE && angle < SEPARATION_ANGLE) {
                separationForce.add(boid.position.clone().sub(other.position));
            }
            if (distance < ALIGNMENT_DISTANCE && angle < ALIGNMENT_ANGLE) {
                alignmentForce.add(boid.speed);
                alignmentNum++;
            }
        }
        if (cohesionNum > 0) {
            cohesionForce.divideScalar(cohesionNum).sub(boid.position).multiplyScalar(COHESION_FORCE);
        }
        
        separationForce.multiplyScalar(SEPARATION_FORCE);
        if (alignmentNum > 0) {
            alignmentForce.divideScalar(alignmentNum).sub(boid.speed).multiplyScalar(ALIGNMENT_FORCE);
        }
        
        const distCenter = boid.position.length();
        const boundaryForce = distCenter > BOUNDARY_DISTANCE ? boid.position.clone().multiplyScalar(BOUNDARY_FORCE).multiplyScalar((distCenter - BOUNDARY_DISTANCE)/distCenter) : new Vector3(0, 0, 0);
        const distPrey = boid.position.distanceTo(prey);
        const preyForce = distPrey === 0 ? new Vector3(0, 0, 0) : prey.clone().sub(boid.position).multiplyScalar(PREY_FORCE).divideScalar(distPrey).divideScalar(distPrey);
        forces[i] = cohesionForce.add(separationForce).add(alignmentForce).add(boundaryForce).add(preyForce);
    }
    for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        const force = forces[i];
        boid.speed.add(force.multiplyScalar(delta));
        const abs = boid.speed.length();
        if (abs !== 0 && abs < MIN_VEL) {
            boid.speed.multiplyScalar(MIN_VEL).divideScalar(abs);
        } else if (abs !== 0 && abs > MAX_VEL) {
            boid.speed.multiplyScalar(MAX_VEL).divideScalar(abs);
        }
        boid.position.add(boid.speed.clone().multiplyScalar(delta));
    }
}
