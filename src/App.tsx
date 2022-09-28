import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import "./App.css";

import Boids from "./boids";

function App() {
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

  useEffect(() => {
    toggleCamera();
  }, [toggleCamera]);
  return (
    <div className="App">
      <Suspense fallback={<p>loading...</p>}>
        <Canvas>
          <OrbitControls />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Boids />
        </Canvas>
        <video className="video" ref={videoRef} playsInline />
        <button className="video-button" onClick={() => setVideoOn(!videoOn)}>
          {videoOn ? "カメラ停止" : "カメラ起動"}
        </button>
      </Suspense>
    </div>
  );
}

export default App;
