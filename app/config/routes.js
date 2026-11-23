/**
 * Route Configuration for Uni-HOTAS
 * Single source of truth for all app routes
 * Used by App.jsx and DevPanel to avoid duplication
 * 
 * Add new routes here and they'll automatically appear in the dev panel
 */

export const routeConfig = {
  main: [
    {
      label: '/ Dashboard',
      path: '/',
      category: 'Main App',
      color: 'cyan',
    },
    {
      label: '/settings',
      path: '/settings',
      category: 'Main App',
      color: 'cyan',
    },
    {
      label: '/settings/hotas',
      path: '/settings/hotas',
      category: 'Main App',
      color: 'cyan',
    },
    {
      label: '/about',
      path: '/about',
      category: 'Main App',
      color: 'cyan',
    },
    {
      label: '/games',
      path: '/games',
      category: 'Main App',
      color: 'cyan',
    },
    {
      label: '/hotas-testing-routine',
      path: '/hotas-testing-routine',
      category: 'Main App',
      color: 'cyan',
    },
  ],

  admin: [
    {
      label: '/developer',
      path: '/developer',
      category: 'Admin & Tools',
      color: 'grape',
    },
    {
      label: '/developer/hotas-data-flow',
      path: '/developer/hotas-data-flow',
      category: 'Admin & Tools',
      color: 'grape',
    },
  ],

  testPages: [
    {
      label: '[HC-TEST] /settings/hotas',
      path: '/settings/hotas',
      category: 'Test Pages',
      color: 'teal',
    },
  ],
};

/**
 * Get all routes organized by category
 * @returns {Object} Routes grouped by category
 */
export const getAllRoutesByCategory = () => {
  return routeConfig;
};

/**
 * Get all routes flattened
 * @returns {Array} All routes in a single array
 */
export const getAllRoutes = () => {
  return [...routeConfig.main, ...routeConfig.admin, ...routeConfig.testPages];
};

/**
 * Get routes by category
 * @param {string} category - Category name (e.g., 'Main App', 'Theme Lab')
 * @returns {Array} Routes in that category
 */
export const getRoutesByCategory = (category) => {
  return getAllRoutes().filter((route) => route.category === category);
};

/**
 * Get unique categories
 * @returns {Array} List of all categories
 */
export const getCategories = () => {
  const categories = new Set();
  getAllRoutes().forEach((route) => {
    categories.add(route.category);
  });
  return Array.from(categories);
};
