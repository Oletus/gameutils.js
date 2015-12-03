/*
 * Copyright Olli Etuaho 2015.
 */

'use strict';

describe('HitBox', function() {
    describe('circle', function() {
        it('tests intersection with a segment', function() {
            var hb1 = new HitBox();
            hb1.setCircle(new Vec2(0, 0), 10);
            var hb2 = new HitBox();
            hb2.setSegment(new Vec2(0, -19), 10, 3.5, 6.1);
            expect(hb2.intersects(hb1)).toBe(false);
            expect(hb1.intersects(hb2)).toBe(false);
        });
    });
});