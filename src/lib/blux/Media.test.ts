import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Media from "./Media.svelte";

afterEach(() => cleanup());

describe("Media", () => {
  it("renders an <img loading=lazy> for kind image with alt defaulting empty", () => {
    const { container } = render(Media, {
      props: { media: { kind: "image", url: "https://cdn/x.jpg" } },
    });
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://cdn/x.jpg");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders an ambient <video> for kind video (muted, loop, playsinline, autoplay, metadata)", () => {
    const { container } = render(Media, {
      props: { media: { kind: "video", url: "https://cdn/x.mp4" } },
    });
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe("https://cdn/x.mp4");
    expect(video?.hasAttribute("autoplay")).toBe(true);
    expect(video?.hasAttribute("loop")).toBe(true);
    expect(video?.hasAttribute("playsinline")).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
    // muted is a property, not always reflected as an attribute
    expect((video as HTMLVideoElement).muted).toBe(true);
  });
});
