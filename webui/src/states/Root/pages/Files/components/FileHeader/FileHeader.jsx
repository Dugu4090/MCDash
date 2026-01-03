import {Box, Button, Chip, FormControlLabel, IconButton, LinearProgress, Stack, Switch, TextField, Tooltip, Typography} from "@mui/material";
import {CreateNewFolder, UploadFile, Archive, Unarchive, Delete, Download, CheckBox, NoteAdd, ArrowBack} from "@mui/icons-material";
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
        
        const formData = new URLSearchParams();
        formData.append("path", "." + directory + newFileName);
        formData.append("content", "");

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

    const pathParts = directory === "/" ? [] : directory.split("/").filter(p => p);

    return (
        <Box sx={{ mb: 3 }}>
            <NewFolderDialog open={folderDialogOpen} setOpen={setFolderDialogOpen} updateFiles={updateFiles}
                             directory={directory} setSnackbar={setSnackbar}/>
            
            {currentFile !== null ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton onClick={() => setCurrentFile(null)} size="small">
                        <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600}>
                        {currentFile.name}
                    </Typography>
                </Stack>
            ) : (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>{t("nav.files")}</Typography>
                        
                        <Stack direction="row" spacing={1}>
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
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                            label="/" 
                            size="small" 
                            onClick={() => setDirectory("/")}
                            sx={{ cursor: 'pointer' }}
                        />
                        {pathParts.map((part, index) => (
                            <React.Fragment key={index}>
                                <Typography>/</Typography>
                                <Chip 
                                    label={part} 
                                    size="small"
                                    onClick={() => {
                                        const newPath = "/" + pathParts.slice(0, index + 1).join("/") + "/";
                                        setDirectory(newPath);
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                />
                            </React.Fragment>
                        ))}
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1 }}>
                        <FormControlLabel
                            control={<Switch checked={selectionMode} onChange={() => setSelectionMode(!selectionMode)} size="small"/>}
                            label={t("files.selection_mode")}
                            sx={{ mr: 2 }}
                        />

                        {selectionMode && (
                            <>
                                <FormControlLabel
                                    control={<Checkbox checked={allSelected} onChange={onSelectAll} size="small"/>}
                                    label={`${selectedCount}`}
                                />
                                <Box sx={{ flexGrow: 1 }} />
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
                            </>
                        )}
                    </Stack>
                </>
            )}

            {uploadProgress.active && (
                <Box sx={{ mt: 2, width: 300 }}>
                    <LinearProgress variant="determinate" value={uploadProgress.percent} sx={{ height: 6, borderRadius: 3 }} />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                        <Typography variant="caption">{uploadProgress.percent}%</Typography>
                        <Typography variant="caption">{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}</Typography>
                    </Stack>
                </Box>
            )}

            {newFileDialogOpen && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <TextField
                        label={t("files.new_file")}
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                        size="small"
                        autoFocus
                    />
                    <Button variant="contained" size="small" onClick={createNewFile}>{t("files.create")}</Button>
                    <Button size="small" onClick={() => { setNewFileDialogOpen(false); setNewFileName(""); }}>{t("files.cancel")}</Button>
                </Stack>
            )}
        </Box>
    );
}