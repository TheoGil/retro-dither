import {
  Scene,
  WebGLRenderer,
  Texture,
  OrthographicCamera,
  LinearFilter,
  Vector2,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  BloomEffect,
  BrightnessContrastEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  PixelationEffect,
  RenderPass,
  TiltShiftEffect,
  VignetteEffect,
} from "postprocessing";
import { Pane } from "tweakpane";

import { assets, AssetsManager } from "./assets";
import { Plane } from "./plane";
import { settings } from "./settings";
import { HardMixPatternBlendEffect } from "./hardMixPatternBlendEffect";
import { ColorizeEffect } from "./colorizeEffect";
import { CustomNoiseEffect } from "./customNoiseEfect";

class App {
  camera!: OrthographicCamera;
  renderer!: WebGLRenderer;
  controls!: OrbitControls;
  scene!: Scene;
  assetManager!: AssetsManager;
  composer!: EffectComposer;
  plane!: Plane;
  pane!: Pane;
  pixelisationEffect!: PixelationEffect;
  hardMixPatternBlendEffect!: HardMixPatternBlendEffect;
  brightnesContrastEffect!: BrightnessContrastEffect;

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
    this.initPostProcessing();

    this.plane = new Plane(this.assetManager.get("plane-texture") as Texture);
    this.scene.add(this.plane.mesh);
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
      console.log(asset);
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

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.initPixelisationEffect();
    this.initLevelsAdjustementsEffect();
    this.initHardMixPatternBlendEffect();
    this.initColorizeEffect();
    this.initBloomEffect();
    this.initNoiseEffect();
    this.initVignetteEffect();
    this.initChromaticAberrationEffect();

    const folder = this.pane.addFolder({
      title: "Pixelisation",
    });

    folder
      .addInput(settings, "granularity", {
        min: 1,
        max: 100,
        // Must be a multiple of 2 as pixelisation effect only works with multiples of 2
        // https://github.com/pmndrs/postprocessing/blob/main/src/effects/PixelationEffect.js#L68
        step: 2,
      })
      .on("change", ({ value }: { value: number }) => {
        this.pixelisationEffect.granularity = value;
        this.hardMixPatternBlendEffect.granularity = value;
      });
  }

  initPixelisationEffect() {
    this.pixelisationEffect = new PixelationEffect(settings.granularity);
    this.composer.addPass(new EffectPass(this.camera, this.pixelisationEffect));
  }

  initLevelsAdjustementsEffect() {
    const hueSaturationEffect = new HueSaturationEffect({
      saturation: -1,
    });
    this.composer.addPass(new EffectPass(this.camera, hueSaturationEffect));

    this.brightnesContrastEffect = new BrightnessContrastEffect({
      brightness: settings.brightness,
      contrast: settings.contrast,
    });
    this.composer.addPass(
      new EffectPass(this.camera, this.brightnesContrastEffect)
    );

    const levelsFolder = this.pane.addFolder({
      title: "Levels",
    });

    levelsFolder.addInput(this.brightnesContrastEffect, "brightness", {
      min: -1,
      max: 1,
    });

    levelsFolder.addInput(this.brightnesContrastEffect, "contrast", {
      min: -1,
      max: 1,
    });
  }

  initHardMixPatternBlendEffect() {
    this.hardMixPatternBlendEffect = new HardMixPatternBlendEffect(
      this.assetManager.get("pattern-texture") as Texture
    );
    this.composer.addPass(
      new EffectPass(this.camera, this.hardMixPatternBlendEffect)
    );
  }

  initColorizeEffect() {
    const colorizeEffect = new ColorizeEffect();
    this.composer.addPass(new EffectPass(this.camera, colorizeEffect));

    const folder = this.pane.addFolder({
      title: "Color",
    });

    folder
      .addInput(settings, "foregroundColor", {
        label: "foreground",
      })
      .on("change", ({ value }: { value: string }) => {
        colorizeEffect.foregroundColor = value;
      });

    folder
      .addInput(settings, "backgroundColor", {
        label: "background",
      })
      .on("change", ({ value }: { value: string }) => {
        colorizeEffect.backgroundColor = value;
      });
  }

  initBloomEffect() {
    const bloomEffect = new BloomEffect({
      luminanceThreshold: settings.bloom.threshold,
      luminanceSmoothing: settings.bloom.smoothing,
      intensity: settings.bloom.intensity,
    });

    this.composer.addPass(new EffectPass(this.camera, bloomEffect));

    const bloomFolder = this.pane.addFolder({
      title: "Bloom",
    });

    bloomFolder.addInput(bloomEffect.luminanceMaterial, "threshold", {
      min: 0,
      max: 1,
    });

    bloomFolder.addInput(bloomEffect.luminanceMaterial, "smoothing", {
      min: 0,
      max: 1,
    });

    bloomFolder.addInput(bloomEffect, "intensity", {
      min: 0,
      max: 5,
    });

    bloomEffect.blurPass.scale = settings.bloom.scale;
    bloomFolder.addInput(bloomEffect.blurPass, "scale", {
      min: 0,
      max: 5,
    });
  }

  initNoiseEffect() {
    const noiseEffect = new CustomNoiseEffect();
    this.composer.addPass(new EffectPass(this.camera, noiseEffect));

    const folder = this.pane.addFolder({
      title: "Noise",
    });

    folder
      .addInput(settings.noise, "threshold", {
        min: 0.9,
        max: 1,
        step: 0.001,
      })
      .on("change", ({ value }: { value: number }) => {
        noiseEffect.threshold = value;
      });

    folder
      .addInput(settings.noise, "opacity", {
        min: 0,
        max: 1,
      })
      .on("change", ({ value }: { value: number }) => {
        noiseEffect.opacity = value;
      });
  }

  initVignetteEffect() {
    const vignetteEffect = new VignetteEffect({
      offset: settings.vignette.offset,
      darkness: settings.vignette.darkness,
    });
    this.composer.addPass(new EffectPass(this.camera, vignetteEffect));

    const folder = this.pane.addFolder({
      title: "Vignette",
    });

    folder.addInput(vignetteEffect, "offset", {
      min: 0,
      max: 1,
    });

    folder.addInput(vignetteEffect, "darkness", {
      min: 0,
      max: 1,
    });
  }

  initChromaticAberrationEffect() {
    const chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: settings.chromaticAberration.offset,
      radialModulation: settings.chromaticAberration.radialModulation,
      modulationOffset: settings.chromaticAberration.modulationOffset,
    });
    this.composer.addPass(
      new EffectPass(this.camera, chromaticAberrationEffect)
    );

    const folder = this.pane.addFolder({
      title: "Chromatic aberration",
    });

    folder.addInput(chromaticAberrationEffect, "offset", {
      x: {
        min: -0.1,
        max: 0.1,
      },
      y: {
        min: -0.1,
        max: 0.1,
      },
    });

    folder.addInput(chromaticAberrationEffect, "radialModulation");

    folder.addInput(chromaticAberrationEffect, "modulationOffset", {
      min: 0,
      max: 1,
    });
  }

  animate() {
    this.composer?.render();
    requestAnimationFrame(this.animate);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer.setSize(w, h);

    this.camera.updateProjectionMatrix();

    this.plane.setScaleUniform();

    this.pixelisationEffect.setSize(w, h);
    this.hardMixPatternBlendEffect.setSize(w, h);
  }
}

export { App };
