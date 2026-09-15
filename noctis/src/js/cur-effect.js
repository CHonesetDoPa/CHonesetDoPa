/**
 * cur-effect.js
 * Mouse cursor particle effects on click.
 */

// Config For Particle Effects
const CONFIG = {
  circleCount: 15, // Number of particles spawned per click
  maxBooms: 12, // Maximum number of simultaneous explosion effects
  maxDistance: 90, // Maximum particle spread radius (px), controls explosion range
  minSpeedRatio: 0.2, // Ratio of the slowest particle speed to the maximum speed
  minRadius: 1, // Minimum particle radius
  maxRadius: 3, // Maximum particle radius
  fadeDuration: 400, // Time for a particle to fully disappear (ms)
  baseFrameMs: 1000 / 60, // Baseline frame duration for speed, keeps the look consistent with the old version
};

// Color Palettes For Different Themes
const PALETTES = {
  light: [
    { r: 60, g: 60, b: 80 },
    { r: 90, g: 70, b: 120 },
    { r: 40, g: 90, b: 130 },
    { r: 120, g: 60, b: 90 },
  ],
  dark: [
    { r: 200, g: 200, b: 255 },
    { r: 255, g: 220, b: 200 },
    { r: 180, g: 230, b: 255 },
    { r: 255, g: 200, b: 230 },
  ],
  vampire: [
    { r: 255, g: 60, b: 60 },
    { r: 200, g: 20, b: 40 },
    { r: 255, g: 120, b: 120 },
    { r: 140, g: 0, b: 20 },
  ],
};

/**
 * @returns {Array<{r:number,g:number,b:number}>}
 */
function getPalette() {
  const body = document.body;
  if (body && body.classList.contains("vampire-mode")) return PALETTES.vampire;
  if (body && body.classList.contains("dark-mode")) return PALETTES.dark;
  return PALETTES.light;
}

class Circle {
  constructor({ origin, speed, color, angle, context, radius = 2 }) {
    this.position = { ...origin };
    this.color = color;
    this.speed = speed;
    this.angle = angle;
    this.context = context;
    this.radius = radius;
    this.alpha = 1;
  }

  /**
   * @param {Array<{r:number,g:number,b:number}>} palette
   */
  applyPalette(palette) {
    if (!palette || palette.length === 0) return;
    this.color = palette[Math.floor(Math.random() * palette.length)];
  }

