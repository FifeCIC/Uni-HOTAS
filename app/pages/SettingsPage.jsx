import { Container, Stack, Text, Tabs, Card, Button, Alert, TextInput, Select, Group } from '@mantine/core';
import { IconBrandGithub, IconCheck, IconHelp } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, clearUniHotasStorage, useSettingsStore } from '../platform-core';
import MappingsFolderPanel from '../components/MappingsFolderPanel';
import { SciFiFrame } from '../components/ui';
import DevTag from '../components/DevTag';
import {
  HOTAS_DEVICE_OPTIONS,
  HOTAS_NOT_LISTED_VALUE,
  buildHotasRequestUrl,
} from '../data/hotasDevices';

const HOTAS_SELECT_DATA = [
  {
    group: 'Supported device',
    items: HOTAS_DEVICE_OPTIONS.filter((d) => d.supported)
      .map((d) => ({ value: d.value, label: d.label })),
  },
  {
    group: 'Popular devices — not yet supported',
    items: HOTAS_DEVICE_OPTIONS.filter((d) => !d.supported)
      .map((d) => ({ value: d.value, label: d.label })),
  },
  {
    group: 'Not listed',
    items: [{ value: HOTAS_NOT_LISTED_VALUE, label: "Can't find my HOTAS" }],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const selectedHotasDevice = useSettingsStore((s) => s.selectedHotasDevice);
  const setSelectedHotasDevice = useSettingsStore((s) => s.setSelectedHotasDevice);

  const selectedDevice = HOTAS_DEVICE_OPTIONS.find((d) => d.value === selectedHotasDevice);
  const wantsDeviceNotListed = selectedHotasDevice === HOTAS_NOT_LISTED_VALUE;

  const [backupPath, setBackupPath] = useState('');
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupSaving, setBackupSaving] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    apiGet('/api/backup/status')
      .then((data) => { setBackupStatus(data); setBackupPath(data.folderPath || ''); })
      .catch(() => {});
  }, []);

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="scifi-heading" style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
          <DevTag tag="ADM01" />Settings
        </h1>
        <Text c="dimmed" size="sm" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Configure your UNI-HOTAS experience
        </Text>
      </div>

      <Tabs defaultValue="general" color="cyan">
        <Tabs.List style={{ borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="backup">Backup</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="xl">
          <Stack gap="lg">
            <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ color: '#00d9ff', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  HOTAS
                </h2>
                <Text size="sm" c="dimmed" mb="md">
                  Configure your flight controls and input devices.
                </Text>
                <Select
                  label="My HOTAS"
                  description="Pick the stick and throttle you fly with. This tells us which devices to support next."
                  placeholder="Select your HOTAS"
                  data={HOTAS_SELECT_DATA}
                  value={selectedHotasDevice}
                  onChange={(value) => setSelectedHotasDevice(value)}
                  checkIconPosition="right"
                  comboboxProps={{ withinPortal: true }}
                  maw={420}
                />

                {selectedDevice?.supported && (
                  <Alert
                    role="status"
                    color="cyan"
                    variant="light"
                    mt="md"
                    icon={<IconCheck size={18} />}
                    title={`${selectedDevice.label} — supported`}
                  >
                    {selectedDevice.note} Multi-mode switch profiles and XML sync are built for this device.
                  </Alert>
                )}

                {selectedDevice && !selectedDevice.supported && (
                  <Alert
                    role="status"
                    color="yellow"
                    variant="light"
                    mt="md"
                    icon={<IconHelp size={18} />}
                    title={`${selectedDevice.label} — not supported yet`}
                  >
                    <Text size="sm" mb="sm">
                      Device support is per-model work, so each HOTAS needs its own mapping. A request from
                      someone who owns the hardware is the best kind — it tells us exactly what to build next.
                    </Text>
                    <Button
                      component="a"
                      href={buildHotasRequestUrl(selectedDevice.label)}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="yellow"
                      variant="light"
                      size="xs"
                      leftSection={<IconBrandGithub size={16} />}
                    >
                      Request support on GitHub
                    </Button>
                  </Alert>
                )}

                {wantsDeviceNotListed && (
                  <Alert
                    role="status"
                    color="cyan"
                    variant="light"
                    mt="md"
                    icon={<IconHelp size={18} />}
                    title="Let's get your HOTAS supported"
                  >
                    <Text size="sm" mb="sm">
                      Don&apos;t worry — you are not stuck. Tell us which HOTAS you fly with and it becomes
                      a real candidate for the next device we add. It takes about a minute, and a
                      well-described request is genuinely the fastest route to support.
                    </Text>
                    <Group gap="sm">
                      <Button
                        component="a"
                        href={buildHotasRequestUrl('')}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="cyan"
                        variant="light"
                        size="xs"
                        leftSection={<IconBrandGithub size={16} />}
                      >
                        Raise a support request
                      </Button>
                      <Button
                        component="a"
                        href="https://github.com/FifeCIC/Uni-HOTAS/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        color="gray"
                        size="xs"
                      >
                        See existing requests
                      </Button>
                    </Group>
                  </Alert>
                )}

                <Button color="cyan" variant="light" mt="md" onClick={() => navigate('/settings/hotas')}>
                  Test inputs live (buttons, hats, axes)
                </Button>
                <div style={{ marginTop: '1rem' }}>
                  <MappingsFolderPanel />
                </div>
              </div>
            </SciFiFrame>

            <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ color: '#ff0055', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Danger Zone
                </h2>
                <Text size="sm" c="dimmed" mb="md">
                  Reset all local data and preferences.
                </Text>
                <Button
                  color="red"
                  variant="light"
                  onClick={() => {
                    if (confirm('Clear all local data? This cannot be undone.')) {
                      resetSettings();
                      clearUniHotasStorage();
                      window.location.reload();
                    }
                  }}
                >
                  Reset All Local Data
                </Button>
              </div>
            </SciFiFrame>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="backup" pt="xl">
          <Stack gap="lg">
            <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ color: '#22d17b', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cloud Backup Folder
                </h2>
                <Text size="sm" c="dimmed" mb="md">
                  Set a folder path where Uni-HOTAS will sync your HOTAS profiles, game settings, and configuration files.
                  Point this to a Google Drive, OneDrive, or Dropbox sync folder for automatic cloud backup.
                </Text>
                <Stack gap="md">
                  <TextInput
                    label="Backup Folder Path"
                    placeholder="e.g. G:\My Drive\Uni-HOTAS-Backup"
                    value={backupPath}
                    onChange={(e) => setBackupPath(e.currentTarget.value)}
                  />
                  <Button
                    color="green"
                    variant="light"
                    loading={backupSaving}
                    onClick={async () => {
                      setBackupSaving(true);
                      setSyncResult(null);
                      try {
                        await apiPost('/api/backup/configure', { enabled: !!backupPath, folderPath: backupPath });
                        const status = await apiGet('/api/backup/status');
                        setBackupStatus(status);
                      } catch (err) {
                        setSyncResult({ success: false, error: err.message });
                      } finally {
                        setBackupSaving(false);
                      }
                    }}
                  >
                    Save Backup Configuration
                  </Button>
                  {backupStatus?.ready && (
                    <Button
                      color="cyan"
                      variant="light"
                      onClick={async () => {
                        setSyncResult(null);
                        try {
                          const result = await apiPost('/api/backup/sync', {});
                          setSyncResult(result);
                          const status = await apiGet('/api/backup/status');
                          setBackupStatus(status);
                        } catch (err) {
                          setSyncResult({ success: false, error: err.message });
                        }
                      }}
                    >
                      Sync Now
                    </Button>
                  )}
                  {backupStatus && (
                    <Card withBorder style={{ background: 'rgba(0,0,0,0.2)', borderColor: backupStatus.ready ? 'rgba(34,209,123,0.3)' : 'rgba(255,107,107,0.3)' }} p="sm">
                      <Text size="xs" fw={600} mb="xs" style={{ color: backupStatus.ready ? '#22d17b' : '#ff6b6b' }}>
                        {backupStatus.ready ? '✓ Backup Ready' : '✗ Backup Not Ready'}
                      </Text>
                      <Text size="xs" c="dimmed">Path: {backupStatus.folderPath || 'Not set'}</Text>
                      <Text size="xs" c="dimmed">Folder exists: {backupStatus.folderExists ? 'Yes' : 'No'}</Text>
                      {backupStatus.lastSyncAt && (
                        <Text size="xs" c="dimmed">Last sync: {new Date(backupStatus.lastSyncAt).toLocaleString()} ({backupStatus.lastSyncFiles} files)</Text>
                      )}
                    </Card>
                  )}
                  {syncResult && (
                    <Alert color={syncResult.success ? 'green' : 'red'} variant="light">
                      {syncResult.success
                        ? `Sync complete: ${syncResult.filesCopied} file(s) copied`
                        : `Sync failed: ${syncResult.error}`}
                    </Alert>
                  )}
                </Stack>
              </div>
            </SciFiFrame>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
