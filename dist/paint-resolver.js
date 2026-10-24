import { paintColors } from './paint-data.js';

// Only exact, sourced records or explicit RGB values can produce a preview.
// No computed NCS/RAL approximation or fuzzy code substitution is performed.
export function rgbChannels(hex) {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}

export function paintFromRgb(red, green, blue) {
  const channels = [red, green, blue].map(value => String(value).trim());
  if (!channels.every(value => /^\d{1,3}$/.test(value) && Number(value) <= 255)) return null;
  const values = channels.map(Number);
  return {
    code: 'RGB (' + values.join(', ') + ')', name: 'Eigen RGB-kleur',
    hex: '#' + values.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase(), source: null
  };
}

export function resolvePaint(input, mode = 'auto') {
  const raw = String(input || '').trim();
  const compact = raw.toUpperCase().replace(/[\s\-]+/g, '');
  if (mode === 'rgb') {
    const match = raw.match(/^(?:rgb\s*\()?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)?$/i);
    return match ? paintFromRgb(match[1], match[2], match[3]) : null;
  }
  const hex = mode === 'ral' ? null : raw.match(mode === 'hex' ? /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i : /^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (hex) {
    const value = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
    return { code: '#' + value.toUpperCase(), name: 'Eigen schermkleur', hex: '#' + value.toUpperCase(), source: null };
  }
  if (mode === 'hex') return null;
  const code = compact.match(/^(?:RAL)?(\d{4})$/);
  const normalizedName = raw.toLocaleLowerCase('nl').replace(/\s+/g, ' ');
  return paintColors.find(paint =>
    (code && paint.code === 'RAL ' + code[1]) ||
    paint.name.toLocaleLowerCase('nl') === normalizedName ||
    (paint.code + ' · ' + paint.name).toLocaleLowerCase('nl') === normalizedName
  ) || null;
}
