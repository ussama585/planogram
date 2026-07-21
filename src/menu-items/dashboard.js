// assets
import { IconDashboard, IconMap2, IconBuildingStore, IconBrand4chan, IconCategory, IconBox, IconTableDashed } from '@tabler/icons-react';

// constant
const icons = { IconDashboard };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
  id: 'dashboard',
  // title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'Dashboard',
      type: 'item',
      url: '/',
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
    {
      id: 'categories',
      title: 'Categories',
      type: 'item',
      url: '/categories',
      icon: IconCategory,
      breadcrumbs: false
    },
    {
      id: 'brands',
      title: 'Brands',
      type: 'item',
      url: '/brands',
      icon: IconBrand4chan,
      breadcrumbs: false
    },
    {
      id: 'products',
      title: 'Products',
      type: 'item',
      url: '/products',
      icon: IconBox,
      breadcrumbs: false
    },
    {
      id: 'tables',
      title: 'Tables',
      type: 'item',
      url: '/tables',
      icon: IconTableDashed,
      breadcrumbs: false
    },
  ]
};

export default dashboard;
