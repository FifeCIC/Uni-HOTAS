import { useMemo, useState, useEffect, useRef } from 'react';
import { Badge, Button, Group, Select, SegmentedControl, Switch, Text } from '@mantine/core';
import { X52_BUTTONS, X52_AXES, X52_MODES, X52_POV_DIRECTIONS } from '../libraries/hotas';

// Features that are typically stick-axis-only (yaw/pitch/roll).
// These clutter the assignment menu for buttons and HATs.
const STICK_AXIS_FEATURE_IDS = new Set([
  'flight_pitch_up',
  'flight_pitch_down',
  'flight_pitch_axis',
  'flight_yaw_left',
  'flight_yaw_right',
  'flight_yaw_axis',
  'flight_roll_left',
  'flight_roll_right',
  'flight_lock_pitch_yaw',
]);

// Features that make sense on a continuous axis (throttle, stick, rotary, slider).
// Everything else is a toggle/button action and shouldn't appear for axis inputs.
const AXIS_COMPATIBLE_FEATURE_IDS = new Set([
  // Primary flight axes
  'flight_pitch_axis',
  'flight_pitch_up',
  'flight_pitch_down',
  'flight_yaw_axis',
  'flight_yaw_left',
  'flight_yaw_right',
  'flight_roll_left',
  'flight_roll_right',
  // Throttle
  'flight_throttle_up',
  'flight_throttle_down',
  // Strafe (can be axis-bound)
  'flight_strafe_up',
  'flight_strafe_down',
  'flight_strafe_left',
  'flight_strafe_right',
  // Speed/accel limiters (rotary-friendly)
  'flight_speed_limiter_step_up',
  'flight_speed_limiter_step_down',
  'flight_accel_limiter_step_up',
  'flight_accel_limiter_step_down',
  // View axes (look around)
  'view_look_lr_axis',
  'view_look_ud_axis',
]);

const MODE_INDEX_TO_KEY = {
  0: 'green',
  1: 'orange',
  2: 'red',
};

/** Display label for the Type column — shared by sorting and rendering so they cannot drift. */
function getTypeLabel(row) {
  if (row.type === 'Button') {
    return `Button ${X52_BUTTONS[row.index]?.windowsIndex ?? row.index + 1}`;
  }
  return row.type;
}

function buildInputList(modes) {
  const inputs = [];
  const modeList = modes.includes('all')
    ? Object.entries(X52_MODES)
    : modes.map((m) => [m, X52_MODES[m]]).filter(([, v]) => v);

  for (const [modeIdx, mode] of modeList) {
    for (const [idx, meta] of Object.entries(X52_BUTTONS)) {
      const baseIndex = Number(idx);
      const xmlToken = `js1_button${meta.windowsIndex ?? baseIndex + 1}`;

      inputs.push({
        id: `m${modeIdx}-btn-${idx}-short`,
        mode, modeIdx: Number(modeIdx),
        type: 'Button', index: Number(idx),
        name: `${meta.name} (Short)`, group: meta.group,
        pressType: 'short',
        xmlToken,
      });

      inputs.push({
        id: `m${modeIdx}-btn-${idx}-long`,
        mode, modeIdx: Number(modeIdx),
        type: 'Button', index: Number(idx),
        name: `${meta.name} (Long)`, group: meta.group,
        pressType: 'long',
        xmlToken,
      });
    }
    for (const [idx, meta] of Object.entries(X52_AXES)) {
      if (meta.type === 'hat') continue;
      inputs.push({
        id: `m${modeIdx}-axis-${idx}`,
        mode, modeIdx: Number(modeIdx),
        type: 'Axis', index: Number(idx),
        name: meta.name, group: meta.group,
        xmlToken: `js1_axis${idx}`,
      });
    }
    for (const dir of X52_POV_DIRECTIONS) {
      inputs.push({
        id: `m${modeIdx}-pov-${dir.dir}`,
        mode, modeIdx: Number(modeIdx),
        type: 'POV', index: dir.dir,
        name: `POV ${dir.label}`, group: 'POV HAT',
        xmlToken: `js1_pov_${dir.dir}`,
      });
    }
  }
  return inputs;
}

function inferBindingPressIntent(binding) {
  const text = `${binding?.feature || ''} ${binding?.description || ''}`.toLowerCase();
  const hasLong = /(long\s*press|hold|maximum\s+zoom|set\s+to\s+max\s*\(hold\)|set\s+to\s+min\s*\(hold\))/.test(text);
  const hasShort = /(short\s*press|tap|toggle|press\)|press\b)/.test(text);

  if (hasLong && hasShort) return 'both';
  if (hasLong) return 'long';
  if (hasShort) return 'short';
  return 'neutral';
}

