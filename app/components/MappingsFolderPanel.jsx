/**
 * MappingsFolderPanel — first-run and recovery UI for the game's controls folder.
 *
 * WHY: the server used to hardcode `…\StarCitizen\LIVE\user\client\0\controls\mappings`.
 * Any other install path (custom drive, PTU, EPTU, HOTFIX) produced an empty profile
 * list with no explanation. This panel shows what was found, lets the user pick the
 * folder natively, and saves the choice to %APPDATA%\Uni-HOTAS\config.json.
 *
 * Used by HOTAS Config when profile loading fails.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';

const SOURCE_LABEL = {
  config: 'Chosen by you',
  env: 'Set by UNIHOTAS_MAPPINGS_PATH',
  detected: 'Detected automatically',
  'config-missing': 'Your saved folder is missing',
  none: 'Not found',
};

export default function MappingsFolderPanel({ onChanged }) {
  const [status, setStatus] = useState(null);
  const [manualPath, setManualPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/hotas/mappings-path');
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setManualPath(data.configured || data.path || '');
    } catch (error) {
      setMessage({ tone: 'red', text: `Could not read the mappings setting: ${error.message}` });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyResult = useCallback((data, fallbackText) => {
    setStatus(data);
    setManualPath(data.path || '');
    const count = typeof data.xmlCount === 'number' ? ` — ${data.xmlCount} profile file(s) found` : '';
    setMessage({ tone: 'green', text: `${fallbackText}${count}` });
    if (onChanged) onChanged();
  }, [onChanged]);

  const chooseFolder = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/hotas/pick-folder', { method: 'POST' });
      if (res.status === 204) {
        setMessage({ tone: 'gray', text: 'No folder chosen.' });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `status ${res.status}`);
      applyResult(data, 'Folder saved');
    } catch (error) {
      setMessage({ tone: 'red', text: `Could not use that folder: ${error.message}` });
    } finally {
      setBusy(false);
    }
  }, [applyResult]);

  const saveManualPath = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/hotas/mappings-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: manualPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `status ${res.status}`);
      applyResult(data, 'Folder saved');
    } catch (error) {
      setMessage({ tone: 'red', text: `Could not save that path: ${error.message}` });
    } finally {
      setBusy(false);
    }
  }, [applyResult, manualPath]);

  const candidates = status?.candidates || [];
  const resolved = status?.path;

  return (
    <Stack gap="xs">
      <Alert color={resolved ? 'green' : 'orange'} variant="light" title={resolved ? 'Controls folder found' : 'Controls folder not found'}>
        <Stack gap={4}>
          <Text size="sm">
            <strong>Current:</strong> {resolved || 'not set'}
          </Text>
          {status ? (
            <Text size="xs" c="dimmed">
              {SOURCE_LABEL[status.source] || status.source}
            </Text>
          ) : null}
          <Text size="xs" c="dimmed">
            Uni-HOTAS needs the folder that holds <code>actionmaps.xml</code>:
            <br />
            <code>…\StarCitizen\&lt;LIVE|PTU|EPTU&gt;\user\client\0\controls\mappings</code>
          </Text>
        </Stack>
      </Alert>

      {candidates.length > 0 ? (
        <Group gap="xs" wrap="wrap">
          <Text size="xs" c="dimmed">Detected installs:</Text>
          {candidates.map((candidate) => (
            <Button
              key={candidate.path}
              size="compact-xs"
              variant={candidate.path === resolved ? 'filled' : 'light'}
              onClick={() => setManualPath(candidate.path)}
            >
              <Badge size="xs" mr={6} variant="outline">{candidate.channel}</Badge>
              {candidate.path}
            </Button>
          ))}
        </Group>
      ) : null}

      <Group gap="xs" align="flex-end" wrap="wrap">
        <TextInput
          label="Folder path"
          value={manualPath}
          onChange={(event) => setManualPath(event.currentTarget.value)}
          placeholder="C:\Program Files\Roberts Space Industries\StarCitizen\LIVE\user\client\0\controls\mappings"
          style={{ flex: '1 1 420px' }}
          size="xs"
        />
        <Button size="xs" onClick={saveManualPath} loading={busy} disabled={!manualPath.trim()}>
          Save path
        </Button>
        <Button size="xs" variant="light" onClick={chooseFolder} loading={busy}>
          Choose folder…
        </Button>
        <Button size="xs" variant="subtle" onClick={() => { void load(); }} disabled={busy}>
          Refresh
        </Button>
      </Group>

      {message ? (
        <Text size="xs" c={message.tone}>{message.text}</Text>
      ) : null}
    </Stack>
  );
}
