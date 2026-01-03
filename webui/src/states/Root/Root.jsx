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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const {tokenValid, serverOnline} = useContext(TokenContext);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <>
            {tokenValid === false && <Navigate to="/login" />}

            {tokenValid === null && serverOnline === false && <ServerDown />}

            {tokenValid && <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header toggleSidebar={toggleSidebar} isMobile={isMobile} sidebarOpen={sidebarOpen} />
                <Sidebar isMobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <Box component="main" sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    ml: isMobile ? 0 : "240px",
                    width: isMobile ? '100%' : 'calc(100% - 240px)',
                    mt: 8,
                    transition: 'margin 0.2s ease-in-out, width 0.2s ease-in-out',
                }}>
                    <Outlet />
                </Box>
            </Box>}
        </>
    )
}