import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIGHT_TILE_LAYER,
  getCursorTone,
  getMarkerTone,
  getTrackLineStyle,
} from './mapTheme';

describe('map theme', () => {
  it('uses a light neutral tile layer configuration', () => {
    expect(DEFAULT_LIGHT_TILE_LAYER.url).toContain('{z}');
    expect(DEFAULT_LIGHT_TILE_LAYER.attribution.length).toBeGreaterThan(0);
  });

  it('returns a darker style for selected tracks', () => {
    const idle = getTrackLineStyle(false);
    const active = getTrackLineStyle(true);

    expect(active.weight).toBeGreaterThan(idle.weight);
    expect(active.color).not.toBe(idle.color);
    expect(active.dashArray).toBeUndefined();
  });

  it('keeps start and end markers in restrained grayscale tones', () => {
    expect(getMarkerTone('start')).toBe('start');
    expect(getMarkerTone('end')).toBe('end');
  });

  it('exposes a restrained cursor tone for replay mode', () => {
    expect(getCursorTone()).toEqual({
      dot: '#1f232b',
      plane: '#303845',
      label: '#202734',
    });
  });
});
