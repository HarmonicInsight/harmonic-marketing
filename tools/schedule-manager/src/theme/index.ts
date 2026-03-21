import { createTheme } from '@mui/material';

const ivory = {
  50: '#fefdfb',
  100: '#fdf9f3',
  200: '#faf3e6',
  300: '#f5ead4',
  400: '#efe0c2',
  500: '#e8d5af',
  600: '#d4b978',
  700: '#b89a56',
  800: '#8a7340',
  900: '#5d4e2c',
};

const brown = {
  50: '#f8f5f2',
  100: '#ede6df',
  200: '#d9cec3',
  300: '#bfad9c',
  400: '#a08a75',
  500: '#7a6652',
  600: '#5d4e3f',
  700: '#4a3e32',
  800: '#3b3228',
  900: '#2d261e',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: brown[600],
      light: brown[400],
      dark: brown[800],
      contrastText: '#fff',
    },
    secondary: {
      main: '#c17817',
      light: '#e8a54a',
      dark: '#8a5510',
    },
    background: {
      default: ivory[100],
      paper: '#ffffff',
    },
    text: {
      primary: brown[800],
      secondary: brown[500],
    },
    success: { main: '#4a7c59' },
    warning: { main: '#c17817' },
    error: { main: '#b5453a' },
    divider: ivory[400],
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: brown[800] },
    h5: { fontWeight: 700, color: brown[800] },
    h6: { fontWeight: 600, color: brown[700] },
    subtitle1: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${ivory[400]}`,
          boxShadow: '0 1px 3px rgba(93,78,44,0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: brown[600],
            color: '#fff',
            fontWeight: 600,
          },
        },
      },
    },
  },
});

export const colors = { ivory, brown };
