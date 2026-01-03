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
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const {tokenValid, serverOnline} = useContext(TokenContext);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <>
            {tokenValid === false && <Navigate to="/login" />}

            {tokenValid === null && serverOnline === false && <ServerDown />}

            {tokenValid && <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <Sidebar open={sidebarOpen} onClose={toggleSidebar} isMobile={isMobile} />
                <Box component="main" sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    ml: sidebarOpen && !isMobile ? "240px" : 0,
                    width: sidebarOpen && !isMobile ? `calc(100% - 240px)` : '100%',
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    mt: 8,
                    minHeight: 'calc(100vh - 64px)',
                }}>
                    <Outlet />
                </Box>
            </Box>}
        </>
    )
}