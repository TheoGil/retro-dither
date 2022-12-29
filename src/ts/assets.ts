import { TextureLoader, Texture } from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

type Asset = Texture | GLTF;

export interface AssetDefinition {
  id: string;
  src: string;
  type: "texture" | "gltf" | "gltf-draco";
  onLoaded?: (asset: Texture | GLTF) => void;
}

const onLoadProgress = (xhr: { loaded: number; total: number }) => {
  console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
};

const onLoadError = (e: ErrorEvent) => {
  console.error(e);
};

class AssetsManager {
  #textureLoader: TextureLoader;
  #GLTFLoader: GLTFLoader;
  #dracoLoader?: DRACOLoader;
  #assets: Map<string, Asset>;
  #loadQueue: AssetDefinition[];

  constructor() {
    this.#textureLoader = new TextureLoader();
    this.#GLTFLoader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.4.1/"
    );
    this.#GLTFLoader.setDRACOLoader(dracoLoader);

    this.#assets = new Map();
    this.#loadQueue = [];
  }

  add(assetToLoad: AssetDefinition): void {
    this.#loadQueue.push(assetToLoad);
  }

  load(): Promise<void> {
    const promises: Array<Promise<void>> = [];

    return new Promise<void>((resolve) => {
      this.#loadQueue.forEach((asset) => {
        switch (asset.type) {
          case "texture":
            promises.push(this.loadTexture(asset));
            break;
          case "gltf":
            promises.push(this.loadGLTF(asset, false));
            break;
          case "gltf-draco":
            promises.push(this.loadGLTF(asset, true));
            break;
        }
      });

      Promise.allSettled(promises).then(() => {
        resolve();
      });
    });
  }

  loadTexture({ id, src, onLoaded }: AssetDefinition): Promise<void> {
    return new Promise<void>((resolve) => {
      this.#textureLoader.load(
        src,
        (texture) => {
          this.set(id, texture);
          onLoaded?.(texture);
          resolve();
        },
        onLoadProgress,
        onLoadError
      );
    });
  }

  loadGLTF(
    { id, src, onLoaded }: AssetDefinition,
    draco: boolean = false
  ): Promise<void> {
    if (draco && !this.#dracoLoader) {
      this.#dracoLoader = new DRACOLoader();
      this.#dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.4.1/"
      );
      this.#GLTFLoader.setDRACOLoader(this.#dracoLoader);
    }

    return new Promise<void>((resolve) => {
      this.#GLTFLoader.load(
        src,
        (gltf) => {
          this.set(id, gltf);
          onLoaded?.(gltf);
          resolve();
        },
        onLoadProgress,
        onLoadError
      );
    });
  }

  set(id: string, value: Asset): void {
    if (this.#assets.has(id)) {
      console.warn(`AssetsManager - Overwriting asset ${id}`);
    }

    this.#assets.set(id, value);
  }

  get(id: string): Asset | undefined {
    return this.#assets.get(id);
  }
}

const assets: AssetDefinition[] = [
  {
    src: "/public/pattern2.png",
    id: "pattern-texture",
    type: "texture",
  },
  {
    src: "/public/Everything_Everywhere059.jpg",
    id: "plane-texture",
    type: "texture",
  },
];

export { AssetsManager, assets };
