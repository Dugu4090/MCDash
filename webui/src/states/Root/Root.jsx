import {Navigate, Outlet} from "react-router-dom";
import {TokenContext} from "@contexts/Token";
import {useContext, useState} from "react";
import {Box, useMediaQuery, useTheme} from "@mui/material";
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
                <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
                <Sidebar open={sidebarOpen} onClose={toggleSidebar} isMobile={isMobile} />
                <Box component="main" sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    ml: sidebarOpen && !isMobile ? "240px" : 0,
                    width: '100%',
                    transition: theme.transitions.create(['margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: 300,
                    }),
                    mt: 8,
                }}>
                    <Outlet />
                </Box>
            </Box>}
        </>
    )
}