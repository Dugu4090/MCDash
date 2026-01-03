import {AppBar, Avatar, IconButton, Stack, Toolbar, Typography} from "@mui/material";
import {Menu as MenuIcon} from "@mui/icons-material";
import {useEffect, useState} from "react";
import {sidebar} from "@/common/routes/server.jsx";
import {useLocation} from "react-router-dom";
import AccountMenu from "@/states/Root/components/Header/components/AccountMenu";
import {t} from "i18next";

export const Header = ({toggleSidebar, isMobile}) => {
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
            width: '100%',
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: 1200,
        }}>
            <AccountMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>

            <Toolbar>
                {isMobile && (
                    <IconButton aria-label="toggle sidebar" edge="start" onClick={toggleSidebar}
                                sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Typography variant="h6">{getTitleByPath()}</Typography>

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