import {IconButton, Stack, Tooltip, Typography} from "@mui/material";
import {t} from "i18next";
import {AvTimer, Group, Memory, Replay, Save} from "@mui/icons-material";
import StatisticBox from "@/states/Root/pages/Overview/components/StatisticBox";
import ChartBox from "@/states/Root/pages/Overview/components/ChartBox";
import ActionConfirmDialog from "@components/ActionConfirmDialog";
import {useContext, useState} from "react";
import {StatsContext} from "@/states/Root/pages/Overview/contexts/StatsContext";
import {request} from "@/common/utils/RequestUtil.js";
import {useTheme} from "@mui/material";

export const OverviewArea = () => {
    const theme = useTheme();
    const [reloadOpen, setReloadOpen] = useState(false);
    const {stats} = useContext(StatsContext);

    const handleReload = async () => {
        return (await request("action/reload", "POST")).status === 200;
    }

    const toGB = (bytes) => {
        return parseFloat((bytes / 1024 / 1024 / 1024).toFixed(2));
    }

    return (
        <>
            <ActionConfirmDialog open={reloadOpen} setOpen={setReloadOpen} title={t("overview.reload.title")}
                                 description={t("overview.reload.text")} buttonText={t("overview.reload.yes")}
                                 onClick={handleReload} successMessage={t("overview.reload.success")}/>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                <Typography variant="h5" fontWeight={500}>{t("nav.overview")}</Typography>
                <Tooltip title={t("overview.reload.button")}>
                    <IconButton onClick={() => setReloadOpen(true)} color="warning" sx={{
                        transition: theme.transitions.create(['transform', 'background-color'], {
                            easing: theme.transitions.easing.easeInOut,
                            duration: 200,
                        }),
                        '&:hover': {
                            transform: 'rotate(180deg)',
                            backgroundColor: 'warning.light',
                        },
                    }}>
                        <Replay/>
                    </IconButton>
                </Tooltip>
            </Stack>

            <Stack direction="row" sx={{mt: 2, flexDirection: {xs: "column", lg: "row"}}} gap={2}>
                <StatisticBox title={t("nav.players")} value={stats[stats.length - 1]?.online_players + " / "
                    + stats[stats.length - 1]?.max_players} icon={<Group/>} color="success"/>

                <StatisticBox title={t("overview.cpu")} value={stats[stats.length - 1]?.processors}
                               icon={<Memory/>} color="success"/>

                <StatisticBox title={t("overview.disk")} value={toGB(stats[stats.length - 1]?.used_space) + " / "
                    + toGB(stats[stats.length - 1]?.total_space) + " GB"} icon={<Save/>} color="success"/>

                <ChartBox title={t("overview.tps")} value={stats.map((s) => s.tps)} icon={<AvTimer />}
                          color="success"/>

                <ChartBox title={t("overview.ram")} value={stats.map((s) => toGB(s.used_memory))}
                          formatter={(v) => `${v} GB / ${toGB(stats[stats.length - 1]?.total_memory)} GB`}
                          icon={<Memory />} color="success"/>
            </Stack>
        </>
    );
}