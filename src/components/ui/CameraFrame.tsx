import { ReactNode } from "react";

interface CameraFrameProps {
  children?: ReactNode;
  size?: number;
}

export default function CameraFrame({
  children,
  size = 240,
}: CameraFrameProps) {
  const outerSize = size + 40;
  return (
    <div
      className="relative"
      style={{ width: outerSize, height: outerSize }}
    >
      {/* Outer pulsing dashed ring (outside clip) */}
      <div
        className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-dashed border-gold/30"
      />

      {/* Corner viewfinder brackets (outside clip) */}
      <div className="camera-bracket camera-bracket--tl" />
      <div className="camera-bracket camera-bracket--tr" />
      <div className="camera-bracket camera-bracket--bl" />
      <div className="camera-bracket camera-bracket--br" />

      {/* Main circular clip */}
      <div
        className="absolute overflow-hidden rounded-full border-2 border-gold/60 bg-void"
        style={{ width: size, height: size, top: 20, left: 20 }}
      >
        {children}
      </div>
    </div>
  );
}
