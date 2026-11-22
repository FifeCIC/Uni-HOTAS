import { Component } from 'react';
import { Anchor, Box, Button, Group, Stack, Text, Title } from '@mantine/core';

/**
 * AppErrorBoundary — keeps a crash visible instead of leaving a blank page.
 *
 * WHY THIS EXISTS: without a boundary, any throw during render or in an effect unmounts the
 * whole React tree. The user sees the app paint, then a flat background — no message, no clue.
 * That is exactly what a failed lazy-chunk load looks like after a deploy, and it is
 * indistinguishable from "the site is down".
 *
 * Kept as plain text on purpose: if the failure involves Mantine, this must still render.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Uni-HOTAS] Unhandled render error:', error, info?.componentStack);
  }

  handleReload = () => {
    // A chunk that 404'd is cached by the service worker until it is replaced, so a plain
    // reload can loop. A cache-busting reload asks the server for everything again.
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = String(error?.message || error);
    const looksLikeChunkFailure = /dynamically imported module|Importing a module script failed|Loading chunk/i.test(message);

    return (
      <Box p="xl" style={{ maxWidth: 760, margin: '4rem auto' }}>
        <Stack gap="md">
          <Title order={2} style={{ color: '#ffb600' }}>
            Something broke while loading this page
          </Title>

          <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
            {looksLikeChunkFailure
              ? 'A part of the app could not be downloaded. This usually happens in the few minutes after an update, when your browser still holds an older copy.'
              : 'The app hit an error it could not recover from.'}
          </Text>

          <Box
            p="sm"
            style={{
              borderRadius: 6,
              border: '1px solid rgba(255,182,0,0.3)',
              background: 'rgba(255,182,0,0.06)',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: 'rgba(255,210,100,0.95)',
              wordBreak: 'break-word',
            }}
          >
            {message}
          </Box>

          <Group gap="sm">
            <Button color="cyan" onClick={this.handleReload}>
              Reload the page
            </Button>
            <Button
              variant="light"
              color="gray"
              onClick={() => { window.location.href = `${import.meta.env.BASE_URL}`; }}
            >
              Back to the dashboard
            </Button>
          </Group>

          <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
            Still broken after a reload?{' '}
            <Anchor
              href="https://github.com/FifeCIC/Uni-HOTAS/issues"
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              style={{ color: '#00d9ff' }}
            >
              Report it on GitHub
            </Anchor>
            {' '}— include the message above.
          </Text>
        </Stack>
      </Box>
    );
  }
}
