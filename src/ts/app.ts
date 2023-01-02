import {
  Scene,
  WebGLRenderer,
  Texture,
  OrthographicCamera,
  LinearFilter,
  Vector2,
  Clock,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  BloomEffect,
  BrightnessContrastEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  NoiseEffect,
  PixelationEffect,
  RenderPass,
  VignetteEffect,
} from "postprocessing";
import { Pane } from "tweakpane";

import { assets, AssetsManager } from "./assets";
import { Plane } from "./plane";
import { settings } from "./settings";
import { PatternOverlayFX } from "./postprocessing/patternOverlayFX";
import { ColorizeFX } from "./postprocessing/colorizeFX";
import { CustomNoiseFX } from "./postprocessing/customNoiseFX";
import { TrailTexture } from "./mode/trailTexture";

class App {
  camera!: OrthographicCamera;
  renderer!: WebGLRenderer;
  controls!: OrbitControls;
  scene!: Scene;
  assetManager!: AssetsManager;
  composer!: EffectComposer;
  plane!: Plane;
  pane!: Pane;
  pixelisationFX!: PixelationEffect;
  patternOverlayFX!: PatternOverlayFX;
  trailTexture!: TrailTexture;
  clock!: Clock;

  constructor() {
    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  async init() {
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initAssetManager();
    await this.loadAssets();
    this.initDebug();
    this.initPostFX();
    this.clock = new Clock();

    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");

    switch (mode) {
      case "trail":
      default:
        this.initMouseTrailPlane();
        break;
    }
  }

  initRenderer() {
    this.renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    document.body.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000);

    this.camera.position.z = 5;

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initScene() {
    this.scene = new Scene();
  }

  initAssetManager() {
    this.assetManager = new AssetsManager();
  }

  async loadAssets() {
    assets.forEach((asset) => {
      this.assetManager.add(asset);
    });

    await this.assetManager.load();

    const patternTexture = this.assetManager.get("pattern-texture") as Texture;

    // Fix visible seam issue
    patternTexture.minFilter = LinearFilter;
    patternTexture.magFilter = LinearFilter;
  }

  initDebug() {
    this.pane = new Pane();
  }

  initPostFX() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.postFXFolder = this.pane.addFolder({
      title: "PostFX",
      expanded: false,
    });

    // Main "retro dither" effect consist only of the three following passes
    // pixelisation -> contrast / brightness -> pattern overlay
    this.initPixelisationFX();
    this.initBrightnessContrastFX();
    this.initPatternOverlayFX();

    // The following passes are not relevant to "retro dither" effect but add a nice polished touch
    this.initColorizeFX();
    this.initBloomFX();
    this.initNoiseFX();
    this.initVignetteFX();
    this.initChromaticAberrationFX();
  }

  initPixelisationFX() {
    this.pixelisationFX = new PixelationEffect(settings.granularity);
    this.composer.addPass(new EffectPass(this.camera, this.pixelisationFX));

    const folder = this.postFXFolder.addFolder({
      title: "Pixelisation",
      expanded: false,
    });

    folder.addInput(this.pixelisationFX, "granularity", {
      min: 2,
      max: 100,
      // Must be a multiple of 2 as pixelisation effect only works with multiples of 2
      // https://github.com/pmndrs/postprocessing/blob/main/src/effects/PixelationEffect.js#L68
      step: 2,
      label: "size",
    });
  }

  initBrightnessContrastFX() {
    this.composer.addPass(
      new EffectPass(
        this.camera,
        new HueSaturationEffect({
          saturation: -1,
        })
      )
    );

    const fx = new BrightnessContrastEffect({
      brightness: settings.brightness,
      contrast: settings.contrast,
    });

    this.composer.addPass(new EffectPass(this.camera, fx));

    const levelsFolder = this.postFXFolder.addFolder({
      title: "Brightness / Contrast",
      expanded: false,
    });

    levelsFolder.addInput(fx, "brightness", {
      min: -1,
      max: 1,
    });

    levelsFolder.addInput(fx, "contrast", {
      min: -1,
      max: 1,
    });
  }