  draw() {
    if (this.alpha <= 0) return;

    this.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.alpha})`;
    this.context.beginPath();
    this.context.arc(
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2,
    );
    this.context.fill();
  }

  /**
   * @param {number} dt
   */
  move(dt) {
    const step = dt / CONFIG.baseFrameMs;

    this.position.x += Math.cos(this.angle) * this.speed * step;
    this.position.y += Math.sin(this.angle) * this.speed * step;

    this.alpha -= dt / CONFIG.fadeDuration;
    if (this.alpha < 0) this.alpha = 0;
  }
}

class Boom {
  constructor({ origin, context, circleCount = 10, area }) {
    this.origin = origin;
    this.context = context;
    this.circleCount = circleCount;
    this.area = area;
    this.stop = false;
    this.circles = [];
  }

  randomRange(start, end) {
    return start + Math.random() * (end - start);
  }

  init() {
    const maxSpeed =
      CONFIG.maxDistance / (CONFIG.fadeDuration / CONFIG.baseFrameMs);
    const minSpeed = maxSpeed * CONFIG.minSpeedRatio;

    // Resolve the palette once per boom instead of once per particle.
    const palette = getPalette();

    for (let i = 0; i < this.circleCount; i++) {
      const circle = new Circle({
        context: this.context,
        origin: this.origin,
        color: palette[Math.floor(Math.random() * palette.length)],
        angle: this.randomRange(0, Math.PI * 2),
        speed: this.randomRange(minSpeed, maxSpeed),
        radius: this.randomRange(CONFIG.minRadius, CONFIG.maxRadius),
      });
      this.circles.push(circle);
    }
  }

  /**
   * Re-color every live particle so an in-flight boom follows theme changes.
   * @param {Array<{r:number,g:number,b:number}>} palette
   */
  applyPalette(palette) {
    this.circles.forEach((circle) => circle.applyPalette(palette));
  }

  /**
   * @param {number} dt
   */
  move(dt) {
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const circle = this.circles[i];
      circle.move(dt);

      const outOfBounds =
        circle.position.x < -circle.radius ||
        circle.position.x > this.area.width + circle.radius ||
        circle.position.y < -circle.radius ||
        circle.position.y > this.area.height + circle.radius;

      if (outOfBounds || circle.alpha <= 0) {
        this.circles.splice(i, 1);
      }
    }

    if (this.circles.length === 0) this.stop = true;
  }

  draw() {
    this.circles.forEach((circle) => circle.draw());
  }

  /**
   * Bounding box of every live particle, or null when nothing is visible.
   * @returns {{minX:number,minY:number,maxX:number,maxY:number}|null}
   */
  bounds() {
    if (this.circles.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const circle of this.circles) {
      const { x, y } = circle.position;
      const r = circle.radius;
      if (x - r < minX) minX = x - r;
      if (y - r < minY) minY = y - r;
      if (x + r > maxX) maxX = x + r;
      if (y + r > maxY) maxY = y + r;
    }

    return { minX, minY, maxX, maxY };
  }
}

class CursorSpecialEffects {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    this.globalWidth = window.innerWidth;
    this.globalHeight = window.innerHeight;
    this.dpr = 1;

    this.booms = [];
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.enabled = true;
    this.initialized = false;
    this.listenersAttached = false;

    // Dirty rectangle of the previous frame, used to avoid clearing the
    // whole canvas every frame.
    this.dirty = null;

    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundResize = this.handleResize.bind(this);
    this.boundPageHide = this.handlePageHide.bind(this);
    this.boundPageShow = this.handlePageShow.bind(this);
    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundThemeChanged = this.handleThemeChanged.bind(this);
    this.boundTick = this.tick.bind(this);
  }

  /**
   * @returns {boolean}
   */
  prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  handleMouseDown(e) {
    if (!this.enabled || !this.context) return;

    // Drop the oldest boom once the cap is reached (FIFO).
    while (this.booms.length >= CONFIG.maxBooms) {
      this.booms.shift();
    }

    const boom = new Boom({
      origin: { x: e.clientX, y: e.clientY },
      context: this.context,
      circleCount: CONFIG.circleCount,
      area: { width: this.globalWidth, height: this.globalHeight },
    });
    boom.init();
    this.booms.push(boom);

    if (!this.running) this.start();
  }

  handleResize() {
    this.globalWidth = window.innerWidth;
    this.globalHeight = window.innerHeight;
    this.resizeCanvas();

    this.booms.forEach((boom) => {
      boom.area.width = this.globalWidth;
      boom.area.height = this.globalHeight;
    });
  }

  handlePageHide() {
    this.stop();
    this.booms = [];
    this.clearDirty();
  }

  handlePageShow() {
    if (!this.initialized) return;
    this.resizeCanvas();
    this.attachListeners();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else if (this.booms.length > 0 && !this.running) {
      this.start();
    }
  }

  /**
   * Re-color every in-flight particle so the effect follows theme switches
   * instead of keeping the palette captured at click time.
   */
  handleThemeChanged() {
    const palette = getPalette();
    this.booms.forEach((boom) => boom.applyPalette(palette));
  }

  resizeCanvas() {
    if (!this.context) return;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.globalWidth * this.dpr);
    this.canvas.height = Math.floor(this.globalHeight * this.dpr);
    this.canvas.style.width = `${this.globalWidth}px`;
    this.canvas.style.height = `${this.globalHeight}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // The resize reset the backing store, so nothing is left to erase.
    this.dirty = null;
  }

  attachListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    window.addEventListener("mousedown", this.boundMouseDown);
    window.addEventListener("resize", this.boundResize);
    window.addEventListener("pagehide", this.boundPageHide);
    window.addEventListener("pageshow", this.boundPageShow);
    document.addEventListener("visibilitychange", this.boundVisibilityChange);
    window.addEventListener("themeChanged", this.boundThemeChanged);
  }

  detachListeners() {
    if (!this.listenersAttached) return;
    this.listenersAttached = false;

    window.removeEventListener("mousedown", this.boundMouseDown);
    window.removeEventListener("resize", this.boundResize);
    window.removeEventListener("pagehide", this.boundPageHide);
    window.removeEventListener("pageshow", this.boundPageShow);
    document.removeEventListener(
      "visibilitychange",
      this.boundVisibilityChange,
    );
    window.removeEventListener("themeChanged", this.boundThemeChanged);
  }

  init() {
    if (this.initialized) return;

    // Mark as initialized even when the effect stays disabled, otherwise a
    // later setEnabled(true) could never bring it back to life.
    this.initialized = true;

    if (this.prefersReducedMotion()) {
      this.enabled = false;
      return;
    }

    if (!this.context || !document.body) {
      this.initialized = false;
      return;
    }

    const style = this.canvas.style;
    style.position = "fixed";
    style.top = style.left = 0;
    style.zIndex = "9999999";
    style.pointerEvents = "none";

    this.resizeCanvas();
    document.body.append(this.canvas);

    this.attachListeners();
  }

  start() {
    if (this.running || !this.enabled) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Erase only the region painted by the previous frame.
   */
  clearDirty() {
    if (!this.context) return;

    if (this.dirty) {
      this.context.clearRect(
        this.dirty.x,
        this.dirty.y,
        this.dirty.width,
        this.dirty.height,
      );
      this.dirty = null;
    }
  }

  /**
   * @param {number} now
   */
  tick(now) {
    if (!this.running) return;

    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.clearDirty();

    if (this.booms.length === 0) {
      this.stop();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = this.booms.length - 1; i >= 0; i--) {
      const boom = this.booms[i];
      boom.move(dt);
      boom.draw();

      const bounds = boom.bounds();
      if (bounds) {
        if (bounds.minX < minX) minX = bounds.minX;
        if (bounds.minY < minY) minY = bounds.minY;
        if (bounds.maxX > maxX) maxX = bounds.maxX;
        if (bounds.maxY > maxY) maxY = bounds.maxY;
      }

      if (boom.stop) this.booms.splice(i, 1);
    }

    if (minX !== Infinity) {
      // Pad by one pixel so anti-aliased edges are fully erased next frame.
      this.dirty = {
        x: minX - 1,
        y: minY - 1,
        width: maxX - minX + 2,
        height: maxY - minY + 2,
      };
    }

    this.rafId = requestAnimationFrame(this.boundTick);
  }

  /**
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.stop();
      this.booms = [];
      this.clearDirty();
      return;
    }

    // Recover from a reduced-motion / failed init so the effect can be
    // re-enabled at runtime.
    if (!this.initialized) this.init();
  }

  destroy() {
    this.stop();
    this.detachListeners();
    this.booms = [];
    this.clearDirty();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.initialized = false;
    if (window.cursorEffects === this) {
      delete window.cursorEffects;
    }
  }
}

const cursorSpecialEffects = new CursorSpecialEffects();

function bootstrapCursorEffects() {
  if (document.body) {
    cursorSpecialEffects.init();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      cursorSpecialEffects.init();
    });
  }
}

bootstrapCursorEffects();

window.cursorEffects = cursorSpecialEffects;

export default cursorSpecialEffects;
