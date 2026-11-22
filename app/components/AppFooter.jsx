import { Anchor, Group, Text } from '@mantine/core';

export default function AppFooter() {
  return (
    <footer
      style={{
        padding: '0.75rem 3%',
        borderTop: '1px solid rgba(0, 217, 255, 0.1)',
        background: 'rgba(4, 8, 20, 0.9)',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        {/* Creator */}
        <Text size="sm" fw={700} style={{ color: '#00d9ff', letterSpacing: '0.08em' }}>
          Created by LOLinDark
        </Text>

        {/* Links */}
        <Group gap="md" justify="center" mt={2}>
          <Anchor href="https://github.com/FifeCIC/Uni-HOTAS" target="_blank" rel="noopener noreferrer" size="xs" style={{ color: '#00d9ff' }}>
            GitHub
          </Anchor>
          <Anchor href="https://github.com/FifeCIC/Uni-HOTAS/issues" target="_blank" rel="noopener noreferrer" size="xs" style={{ color: '#00d9ff' }}>
            Report a Bug
          </Anchor>
        </Group>
      </div>
    </footer>
  );
}