function bindingMatchesPressType(binding, pressType) {
  if (!pressType) return true;

  const intent = inferBindingPressIntent(binding);
  if (pressType === 'long') return intent === 'long' || intent === 'both';
  if (pressType === 'short') return intent === 'short' || intent === 'both' || intent === 'neutral';
  return true;
}

function extractPovDirection(hotasVal) {
  const value = String(hotasVal || '').toLowerCase();
  if (!value) return null;

  const xmlMatch = value.match(/\bjs\d+_pov_([nsew])\b/);
  if (xmlMatch?.[1]) return xmlMatch[1];

  const shortPovMatch = value.match(/\bpov[_\s-]?([nsew])\b/);
  if (shortPovMatch?.[1]) return shortPovMatch[1];

  if (/\b(hat|pov)[_\s-]?(up|north)\b/.test(value)) return 'n';
  if (/\b(hat|pov)[_\s-]?(down|south)\b/.test(value)) return 's';
  if (/\b(hat|pov)[_\s-]?(left|west)\b/.test(value)) return 'w';
  if (/\b(hat|pov)[_\s-]?(right|east)\b/.test(value)) return 'e';

  return null;
}

function findAssignedFeatures(input, bindings, hotasOverrides, { preferSingle = false } = {}) {
  if (!bindings?.length) return [];
  const token = input.xmlToken.toLowerCase();
  const buttonMeta = input.type === 'Button' ? X52_BUTTONS[input.index] : null;
  const buttonName = String(buttonMeta?.name || '').toLowerCase();
  const buttonNum = input.type === 'Button' ? (X52_BUTTONS[input.index]?.windowsIndex ?? input.index + 1) : null;
  const modeKey = MODE_INDEX_TO_KEY[input.modeIdx];
  // Separate explicit user assignments from XML-loaded fallbacks so that
  // an explicit assignment always takes priority over a stale XML binding.
  const overrideMatches = [];
  const xmlMatches = [];

  for (const binding of bindings) {
    if (input.type === 'Button' && !bindingMatchesPressType(binding, input.pressType)) continue;

    const modeValue = (!preferSingle && modeKey)
      ? String(binding.modeHotasBindings?.[modeKey] || '')
      : '';
    const greenFallbackValue = (!preferSingle && modeKey && modeKey !== 'green')
      ? String(binding.modeHotasBindings?.green || '')
      : '';

    // explicitOverride is undefined when the user hasn't touched this feature,
    // '' when the user explicitly cleared it, or a token string when assigned.
    const explicitOverride = hotasOverrides[binding.id];
    // If explicitly cleared, exclude from all matches.
    if (explicitOverride === '') continue;
    const singleValue = explicitOverride !== undefined
      ? String(explicitOverride)
      : String(binding.hotasBinding || '');
    const hotasVal = String(modeValue || greenFallbackValue || singleValue || '').toLowerCase();
    if (!hotasVal) continue;

    let matched = false;
    if (hotasVal === token) {
      matched = true;
    } else if (input.type === 'Button' && buttonNum !== null) {
      if (hotasVal === `button ${buttonNum}`) matched = true;
      else if (hotasVal.includes(`button ${buttonNum}`) && !hotasVal.includes(`button ${buttonNum}0`)) matched = true;
      else if (hotasVal.includes(`js1_button${buttonNum}`)) matched = true;
      // Some profiles/store views use X52 display labels instead of XML tokens.
      // Match those labels so existing assignments don't appear empty.
      else if (buttonName && hotasVal.includes(buttonName)) matched = true;
    } else if (input.type === 'Axis') {
      const axisName = (X52_AXES[input.index]?.name || '').toLowerCase();
      if (axisName && hotasVal.includes(axisName.split('(')[0].trim())) matched = true;
    } else if (input.type === 'POV') {
      const povDirection = extractPovDirection(hotasVal);
      if (povDirection === input.index) matched = true;
    }

    if (matched) {
      // Mode-driven bindings (modeHotasBindings) are always explicit user assignments.
      const isModeDriven = Boolean(modeValue || greenFallbackValue);
      const isOverrideDriven = isModeDriven || explicitOverride !== undefined;
      if (isOverrideDriven) {
        overrideMatches.push(binding);
      } else {
        xmlMatches.push(binding);
      }
    }
  }

  // Explicit user overrides take precedence over XML-loaded fallbacks.
  // If any feature has been explicitly assigned to this input, only show those —
  // this prevents stale XML bindings from shadowing new assignments.
  return overrideMatches.length > 0 ? overrideMatches : xmlMatches;
}

