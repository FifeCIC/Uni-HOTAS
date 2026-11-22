import { Anchor, Badge, Box, Group, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconTerminal2 } from '@tabler/icons-react';

const RELEASES_URL = 'https://github.com/FifeCIC/Uni-HOTAS/releases/latest';
const REPO_URL = 'https://github.com/FifeCIC/Uni-HOTAS';

function Code({ children, color = '#00d9ff', bg = 'rgba(0,217,255,0.08)' }) {
  return (
    <code style={{ color, background: bg, padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>
      {children}
    </code>
  );
}

function Step({ n, children }) {
  return (
    <Group align="flex-start" gap={8} wrap="nowrap">
      <Text size="xs" fw={700} style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, minWidth: 12 }}>
        {n}.
      </Text>
      <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>{children}</Text>
    </Group>
  );
}

const panelStyle = {
  flex: '1 1 260px',
  minWidth: 0,
  padding: '1rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(0,0,0,0.25)',
};

/**
 * Shown on pages that need the local server (Peripheral Configuration on GitHub Pages).
 *
 * TWO INSTALL PATHS, DELIBERATELY SIDE BY SIDE WITH "OR" BETWEEN THEM.
 * The Windows installer is the answer for a player; running from source is the answer for a
 * developer. Offering only the source path is why a visitor concludes the app "does not work"
 * and leaves — the installer has to be visible, and first.
 *
 * Each option is a panel and the OR is the middle flex child, so flex-wrap gives two columns on a
 * wide screen and keeps the A -> OR -> B reading order when they stack on mobile.
 */
export default function ServerRequiredOverlay({ featureName = 'This feature', reason }) {
  return (
    <Box
      p="xl"
      style={{
        border: '1px solid rgba(255, 182, 0, 0.25)',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(30,16,0,0.7) 0%, rgba(10,8,0,0.85) 100%)',
        maxWidth: 900,
        margin: '3rem auto',
      }}
    >
      <Stack gap="md">
        <Group gap="sm">
          <Badge size="md" variant="outline" style={{ borderColor: '#ffb600', color: '#ffb600', fontWeight: 700 }}>
            SERVER REQUIRED
          </Badge>
          <Badge size="sm" variant="light" color="gray">
            Demo Mode
          </Badge>
        </Group>

        <div>
          <Title order={3} style={{ color: 'rgba(255,210,100,0.9)', marginBottom: '0.4rem' }}>
            {featureName} needs the local server
          </Title>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
            {reason || (
              <>
                This tool reads and writes files on your machine — your game&apos;s control profile
                files, HOTAS binding data, and local settings. That requires the Uni-HOTAS app
                running alongside your game.
              </>
            )}
          </Text>
        </div>

        <Group align="stretch" gap="md" wrap="wrap">
          {/* Option 1: Windows installer */}
          <Box style={{ ...panelStyle, border: '1px solid rgba(34,209,123,0.35)', background: 'rgba(34,209,123,0.05)' }}>
            <Stack gap={8}>
              <Group gap={6}>
                <IconDownload size={15} color="#22d17b" />
                <Text size="sm" fw={700} style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Windows installer
                </Text>
                <Badge size="xs" variant="light" color="green">Recommended</Badge>
              </Group>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                No Node.js, no terminal — it runs like any other Windows app.
              </Text>
              <Step n={1}>
                Download <Code color="#22d17b" bg="rgba(34,209,123,0.12)">Uni-HOTAS-&lt;version&gt;-x64.exe</Code> from
                the releases page.
              </Step>
              <Step n={2}>
                Run it. It installs for your user only (no admin rights) and adds Start Menu and
                desktop shortcuts.
              </Step>
              <Step n={3}>
                Uni-HOTAS opens in its own window and finds your game&apos;s controls folder
                automatically (Star Citizen is detected out of the box).
              </Step>
              <Anchor
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                fw={600}
                style={{ color: '#22d17b' }}
                mt={4}
              >
                Download for Windows &rarr;
              </Anchor>
              <Text size="xs" style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>
                Unsigned build: Windows may show <em>“More info → Run anyway”</em>. Prefer nothing
                installed? Use the <Code color="#8de3ff" bg="rgba(0,217,255,0.08)">-portable.exe</Code> on the
                same page.
              </Text>
            </Stack>
          </Box>

          {/* OR */}
          <Group align="center" justify="center" style={{ flex: '0 0 auto', padding: '0 0.25rem' }}>
            <Text
              size="xs"
              fw={700}
              style={{
                color: 'rgba(255,182,0,0.85)',
                letterSpacing: '0.18em',
                border: '1px solid rgba(255,182,0,0.35)',
                borderRadius: 999,
                padding: '2px 10px',
                background: 'rgba(255,182,0,0.08)',
              }}
            >
              OR
            </Text>
          </Group>

          {/* Option 2: run from source */}
          <Box style={panelStyle}>
            <Stack gap={8}>
              <Group gap={6}>
                <IconTerminal2 size={15} color="#00d9ff" />
                <Text size="sm" fw={700} style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Run from source
                </Text>
              </Group>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                For developers, or if you would rather not install anything.
              </Text>
              <Step n={1}>
                Clone <Anchor href={REPO_URL} target="_blank" rel="noopener noreferrer" size="xs" style={{ color: '#00d9ff' }}>github.com/FifeCIC/Uni-HOTAS</Anchor>.
              </Step>
              <Step n={2}>
                <Code color="#22d17b" bg="rgba(34,209,123,0.1)">npm install</Code>
              </Step>
              <Step n={3}>
                <Code color="#22d17b" bg="rgba(34,209,123,0.1)">npm run serve</Code> then open{' '}
                <Code>http://localhost:3111</Code>.
              </Step>
              <Text size="xs" style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>
                Needs Node.js 20+. <Code color="#8de3ff" bg="rgba(0,217,255,0.08)">npm run dev</Code> gives
                hot reload on port 5175.
              </Text>
            </Stack>
          </Box>
        </Group>

        <Box
          p="sm"
          style={{
            borderRadius: 6,
            border: '1px solid rgba(34,209,123,0.2)',
            background: 'rgba(34,209,123,0.04)',
          }}
        >
          <Text size="xs" style={{ color: 'rgba(34,209,123,0.85)', lineHeight: 1.6 }}>
            <strong>A supported game must be installed</strong> for either option — the app reads and
            writes the game&apos;s own profile files. Star Citizen has built-in detection today; other
            titles are pointed at their controls folder manually. Prefer a fully online version? Online
            support is planned; community funding decides what gets built next, so{' '}
            <Anchor
              href="https://github.com/sponsors/LOLinDark"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22d17b' }}
            >
              consider supporting development
            </Anchor>
            {' '}and request it.
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}