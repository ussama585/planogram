// assets
import { IconDashboard, IconMap2, IconBuildingStore } from '@tabler/icons-react';

// constant
const icons = { IconDashboard };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
  id: 'dashboard',
  title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.IconDashboard,
      breadcrumbs: false
    },
    {
      id: 'region',
      title: 'Region',
      type: 'item',
      url: '/region',
      icon: IconMap2,
      breadcrumbs: false
    },
    {
      id: 'store',
      title: 'Store',
      type: 'item',
      url: '/store',
      icon: IconBuildingStore,
      breadcrumbs: false
    },
    // {
    //   id: 'admin-panel',
    //   title: 'Admin Panel',
    //   type: 'item',
    //   url: '/admin',
    //   icon: icons.IconDashboard,
    //   breadcrumbs: false
    // }
  ]
};

export default dashboard;