function readAxisValue(axisValues, axisIndex) {
  if (Array.isArray(axisValues)) return Number(axisValues[axisIndex]);
  if (axisValues && typeof axisValues === 'object') return Number(axisValues[axisIndex]);
  return NaN;
}

function isInputActive(input, activeInputs, axisValues, lastHotasInput) {
  if (!input) return false;

  if (input.type === 'Button') {
    const effectiveIndex = input.index;

    if (activeInputs?.has?.(`button-${effectiveIndex}`)) return true;
    if (Number.isInteger(lastHotasInput?.index) && lastHotasInput.index === effectiveIndex) return true;
    const displayIndex = X52_BUTTONS[effectiveIndex]?.windowsIndex ?? effectiveIndex + 1;
    if (Number.isInteger(lastHotasInput?.displayIndex) && lastHotasInput.displayIndex === displayIndex) return true;
    return false;
  }

  if (input.type === 'Axis') {
    const axisValue = readAxisValue(axisValues, input.index);
    if (Number.isFinite(axisValue) && Math.abs(axisValue) >= 0.12) return true;
    if (Number.isInteger(lastHotasInput?.index) && lastHotasInput.index === input.index) {
      const liveValue = Number(lastHotasInput?.value);
      return Number.isFinite(liveValue) && Math.abs(liveValue) >= 0.12;
    }
    return false;
  }

  if (input.type === 'POV' && typeof lastHotasInput?.index === 'string') {
    return lastHotasInput.index.includes(`hat-${input.index}`);
  }

  return false;
}

const MODE_COLORS = Object.fromEntries(
  Object.entries(X52_MODES).map(([modeIdx, mode]) => [modeIdx, mode.color])
);

const MODE_SEGMENTS = [
  { value: 'none', label: 'No Modes' },
  ...Object.entries(X52_MODES).map(([modeIdx, mode]) => ({
    value: String(modeIdx),
    label: `${mode.indicator} ${mode.name.replace(/ Mode$/, '')}`,
  })),
  { value: 'all', label: 'All Modes' },
];

const ROWS_PER_PAGE = 120;

