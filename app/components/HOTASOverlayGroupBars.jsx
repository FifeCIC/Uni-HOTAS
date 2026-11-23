/**
 * HOTASOverlayGroupBars — the connector drawn behind a group of related hotspot circles.
 *
 * WHY: a four-way POV hat is four independent hotspots (N/E/S/W), so on the overlay photo it
 * reads as four loose circles rather than one physical control. A connector bar joins them
 * visually without merging them, which keeps each direction individually clickable.
 *
 * Groups are DERIVED from the hotspot id (`pov-hat-<n>-<dir>`) rather than stored on the
 * record, so a layout saved by an older build still groups correctly.
 *
 * Used by HC05LiveInputContainer (HOTAS Live view) and HOTASOverlayPage (dev overlay editor).
 */

export const POV_GROUP_PATTERN = /^pov-hat-(\d+)-([nsew])$/i;

const BAR_COLOR = 'rgba(0, 217, 255, 0.30)';
const BAR_GLOW = '0 0 8px rgba(0, 217, 255, 0.25)';
const BAR_THICKNESS_RATIO = 0.22;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Centre of a circle, in percent units. `size` is a width percentage for both axes. */
function circleCentre(overlay) {
  const size = toNumber(overlay?.style?.size);
  return {
    x: toNumber(overlay?.style?.left) + size / 2,
    y: toNumber(overlay?.style?.top) + size / 2,
    size,
  };
}

export function findOverlayGroups(overlays = []) {
  const groups = new Map();

  for (const overlay of overlays) {
    const match = POV_GROUP_PATTERN.exec(overlay?.id || '');
    if (!match) continue;

    const key = `pov-hat-${match[1]}`;
    if (!groups.has(key)) {
      groups.set(key, { key, label: `POV Hat ${match[1]}`, members: {} });
    }
    groups.get(key).members[match[2].toLowerCase()] = overlay;
  }

  // A single member is not a group — nothing to connect.
  return [...groups.values()].filter((group) => Object.keys(group.members).length > 1);
}

/**
 * Horizontal and vertical bars spanning the circle centres, so the cross reads as one control.
 * Returned in percent units; the caller converts to px.
 */
export function buildGroupBars(group) {
  const { n, e, s, w } = group.members;
  const bars = [];

  const centres = Object.values(group.members).map(circleCentre);
  const thickness = Math.max(...centres.map((c) => c.size)) * BAR_THICKNESS_RATIO;

  if (w && e) {
    const start = circleCentre(w);
    const end = circleCentre(e);
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    bars.push({
      key: `${group.key}-h`,
      orientation: 'horizontal',
      left,
      top: (start.y + end.y) / 2 - thickness / 2,
      width: right - left,
      height: thickness,
    });
  }

  if (n && s) {
    const start = circleCentre(n);
    const end = circleCentre(s);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    bars.push({
      key: `${group.key}-v`,
      orientation: 'vertical',
      left: (start.x + end.x) / 2 - thickness / 2,
      top,
      width: thickness,
      height: bottom - top,
    });
  }

  return bars;
}

export default function HOTASOverlayGroupBars({ overlays, containerWidth, containerHeight }) {
  const bars = [];

  for (const group of findOverlayGroups(overlays)) {
    for (const bar of buildGroupBars(group)) {
      bars.push(bar);
    }
  }

  return bars.map((bar) => (
    <div
      key={bar.key}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: (bar.left / 100) * containerWidth,
        top: (bar.top / 100) * containerHeight,
        width: (bar.width / 100) * containerWidth,
        height: (bar.height / 100) * containerHeight,
        background: BAR_COLOR,
        boxShadow: BAR_GLOW,
        borderRadius: 999,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  ));
}
