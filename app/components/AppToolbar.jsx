/**
 * AppToolbar — the sticky quick-action bar under the header.
 *
 * BEFORE: the previous toolbar was organised around a media feed (since removed).
 * AFTER:  HOTAS-only actions — Feedback, HOTAS test guide, official links.
 * NEXT:   MainLayout and LayoutNew both render this; it also hosts the
 *         HOTAS config save-status badges emitted on the `unihotas:hotas-bookmark-status` event.
 */
import { Group, Button, Badge, Tooltip, Menu, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Feedback from './Feedback';

const HOTAS_BAR_EVENT = 'unihotas:hotas-bookmark-status';

const OFFICIAL_BOOKMARKS = [
  { label: 'Star Map', url: 'https://robertsspaceindustries.com/en/starmap', icon: '🗺️' },
  { label: 'Referral Program', url: 'https://robertsspaceindustries.com/en/referral-program', icon: '🤝' },
  { label: 'Progress Tracker', url: 'https://robertsspaceindustries.com/roadmap/progress-tracker/teams', icon: '📊' },
  { label: 'Community Hub', url: 'https://robertsspaceindustries.com/community-hub', icon: '👥' },
  { label: 'Spectrum', url: 'https://robertsspaceindustries.com/spectrum/', icon: '💬' },
  { label: 'Organizations', url: 'https://robertsspaceindustries.com/en/community/orgs', icon: '🏢' },
];

export default function AppToolbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [hotasBarStatus, setHotasBarStatus] = useState(null);

  useEffect(() => {
    function onHotasStatus(event) {
      setHotasBarStatus(event?.detail || null);
    }

    window.addEventListener(HOTAS_BAR_EVENT, onHotasStatus);
    return () => window.removeEventListener(HOTAS_BAR_EVENT, onHotasStatus);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/hotas-config') {
      setHotasBarStatus(null);
    }
  }, [location.pathname]);

  const showHotasBarStatus = location.pathname === '/hotas-config' && hotasBarStatus;

  return (
    <Group
      gap="xs"
      p="xs"
      style={{
        backgroundColor: 'rgba(11, 20, 40, 0.9)',
        borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        borderTop: '1px solid rgba(0, 217, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        minHeight: '44px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Group gap="xs" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
        <Tooltip label="Report a bug or send a message" position="bottom">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setFeedbackOpen(true)}
            style={{
              color: '#b8cfe0',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.5rem 0.75rem',
            }}
          >
            ✉ Feedback
          </Button>
        </Tooltip>

        <div
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'rgba(0, 217, 255, 0.2)',
            margin: '0 0.5rem',
          }}
        />

        <Tooltip label="Community HOTAS testing guide" position="bottom">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => navigate('/hotas-testing-routine')}
            style={{
              color: '#8de3ff',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.5rem 0.75rem',
            }}
          >
            🧪 HOTAS Test Guide
          </Button>
        </Tooltip>

        <Menu position="bottom-start" shadow="md">
          <Menu.Target>
            <Tooltip label="Official Star Citizen links" position="bottom">
              <Button
                variant="subtle"
                size="sm"
                style={{
                  color: 'rgba(0, 255, 136, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                }}
              >
                + Links
              </Button>
            </Tooltip>
          </Menu.Target>

          <Menu.Dropdown
            style={{
              backgroundColor: 'rgba(11, 20, 40, 0.95)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '4px',
            }}
          >
            {OFFICIAL_BOOKMARKS.map((bookmark) => (
              <Menu.Item
                key={bookmark.url}
                onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')}
                style={{
                  color: '#00ff88',
                  fontSize: '0.85rem',
                  padding: '0.5rem 0.75rem',
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>{bookmark.icon}</span>
                {bookmark.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {showHotasBarStatus && (
        <Group gap="xs" wrap="wrap" justify="flex-end" style={{ flexShrink: 0, marginLeft: '1rem' }}>
          <Tooltip label={hotasBarStatus.saveMessage} position="bottom-end">
            <Badge color={hotasBarStatus.saveTone} variant="light" size="sm">
              {hotasBarStatus.saveIcon} {hotasBarStatus.saveLabel}
            </Badge>
          </Tooltip>

          <Tooltip label={hotasBarStatus.contextMessage} position="bottom-end">
            <Badge color={hotasBarStatus.contextTone} variant="outline" size="sm">
              {hotasBarStatus.contextIcon} {hotasBarStatus.contextLabel}
            </Badge>
          </Tooltip>

          {hotasBarStatus.warningLabel ? (
            <Tooltip label={hotasBarStatus.warningMessage} position="bottom-end">
              <Badge color="orange" variant="light" size="sm">
                {hotasBarStatus.warningIcon} {hotasBarStatus.warningLabel}
              </Badge>
            </Tooltip>
          ) : null}

          <Text size="xs" c="dimmed" fw={600}>
            {hotasBarStatus.helperText}
          </Text>
        </Group>
      )}

      <Feedback opened={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </Group>
  );
}
