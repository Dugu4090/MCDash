import {Box, Button, Chip, FormControlLabel, IconButton, LinearProgress, Stack, Switch, TextField, Tooltip, Typography} from "@mui/material";
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
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, mb: 2, flexWrap: "wrap", gap: 2}}>
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
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Tooltip title={t("files.go_back")}>
                        <IconButton onClick={goBack} disabled={directory === "/"}>
                            <ArrowBack />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="h5" fontWeight={500}>{t("nav.files")}</Typography>
                    {directory.split("/").filter(d => d).map((dir, index) => (
                        <Chip key={index} label={dir} size="small" 
                              onClick={() => setDirectory("/" + directory.split("/").slice(1, directory.split("/").indexOf(dir) + 2).join("/") + "/")}
                        />
                    ))}
                </Stack>
            )}

            {selectionMode && currentFile === null && (
                <Stack direction="row" alignItems="center" gap={1}>
                    <FormControlLabel 
                        control={<CheckBox checked={allSelected} onChange={onSelectAll} />}
                        label={`${selectedCount} ${t("files.selected")}`}
                    />
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
                    <IconButton onClick={clearSelection}>
                        <Close/>
                    </IconButton>
                </Stack>
            )}

            {!selectionMode && currentFile === null && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={t("files.upload_file")}>
                        <IconButton color="primary" onClick={upload}>
                            <UploadFile/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.create_folder.title")}>
                        <IconButton color="primary" onClick={() => setFolderDialogOpen(true)}>
                            <CreateNewFolder/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.new_file")}>
                        <IconButton color="primary" onClick={() => setNewFileDialogOpen(true)}>
                            <NoteAdd/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t("files.selection_mode")}>
                        <FormControlLabel 
                            control={<Switch checked={selectionMode} onChange={() => setSelectionMode(!selectionMode)} />}
                            label=""
                        />
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

            <TextField
                open={newFileDialogOpen}
                label={t("files.new_file")}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                size="small"
                sx={{ display: newFileDialogOpen ? 'block' : 'none' }}
                autoFocus
            />
            {newFileDialogOpen && (
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" onClick={createNewFile}>{t("files.create")}</Button>
                    <Button size="small" onClick={() => { setNewFileDialogOpen(false); setNewFileName(""); }}>{t("files.cancel")}</Button>
                </Stack>
            )}
        </Box>
    );
}