import {Navigate, Outlet} from "react-router-dom";
import {TokenContext} from "@contexts/Token";
import {useContext, useState} from "react";
import {Box, Toolbar, useMediaQuery, useTheme} from "@mui/material";
import Sidebar from "@/states/Root/components/Sidebar";
import Header from "@/states/Root/components/Header";
import ServerDown from "@/states/Root/pages/ServerDown";

export const Root = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const {tokenValid, serverOnline} = useContext(TokenContext);

    return (
        <>
            {tokenValid === false && <Navigate to="/login" />}

            {tokenValid === null && serverOnline === false && <ServerDown />}

            {tokenValid && <Box sx={{ display: 'flex', overflow: 'hidden', minHeight: '100vh' }}>
                <Header mobileOpen={mobileOpen} toggleOpen={() => setMobileOpen(current => !current)} />
                <Sidebar mobileOpen={mobileOpen} toggleOpen={() => setMobileOpen(current => !current)} isMobile={isMobile} />
                <Box component="main" sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    ml: isMobile ? 0 : "240px",
                    width: isMobile ? '100%' : `calc(100% - 240px)`,
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.easeOut,
                        duration: 300,
                    }),
                }}>
                    <Toolbar />
                    <Outlet />
                </Box>
            </Box>}
        </>
    )
}