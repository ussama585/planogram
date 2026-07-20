import { useEffect, useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { gridSpacing } from 'store/constant';

// assets
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const stats = [
  {
    title: 'Active users',
    value: '1,284',
    change: '+12.4%',
    icon: <GroupOutlinedIcon />,
    color: 'primary.main'
  },
  {
    title: 'Orders today',
    value: '328',
    change: '+8.1%',
    icon: <Inventory2OutlinedIcon />,
    color: 'secondary.main'
  },
  {
    title: 'Revenue',
    value: '$42.8k',
    change: '+5.6%',
    icon: <AssessmentOutlinedIcon />,
    color: 'success.main'
  },
  {
    title: 'Alerts',
    value: '14',
    change: 'Needs review',
    icon: <NotificationsActiveOutlinedIcon />,
    color: 'warning.main'
  }
];

const activityFeed = [
  { title: 'New shipment scheduled', detail: 'Warehouse B confirmed delivery for 12 pallets.', time: '10 min ago' },
  { title: 'Inventory threshold reached', detail: 'SKU-1042 is below the reorder point.', time: '32 min ago' },
  { title: 'Support ticket updated', detail: 'Priority issue for North region was escalated.', time: '1 hr ago' }
];

const teamMembers = [
  { name: 'Alicia Chen', role: 'Operations lead', status: 'Online' },
  { name: 'Marcus Lee', role: 'Inventory analyst', status: 'Away' },
  { name: 'Rina Patel', role: 'Customer success', status: 'Online' }
];

export default function AdminPanel() {
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Grid container spacing={gridSpacing}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <div>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>
              Admin panel
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control operations, monitor activity, and manage team priorities from one place.
            </Typography>
          </div>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<SettingsOutlinedIcon />}>
              Settings
            </Button>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />}>
              Create report
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {stats.map((item) => (
        <Grid key={item.title} size={{ xs: 12, sm: 6, lg: 3 }}>
          <MainCard contentSX={{ p: 2.5 }} sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <div>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color={item.color}>
                  {item.change}
                </Typography>
              </div>
              <Avatar sx={{ bgcolor: `${item.color}22`, color: item.color, width: 44, height: 44 }}>
                {item.icon}
              </Avatar>
            </Stack>
          </MainCard>
        </Grid>
      ))}

      <Grid size={{ xs: 12, lg: 8 }}>
        <MainCard title="Operations snapshot" contentSX={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SubCard title="Today’s focus" contentSX={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your team is trending ahead of plan with healthy fulfillment coverage and faster response times.
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Fulfillment rate</Typography>
                    <Chip label="94%" color="success" size="small" />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Average response time</Typography>
                    <Chip label="18m" color="primary" size="small" />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Pending approvals</Typography>
                    <Chip label="7" color="warning" size="small" />
                  </Stack>
                </Stack>
              </SubCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SubCard title="Quick actions" contentSX={{ p: 2 }}>
                <Stack spacing={1.2}>
                  <Button variant="outlined" fullWidth>
                    Review pending orders
                  </Button>
                  <Button variant="outlined" fullWidth>
                    Invite team member
                  </Button>
                  <Button variant="outlined" fullWidth>
                    Download performance report
                  </Button>
                </Stack>
              </SubCard>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <MainCard title="Recent activity" contentSX={{ p: 0 }}>
          <List disablePadding>
            {activityFeed.map((item, index) => (
              <div key={item.title}>
                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {item.detail}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.time}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < activityFeed.length - 1 && <Divider variant="inset" component="li" />}
              </div>
            ))}
          </List>
        </MainCard>
      </Grid>

      <Grid size={12}>
        <MainCard title="Team availability" contentSX={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.name} hover>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <Chip label={member.status} color={member.status === 'Online' ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MainCard>
      </Grid>
    </Grid>
  );
}
