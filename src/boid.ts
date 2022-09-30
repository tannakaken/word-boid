import { Vector3 } from "three"

/**
 * 鳥もどき。
 */
export type Boid = {
    position: Vector3;
    speed: Vector3;
}

/**
 * Boid同士が近づいていく力
 */
const COHESION_FORCE = 0.1;
/**
 * 近づきすぎたBoid同士が離れようとする力
 */
const SEPARATION_FORCE = 0.4;
/**
 * Boid同士が動く向きを合わせる力
 */
const ALIGNMENT_FORCE = 0.1;

/**
 * Boidが近づいていく力の働く距離
 */
const COHESION_DISTANCE = 4;
/**
 * 近づきすぎたBoidが離れようとする力の働く距離
 */
const SEPARATION_DISTANCE = 0.8;
/**
 * Boidが動く向きを合わせる力の働く距離
 */
const ALIGNMENT_DISTANCE = 1.2;

/**
 * Boidが近づいていく力の働く角度
 */
const COHESIION_ANGLE = Math.PI / 2;
/**
 * 近づきすぎたBoidが離れようとする力の働く角度
 */
const SEPARATION_ANGLE = Math.PI / 2;
/**
 * Boidが動く向きを合わせる力の働く角度
 */
const ALIGNMENT_ANGLE = Math.PI / 3;

/**
 * 最低速度（Boidが止まらぬように）
 */
const MIN_VEL = 0.3;
/**
 * 最高速度
 */
const MAX_VEL = 0.9;

/**
 * 中心から離れすぎないように働く求心力
 */
const BOUNDARY_FORCE = 0.001;
/**
 * これより離れたら求心力が働く
 */
const BOUNDARY_DISTANCE = 1;

/**
 * 餌に引き寄せる力
 */
const PREY_FORCE = 0.8;

/**
 * boid同士の距離を全て計算する
 */
const mapDistances = (boid: Boid, boids: Boid[]): number[] => 
    boids.map((other) => other.position.distanceTo(boid.position));

/**
 * boid同士の角度を全て計算する。
 */
const mapAngles = (boid: Boid, boids: Boid[]): number[] => 
    boids.map((other) => {
        // Three.jsのVector3の四則演算は自身をupdateしてしまうので注意
        const diff = other.position.clone().sub(boid.position);
        // @see https://ja.wikipedia.org/wiki/%E3%83%89%E3%83%83%E3%83%88%E7%A9%8D
        return Math.acos(boid.speed.dot(diff) / (boid.speed.length() * diff.length()));
    });


/**
 * boids algoritym
 * 
 * boidsアルゴリズムに従って、boidsたちの座標と速度を更新する。
 * 
 * この手続きは関数型スタイルではなく、状態を変化させるオブジェクト指向スタイルで書かれている。
 * その理由はreactの関数型スタイルに対して、three.jsはオブジェクト指向スタイルで作られていて、
 * react-three-fiberでも、refを使ったオブジェクト指向スタイルで状態を扱うことが推奨されるからだ（パフォーマンスの面でもそちらの方が良い）。
 * 
 * 『作って動かす ALife』を参考にした。
 * 
 * @see https://en.wikipedia.org/wiki/Boids
 * @see https://github.com/alifelab/alife_book_src/blob/master/chap04/boids_prey.py
 * 
 * @param boids Boidのリスト。このリストのオブジェクトの状態が更新される。
 * @param prey Boidを引き寄せる餌
 * @param delta 前回からの経過時間
 */
export const updateBoids = (boids: Boid[], prey: Vector3, delta: number) => {
    if (delta === 0) {
        // delta === 0だとupdateする必要なし。
        return;
    }
    // boidにかかっている力を全て計算してからupdateしないと、update前のboidとupdate後のboidが影響しあってしまう。
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
            // 自分自身は除く
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
            // boidが近づいていく力の集計
            if (distance < COHESION_DISTANCE && angle < COHESIION_ANGLE) {
                cohesionForce.add(other.position);
                cohesionNum++;
            }
            // 近づきすぎたboidが離れようとする力の集計
            if (distance < SEPARATION_DISTANCE && angle < SEPARATION_ANGLE) {
                // Three.jsのVector3の四則演算は自身をupdateしてしまうので注意
                separationForce.add(boid.position.clone().sub(other.position));
            }
            // Boidが動く向きを合わせる力の集計
            if (distance < ALIGNMENT_DISTANCE && angle < ALIGNMENT_ANGLE) {
                alignmentForce.add(boid.speed);
                alignmentNum++;
            }
        }
        // 0除散にならないようにチェック
        if (cohesionNum > 0) {
            // 近くのBoidの座標の平均を求めて、自分の位置との差に係数をかける
            cohesionForce.divideScalar(cohesionNum).sub(boid.position).multiplyScalar(COHESION_FORCE);
        }
        
        // 近くのBoidとの距離の差の合計に係数をかける
        separationForce.multiplyScalar(SEPARATION_FORCE);

        // 0除散にならないようにチェック
        if (alignmentNum > 0) {
            // 近くのBoidの速度の平均を求めて、自分の速度との差に係数をかける
            alignmentForce.divideScalar(alignmentNum).sub(boid.speed).multiplyScalar(ALIGNMENT_FORCE);
        }
 
        // 求心力の計算
        const distCenter = boid.position.length();
        // Three.jsのVector3の四則演算は自身をupdateしてしまうので注意
        const boundaryForce = distCenter > BOUNDARY_DISTANCE ? boid.position.clone().multiplyScalar(BOUNDARY_FORCE).multiplyScalar((distCenter - BOUNDARY_DISTANCE)/distCenter) : new Vector3(0, 0, 0);
        
        // 餌に引き寄せられる力の計算
        const distPrey = boid.position.distanceTo(prey);
        // Three.jsのVector3の四則演算は自身をupdateしてしまうので注意
        const preyForce = distPrey === 0 ? new Vector3(0, 0, 0) : prey.clone().sub(boid.position).multiplyScalar(PREY_FORCE).divideScalar(distPrey).divideScalar(distPrey);
        // 力の合計
        forces[i] = cohesionForce.add(separationForce).add(alignmentForce).add(boundaryForce).add(preyForce);
    }
    for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        const force = forces[i];
        // 速度の更新
        boid.speed.add(force.multiplyScalar(delta));
        const abs = boid.speed.length();
        // 最低速度と最高速度の間に収める調整
        if (abs !== 0 && abs < MIN_VEL) {
            // abs === 0だと0除算になる
            boid.speed.multiplyScalar(MIN_VEL).divideScalar(abs);
        } else if (abs > MAX_VEL) {
            boid.speed.multiplyScalar(MAX_VEL).divideScalar(abs);
        }
        // 座標の更新
        // Three.jsのVector3の四則演算は自身をupdateしてしまうので注意
        boid.position.add(boid.speed.clone().multiplyScalar(delta));
    }
}
