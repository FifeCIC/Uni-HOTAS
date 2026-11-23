import { AppShell, NavLink, Button, Stack, Title, Indicator, Text, Divider, Alert, Switch, Group, Menu, Container } from '@mantine/core';
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { apiGet, useAppStore } from '../platform-core';
import DevFooter from './DevFooter';
import BrandWordmark from './BrandWordmark';

const FRONTEND_VERSION = 'Alpha V0.1.0';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const { colorScheme, toggleColorScheme, devMode, toggleDevMode, logActivity } = useAppStore();

  const [serverOnline, setServerOnline] = useState(false);
  const [serverVersion, setServerVersion] = useState(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        logActivity('API', 'GET /api/version');
        const data = await apiGet('/api/version');
        logActivity('DATA', `Server ${data.version}`);
        setServerVersion(data.version);
        setServerOnline(true);
      } catch {
        logActivity('ERROR', 'Server offline');
        setServerOnline(false);
      }
    };

    checkServer();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkServer();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [logActivity]);

  const isActive = (route) => path === route || path.startsWith(route + '/');

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      aside={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Group justify="space-between">
          <Group>
            <BrandWordmark onClick={() => navigate('/')} size="1.25rem" color="#4cc9f0" />
            <Text size="xs" c="dimmed" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {FRONTEND_VERSION}
            </Text>
          </Group>
          <Group gap="xs">
            <Button variant={path === '/' ? 'filled' : 'subtle'} color="cyan" component={Link} to="/">Dashboard</Button>
            <Menu>
              <Menu.Target>
                <Button variant={path.startsWith('/admin') ? 'filled' : 'subtle'}>Admin</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item component={Link} to="/admin/history">Field History</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button variant={path.startsWith('/developer') ? 'filled' : 'subtle'} component={Link} to="/developer">Developer</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Title order={5} mb="md" c="dimmed" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>Navigation</Title>
        <Stack gap="xs">
          <NavLink label="Dashboard" active={path === '/'} component={Link} to="/" />
          <Divider my="xs" label="Admin Tools" labelPosition="center" />
          <NavLink label="Field History" active={isActive('/admin/history')} component={Link} to="/admin/history" />
          <Divider my="xs" label="Config" labelPosition="center" />
          <NavLink label="Settings" active={path === '/settings'} component={Link} to="/settings" />
          <NavLink label="Theme" active={isActive('/settings/theme')} component={Link} to="/settings/theme" />
          <NavLink label="HOTAS" active={isActive('/settings/hotas')} component={Link} to="/settings/hotas" />
          <NavLink label="Error Log" active={isActive('/developer/errors')} component={Link} to="/developer/errors" />
          <NavLink label="Changes" active={isActive('/developer/changes')} component={Link} to="/developer/changes" />
          <NavLink label="About" active={isActive('/about')} component={Link} to="/about" />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Aside p="md">
        <Stack>
          <Group justify="space-between">
            <Title order={5}>Theme</Title>
            <Switch
              checked={colorScheme === 'dark'}
              onChange={toggleColorScheme}
              onLabel="🌙"
              offLabel="☀️"
            />
          </Group>
          <Divider />
          <Group justify="space-between">
            <Title order={5}>Dev Mode</Title>
            <Switch checked={devMode} onChange={toggleDevMode} onLabel="ON" offLabel="OFF" />
          </Group>
          <Divider />
          <Title order={5}>Server Status</Title>

          {serverVersion && serverVersion !== FRONTEND_VERSION && (
            <Alert color="orange" title="Version Mismatch" mb="sm">
              <Text size="xs">Backend: {serverVersion}</Text>
              <Text size="xs">Frontend: {FRONTEND_VERSION}</Text>
            </Alert>
          )}

          <Indicator color={serverOnline ? 'green' : 'red'} processing={serverOnline}>
            <Text size="sm">{serverOnline ? 'Backend Online' : 'Backend Offline'}</Text>
          </Indicator>
          {serverVersion && <Text size="xs" c="dimmed">{serverVersion}</Text>}

          <Button onClick={() => window.location.reload()} color="blue" size="sm">Reload</Button>
        </Stack>
      </AppShell.Aside>

      <AppShell.Main>
        <Container size="xl" py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
      <DevFooter />
    </AppShell>
  );
}
