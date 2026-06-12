import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import {
  Home,
  Men,
  Women,
  Collection,
  Sale,
  Cart,
  Checkout,
  Account,
  Contact,
  LookBook,
  OurStory,
  OrderDetail,
} from './pages';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6e7051',
      dark: '#5a5c42',
    },
    secondary: {
      main: '#262b2c',
      light: '#3a4042',
    },
    background: {
      default: '#ffffff',
      paper: '#f1f1ef',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="men" element={<Men />} />
            <Route path="women" element={<Women />} />
            <Route path="collection" element={<Collection />} />
            <Route path="sale" element={<Sale />} />
            <Route path="cart" element={<Cart />} />
            <Route path="account" element={<Account />} />
            <Route path="contact" element={<Contact />} />
            <Route path="lookbook" element={<LookBook />} />
            <Route path="ourstory" element={<OurStory />} />

            {/* Protected Routes */}
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="order/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
