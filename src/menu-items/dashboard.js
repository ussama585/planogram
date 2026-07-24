// assets
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import AppleIcon from '@mui/icons-material/Apple';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ViewListIcon from '@mui/icons-material/ViewList';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const authState = JSON.parse(localStorage.getItem('auth-state') || '{}');
const userType = authState?.state?.userType || '';

const dashboard = {
  id: 'dashboard',
  // title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/',
      icon: DashboardIcon,
      breadcrumbs: false
    },
    {
      id: 'region',
      title: 'Region',
      type: 'item',
      url: '/region',
      icon: MapIcon,
      breadcrumbs: true
    },
    {
      id: 'store',
      title: 'Store',
      type: 'item',
      url: '/store',
      icon: StoreIcon,
      breadcrumbs: true
    },
    {
      id: 'categories',
      title: 'Categories',
      type: 'item',
      url: '/categories',
      icon: CategoryIcon,
      breadcrumbs: true
    },
    {
      id: 'brands',
      title: 'Brands',
      type: 'item',
      url: '/brands',
      icon: AppleIcon,
      breadcrumbs: true
    },
    {
      id: 'products',
      title: 'Products',
      type: 'item',
      url: '/products',
      icon: ViewInArIcon,
      breadcrumbs: true
    },
    {
      id: 'tables',
      title: 'Tables',
      type: 'item',
      url: '/tables',
      icon: ViewListIcon,
      breadcrumbs: true
    },
    {
      id: 'security-types',
      title: 'Security Type',
      type: 'item',
      url: '/security-types',
      icon: AdminPanelSettingsIcon,
      breadcrumbs: true
    },
    {
      id: 'display-record',
      title: 'Display Record',
      type: 'item',
      url: '/display-record',
      icon: StorageIcon,
      breadcrumbs: true
    },
    {
      id: 'user-management',
      title: 'User Management',
      type: 'item',
      url: '/user-management',
      icon: ManageAccountsIcon,
      breadcrumbs: true
    },
  ]
};

export default dashboard;
