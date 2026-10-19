import { createTheme } from '@mui/material/styles';

const fontStack = '"Inter", "Segoe UI", Arial, sans-serif';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0f766e',
      light: '#0d9488',
      dark: '#115e59',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: '#94a3b8',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: fontStack,

    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,

    h1: {
      fontFamily: fontStack,
      fontSize: '28px',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: fontStack,
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: fontStack,
      fontSize: '22px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: fontStack,
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: fontStack,
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h6: {
      fontFamily: fontStack,
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: 1.4,
    },

    subtitle1: {
      fontFamily: fontStack,
      fontSize: '16px',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontFamily: fontStack,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.5,
    },

    body1: {
      fontFamily: fontStack,
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: fontStack,
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
    },

    button: {
      fontFamily: fontStack,
      fontSize: '14px',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontFamily: fontStack,
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    overline: {
      fontFamily: fontStack,
      fontSize: '12px',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: fontStack,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '15px',
        },
        input: {
          fontFamily: fontStack,
          fontSize: '15px',
          fontWeight: 400,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '13px',
          fontWeight: 400,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 400,
        },
        head: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '13px',
          fontWeight: 500,
        },
        label: {
          fontFamily: fontStack,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '14px',
          fontWeight: 400,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: fontStack,
          fontSize: '20px',
          fontWeight: 600,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        fontFamily: fontStack,
      },
    },
  },
});

export default theme;
