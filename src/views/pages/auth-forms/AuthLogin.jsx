import { useState } from 'react';
import { Formik } from 'formik';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import useAppStore from 'store/appStore';
import { loginUser } from 'api/authApi';
import loginSchema from './loginSchema';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/material/CircularProgress';

// ===============================|| JWT - LOGIN ||=============================== //

export default function AuthLogin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const setAuth = useAppStore((state) => state.setAuth);

  const [checked, setChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const authPayload = {
        accessToken: data?.access || '',
        id: data?.id || null,
        email: data?.email || '',
        name: data?.name || '',
        refreshToken: data?.refresh || '',
        userType: data?.user_type || 'admin'
      };

      setAuth(authPayload);
      navigate('/');
    },
    onError: () => {
      // You can show an error snackbar here later.
    }
  });

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={(values) => {
        loginMutation.mutate({
          email: values.email,
          password: values.password
        });
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ ...theme.typography.customInput }} error={Boolean(touched.email && errors.email)}>
            <InputLabel htmlFor="outlined-adornment-email-login">Email Address / Username</InputLabel>
            <OutlinedInput
              id="outlined-adornment-email-login"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              name="email"
              inputProps={{}}
            />
            {touched.email && errors.email && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.email}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth sx={{ ...theme.typography.customInput }} error={Boolean(touched.password && errors.password)}>
            <InputLabel htmlFor="outlined-adornment-password-login">Password</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password-login"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              name="password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              inputProps={{}}
              label="Password"
            />
            {touched.password && errors.password && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.password}
              </Typography>
            )}
          </FormControl>

          {/* <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid>
              <FormControlLabel
                control={<Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />}
                label="Keep me logged in"
              />
            </Grid>
            <Grid>
              <Typography variant="subtitle1" component={Link} to="/forgot-password" color="secondary" sx={{ textDecoration: 'none' }}>
                Forgot Password?
              </Typography>
            </Grid>
          </Grid> */}
          <Box sx={{ mt: 2 }}>
            <AnimateButton>
              <Button
                color="secondary"
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loginMutation.isPending}
                startIcon={loginMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </AnimateButton>
          </Box>
        </form>
      )}
    </Formik>
  );
}
