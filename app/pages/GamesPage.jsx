/**
 * GamesPage — the titles with extra built-in support, plus an explicit statement that the
 * list is not the app's limit.
 *
 * WHY: a page called "supported games" that only shows Star Citizen reads as "this app only
 * does Star Citizen". The profile engine is game-agnostic; what differs per title is the
 * adapter. This page separates the two so a visitor with a different sim knows where they
 * stand and what to do next.
 */
import { Anchor, Badge, Button, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { SciFiFrame } from '../components/ui';
import DevTag from '../components/DevTag';
import {
  GAMES,
  SUPPORT_COLORS,
  SUPPORT_LABELS,
  getGameById,
} from '../data/games';
import useActiveGame from '../hooks/useActiveGame';

const REFERRAL_NOTE =
  'Links to Roberts Space Industries on this page carry the project’s referral code.';

function GameCard({ game, onUse, isActive }) {
  return (
    <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
      <Stack gap="xs" p="md" style={{ height: '100%' }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text fw={800} size="lg" style={{ color: '#00d9ff', letterSpacing: '0.03em' }}>
              {game.name}
            </Text>
            <Text size="xs" c="dimmed">{game.publisher}</Text>
          </div>
          <Badge size="sm" variant="light" color={SUPPORT_COLORS[game.support]}>
            {SUPPORT_LABELS[game.support]}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>{game.summary}</Text>

        <Text size="xs" c="dimmed">
          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Profile format:</strong> {game.profileFormatLabel}
        </Text>

        {game.highlights.length > 0 ? (
          <Stack gap={4}>
            {game.highlights.map((highlight) => (
              <Text key={highlight} size="xs" c="dimmed">• {highlight}</Text>
            ))}
          </Stack>
        ) : null}

        <Group gap="xs" mt="auto" pt="xs" wrap="wrap">
          {game.website ? (
            <Button
              size="compact-sm"
              variant="light"
              component="a"
              href={game.website.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {game.website.label}
            </Button>
          ) : null}
          {game.support === 'built-in' ? (
            <Button
              size="compact-sm"
              variant={isActive ? 'filled' : 'outline'}
              onClick={() => onUse(game.id)}
              disabled={isActive}
            >
              {isActive ? 'Active game' : 'Use in app'}
            </Button>
          ) : null}
        </Group>
      </Stack>
    </SciFiFrame>
  );
}

export default function GamesPage() {
  const navigate = useNavigate();
  const { activeGame, setActiveGame } = useActiveGame();
  const generic = getGameById('generic');
  const builtInGames = GAMES.filter((game) => game.support === 'built-in');
  const plannedGames = GAMES.filter((game) => game.support === 'planned');

  const useGame = (gameId) => {
    setActiveGame(gameId);
  };

  return (
    <Container size="xl" py="lg">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="scifi-heading" style={{ margin: 0, fontSize: '2rem' }}>
          <DevTag tag="GAME01" />Games &amp; Extra Support
        </h1>
        <Text c="dimmed" size="sm" style={{ letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
          The full list is the roadmap — not the limit
        </Text>
      </div>

      <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
        <Stack gap="xs" p="md">
          <Text size="sm" fw={700} style={{ color: '#22d17b' }}>
            Uni-HOTAS works through profile adapters, not a fixed game list.
          </Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
            A game needs a readable binding file and a small adapter to be supported — not a place on this
            page. Star Citizen and Squadron 42 have that adapter today. The other titles below are planned,
            and <strong style={{ color: 'rgba(255,255,255,0.75)' }}>any game that writes its bindings to a
            profile can be added</strong>.
          </Text>
          <Text size="xs" c="dimmed">{REFERRAL_NOTE}</Text>
        </Stack>
      </SciFiFrame>

      <Text size="sm" fw={700} mt="lg" mb="sm" style={{ color: '#00d9ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Titles with extra built-in support
      </Text>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {builtInGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isActive={game.id === activeGame.id}
            onUse={useGame}
          />
        ))}
      </SimpleGrid>

      <Text size="sm" fw={700} mt="xl" mb="sm" style={{ color: '#ffb648', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Adapters planned
      </Text>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {plannedGames.map((game) => (
          <GameCard key={game.id} game={game} isActive={false} onUse={useGame} />
        ))}
      </SimpleGrid>

      <Text size="sm" fw={700} mt="xl" mb="sm" style={{ color: '#b8cfe0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Everything else
      </Text>
      <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
        <Stack gap="xs" p="md">
          <Text fw={800} size="lg" style={{ color: '#b8cfe0' }}>{generic.name}</Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>{generic.summary}</Text>
          {generic.highlights.map((highlight) => (
            <Text key={highlight} size="xs" c="dimmed">• {highlight}</Text>
          ))}
          <Group gap="sm" mt="xs" wrap="wrap">
            <Button
              size="compact-sm"
              variant="light"
              onClick={() => navigate('/hotas-config')}
            >
              Open Peripheral Config
            </Button>
            <Anchor
              href="https://github.com/FifeCIC/Uni-HOTAS/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              Request a game adapter
            </Anchor>
          </Group>
        </Stack>
      </SciFiFrame>
    </Container>
  );
}
