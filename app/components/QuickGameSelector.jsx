/**
 * QuickGameSelector — switch the active game without leaving the page.
 *
 * BEFORE: Star Citizen paths and labels were baked into the HOTAS config page.
 * AFTER:  the header offers a quick switch; the chosen game flows through the store to
 *         the parts that are game-specific (profile folder hints, adapter availability).
 * NEXT:   a game without a built-in adapter shows an honest notice rather than parsing its
 *         files with the Star Citizen adapter.
 */
import { Badge, Button, Group, Menu, Text } from '@mantine/core';
import { IconChevronDown, IconDeviceGamepad2 } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORT_COLORS, SUPPORT_LABELS, getGamesForSelector } from '../data/games';
import useGameStore from '../stores/useGameStore';
import useActiveGame from '../hooks/useActiveGame';

/** Best-effort: the hosted demo has no server, and must not look broken because of it. */
export function announceActiveGame(gameId) {
  fetch('/api/hotas/active-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game: gameId }),
  }).catch(() => {});
}

export default function QuickGameSelector() {
  const navigate = useNavigate();
  const { activeGame, setActiveGame } = useActiveGame();
  const games = getGamesForSelector();

  // Keep the server's active game in step with the persisted choice, including on reload.
  useEffect(() => {
    announceActiveGame(activeGame.id);
  }, [activeGame.id]);

  const selectGame = (gameId) => {
    setActiveGame(gameId);
  };

  return (
    <Menu position="bottom-end" shadow="md" width={280}>
      <Menu.Target>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconDeviceGamepad2 size={16} />}
          rightSection={<IconChevronDown size={14} />}
          aria-label={`Active game: ${activeGame.name}. Change game`}
          style={{ color: '#8de3ff' }}
        >
          <Text size="xs" fw={700} style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {activeGame.name}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Quick game select</Menu.Label>
        {games.map((game) => (
          <Menu.Item key={game.id} onClick={() => selectGame(game.id)}>
            <Group justify="space-between" gap="xs" wrap="nowrap">
              <Text size="sm" fw={game.id === activeGame.id ? 700 : 400}>{game.name}</Text>
              <Badge size="xs" variant="light" color={SUPPORT_COLORS[game.support]}>
                {SUPPORT_LABELS[game.support]}
              </Badge>
            </Group>
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item onClick={() => navigate('/games')}>
          More games &amp; extra support…
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
