import {Box, Chip, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography} from "@mui/material";
import {Close, CreateNewFolder, UploadFile} from "@mui/icons-material";
import NewFolderDialog from "@/states/Root/pages/Files/components/FileHeader/components/NewFolderDialog";
import React, {useState} from "react";
import {uploadRequest} from "@/common/utils/RequestUtil.js";
import {t} from "i18next";

export const FileHeader = ({currentFile, directory, setDirectory, setCurrentFile, updateFiles, setSnackbar}) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const [uploadProgress, setUploadProgress] = useState({active: false, loaded: 0, total: 0, percent: 0});

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const upload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return;

            setUploadProgress({active: true, loaded: 0, total: file.size, percent: 0});

            uploadRequest("filebrowser/file?path=." + directory, file, (loaded, total) => {
                setUploadProgress({
                    active: true,
                    loaded: loaded,
                    total: total,
                    percent: Math.round((loaded / total) * 100)
                });
            }).then(() => {
                updateFiles();
                setSnackbar(t("files.file_uploaded"));
                setUploadProgress({active: false, loaded: 0, total: 0, percent: 0});
            }).catch(() => {
                setSnackbar(t("files.upload_failed"));
                setUploadProgress({active: false, loaded: 0, total: 0, percent: 0});
            });
        }
        input.click();
    }

    return (
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, mb: 2}}>
            <NewFolderDialog open={dialogOpen} setOpen={setDialogOpen} updateFiles={updateFiles}
                             directory={directory} setSnackbar={setSnackbar}/>
            <Typography variant="h5" fontWeight={500} sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1}}>
                {t("nav.files")}
                {currentFile === null && directory.split("/").splice(0, directory.split("/").length - 1).map((dir, index) => (
                    <Chip key={index} label={dir || "/"} color="secondary" 
                          onClick={() => setDirectory(directory.substring(0, directory.indexOf(dir) + dir.length + 1))}/>
                ))}
            </Typography>

            {uploadProgress.active && (
                <Box sx={{display: "flex", alignItems: "center", gap: 2, minWidth: 200}}>
                    <Box sx={{flexGrow: 1}}>
                        <LinearProgress variant="determinate" value={uploadProgress.percent} sx={{height: 8, borderRadius: 4}}/>
                        <Stack direction="row" justifyContent="space-between" sx={{mt: 0.5}}>
                            <Typography variant="caption">{uploadProgress.percent}%</Typography>
                            <Typography variant="caption">{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}</Typography>
                        </Stack>
                    </Box>
                </Box>
            )}

            {currentFile !== null &&
                <IconButton color="secondary" onClick={() => setCurrentFile(null)}><Close/></IconButton>}

            {currentFile === null && <Stack direction="row" spacing={1}>
                <Tooltip title={t("files.upload_file")}><IconButton color="secondary" onClick={upload}>
                    <UploadFile/></IconButton></Tooltip>
                <Tooltip title={t("files.create_folder.title")}><IconButton color="secondary" onClick={() => setDialogOpen(true)}>
                    <CreateNewFolder/></IconButton></Tooltip>
            </Stack>}
        </Box>
    );
}