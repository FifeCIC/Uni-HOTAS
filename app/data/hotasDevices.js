/**
 * HOTAS device catalogue for the Settings → HOTAS selector.
 *
 * ⚠️ This list is a MENU, not a capability claim. Only `supported: true` entries
 * have a device mapping in `libraries/hotas/devices/` — everything else exists so a
 * user can tell us which stick/throttle they own. Selecting an unsupported entry (or
 * "Can't find my HOTAS") routes them to a GitHub issue instead of implying support.
 *
 * To add a device: append an entry here. To add SUPPORT for one: it needs a mapping
 * module in `libraries/hotas/devices/` and registration in `deviceRegistry.js`.
 *
 * The list deliberately spans vendors and form factors (two Logitech, two Thrustmaster,
 * one VKB) so a first-time user recognises at least one entry as "mine".
 */

export const HOTAS_NOT_LISTED_VALUE = 'not-listed';

export const HOTAS_DEVICE_OPTIONS = [
  {
    value: 'logitech-x52',
    label: 'Logitech X52 HOTAS',
    supported: true,
    note: 'The supported baseline this build is built and tested against.',
  },
  {
    value: 'logitech-x56',
    label: 'Logitech X56 HOTAS',
    supported: false,
  },
  {
    value: 'thrustmaster-t16000m',
    label: 'Thrustmaster T.16000M FCS HOTAS',
    supported: false,
  },
  {
    value: 'thrustmaster-warthog',
    label: 'Thrustmaster HOTAS Warthog',
    supported: false,
  },
  {
    value: 'vkb-gladiator-nxt-evo',
    label: 'VKB Gladiator NXT EVO',
    supported: false,
  },
];

export const NEW_ISSUE_URL = 'https://github.com/FifeCIC/Uni-HOTAS/issues/new';

/**
 * Builds a prefilled "please support my HOTAS" issue URL.
 *
 * Concept: the report itself is the cheapest thing a user can give us, so the body
 * asks for exactly the details we cannot infer (device name, how it enumerates in the
 * browser) and nothing more. A blank issue form is friction; a half-filled one is not.
 */
export function buildHotasRequestUrl(deviceLabel) {
  const title = deviceLabel
    ? `HOTAS support request: ${deviceLabel}`
    : 'HOTAS support request';

  const body = [
    deviceLabel ? `**HOTAS model:** ${deviceLabel}` : '**HOTAS model:** ',
    '',
    'What I would like UNI-HOTAS to do with this device:',
    '',
    '',
    '---',
    'Device details (if you know them):',
    '- Manufacturer:',
    '- Model:',
    '- Connection: USB / Bluetooth / Virtual',
    '',
    '_Tip: with the device connected, open the HOTAS Settings → Test page in the app —',
    'the detected gamepad name it shows is exactly what we need._',
  ].join('\n');

  const params = [
    `title=${encodeURIComponent(title)}`,
    `body=${encodeURIComponent(body)}`,
  ].join('&');
  return `${NEW_ISSUE_URL}?${params}`;
}
