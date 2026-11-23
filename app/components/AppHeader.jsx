import { Group, Button, Badge, Menu, Text } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import BrandWordmark from './BrandWordmark';
import QuickGameSelector from './QuickGameSelector';
import Feedback from './Feedback';

const FRONTEND_VERSION = 'Alpha V0.1.0';

function useNetworkStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [backendOk, setBackendOk] = useState(true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => { setOnline(false); setBackendOk(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!navigator.onLine) { if (active) setBackendOk(false); return; }
      try {
        const r = await fetch('/api/version', { method: 'GET', cache: 'no-store' });
        if (active) setBackendOk(r.ok);
      } catch { if (active) setBackendOk(false); }
    }
    check();
    const id = setInterval(check, 20000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return useMemo(() => {
    if (!online) return { label: 'OFFLINE', color: '#ff5c5c' };
    if (!backendOk) return { label: 'LIMITED', color: '#ffb648' };
    return { label: 'ONLINE', color: '#22d17b' };
  }, [online, backendOk]);
}

function useBackupStatus() {
  const [status, setStatus] = useState({ ready: false, label: '...', color: '#6a8898' });

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const r = await fetch('/api/backup/status', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (!active) return;
        if (!data.enabled) setStatus({ ready: false, label: 'NO BACKUP', color: '#6a8898' });
        else if (data.ready) setStatus({ ready: true, label: 'BACKUP OK', color: '#22d17b' });
        else setStatus({ ready: false, label: 'BACKUP ERR', color: '#ff5c5c' });
      } catch {
        if (active) setStatus({ ready: false, label: 'NO BACKUP', color: '#6a8898' });
      }
    }
    check();
    const id = setInterval(check, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return status;
}

export default function AppHeader() {
  const navigate = useNavigate();
  const network = useNetworkStatus();
  const backup = useBackupStatus();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(11, 20, 40, 0.95)',
        borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        minHeight: '60px',
      }}
    >
      {/* Left: Status pills */}
      <Group gap="xs" justify="flex-start">
        <Badge
          size="xs"
          variant="outline"
          style={{
            borderColor: 'rgba(255, 189, 89, 0.7)',
            color: '#ffcf7a',
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          IN-DEV
        </Badge>
        <Badge
          size="xs"
          variant="dot"
          style={{
            '--badge-dot-color': network.color,
            color: network.color,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {network.label}
        </Badge>
        <Badge
          size="xs"
          variant="dot"
          style={{
            '--badge-dot-color': backup.color,
            color: backup.color,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {backup.label}
        </Badge>
      </Group>

      {/* Center: creator mark + brand + version */}
      <Group gap="sm" align="center" justify="center" wrap="nowrap">
        <Text
          size="xs"
          fw={600}
          style={{
            color: 'rgba(255, 255, 255, 0.25)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Created by LOLinDark
        </Text>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <BrandWordmark size="1.5rem" color="#00d9ff" />
        </div>
        <Text
          size="xs"
          fw={600}
          style={{
            color: 'rgba(255, 255, 255, 0.25)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {FRONTEND_VERSION}
        </Text>
      </Group>

      {/* Right: Game selector, feedback & menu */}
      <Group gap="md" justify="flex-end">
        <QuickGameSelector />

        <Button
          variant="subtle"
          size="sm"
          onClick={() => setFeedbackOpen(true)}
          style={{
            color: '#b8cfe0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          ✉ Feedback
        </Button>

        <Menu position="bottom-end" shadow="md">
          <Menu.Target>
            <Button
              variant="subtle"
              size="sm"
              style={{
                color: '#00d9ff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ☰ Menu
            </Button>
          </Menu.Target>
          {/* Real anchors, not onClick handlers: a click whose event path is disturbed still
              navigates by default action, and middle-click / open-in-new-tab keeps working. */}
          <Menu.Dropdown>
            <Menu.Item component={Link} to="/">Home</Menu.Item>
            <Menu.Item component={Link} to="/hotas-config">Peripheral Config</Menu.Item>
            <Menu.Item component={Link} to="/games">Games &amp; Support</Menu.Item>
            <Menu.Item component={Link} to="/settings">Settings</Menu.Item>
            <Menu.Divider />
            <Menu.Item component={Link} to="/about">About</Menu.Item>
            <Menu.Divider />
            {/* Early technical documentation, kept reachable from the main menu. The Developer
                page also hosts the Dev Mode switch (which unlocks HOTAS hotspot editing). */}
            <Menu.Label>Technical documentation</Menu.Label>
            <Menu.Item component={Link} to="/developer">📘 Developer Docs &amp; Tools</Menu.Item>
            <Menu.Item component={Link} to="/developer/hotas-data-flow">🔀 HOTAS Data Flow</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Feedback opened={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
