import SceneCanvas from "../../components/SceneCanvas";
import BackgroundSlideshow from "../../components/BackgroundSlideshow";
import RouteTransitionOverlay from "../../components/RouteTransitionOverlay";
import BootOverlay from "../../components/BootOverlay";

export const metadata = {
  title: "CONCORD | Logo Showcase",
};

export default function SlidesLayout({ children }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden safe-inset touch-none">
      <BootOverlay />
      <BackgroundSlideshow />
      <SceneCanvas />
      <RouteTransitionOverlay />
      {children}
    </div>
  );
}


