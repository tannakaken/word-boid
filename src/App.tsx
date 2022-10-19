import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { button, Leva, useControls } from "leva";
import "./App.css";
import Boids, { initialPoem } from "./boids";
import ReactModal from "react-modal";

ReactModal.setAppElement("#root");

export type Orientation = {
  alpha: number;
  beta: number;
  gamma: number;
};

function App() {
  const [poem, setPoem] = useState(initialPoem);
  const [edited, setEdited] = useState(initialPoem);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { color } = useControls({
    color: {
      value: "#000000",
      label: "文字色",
    },
    text: {
      ...button(() => setIsEditorOpen(true)),
      label: "詩の編集",
    },
    about: {
      ...button(() => setIsInfoOpen(true)),
      label: "このサイトについて",
    },
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOn, setVideoOn] = useState(false);
  const toggleCamera = useCallback(async () => {
    if (videoRef.current === null) {
      return;
    }
    if (videoOn) {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
    } else {
      videoRef.current.pause();
      const mediaStream = videoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  }, [videoOn]);
  const handleHorizontalOrientation = useCallback(
    (
      event: DeviceOrientationEvent,
      orbitControls: OrbitControlsImpl,
      orientation: Orientation
    ) => {
      if (event.alpha && event.gamma) {
        // 正確に一回転にならない
        const diffAlpha = ((event.alpha - orientation.alpha) / 90) * Math.PI;
        const diffGamma = ((event.gamma - orientation.gamma) / 90) * Math.PI;
        orbitControls.setAzimuthalAngle(
          orbitControls.getAzimuthalAngle() + diffAlpha + diffGamma
        );
        orientation.alpha = event.alpha;
        orientation.gamma = event.gamma;
      }
    },
    []
  );
  const orbitControlRef = useRef<OrbitControlsImpl>(null);
  const handleVerticalOrientation = useCallback(
    (
      event: DeviceOrientationEvent,
      orbitControls: OrbitControlsImpl,
      orientation: Orientation
    ) => {
      if (event.beta) {
        const newPolarAngle = (event.beta / 180) * Math.PI;
        orbitControls.setPolarAngle(newPolarAngle);

        orientation.beta = event.beta;
      }
    },
    []
  );
  const orientation = useMemo(() => ({ alpha: 0, beta: 0, gamma: 0 }), []);
  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (orbitControlRef.current === null) {
        return;
      }
      handleHorizontalOrientation(event, orbitControlRef.current, orientation);
      handleVerticalOrientation(event, orbitControlRef.current, orientation);
      orbitControlRef.current.update();
    },
    [handleHorizontalOrientation, handleVerticalOrientation, orientation]
  );

  useEffect(() => {
    toggleCamera();
  }, [toggleCamera]);
  return (
    <div className="App">
      <Suspense fallback={<p>loading...</p>}>
        <Canvas>
          <OrbitControls ref={orbitControlRef} />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Boids poem={poem} color={color} />
        </Canvas>
        <video className="video" ref={videoRef} playsInline />
        <button
          className="video-button"
          onClick={() => {
            // if (videoOn) {
            //   window.removeEventListener(
            //     "deviceorientation",
            //     handleOrientation
            //   );
            // } else {
            //   if (
            //     // @ts-ignore
            //     typeof DeviceOrientationEvent["requestPermission"] ===
            //     "function"
            //   ) {
            //     // @ts-ignore
            //     DeviceOrientationEvent["requestPermission"]()
            //       .then((permissionStatus: string) => {
            //         if (permissionStatus === "granted") {
            //           window.addEventListener(
            //             "deviceorientation",
            //             handleOrientation
            //           );
            //         }
            //       })
            //       .catch((error: any) => console.error(error));
            //   } else {
            //     window.addEventListener("deviceorientation", handleOrientation);
            //   }
            // }
            setVideoOn(!videoOn);
          }}
        >
          {videoOn ? "カメラ停止" : "カメラ起動"}
        </button>
        <Leva hidden={isInfoOpen || isEditorOpen} />
      </Suspense>
      <ReactModal
        isOpen={isEditorOpen}
        onRequestClose={() => setIsEditorOpen(false)}
        contentLabel="Editor Modal"
        style={{
          content: {
            borderRadius: "20px",
          },
        }}
      >
        <div className="info">
          <h2>詩の編集</h2>
          <textarea
            value={edited}
            onChange={(event) => {
              setEdited(event.target.value);
            }}
            cols={30}
            rows={20}
          />
          <br />
          <button
            className="btn"
            onClick={() => {
              setPoem(edited);
              setIsEditorOpen(false);
            }}
            style={{
              marginRight: "3px",
            }}
          >
            OK
          </button>
          <button
            className="btn"
            onClick={() => {
              setEdited(poem);
              setIsEditorOpen(false);
            }}
          >
            キャンセル
          </button>
        </div>
      </ReactModal>
      <ReactModal
        isOpen={isInfoOpen}
        onRequestClose={() => setIsInfoOpen(false)}
        contentLabel="Info Modal"
        style={{
          content: {
            borderRadius: "20px",
          },
        }}
      >
        <div className="info">
          <h2>言羽のボイド</h2>
          <p>ホメロスの時代から言葉は「翼を持つ」と喩えられてきました。</p>
          <p>そこで実際にBoidsというアルゴリズムで言葉を飛ばしてみました。</p>
          <p>
            <a
              href="https://en.wikipedia.org/wiki/Boids"
              target="_blank"
              rel="noopener noreferrer"
            >
              Boids
            </a>
            とは、鳥や魚の群れをシミュレーションするためのアルゴリズムです。
            <a
              href="https://www.youtube.com/watch?v=pbFEQv259yw"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stanley &amp; Stella in: Breaking The Ice (1987)
            </a>
            という初期のCGアニメーション映画で使われました。
          </p>
          <p>
            製作者:
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://tannakaken.xyz/"
            >
              淡中圏
            </a>
            （twitter:
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://twitter.com/tannakaken"
            >
              @tannakaken
            </a>
            ）
          </p>
          <p>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://tannakaken.xyz/novels/TreeMaker"
            >
              小説
            </a>
            なんかも書いてます。
          </p>
          <button className="btn" onClick={() => setIsInfoOpen(false)}>
            閉じる
          </button>
        </div>
      </ReactModal>
    </div>
  );
}

export default App;
