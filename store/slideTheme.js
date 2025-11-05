"use client";

import { create } from "zustand";

export const useSlideTheme = create((set) => ({
  accentColor: "#00FFD1",
  grid: { sectionColor: "#00FFD1", cellColor: "#00ffd11a" },
  bloom: 0.35,
  camera: { position: [0, 0, 5], fov: 60 },
  layers: { reveal: 1, spacing: 0.05, mergeProgress: 0 },
  setTheme: (partial) => set((s) => ({ ...s, ...partial })),
  setLayers: (partial) =>
    set((s) => ({ layers: { ...s.layers, ...partial } })),
  setCamera: (partial) =>
    set((s) => ({ camera: { ...s.camera, ...partial } })),
}));


