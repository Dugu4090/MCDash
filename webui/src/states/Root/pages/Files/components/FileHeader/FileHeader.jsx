import {Box, Chip, FormControlLabel, IconButton, LinearProgress, Stack, Switch, Tooltip, Typography} from "@mui/material";
import {Close, CreateNewFolder, UploadFile, Archive, Unarchive, Delete, Download, CheckBox} from "@mui/icons-material";
import NewFolderDialog from "@/states/Root/pages/Files/components/FileHeader/components/NewFolderDialog";
import React, {useState} from "react";
import {uploadRequest} from "@/common/utils/RequestUtil.js";
import {t} from "i18next";

export const FileHeader = ({currentFile, directory, setDirectory, setCurrentFile, updateFiles, setSnackbar,
                           selectedCount, selectionMode, setSelectionMode, onSelectAll, onArchive, onUnarchive,
                           onDelete, onDownload, allSelected}) => {
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
        input.multiple = true;
        input.onchange = () => {
            const fileList = Array.from(input.files);
            if (fileList.length === 0) return;

            if (fileList.length === 1) {
                const file = fileList[0];
                setUploadProgress({active: true, loaded: 0, total: file.size, percent: 0});
                uploadRequest("filebrowser/file?path=." + directory, file, (loaded, total) => {
                    setUploadProgress({active: true, loaded, total, percent: Math.round((loaded / total) * 100)});
                }).then(() => {
                    updateFiles();
                    setSnackbar(t("files.file_uploaded"));
                    setUploadProgress({active: false, loaded: 0, total: 0, percent: 0});
                }).catch(() => {
                    setSnackbar(t("files.upload_failed"));
                    setUploadProgress({active: false, loaded: 0, total: 0, percent: 0});
                });
            } else {
                setSnackbar(t("files.uploading_multiple"));
                let completed = 0;
                fileList.forEach(file => {
                    uploadRequest("filebrowser/file?path=." + directory, file).then(() => {
                        completed++;
                        if (completed === fileList.length) {
                            updateFiles();
                            setSnackbar(t("files.files_uploaded"));
                        }
                    });
                });
            }
        }
        input.click();
    }

    return (
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, mb: 2, flexWrap: "wrap", gap: 2}}>
            <NewFolderDialog open={dialogOpen} setOpen={setDialogOpen} updateFiles={updateFiles}
                             directory={directory} setSnackbar={setSnackbar}/>
            <Typography variant="h5" fontWeight={500} sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1}}>
                {t("nav.files")}
                {currentFile === null && directory.split("/").splice(0, directory.split("/").length - 1).map((dir, index) => (
                    <Chip key={index} label={dir || "/"} color="secondary" 
                          onClick={() => setDirectory(directory.substring(0, directory.indexOf(dir) + dir.length + 1))}/>
                ))}
            </Typography>

            {selectionMode ? (
                <Stack direction="row" alignItems="center" gap={1}>
                    <FormControlLabel 
                        control={<CheckBox checked={allSelected} onChange={onSelectAll} />}
                        label={t("files.select_all")}
                    />
                    <Typography>{selectedCount} {t("files.selected")}</Typography>
                    <Tooltip title={t("files.archive")}>
                        <IconButton color="warning" onClick={onArchive} disabled={selectedCount === 0}>
                            <Archive/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.unarchive")}>
                        <IconButton color="info" onClick={onUnarchive} disabled={selectedCount === 0}>
                            <Unarchive/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.download")}>
                        <IconButton color="primary" onClick={onDownload} disabled={selectedCount === 0}>
                            <Download/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.delete")}>
                        <IconButton color="error" onClick={onDelete} disabled={selectedCount === 0}>
                            <Delete/>
                        </IconButton>
                    </Tooltip>
                    <IconButton onClick={() => { setSelectionMode(false); }}>
                        <Close/>
                    </IconButton>
                </Stack>
            ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={t("files.selection_mode")}>
                        <FormControlLabel 
                            control={<Switch checked={selectionMode} onChange={() => setSelectionMode(!selectionMode)} />}
                            label=""
                        />
                    </Tooltip>
                    <Tooltip title={t("files.upload_file")}>
                        <IconButton color="secondary" onClick={upload}>
                            <UploadFile/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.create_folder.title")}>
                        <IconButton color="secondary" onClick={() => setDialogOpen(true)}>
                            <CreateNewFolder/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            )}

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
        </Box>
    );
}