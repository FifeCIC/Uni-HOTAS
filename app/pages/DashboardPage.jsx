import { Container, Text, SimpleGrid, Stack, Image, Group, useMantineTheme } from '@mantine/core';
import React, { useMemo } from 'react';
import { SciFiFrame } from '../components/ui';
import { getAssetUrl } from '../utils/pathUtils';

// Function to generate TOOLS array at runtime (not module scope)
const getToolsArray = () => [
  {
    id: 'hotas-config',
    title: 'Peripheral Configuration',
    desc: 'Configure your flight stick, mouse, and keyboard for precision control',
    image: getAssetUrl('tools/hotas-config.png'),
    alt: 'Peripheral Configuration - Flight controls, HOTAS, mouse and keyboard setup',
    color: '#ff6b00',
  },
];

function DashboardPageContent() {
  // Evaluate TOOLS array at component render time (not module scope)
  const TOOLS = useMemo(() => getToolsArray(), []);
  
  // Fallback image placeholder for missing assets
  const PlaceholderImage = ({ tool }) => (
  <div
    style={{
      width: '100%',
      height: '200px',
      background: `linear-gradient(135deg, ${tool.color}20, ${tool.color}40)`,
      border: `1px solid ${tool.color}60`,
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      opacity: 0.8,
    }}
  >
    <Text
      fw={700}
      size="sm"
      style={{
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: tool.color,
      }}
    >
      Preview
    </Text>
  </div>
);

const ToolCard = ({ tool }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <SciFiFrame variant="corners" cornerLength={16} strokeWidth={1.5} padding={0}>
      <Stack gap={0}>
        {/* Image section */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderBottom: `1px solid var(--oc-cyan-dim)`,
          }}
        >
          <Image
            src={tool.image}
            alt={tool.alt}
            onLoad={() => setImageLoaded(true)}
            fallback={<PlaceholderImage tool={tool} />}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && <PlaceholderImage tool={tool} />}
        </div>

        {/* Content section */}
        <div style={{ padding: '1rem' }}>
          <Group gap={6} mb={6}>
            <Text fw={700} style={{ color: tool.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tool.title}
            </Text>
          </Group>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
            {tool.desc}
          </Text>
        </div>
      </Stack>
    </SciFiFrame>
  );
};

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="scifi-heading" style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
          UNI-HOTAS
        </h1>
        <Text c="dimmed" size="sm" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Universal HOTAS configuration for every sim
        </Text>
        <Text c="dimmed" size="xs" style={{ marginTop: '1rem', opacity: 0.6 }}>
          Select a tool to begin
        </Text>
      </div>

      {/* Tools Grid */}
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing="lg"
        style={{
          marginBottom: '2rem',
        }}
      >
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </SimpleGrid>
    </Container>
  );
}

export default DashboardPageContent;
