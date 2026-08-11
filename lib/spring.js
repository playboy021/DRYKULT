// Mali rAF integrator umesto cele biblioteke.
// a = tension*(target - x) - friction*v, fiksni dt ≈ 1/60 (ne pravi dt —
// promenljiv dt na 144Hz ekranu ume da razbije integraciju i opruga "eksplodira").

const DT = 1 / 60;
const EPS = 0.001;

export const SPRINGS = {
  enter: { tension: 200, friction: 24 }, // ulasci sekcija
  hover: { tension: 320, friction: 18 }, // hover — brže i malo elastičnije
  panel: { tension: 180, friction: 26 }, // paneli, meni, modali
  follow: { tension: 300, friction: 22 }, // peškir prati kursor
};

export function createSpring(initial = 0, cfg = SPRINGS.enter) {
  let x = initial;
  let v = 0;
  let target = initial;

  return {
    get value() {
      return x;
    },
    get target() {
      return target;
    },
    get settled() {
      return Math.abs(target - x) < EPS && Math.abs(v) < EPS;
    },
    set(next) {
      target = next;
    },
    jump(next) {
      target = next;
      x = next;
      v = 0;
    },
    // Vrati true dok se kreće — pozivalac tako zna da li da traži sledeći frejm.
    step() {
      if (Math.abs(target - x) < EPS && Math.abs(v) < EPS) {
        x = target;
        v = 0;
        return false;
      }
      const a = cfg.tension * (target - x) - cfg.friction * v;
      v += a * DT;
      x += v * DT;
      return true;
    },
  };
}

// Opruga za par (x, y) — kursor, parallax, naginjanje.
export function createSpring2(ix = 0, iy = 0, cfg = SPRINGS.follow) {
  const sx = createSpring(ix, cfg);
  const sy = createSpring(iy, cfg);
  return {
    get x() {
      return sx.value;
    },
    get y() {
      return sy.value;
    },
    set(x, y) {
      sx.set(x);
      sy.set(y);
    },
    jump(x, y) {
      sx.jump(x);
      sy.jump(y);
    },
    step() {
      const a = sx.step();
      const b = sy.step();
      return a || b;
    },
  };
}
