import {
    Divider, Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Typography,
    useTheme
} from "@mui/material";
import {sidebar} from "@/common/routes/server.jsx";
import {useLocation, useNavigate} from "react-router-dom";

const drawerWidth = 240;

export const Sidebar = ({open, onClose, isMobile}) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const isSelected = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    }

    const handleNavigate = (path) => {
        navigate(path.replace("/*", ""));
        if (isMobile) onClose();
    }

    const drawerContent = (
        <>
            <Toolbar sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 2
            }}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <img src="/assets/img/favicon.png" alt="MCDash" width="40px" height="40px" style={{ borderRadius: 8 }} />
                    <Typography variant="h6" noWrap fontWeight={700}>MCDash</Typography>
                </Stack>
            </Toolbar>

            <Divider />

            <List sx={{ px: 1, py: 1 }}>
                {sidebar.map((route) => (
                    <ListItem key={route.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton 
                            selected={isSelected(route.path)}
                            onClick={() => handleNavigate(route.path)}
                            sx={{
                                borderRadius: 2,
                                transition: theme.transitions.create(['background-color', 'transform'], {
                                    easing: theme.transitions.easing.easeInOut,
                                    duration: 200,
                                }),
                                '&:hover': {
                                    transform: 'translateX(4px)',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'white',
                                    },
                                    '& .MuiListItemText-primary': {
                                        color: 'white',
                                        fontWeight: 600,
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{route.icon}</ListItemIcon>
                            <ListItemText primary={route.name()} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    );

    return (
        <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': { 
                    boxSizing: 'border-box', 
                    width: drawerWidth,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    transition: theme.transitions.create(['transform', 'width'], {
                        easing: theme.transitions.easing.easeOut,
                        duration: 300,
                    }),
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}