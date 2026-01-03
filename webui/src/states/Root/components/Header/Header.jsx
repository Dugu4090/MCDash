import {AppBar, Avatar, IconButton, Stack, Toolbar, Typography, useTheme} from "@mui/material";
import {Menu as MenuIcon} from "@mui/icons-material";
import {useEffect, useState} from "react";
import {sidebar} from "@/common/routes/server.jsx";
import {useLocation} from "react-router-dom";
import AccountMenu from "@/states/Root/components/Header/components/AccountMenu";
import {t} from "i18next";

const drawerWidth = 240;

export const Header = ({sidebarOpen, toggleSidebar}) => {
    const theme = useTheme();
    const location = useLocation();

    const retrieveUsername = () => atob(localStorage.getItem("token")).split(":")[0];

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        document.title = "MCDash - " + getTitleByPath();
    }, [location]);

    const getTitleByPath = () => {
        const route = sidebar.find((route) => location.pathname.startsWith(route.path) && route.path !== "/");
        if (route) return route.name();
        return t("nav.overview");
    }

    return (
        <AppBar position="fixed" sx={{ 
            width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
            ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            zIndex: theme.zIndex.drawer + 1,
        }}>
            <AccountMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>

            <Toolbar>
                <IconButton aria-label="toggle sidebar" edge="start" onClick={toggleSidebar}
                            sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap>{getTitleByPath()}</Typography>

                <Stack sx={{ ml: "auto" }} direction="row">
                    <IconButton id="menu" onClick={() => setMenuOpen(true)}>
                        <Avatar src={"https://mc-heads.net/avatar/" + retrieveUsername()} alt={retrieveUsername()}
                                sx={{ width: 32, height: 32 }}/>
                    </IconButton>
                </Stack>
            </Toolbar>
        </AppBar>
    )
}