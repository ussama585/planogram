import { createRoot } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

// project imports
import App from 'App';
import * as serviceWorker from 'serviceWorker';
import reportWebVitals from 'reportWebVitals';
import { ConfigProvider } from 'contexts/ConfigContext';

// style + assets
import 'assets/scss/style.scss';

// ==============================|| REACT DOM RENDER ||============================== //

const container = document.getElementById('root');
const root = createRoot(container);
const queryClient = new QueryClient();

root.render(
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <App />
      </SnackbarProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

serviceWorker.unregister();
reportWebVitals();