import {Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography} from "@mui/material";
import {sidebar} from "@/common/routes/server.jsx";
import {useLocation, useNavigate} from "react-router-dom";

const drawerWidth = 240;

export const Sidebar = ({isMobile}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const isSelected = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    }

    const handleNavigate = (path) => {
        navigate(path.replace("/*", ""));
    }

    const drawerContent = (
        <>
            <Toolbar sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 2,
                minHeight: '64px',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <img src="/assets/img/favicon.png" alt="MCDash" width="36px" height="36px" style={{ borderRadius: 6 }} />
                    <Typography variant="h6" fontWeight={700}>MCDash</Typography>
                </Stack>
            </Toolbar>

            <List sx={{ px: 1, py: 2 }}>
                {sidebar.map((route) => (
                    <ListItem key={route.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton 
                            selected={isSelected(route.path)}
                            onClick={() => handleNavigate(route.path)}
                            sx={{
                                borderRadius: 1,
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{route.icon}</ListItemIcon>
                            <ListItemText primary={route.name()} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    );

    return (
        <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': { 
                    boxSizing: 'border-box', 
                    width: drawerWidth,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}