export default function HOTASInputView({ bindings, allBindings = [], hotasOverrides, bindingFilter, deviceFilter, searchQuery, onAssign, onClear, activeInputs, axisValues, lastHotasInput, currentMode, disableAssignmentMenuFiltering = false, hideStickFeatures = true, showHideStickToggle = true, onHideStickFeaturesChange, focusInput = null, fillAvailableHeight = false }) {
  const [modeFilter, setModeFilter] = useState('none');
  const [modeOverride, setModeOverride] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [localHideStickFeatures, setLocalHideStickFeatures] = useState(hideStickFeatures);
  const prevModeRef = useRef(currentMode);
  const effectiveHideStickFeatures = onHideStickFeaturesChange ? hideStickFeatures : localHideStickFeatures;

  useEffect(() => {
    if (onHideStickFeaturesChange) return;
    setLocalHideStickFeatures(hideStickFeatures);
  }, [hideStickFeatures, onHideStickFeaturesChange]);

  // Auto-sync mode filter to device mode only when device mode changes
  useEffect(() => {
    // Only sync if currentMode actually changed on the device
    if (currentMode === prevModeRef.current) return;
    prevModeRef.current = currentMode;

    // Device mode changed physically — always update UI and clear override
    if (currentMode !== undefined && currentMode !== null) {
      const newMode = String(currentMode);
      setModeFilter(newMode);
      setModeOverride(false);  // Clear override on physical device change
    }
  }, [currentMode]); // Only depend on currentMode changes

  const visibleModes = useMemo(() => {
    if (modeFilter === 'none') return ['0'];
    if (modeFilter === 'all') return ['all'];
    return [modeFilter];
  }, [modeFilter]);

  const handleModeFilterChange = (newMode) => {
    setModeFilter(newMode);
    // Any manual click is an override (even to M1/M2/M3)
    setModeOverride(true);
  };

  const inputList = useMemo(() => buildInputList(visibleModes), [visibleModes]);
  const assignmentBindings = useMemo(() => (allBindings.length > 0 ? allBindings : bindings), [allBindings, bindings]);

  const rows = useMemo(() => {
    return inputList.map((input) => ({
      ...input,
      assignedBindings: findAssignedFeatures(input, assignmentBindings, hotasOverrides, {
        preferSingle: modeFilter === 'none',
      }),
      isActive: isInputActive(input, activeInputs, axisValues, lastHotasInput),
    })).map((row) => ({
      ...row,
      assignedBinding: row.assignedBindings[0] || null,
      hasConflict: row.assignedBindings.length > 1,
      conflictCount: Math.max(0, row.assignedBindings.length - 1),
    }));
  }, [inputList, assignmentBindings, hotasOverrides, activeInputs, axisValues, lastHotasInput, modeFilter]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Profile-based filtering (ignores game defaults)
    if (bindingFilter === 'hotas-assigned' || deviceFilter === 'hotas-assigned') {
      result = result.filter((r) => r.assignedBinding);
    } else if (bindingFilter === 'hotas-empty' || deviceFilter === 'hotas-empty') {
      result = result.filter((r) => !r.assignedBinding);
    } else if (bindingFilter === 'fully-unbound' || deviceFilter === 'fully-unbound') {
      result = result.filter((r) => !r.assignedBinding);
    }
    // kb-assigned and kb-empty don't apply to the HOTAS input view

    // Search
    if (searchQuery?.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.name.toLowerCase().includes(term) ||
        r.group.toLowerCase().includes(term) ||
        (r.assignedBinding?.feature || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [rows, bindingFilter, deviceFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [modeFilter, bindingFilter, deviceFilter, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sorting happens after filtering but before pagination, so the header applies to the
  // whole result set rather than the visible page.
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;

    const direction = sortDirection === 'asc' ? 1 : -1;
    const valueFor = (row) => {
      switch (sortColumn) {
        case 'mode': return row.mode?.indicator || '';
        case 'input': return row.name || '';
        case 'group': return row.group || '';
        case 'type': return getTypeLabel(row);
        case 'feature': return row.assignedBinding?.feature || '';
        case 'category': return row.assignedBinding?.category || '';
        default: return '';
      }
    };

    return [...filteredRows].sort((a, b) => {
      const aValue = valueFor(a);
      const bValue = valueFor(b);
      const aEmpty = aValue === '';
      const bEmpty = bValue === '';

      // Unassigned inputs stay at the bottom in both directions, so sorting by
      // Assigned Feature surfaces the bound rows instead of burying them.
      if (aEmpty || bEmpty) {
        if (aEmpty && bEmpty) return 0;
        return aEmpty ? 1 : -1;
      }

      return direction * String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Build feature options for the Select dropdown.
  const featureOptionsAll = useMemo(() => {
    if (!bindings?.length) return [];
    const seen = new Set();
    return bindings
      .filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      })
      .map((b) => ({
        value: b.id,
        label: `${b.feature}${b.category ? ` (${b.category})` : ''}`,
      }));
  }, [bindings]);

  const featureOptionsFiltered = useMemo(() => {
    if (!effectiveHideStickFeatures) return featureOptionsAll;
    return featureOptionsAll.filter((opt) => !STICK_AXIS_FEATURE_IDS.has(opt.value));
  }, [featureOptionsAll, effectiveHideStickFeatures]);

  const getFeatureOptionsForRow = (row) => {
    if (disableAssignmentMenuFiltering) {
      const assignedBinding = row.assignedBinding;
      if (!assignedBinding) return featureOptionsAll;
      if (featureOptionsAll.some((opt) => opt.value === assignedBinding.id)) return featureOptionsAll;
      return [
        {
          value: assignedBinding.id,
          label: `${assignedBinding.feature}${assignedBinding.category ? ` (${assignedBinding.category})` : ''} [Currently Assigned]`,
        },
        ...featureOptionsAll,
      ];
    }

    const baseOptions = row.type === 'Axis' ? featureOptionsAll : featureOptionsFiltered;

    const assignedBinding = row.assignedBinding;

    if (!assignedBinding) return baseOptions;
    if (baseOptions.some((opt) => opt.value === assignedBinding.id)) return baseOptions;

    return [
      {
        value: assignedBinding.id,
        label: `${assignedBinding.feature}${assignedBinding.category ? ` (${assignedBinding.category})` : ''} [Currently Assigned]`,
      },
      ...baseOptions,
    ];
  };

  function handleFeatureSelect(row, bindingId) {
    setEditingRowId(null);
    if (!bindingId) {
      if (row.assignedBinding && onClear) {
        onClear(row.assignedBinding.id, row.xmlToken, MODE_INDEX_TO_KEY[row.modeIdx] || null);
      }
      return;
    }

    if (!onAssign) return;
    onAssign(bindingId, row.xmlToken, MODE_INDEX_TO_KEY[row.modeIdx] || null);
  }

  const boundCount = filteredRows.filter((r) => r.assignedBinding).length;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = useMemo(() => {
    return sortedRows.slice(pageStart, pageStart + ROWS_PER_PAGE);
  }, [sortedRows, pageStart]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /**
   * focusInput — set when a hotspot on the HOTAS overlay is clicked.
   *
   * A physical input can own two rows (Short and Long press), so matching is by
   * type+index rather than by row id, and every match is highlighted. The page is
   * moved to the first match so a click does something visible even when the input
   * is not on the current page.
   */
  const focusInputRef = useRef(sortedRows);
  focusInputRef.current = sortedRows;
  const tableWrapRef = useRef(null);

  const isFocusedRow = (row) => Boolean(
    focusInput
    && row.type === focusInput.type
    && String(row.index) === String(focusInput.index)
  );

  const focusedDescriptorRow = focusInput ? sortedRows.find(isFocusedRow) : null;
  const focusedInputLabel = focusedDescriptorRow?.name || focusInput?.label || 'Selected input';

  useEffect(() => {
    if (!focusInput) return;
    const rowsNow = focusInputRef.current;
    const index = rowsNow.findIndex((row) => (
      row.type === focusInput.type && String(row.index) === String(focusInput.index)
    ));
    if (index >= 0) {
      setCurrentPage(Math.floor(index / ROWS_PER_PAGE) + 1);
    }

    // The matched row can be below the fold on a long page, so bring it into view
    // once React has painted the new page.
    const scrollTimer = setTimeout(() => {
      const rowEl = tableWrapRef.current?.querySelector('[data-focus-row="true"]');
      rowEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);

    // Only react to a new click: re-running on every sort/filter change would drag
    // the reader back to an old input while they are browsing.
    return () => clearTimeout(scrollTimer);
  }, [focusInput?.token, focusInput?.type, focusInput?.index]);

  return (
    <>
      <Group gap="md" mb="md" align="center">
        <Text size="sm" fw={600}>Modes:</Text>
        <SegmentedControl
          value={modeFilter}
          onChange={handleModeFilterChange}
          data={MODE_SEGMENTS}
          size="xs"
        />
        {!modeOverride && currentMode !== undefined && currentMode !== null && (
          <Text size="xs" c="cyan" fw={500}>
            (Following device)
          </Text>
        )}
        <Badge color="cyan" variant="light" size="sm">
          {boundCount}/{filteredRows.length} assigned
        </Badge>
        <Badge color="blue" variant="light" size="sm">
          Page {currentPage}/{totalPages}
        </Badge>
        {focusInput ? (
          <Badge color="cyan" variant="filled" size="sm" title="Selected from the HOTAS overlay">
            ◉ {focusedInputLabel}
          </Badge>
        ) : null}
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="xs"
            variant="light"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </Group>
        {showHideStickToggle && (
          <Switch
            label="Hide stick features"
            checked={effectiveHideStickFeatures}
            onChange={(e) => {
              if (onHideStickFeaturesChange) {
                onHideStickFeaturesChange(e.currentTarget.checked);
                return;
              }
              setLocalHideStickFeatures(e.currentTarget.checked);
            }}
            size="xs"
            title="Hide Yaw/Pitch/Roll from button and HAT assignment menus (they remain available for axis inputs)"
          />
        )}
      </Group>

      <div
        ref={tableWrapRef}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 217, 255, 0.15)',
          borderRadius: 8,
          overflowY: 'auto',
          overflowX: 'auto',
          ...(fillAvailableHeight ? { flex: 1, minHeight: 0 } : null),
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 217, 255, 0.08)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
              {modeFilter !== 'none' && (
                <SortableTh label="Mode" column="mode" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              )}
              <SortableTh label="Input" column="input" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTh label="Group" column="group" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTh label="Type" column="type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTh label="Assigned Feature" column="feature" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} style={{ textAlign: 'left' }} />
              <SortableTh label="Category" column="category" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={modeFilter !== 'none' ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#3a5060' }}>
                  No inputs match your filters
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const focused = isFocusedRow(row);
                return (
                <tr
                  key={row.id}
                  data-focus-row={focused ? 'true' : undefined}
                  aria-current={focused ? 'true' : undefined}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: focused
                      ? 'rgba(0, 217, 255, 0.18)'
                      : (row.assignedBinding ? 'rgba(34, 209, 123, 0.04)' : 'transparent'),
                    boxShadow: focused ? 'inset 3px 0 0 #00d9ff' : undefined,
                    transition: 'background 0.15s ease',
                  }}
                >
                  {modeFilter !== 'none' && (
                    <td style={tdStyle}>
                      <Badge size="xs" color={MODE_COLORS[row.modeIdx]} variant="filled">
                        {row.mode.indicator}
                      </Badge>
                    </td>
                  )}
                  <td style={{ ...tdStyle, color: row.isActive ? '#ff9500' : '#e0eaf4', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ ...tdStyle, color: '#6a8898' }}>{row.group}</td>
                  <td style={tdStyle}>
                    <Badge size="xs" variant="light" color={row.type === 'Button' ? 'cyan' : row.type === 'Axis' ? 'orange' : 'green'}>
                      {getTypeLabel(row)}
                    </Badge>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'left', minWidth: 260 }}>
                    {editingRowId === row.id ? (
                      <Select
                        data={getFeatureOptionsForRow(row)}
                        placeholder="Search features..."
                        searchable
                        clearable
                        size="xs"
                        autoFocus
                        value={row.assignedBinding?.id || null}
                        onChange={(val) => handleFeatureSelect(row, val)}
                        onBlur={() => setEditingRowId(null)}
                        styles={{ input: { background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(0,217,255,0.3)', color: '#e0eaf4' } }}
                        maxDropdownHeight={200}
                        limit={disableAssignmentMenuFiltering ? undefined : 120}
                      />
                    ) : (
                      <Group gap="xs" wrap="nowrap" align="center">
                        <div
                          onClick={() => setEditingRowId(row.id)}
                          style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'background 0.15s', flex: 1 }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,217,255,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {row.assignedBinding ? (
                            <Group gap="xs" wrap="nowrap" align="center">
                              <Text size="sm" fw={500} style={{ color: '#81c784' }}>
                                {row.assignedBinding.feature}
                              </Text>
                              {row.hasConflict && (
                                <Badge size="xs" color="orange" variant="light">
                                  Conflict (+{row.conflictCount})
                                </Badge>
                              )}
                            </Group>
                          ) : (
                            <Text size="sm" style={{ color: '#555', fontStyle: 'italic' }}>Click to assign Star Citizen feature...</Text>
                          )}
                        </div>
                        {row.assignedBinding && onClear && (
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            onClick={() => onClear(row.assignedBinding.id, row.xmlToken, MODE_INDEX_TO_KEY[row.modeIdx] || null)}
                          >
                            Clear
                          </Button>
                        )}
                      </Group>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#6a8898' }}>
                    {row.assignedBinding?.category || ''}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  color: '#6a8898',
  fontWeight: 700,
  letterSpacing: '0.07em',
  fontSize: '0.7rem',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
};

/**
 * Header cells stick to the top of the scrolling table body.
 *
 * `position: sticky` on a `th` only works while an ancestor is the scroll container,
 * which is why the table wrapper owns `overflow-y: auto`. The background must be opaque
 * or rows show through, and a box-shadow replaces the bottom border because a collapsed
 * border does not travel with a sticky cell.
 */
const thStickyStyle = {
  ...thStyle,
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: 'linear-gradient(rgba(0, 217, 255, 0.10), rgba(0, 217, 255, 0.10)), #071523',
  boxShadow: 'inset 0 -1px 0 rgba(0, 217, 255, 0.25)',
};

/**
 * SortableTh — a table header that is a real button, so it works by mouse and keyboard.
 * The arrow is decorative; `aria-sort` carries the state for assistive tech.
 */
function SortableTh({ label, column, sortColumn, sortDirection, onSort, style }) {
  const active = sortColumn === column;
  const indicator = active ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';

  return (
    <th
      style={{ ...thStyle, ...style }}
      aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 0,
          padding: 0,
          margin: 0,
          color: active ? '#9fe8ff' : 'inherit',
          font: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {label}
        <span aria-hidden="true" style={{ fontSize: '0.72rem', opacity: active ? 1 : 0.4 }}>
          {indicator}
        </span>
      </button>
    </th>
  );
}

const tdStyle = {
  padding: '8px 14px',
  whiteSpace: 'nowrap',
};
