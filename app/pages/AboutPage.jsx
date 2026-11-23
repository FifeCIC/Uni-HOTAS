import { Container, Stack, Text, Anchor, Table } from '@mantine/core';
import { SciFiFrame } from '../components/ui';
import DevTag from '../components/DevTag';

const DEPENDENCIES = [
  { name: 'Arwes', author: 'Romel Pérez', url: 'https://github.com/arwes/arwes', license: 'MIT', desc: 'Futuristic Sci-Fi UI Web Framework — frames, text effects, backgrounds' },
  { name: 'Mantine', author: 'Vitaly Rtishchev', url: 'https://github.com/mantinedev/mantine', license: 'MIT', desc: 'React component library — layout, forms, data display' },
  { name: 'React', author: 'Meta', url: 'https://github.com/facebook/react', license: 'MIT', desc: 'UI framework' },
  { name: 'Vite', author: 'Evan You', url: 'https://github.com/vitejs/vite', license: 'MIT', desc: 'Build tool and dev server' },
  { name: 'Express', author: 'TJ Holowaychuk', url: 'https://github.com/expressjs/express', license: 'MIT', desc: 'Backend API server' },
];

export default function AboutPage() {
  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="scifi-heading" style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
          <DevTag tag="ADM05" />About UNI-HOTAS
        </h1>
        <Text c="dimmed" size="sm" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Universal HOTAS configuration for every sim
        </Text>
      </div>

      <Stack gap="lg">
        <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#00d9ff', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Project
            </h2>
            <Text size="sm" mb="xs">
              UNI-HOTAS — Universal HOTAS App
            </Text>
            <Text size="sm" c="dimmed" mb="md" style={{ fontStyle: 'italic' }}>
              "One setup. Every stick."
            </Text>
            <Text size="sm" mb="md">
              A universal HOTAS configuration tool: visual binding editor, live input capture, mode
              profiles and device-aware XML write-back.
            </Text>

            <Text size="sm" fw={600} mb="xs" style={{ color: '#00d9ff' }}>
              How it started
            </Text>
            <Text size="sm" mb="md">
              UNI-HOTAS began as a Star Citizen fan project. Binding a HOTAS in-game was slow and
              opaque, so it started as a way to edit the game&apos;s XML configuration directly,
              back it up, and manage profiles in one place — with full support for the X52&apos;s
              three-position mode switch.
            </Text>

            <Text size="sm" fw={600} mb="xs" style={{ color: '#22d17b' }}>
              Where it became general
            </Text>
            <Text size="sm" mb="md">
              None of that is unique to Star Citizen. The profile engine is deliberately
              game-agnostic — live input capture, mode profiles, per-device button and axis maps and
              the read/write of a sim&apos;s binding file are all driven by data rather than by the
              game&apos;s name. Star Citizen and Squadron 42 share that binding format and are
              wired up today; Elite Dangerous, DCS World, Microsoft Flight Simulator, X-Plane and
              IL-2 Sturmovik are listed with adapters planned, with a catch-all entry for any other
              game. In other words, the project stopped being a Star Citizen tool and became a
              HOTAS tool.
            </Text>

            <Text size="sm" c="dimmed" mb="md">
              Star Citizen is still where it started and still the best-tested path — it is the
              first sim, not the only one.
            </Text>
            <Text size="sm">
              Source: <Anchor href="https://github.com/FifeCIC/Uni-HOTAS" target="_blank" rel="noreferrer">github.com/FifeCIC/Uni-HOTAS</Anchor>
            </Text>
          </div>
        </SciFiFrame>

        <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#00d9ff', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vision & Motivation
            </h2>
            <Text size="sm" mb="md">
              As a Star Citizen backer since 2013, I've watched Cloud Imperium Games build an impressive scope of tools and systems. But there's always room for innovation in how we play.
            </Text>
            <Text size="sm" mb="md">
              After taking a break from the game and returning to master flying mechanics, I found HOTAS configuration tedious. Most games struggle here. Rather than accept those limitations, I built a tool to directly edit the game's XML configuration files, backup to GitHub or Google Drive, and manage profiles effortlessly.
            </Text>
            <Text size="sm" mb="md">
              From there, the idea grew: <strong style={{ color: '#22d17b' }}>why should every sim make you learn its binding file from scratch?</strong>
            </Text>
            <Text size="sm" style={{ color: '#aaa' }} mb="md">
              <strong>Planned Features:</strong>
            </Text>
            <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
              <Text size="sm" mb="xs" c="dimmed">• <strong>Advanced HOTAS</strong> — Full support for multi-mode controllers like the X52's 3-position switch, with pre-built profiles and seamless XML sync</Text>
              <Text size="sm" mb="xs" c="dimmed">• <strong>More sims</strong> — Adapters for DCS World, Elite Dangerous, Microsoft Flight Simulator and others</Text>
              <Text size="sm" mb="xs" c="dimmed">• <strong>Mobile App</strong> — PWA today, native Android app tomorrow</Text>
            </div>
            <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
              Preparing for Squadron 42's release and ready to enhance how we fly.
            </Text>
          </div>
        </SciFiFrame>

        <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#00ff88', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact & Feedback
            </h2>
            <Text size="sm" mb="md">For feedback, suggestions, or bug reports:</Text>
            <Text size="sm">
              GitHub: <Anchor href="https://github.com/FifeCIC/Uni-HOTAS/issues" target="_blank" rel="noreferrer">Open an issue</Anchor>
            </Text>
          </div>
        </SciFiFrame>

        <SciFiFrame variant="corners" cornerLength={12} strokeWidth={1.5} padding={0}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#ffd166', marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Open Source Credits
            </h2>
            <Text size="sm" c="dimmed" mb="md">
              UNI-HOTAS is built on the shoulders of these open-source projects.
            </Text>
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover style={{ fontSize: '0.85rem' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottomColor: 'rgba(0, 217, 255, 0.2)' }}>
                    <Table.Th style={{ color: '#00d9ff' }}>Project</Table.Th>
                    <Table.Th style={{ color: '#00d9ff' }}>Author</Table.Th>
                    <Table.Th style={{ color: '#00d9ff' }}>License</Table.Th>
                    <Table.Th style={{ color: '#00d9ff' }}>Role</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {DEPENDENCIES.map((dep) => (
                    <Table.Tr key={dep.name} style={{ borderBottomColor: 'rgba(0, 217, 255, 0.1)' }}>
                      <Table.Td><Anchor href={dep.url} target="_blank" rel="noreferrer" size="sm">{dep.name}</Anchor></Table.Td>
                      <Table.Td><Text size="sm">{dep.author}</Text></Table.Td>
                      <Table.Td><Text size="sm">{dep.license}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{dep.desc}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </div>
        </SciFiFrame>

      </Stack>
    </Container>
  );
}