  initPatternOverlayFX() {
    this.patternOverlayFX = new PatternOverlayFX(
      this.assetManager.get("pattern-texture") as Texture
    );

    const pass = new EffectPass(this.camera, this.patternOverlayFX);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Pattern Overlay",
      expanded: false,
    });

    folder.addInput(pass, "enabled");

    folder.addInput(
      this.patternOverlayFX.uniforms.get("uGranularity"),
      "value",
      {
        min: 2,
        max: 100,
        // Must be a multiple of 2 as pixelisation effect only works with multiples of 2
        // https://github.com/pmndrs/postprocessing/blob/main/src/effects/PixelationEffect.js#L68
        step: 2,
        label: "size",
      }
    );
  }

  initColorizeFX() {
    const fx = new ColorizeFX();

    const pass = new EffectPass(this.camera, fx);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Color",
      expanded: false,
    });

    folder.addInput(pass, "enabled");

    folder
      .addInput(settings, "foregroundColor", {
        label: "foreground",
      })
      .on("change", ({ value }: { value: string }) => {
        fx.foregroundColor = value;
      });

    folder
      .addInput(settings, "backgroundColor", {
        label: "background",
      })
      .on("change", ({ value }: { value: string }) => {
        fx.backgroundColor = value;
      });
  }

  initBloomFX() {
    const fx = new BloomEffect({
      luminanceThreshold: settings.bloom.threshold,
      luminanceSmoothing: settings.bloom.smoothing,
      intensity: settings.bloom.intensity,
    });

    const pass = new EffectPass(this.camera, fx);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Bloom",
      expanded: false,
    });

    folder.addInput(pass, "enabled");

    folder.addInput(fx.luminanceMaterial, "threshold", {
      min: 0,
      max: 1,
    });

    folder.addInput(fx.luminanceMaterial, "smoothing", {
      min: 0,
      max: 1,
    });

    folder.addInput(fx, "intensity", {
      min: 0,
      max: 5,
    });

    fx.blurPass.scale = settings.bloom.scale;
    folder.addInput(fx.blurPass, "scale", {
      min: 0,
      max: 5,
    });
  }

  initNoiseFX() {
    const fx = new CustomNoiseFX();

    const pass = new EffectPass(this.camera, fx);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Noise",
      expanded: false,
    });

    folder.addInput(pass, "enabled");

    folder
      .addInput(settings.noise, "threshold", {
        min: 0.9,
        max: 1,
        step: 0.001,
      })
      .on("change", ({ value }: { value: number }) => {
        fx.threshold = value;
      });

    folder
      .addInput(settings.noise, "opacity", {
        min: 0,
        max: 1,
      })
      .on("change", ({ value }: { value: number }) => {
        fx.opacity = value;
      });
  }

  initVignetteFX() {
    const fx = new VignetteEffect({
      offset: settings.vignette.offset,
      darkness: settings.vignette.darkness,
    });

    const pass = new EffectPass(this.camera, fx);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Vignette",
      expanded: false,
    });

    folder.addInput(pass, "enabled");

    folder.addInput(fx, "offset", {
      min: 0,
      max: 1,
    });

    folder.addInput(fx, "darkness", {
      min: 0,
      max: 1,
    });
  }

  initChromaticAberrationFX() {
    const fx = new ChromaticAberrationEffect({
      offset: settings.chromaticAberration.offset,
      radialModulation: settings.chromaticAberration.radialModulation,
      modulationOffset: settings.chromaticAberration.modulationOffset,
    });

    const pass = new EffectPass(this.camera, fx);

    this.composer.addPass(pass);

    const folder = this.postFXFolder.addFolder({
      title: "Chromatic aberration",
      expanded: false,
    });

    folder.addInput(fx, "offset", {
      x: {
        min: -0.1,
        max: 0.1,
      },
      y: {
        min: -0.1,
        max: 0.1,
      },
    });

    folder.addInput(fx, "radialModulation");

    folder.addInput(fx, "modulationOffset", {
      min: 0,
      max: 1,
    });
  }

  initMouseTrailPlane() {
    this.trailTexture = new TrailTexture({
      radius: settings.trailTexture.radius,
      maxAge: settings.trailTexture.maxAge,
      intensity: settings.trailTexture.intensity,
      interpolate: settings.trailTexture.interpolate,
      smoothing: settings.trailTexture.smoothing,
      minForce: settings.trailTexture.minForce,
    });

    this.plane = new Plane(this.trailTexture.texture);
    this.scene.add(this.plane.mesh);

    document.body.appendChild(this.trailTexture.canvas);
    this.trailTexture.canvas.style.position = "fixed";
    this.trailTexture.canvas.style.top = "0px";
    this.trailTexture.canvas.style.left = "0px";

    this.renderer.domElement.addEventListener("mousemove", (e) => {
      this.trailTexture.addTouch({
        x: e.clientX / this.renderer.domElement.width,
        y: 1 - e.clientY / this.renderer.domElement.height,
      });
    });

    const trailFolder = this.pane.addFolder({
      title: "Trail",
      expanded: false,
    });

    trailFolder.addInput(this.trailTexture, "maxAge", {
      min: 1,
      max: 2000,
      step: 1,
    });

    trailFolder.addInput(this.trailTexture, "radius", {
      min: 0,
      max: 0.2,
      step: 0.001,
    });

    trailFolder.addInput(this.trailTexture, "intensity", {
      min: 0,
      max: 1,
    });

    trailFolder.addInput(this.trailTexture, "interpolate", {
      min: 0,
      max: 1,
    });

    trailFolder.addInput(this.trailTexture, "smoothing", {
      min: 0,
      max: 1,
    });

    trailFolder.addInput(this.trailTexture, "minForce", {
      min: 0,
      max: 1,
    });
  }

  animate() {
    this.trailTexture?.update(this.clock.getDelta());
    this.composer?.render();
    requestAnimationFrame(this.animate);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.composer.setSize(w, h);

    this.camera.updateProjectionMatrix();

    this.plane.setScaleUniform();
  }
}

export { App };
