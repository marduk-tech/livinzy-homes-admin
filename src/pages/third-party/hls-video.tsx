import { Alert } from "antd";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

// Plays an HLS (.m3u8) stream: natively where supported (Safari), via hls.js elsewhere.
export function HlsVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setFailed(false);
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    if (!Hls.isSupported()) {
      setFailed(true);
      return;
    }
    const hls = new Hls();
    hls.on(Hls.Events.ERROR, (_, data) => data.fatal && setFailed(true));
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src]);

  return (
    <>
      {failed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message="Couldn't load this video in this browser"
          description="The video host may be blocking cross-origin requests. Try Safari, which plays HLS natively."
        />
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        onError={() => setFailed(true)}
        style={{ width: "100%", maxHeight: "70vh", background: "#000" }}
      />
    </>
  );
}
