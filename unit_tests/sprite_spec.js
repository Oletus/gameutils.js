
import { Sprite } from "../src/gjs/sprite.js";

Sprite.gfxPath = '../examples/assets/gfx/';

async function until(predicate, interval = 500, timeout = 30 * 1000) {
  const start = Date.now();

  let done = false;

  do {
    if (predicate()) {
      done = true;
    } else if (Date.now() > (start + timeout)) {
      throw new Error(`Timed out waiting for predicate to return true after ${timeout}ms.`);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  } while (done !== true);
}

describe('Sprite', function() {
    it('maintains a counter of loaded objects', async function() {
        let s = new Sprite('carrot.png');
        expect(Sprite.loadedFraction()).toBeLessThan(1);
        await until(() => s.loaded);
        expect(Sprite.loadedFraction()).toBe(1);
    });
    it('can be used before it is loaded', function() {
        var s = new Sprite('carrot.png');
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        s.draw(ctx, 0, 0);
        s.drawRotated(ctx, 0, 0, 0);
        s.drawRotatedNonUniform(ctx, 0, 0, 0, 0, 0);
        expect(s.loaded).toBe(false);
    });
});