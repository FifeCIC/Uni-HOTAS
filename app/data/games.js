/**
 * Game registry — the single list of titles Uni-HOTAS knows anything about.
 *
 * WHY THIS EXISTS: the app began as a Star Citizen companion, so its profile paths,
 * action map and labels were spread through the UI and the server. Every one of those
 * is game-specific. A record here keeps them in one place, so switching game changes
 * *data* instead of code.
 *
 * `support` is deliberately three-valued:
 *   - 'built-in' → a profile adapter exists and is wired up today (read + write)
 *   - 'planned'  → an adapter is on the roadmap; folder access works, parsing does not
 *   - 'generic'  → the catch-all for a game with no adapter yet
 *
 * ⚠️ This list is NOT a whitelist. It is the opposite: the profile engine is
 * game-agnostic, and a new title becomes supportable by adding an adapter. The games
 * page says so in the UI, because a list of supported games reads like a limitation.
 */

export const DEFAULT_GAME_ID = 'star-citizen';

export const SUPPORT_LABELS = {
  'built-in': 'Built-in support',
  planned: 'Adapter planned',
  generic: 'Generic profile support',
};

export const SUPPORT_COLORS = {
  'built-in': 'green',
  planned: 'orange',
  generic: 'gray',
};

export const GAMES = [
  {
    id: 'star-citizen',
    name: 'Star Citizen',
    publisher: 'Cloud Imperium Games',
    support: 'built-in',
    adapterId: 'star-citizen',
    profileFormatLabel: 'actionmaps.xml (device-aware read/write)',
    profileFileName: 'actionmaps.xml',
    profileFolderHint: '…\\StarCitizen\\<LIVE|PTU|EPTU>\\user\\client\\0\\controls\\mappings',
    profileFolderPlaceholder: 'C:\\Program Files\\Roberts Space Industries\\StarCitizen\\LIVE\\user\\client\\0\\controls\\mappings',
    autoDetect: true,
    processNames: ['StarCitizen.exe'],
    website: {
      label: 'Roberts Space Industries',
      url: 'https://robertsspaceindustries.com/en/star-citizen?referral=STAR-TBYK-XVFK',
    },
    summary:
      'Full built-in support: read your actionmaps.xml, browse every binding, rebind any input and write it straight back.',
    highlights: [
      'Device-aware rebinds that do not clobber a HOTAS binding with a keyboard one',
      'Mode profiles for multi-position switches such as the X52 rotaries',
      'Live input capture with duplicate-binding detection before the game sees it',
    ],
  },
  {
    id: 'squadron-42',
    name: 'Squadron 42',
    publisher: 'Cloud Imperium Games',
    support: 'built-in',
    adapterId: 'star-citizen',
    profileFormatLabel: 'Same Star Citizen input system',
    profileFileName: 'actionmaps.xml',
    profileFolderHint: 'Uses the Star Citizen input system and the same actionmaps.xml profile format.',
    profileFolderPlaceholder: 'C:\\Program Files\\Roberts Space Industries\\StarCitizen\\LIVE\\user\\client\\0\\controls\\mappings',
    autoDetect: false,
    processNames: ['Squadron42.exe'],
    website: {
      label: 'Roberts Space Industries',
      url: 'https://robertsspaceindustries.com/en/squadron-42?referral=STAR-TBYK-XVFK',
    },
    summary:
      'Shares the Star Citizen input system, so the Star Citizen adapter manages its bindings too.',
    highlights: [
      'Same action map, same profile format — no separate adapter needed',
      'Prepared for launch: bindings can be planned before the game ships',
    ],
  },
  {
    id: 'elite-dangerous',
    name: 'Elite Dangerous',
    publisher: 'Frontier Developments',
    support: 'planned',
    adapterId: null,
    profileFormatLabel: 'Expected: .binds (XML)',
    profileFileName: '.binds',
    profileFolderHint: '…\\Frontier Developments\\Elite Dangerous\\Options\\Bindings',
    profileFolderPlaceholder: '%LOCALAPPDATA%\\Frontier Developments\\Elite Dangerous\\Options\\Bindings',
    autoDetect: false,
    processNames: ['EliteDangerous64.exe'],
    website: { label: 'Elite Dangerous', url: 'https://www.elitedangerous.com/' },
    summary:
      'A .binds adapter is planned. The folder can already be pointed at, so the profile files are visible today.',
    highlights: ['Per-game folder path is remembered separately from Star Citizen'],
  },
  {
    id: 'dcs-world',
    name: 'DCS World',
    publisher: 'Eagle Dynamics',
    support: 'planned',
    adapterId: null,
    profileFormatLabel: 'Expected: per-module .diff.lua',
    profileFileName: '.diff.lua',
    profileFolderHint: '…\\Saved Games\\DCS\\Config\\Input\\<module>',
    profileFolderPlaceholder: '%USERPROFILE%\\Saved Games\\DCS\\Config\\Input',
    autoDetect: false,
    processNames: ['DCS.exe'],
    website: { label: 'DCS World', url: 'https://www.digitalcombatsimulator.com/' },
    summary:
      'DCS keeps bindings per module, which needs a module-aware adapter rather than a single file.',
    highlights: ['Per-aircraft binding sets are the main design question for this adapter'],
  },
  {
    id: 'microsoft-flight-simulator',
    name: 'Microsoft Flight Simulator',
    publisher: 'Microsoft / Asobo Studio',
    support: 'planned',
    adapterId: null,
    profileFormatLabel: 'Adapter planned',
    profileFileName: null,
    profileFolderHint: 'Controller profiles are managed by the sim; an import adapter is planned.',
    profileFolderPlaceholder: '',
    autoDetect: false,
    processNames: ['FlightSimulator.exe'],
    website: { label: 'Microsoft Flight Simulator', url: 'https://www.flightsimulator.com/' },
    summary: 'Controller profiles are cloud-backed, so importing them needs a different approach to a local file.',
    highlights: ['Export/import workflow under investigation'],
  },
  {
    id: 'x-plane',
    name: 'X-Plane',
    publisher: 'Laminar Research',
    support: 'planned',
    adapterId: null,
    profileFormatLabel: 'Adapter planned',
    profileFileName: null,
    profileFolderHint: 'Joystick settings live in the X-Plane preferences folder.',
    profileFolderPlaceholder: '',
    autoDetect: false,
    processNames: ['X-Plane.exe'],
    website: { label: 'X-Plane', url: 'https://www.x-plane.com/' },
    summary: 'Preference-based joystick settings; an adapter is planned.',
    highlights: [],
  },
  {
    id: 'il-2-sturmovik',
    name: 'IL-2 Sturmovik',
    publisher: '1C Game Studios',
    support: 'planned',
    adapterId: null,
    profileFormatLabel: 'Adapter planned',
    profileFileName: null,
    profileFolderHint: 'Input settings live in the game data folder.',
    profileFolderPlaceholder: '',
    autoDetect: false,
    processNames: ['Il-2.exe'],
    website: { label: 'IL-2 Sturmovik', url: 'https://il2sturmovik.com/' },
    summary: 'An adapter is planned once the input file format is mapped.',
    highlights: [],
  },
  {
    id: 'generic',
    name: 'Any other game',
    publisher: 'Your sim',
    support: 'generic',
    adapterId: null,
    profileFormatLabel: 'Any readable binding file',
    profileFileName: null,
    profileFolderHint: 'Point Uni-HOTAS at the folder holding the game’s controls or bindings file.',
    profileFolderPlaceholder: '',
    autoDetect: false,
    processNames: [],
    website: null,
    summary:
      'If a game writes its bindings to a readable profile, it can gain support through an adapter. This app is not limited to the titles on this page.',
    highlights: [
      'Open an issue with the game name and a sample binding file to get an adapter started',
    ],
  },
];

export function getGameById(gameId) {
  return GAMES.find((game) => game.id === gameId) || getGameById(DEFAULT_GAME_ID);
}

export function getGamesForSelector() {
  return GAMES.filter((game) => game.id !== 'generic');
}

export function hasProfileAdapter(game) {
  return Boolean(game && game.support === 'built-in' && game.adapterId);
}
