// assets
import KeyIcon from '@mui/icons-material/Key';

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const pages = {
  id: 'pages',
  title: 'Pages',
  caption: 'Pages Caption',
  icon: KeyIcon,
  type: 'group',
  children: [
    {
      id: 'authentication',
      title: 'Authentication',
      type: 'collapse',
      icon: KeyIcon,
      children: [
        {
          id: 'login',
          title: 'login',
          type: 'item',
          url: '/signin',
          target: true
        },
        {
          id: 'register',
          title: 'register',
          type: 'item',
          url: '/signup',
          target: true
        }
      ]
    }
  ]
};

export default pages;
