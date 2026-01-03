import {dispatchCommand, request} from "@/common/utils/RequestUtil";
import React, {useEffect, useRef, useState} from "react";
import {Terminal} from "xterm";
import {FitAddon} from "xterm-addon-fit";

import "xterm/css/xterm.css";
import "./custom.css";
import {Box, IconButton, Stack, TextField, Typography, Tooltip, useTheme} from "@mui/material";
import {Replay, Send} from "@mui/icons-material";
import {t} from "i18next";
import ActionConfirmDialog from "@components/ActionConfirmDialog";

export const Console = () => {
    const theme = useTheme();
    const [consoleHistory, setConsoleHistory] = useState(JSON.parse(localStorage.getItem("consoleHistory")) || []);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(consoleHistory.length);
    const [restartOpen, setRestartOpen] = useState(false);

    const pushHistory = (command) => {
        if (consoleHistory.length >= 25) consoleHistory.splice(0, 1);
        consoleHistory.push(command);
        setConsoleHistory(consoleHistory);
        localStorage.setItem("consoleHistory", JSON.stringify(consoleHistory));
        setCurrentHistoryIndex(consoleHistory.length);

        setCommand("");
    }

    const onHistoryKeyUp = (e) => {
        if (e.key === "ArrowUp") {
            if (currentHistoryIndex > 0) {
                setCurrentHistoryIndex(currentHistoryIndex - 1);
                setCommand(consoleHistory[currentHistoryIndex - 1]);
            }
        } else if (e.key === "ArrowDown") {
            setCurrentHistoryIndex(currentHistoryIndex < consoleHistory.length - 1 ? currentHistoryIndex + 1 : consoleHistory.length);
            setCommand(currentHistoryIndex < consoleHistory.length - 1 ? consoleHistory[currentHistoryIndex + 1] : "");
        }
    }

    const executeCommand = (event) => {
        event.preventDefault();
        dispatchCommand(command).then(() => pushHistory(command));
    }

    const handleRestart = async () => {
        return (await request("action/reload", "POST")).status === 200;
    }

    const terminalRef = useRef(null);
    const [command, setCommand] = useState("");

    useEffect(() => {
        const terminal = new Terminal({
            fontSize: 14,
            theme: {
                background: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f1f1',
                foreground: theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
            }
        });

        let currentLine = 1;

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        const resize = () => fitAddon.fit();

        window.addEventListener("resize", resize);

        terminal.open(terminalRef.current);
        fitAddon.fit();

        const updateConsole = () => {
            request("console/?startLine=" + currentLine).then(async (r) => {
                const lines = (await r.text()).split("\n");
                let lineAmount = lines.length;
                if (lines.length === 1 && lines[0] === "") return;

                if (currentLine === 0 && lines.length >= 100) lines.splice(0, lines.length - 100);

                lines.forEach((line) => {
                    const logLevelRegex = /\[(\d{2}:\d{2}:\d{2})] \[.*?\/(INFO|WARN(ING)?|ERROR)]: /;

                    line = line.replace(logLevelRegex, (match, time, level) => {
                        let colorCode = '\x1b[0m';
                        if (level === 'INFO') colorCode = '\x1b[34m';
                        else if (level === 'WARN' || level === 'WARNING') colorCode = '\x1b[33m';
                        else if (level === 'ERROR') colorCode = '\x1b[31m';

                        return `[${time}] [${colorCode}${level}\x1b[0m]: ${colorCode === '\x1b[34m' ? '' : colorCode}`;
                    });

                    terminal.writeln(line + '\x1b[0m');
                });

                currentLine += lineAmount;
            });
        };

        const interval = setInterval(() => {
            updateConsole();
        }, 2000);

        updateConsole();

        return () => {
            terminal.dispose();
            window.removeEventListener("resize", resize);
            clearInterval(interval);
        };
    }, [theme]);

    return (
        <>
            <ActionConfirmDialog open={restartOpen} setOpen={setRestartOpen} title={t("overview.reload.title")}
                                 description={t("overview.reload.text")} buttonText={t("overview.reload.yes")}
                                 onClick={handleRestart} successMessage={t("overview.reload.success")}/>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1, mb: 2}}>
                <Typography variant="h5" fontWeight={500}>{t("nav.console")}</Typography>
                <Tooltip title={t("overview.reload.button")}>
                    <IconButton onClick={() => setRestartOpen(true)} color="warning" sx={{
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

            <Box ref={terminalRef} sx={{
                mt: 2, 
                width: "85vw", 
                borderRadius: 1.5, 
                overflow: "hidden",
                transition: theme.transitions.create(['background-color'], {
                    easing: theme.transitions.easing.easeInOut,
                    duration: 300,
                }),
            }}/>

            <Stack component="form" direction="row" alignItems="center" gap={1} sx={{mt: 3}} onSubmit={executeCommand}>
                <TextField value={command} required fullWidth label={t("console.command")}
                           autoFocus onChange={(e) => setCommand(e.target.value)} onKeyUp={onHistoryKeyUp}
                           sx={{
                               '& .MuiOutlinedInput-root': {
                                   transition: theme.transitions.create(['box-shadow'], {
                                       easing: theme.transitions.easing.easeInOut,
                                       duration: 200,
                                   }),
                                   '&:hover': {
                                       boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
                                   },
                                   '&.Mui-focused': {
                                       boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
                                   },
                               },
                           }}/>

                <IconButton variant="contained" type="submit" sx={{
                    transition: theme.transitions.create(['transform', 'background-color'], {
                        easing: theme.transitions.easing.easeInOut,
                        duration: 200,
                    }),
                    '&:hover': {
                        transform: 'scale(1.1)',
                    },
                }}>
                    <Send/>
                </IconButton>
            </Stack>
        </>
    );
};