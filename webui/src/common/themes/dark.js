import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3b82f6',
        },
        background: {
            default: '#0f172a',
            darker: "#020617",
            card: '#1e293b',
        }
    },
    components: {
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1e293b'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e293b'
                }
            }
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1e293b'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 15,
                    margin: 4,
                    marginLeft: 7,
                    marginRight: 7
                }
            }
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        width: 8,
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        minHeight: 24,
                        backgroundColor: "#334155",
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: "#475569"
                    }
                },
            },
        },
    },
    shape: {
        borderRadius: 8,
    }
});

export default theme;