"use client";

import { Component, type ReactNode } from "react";
import { RendererError } from "@/components/overlays/GameOverlays";

export class RendererBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RendererError /> : this.props.children; }
}
