import { Texture } from "three";

/**
 * -------------------------------------------------------------------------------
 * -------------------------------------------------------------------------------
 * Adapted from David Lindkvist's usetrailtexture CodeSandbox.
 * -> https://codesandbox.io/s/usetrailtexture-fj1qlg 🙏
 * More context -> https://twitter.com/ffdead/status/1594809171987275804
 * Almost copy and pasted without any changed except removing react related stuff.
 * -------------------------------------------------------------------------------
 * -------------------------------------------------------------------------------
 */

/**
 *  Adapted from https://github.com/brunoimbrizi/interactive-particles/blob/master/src/scripts/webgl/particles/TrailTexture.js
 *  Changes:
 *    * accepts config as constructor params
 *    * frame-rate independent aging
 *    * added option to interpolate between slow mouse events
 *    * added option for smoothing between values to avoid large jumps in force
 */
type Point = {
  x: number;
  y: number;
  age: number;
  force: number;
};

// smooth new sample (measurement) based on previous sample (current)
function smoothAverage(current, measurement, smoothing = 0.9) {
  return measurement * smoothing + current * (1.0 - smoothing);
}

// default ease
const easeCircleOut = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2));

const easeLinear = (x: number) => x;

class TrailTexture {
  trail: Point[];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: Texture;
  force: number;
  width: number;
  height: number;
  ratio: number;
  maxAge: number;
  radius: number;
  intensity: number;
  ease: (t: number) => number;
  minForce: number;
  interpolate: number;
  smoothing: number;
  blend: CanvasRenderingContext2D["globalCompositeOperation"];
  opacity = 1;
  debug = false;

  constructor({
    ratio = 10,
    width = 64,
    height = 64,
    maxAge = 750,
    radius = 0.05,
    intensity = 0.5,
    interpolate = 0,
    smoothing = 0,
    minForce = 0.3,
    blend = "screen", // source-over is canvas default. Others are slower
    ease = easeLinear,
  } = {}) {
    this.width = width;
    this.height = height;
    this.ratio = ratio;
    this.maxAge = maxAge;
    this.radius = radius;
    this.intensity = intensity;
    this.ease = ease;
    this.interpolate = interpolate;
    this.smoothing = smoothing;
    this.minForce = minForce;
    this.blend = blend;

    this.trail = [];
    this.force = 0;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.texture = new Texture(this.canvas);

    this.canvas.style.opacity = this.opacity;
    this.canvas.style.display = this.debug ? "block" : "none";
  }

  update(delta) {
    this.clear();

    // age points
    this.trail.forEach((point, i) => {
      point.age += delta * 1000;
      // remove old
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      }
    });

    // reset force when empty (when smoothing)
    if (!this.trail.length) this.force = 0;

    this.trail.forEach((point, i) => {
      this.drawTouch(point);
    });

    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point) {
    const last = this.trail[this.trail.length - 1];

    if (last) {
      const dx = last.x - point.x;
      const dy = last.y - point.y;
      const dd = dx * dx + dy * dy;

      const force = Math.max(this.minForce, Math.min(dd * 10000, 1));

      this.force = smoothAverage(force, this.force, this.smoothing);

      if (!!this.interpolate) {
        const lines = Math.ceil(
          dd / Math.pow((this.radius * 0.5) / this.interpolate, 2)
        );

        if (lines > 1) {
          for (let i = 1; i < lines; i++) {
            this.trail.push({
              x: last.x - (dx / lines) * i,
              y: last.y - (dy / lines) * i,
              age: 0,
              force,
            });
          }
        }
      }
    }
    this.trail.push({ x: point.x, y: point.y, age: 0, force: this.force });
  }

  drawTouch(point) {
    const pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };

    let intensity = 1;
    if (point.age < this.maxAge * 0.3) {
      intensity = this.ease(point.age / (this.maxAge * 0.3));
    } else {
      intensity = this.ease(
        1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7)
      );
    }

    intensity *= point.force;

    // apply blending
    this.ctx.globalCompositeOperation = this.blend;

    const radius = Math.max(this.width, this.height) * this.radius * intensity;
    const grd = this.ctx.createRadialGradient(
      pos.x,
      pos.y,
      Math.max(0, radius * 0.25),
      pos.x,
      pos.y,
      Math.max(0, radius)
    );
    grd.addColorStop(0, `rgba(255, 255, 255, ${this.intensity})`);
    grd.addColorStop(1, `rgba(0, 0, 0, 0.0)`);

    this.ctx.beginPath();
    this.ctx.fillStyle = grd;
    this.ctx.arc(pos.x, pos.y, Math.max(0, radius), 0, Math.PI * 2);
    this.ctx.fill();
  }

  onResize() {
    this.width = window.innerWidth / this.ratio;
    this.height = window.innerHeight / this.ratio;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.texture = new Texture(this.canvas);
  }
}

export { TrailTexture };
