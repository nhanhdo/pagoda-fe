import React from "react";
import { Composition, registerRoot, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { HomeLanding } from "./HomePage";
import "../../index.css";
import "./showcase.css";

const showcaseDate = new Date(2026, 10, 26, 7, 0);

function HomeShowcase() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <LanguageProvider>
      <HomeLanding
        now={showcaseDate}
        showcaseTime={frame / fps}
        logoSrc={staticFile("logochua.jpg")}
        sceneSrc={staticFile("temple-cinema.jpg")}
      />
    </LanguageProvider>
  );
}

registerRoot(() => (
  <Composition
    id="TanThanhHomeShowcase"
    component={HomeShowcase}
    durationInFrames={270}
    fps={30}
    width={1440}
    height={900}
  />
));
