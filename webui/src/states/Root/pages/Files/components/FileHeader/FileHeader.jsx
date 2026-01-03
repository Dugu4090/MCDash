import {Box, Button, FormControlLabel, IconButton, LinearProgress, Stack, Switch, TextField, Tooltip, Typography} from "@mui/material";
import {Close, CreateNewFolder, UploadFile, Archive, Unarchive, Delete, Download, CheckBox, NoteAdd, ArrowBack} from "@mui/icons-material";
import NewFolderDialog from "@/states/Root/pages/Files/components/FileHeader/components/NewFolderDialog";
import React, {useState} from "react";
import {uploadRequest} from "@/common/utils/RequestUtil.js";
import {t} from "i18next";

export const FileHeader = ({currentFile, directory, setDirectory, setCurrentFile, updateFiles, setSnackbar,
                           selectedCount, selectionMode, setSelectionMode, onSelectAll, onArchive, onUnarchive,
                           onDelete, onDownload, allSelected, clearSelection}) => {
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");

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

    const createNewFile = () => {
        if (!newFileName.trim()) return;
        
        const fileContent = "";
        const formData = new URLSearchParams();
        formData.append("path", "." + directory + newFileName);
        formData.append("content", fileContent);

        fetch("/api/filebrowser/file", {
            method: "PATCH",
            headers: { "Authorization": "Basic " + localStorage.getItem("token") },
            body: formData
        }).then(() => {
            setSnackbar(t("files.file_created"));
            setNewFileName("");
            setNewFileDialogOpen(false);
            updateFiles();
        }).catch(() => {
            setSnackbar(t("files.create_failed"));
        });
    };

    const goBack = () => {
        if (directory === "/") return;
        const newDir = directory.substring(0, directory.length - 1).split("/").slice(0, -1).join("/") + "/";
        setDirectory(newDir);
    };

    return (
        <Box sx={{mb: 2}}>
            <NewFolderDialog open={folderDialogOpen} setOpen={setFolderDialogOpen} updateFiles={updateFiles}
                             directory={directory} setSnackbar={setSnackbar}/>
            
            {currentFile !== null ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton onClick={() => setCurrentFile(null)}>
                        <Close />
                    </IconButton>
                    <Typography variant="h5" fontWeight={500}>
                        {currentFile.name}
                    </Typography>
                </Stack>
            ) : (
                <>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="h5" fontWeight={500}>{t("nav.files")}</Typography>
                        <FormControlLabel
                            control={<Switch checked={selectionMode} onChange={() => setSelectionMode(!selectionMode)} size="small"/>}
                            label={t("files.selection_mode")}
                        />
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        {directory === "/" ? "/" : directory}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Tooltip title={t("files.go_back")}>
                            <IconButton onClick={goBack} disabled={directory === "/"} size="small">
                                <ArrowBack fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("files.upload_file")}>
                            <IconButton color="primary" onClick={upload} size="small">
                                <UploadFile fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("files.create_folder.title")}>
                            <IconButton color="primary" onClick={() => setFolderDialogOpen(true)} size="small">
                                <CreateNewFolder fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("files.new_file")}>
                            <IconButton color="primary" onClick={() => setNewFileDialogOpen(true)} size="small">
                                <NoteAdd fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {selectionMode && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                            <FormControlLabel
                                control={<CheckBox checked={allSelected} onChange={onSelectAll} size="small"/>}
                                label={`${selectedCount} ${t("files.selected")}`}
                            />
                            <Tooltip title={t("files.archive")}>
                                <IconButton color="warning" onClick={onArchive} disabled={selectedCount === 0} size="small">
                                    <Archive fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t("files.unarchive")}>
                                <IconButton color="info" onClick={onUnarchive} disabled={selectedCount === 0} size="small">
                                    <Unarchive fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t("files.download")}>
                                <IconButton color="primary" onClick={onDownload} disabled={selectedCount === 0} size="small">
                                    <Download fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t("files.delete")}>
                                <IconButton color="error" onClick={onDelete} disabled={selectedCount === 0} size="small">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <IconButton onClick={clearSelection} size="small">
                                <Close fontSize="small" />
                            </IconButton>
                        </Stack>
                    )}
                </>
            )}

            {uploadProgress.active && (
                <Box sx={{mt: 2, width: 300}}>
                    <LinearProgress variant="determinate" value={uploadProgress.percent} sx={{height: 6, borderRadius: 3}}/>
                    <Stack direction="row" justifyContent="space-between" sx={{mt: 0.5}}>
                        <Typography variant="caption">{uploadProgress.percent}%</Typography>
                        <Typography variant="caption">{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}</Typography>
                    </Stack>
                </Box>
            )}

            <TextField
                open={newFileDialogOpen}
                label={t("files.new_file")}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                size="small"
                sx={{ display: newFileDialogOpen ? 'block' : 'none', mt: 2, width: 300 }}
                autoFocus
            />
            {newFileDialogOpen && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" onClick={createNewFile}>{t("files.create")}</Button>
                    <Button size="small" onClick={() => { setNewFileDialogOpen(false); setNewFileName(""); }}>{t("files.cancel")}</Button>
                </Stack>
            )}
        </Box>
    );
}