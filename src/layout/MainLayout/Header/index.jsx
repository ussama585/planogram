// material-ui
import { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';

// project imports
import LogoSection from '../LogoSection';
import ProfileSection from './ProfileSection';
import useAppStore from 'store/appStore';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets
import { IconMenu2 } from '@tabler/icons-react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const { accessToken } = useAppStore();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  useEffect(() => {
    if (!accessToken) {
      return;
    }
  }, [accessToken]);

  return (
    <>
      {/* logo & toggler button */}
      <Box sx={{ width: downMD ? 'auto' : 228, display: 'flex', alignItems: "center" }}>
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <div style={{ display: "flex", alignItems: 'center' }}>
            <div style={{ color: "#fff", fontSize: "21px", fontWeight: "bold", marginRight: '15px' }}>st<em style={{ color: '#ff6a39', fontStyle: 'normal' }}>c</em></div>
            <div style={{ width: "1px", height: "22px", background: 'rgba(255,255,255,0.2)', marginRight: '15px' }}></div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', width: 'max-content', marginRight: '15px' }}>Planogram Dashboard · 121 Marketing</div>
          </div>
          {/* <LogoSection /> */}
        </Box>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            overflow: 'hidden',
            transition: 'all .2s ease-in-out',
            bgcolor: 'secondary.light',
            color: 'secondary.dark',
            '&:hover': {
              bgcolor: 'secondary.dark',
              color: 'secondary.light'
            }
          }}
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          color="inherit"
        >
          <IconMenu2 stroke={1.5} size="20px" />
        </Avatar>
      </Box>

      {/* header search */}
      {/* <SearchSection /> */}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />

      {/* notification */}
      {/* <NotificationSection /> */}

      {/* profile */}
      {accessToken ? (
        <ProfileSection />
      ) : (
        <Button component={RouterLink} to="/signin" variant="outlined" size="small">
          Sign in
        </Button>
      )}
    </>
  );
}
