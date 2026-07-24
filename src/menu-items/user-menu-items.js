// assets
import DashboardIcon from '@mui/icons-material/Dashboard';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const userDashboard = {
  id: 'dashboard',
  // title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'Dashboard',
      type: 'item',
      url: '/',
      icon: DashboardIcon,
      breadcrumbs: false
    },
  ]
};

export default userDashboard;
