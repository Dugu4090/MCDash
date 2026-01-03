import React, {useEffect, useState} from "react";
import {deleteRequest, downloadRequest, jsonRequest, postRequest} from "@/common/utils/RequestUtil.js";
import {useLocation, useNavigate} from "react-router-dom";
import FileEditor from "@/states/Root/pages/Files/components/FileEditor";
import FileDropdown from "@/states/Root/pages/Files/components/FileDropdown";
import FileView from "@/states/Root/pages/Files/components/FileView";
import FileHeader from "@/states/Root/pages/Files/components/FileHeader";
import {Alert, Snackbar} from "@mui/material";
import {t} from "i18next";

export const Files = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [contextMenu, setContextMenu] = useState(null);

    const [files, setFiles] = useState([]);
    const [directory, setDirectory] = useState(location.pathname.substring(6));
    const [currentFile, setCurrentFile] = useState(null);
    const [snackbar, setSnackbar] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);

    const handleContextMenu = (event, file) => {
        event.preventDefault();
        setContextMenu(contextMenu === null ? {mouseX: event.clientX + 2, mouseY: event.clientY - 6, file} : null);
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const changeDirectory = (newDirectory) => {
        if (currentFile !== null) setCurrentFile(null);

        if (newDirectory === "..") {
            if (directory === "/") return;
            setDirectory(directory.substring(0, directory.length - 1).split("/").slice(0, -1).join("/") + "/");
        } else {
            setDirectory(directory + newDirectory + "/");
        }
    }

    const click = (file, event) => {
        if (event?.ctrlKey || event?.metaKey || selectionMode) {
            toggleFileSelection(file);
            return;
        }
        if (file.is_folder) return changeDirectory(file.name);
        if (file.size > 1000000) return downloadRequest("filebrowser/file?path=." + directory + file.name, file.name);

        setCurrentFile(file);
    }

    const toggleFileSelection = (file) => {
        if (selectedFiles.includes(file.name)) {
            setSelectedFiles(selectedFiles.filter(name => name !== file.name));
        } else {
            setSelectedFiles([...selectedFiles, file.name]);
        }
        if (selectedFiles.length > 0 || selectedFiles.includes(file.name)) {
            setSelectionMode(true);
        }
    };

    const toggleSelectAll = () => {
        if (selectedFiles.length === files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(files.map(f => f.name));
        }
    };

    const clearSelection = () => {
        setSelectedFiles([]);
        setSelectionMode(false);
    };

    const archiveSelected = async () => {
        if (selectedFiles.length === 0) return;
        setSnackbar(t("files.archiving"));
        try {
            await postRequest("filebrowser/archive", {path: "." + directory, files: selectedFiles});
            setSnackbar(t("files.archived"));
            clearSelection();
            updateFiles();
        } catch {
            setSnackbar(t("files.archive_failed"));
        }
    };

    const unarchiveSelected = async () => {
        if (selectedFiles.length === 0) return;
        setSnackbar(t("files.unarchiving"));
        try {
            await postRequest("filebrowser/archive", {path: "." + directory, files: selectedFiles});
            setSnackbar(t("files.unarchived"));
            clearSelection();
            updateFiles();
        } catch {
            setSnackbar(t("files.unarchive_failed"));
        }
    };

    const deleteSelected = async () => {
        if (selectedFiles.length === 0) return;
        setSnackbar(t("files.deleting"));
        try {
            for (const fileName of selectedFiles) {
                const file = files.find(f => f.name === fileName);
                if (file.is_folder) {
                    await deleteRequest("filebrowser/folder", {path: "." + directory + fileName});
                } else {
                    await deleteRequest("filebrowser/file", {path: "." + directory + fileName});
                }
            }
            setSnackbar(t("files.deleted"));
            clearSelection();
            updateFiles();
        } catch {
            setSnackbar(t("files.delete_failed"));
        }
    };

    const downloadSelected = async () => {
        for (const fileName of selectedFiles) {
            const file = files.find(f => f.name === fileName);
            if (!file.is_folder) {
                downloadRequest("filebrowser/file?path=." + directory + fileName, fileName);
            }
        }
    };

    useEffect(() => {
        navigate("/files" + directory);
        updateFiles();
    }, [directory]);

    const updateFiles = () => {
        jsonRequest("filebrowser/folder?path=." + directory)
            .then((data) => setFiles(data.sort((a, b) => b.is_folder - a.is_folder)))
            .catch(() => changeDirectory(".."));
    }

    useEffect(() => {
        if (location.pathname === "/files") {
            setDirectory("/");
            setCurrentFile(null);
            clearSelection();
        }
    }, [location.pathname]);

    return (
        <>
            <Snackbar open={snackbar !== ""} autoHideDuration={3000} onClose={() => setSnackbar("")}
                      anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <Alert onClose={() => setSnackbar("")} severity="success" sx={{width: '100%'}}>
                    {snackbar}
                </Alert>
            </Snackbar>

            <FileDropdown setFiles={setFiles} setContextMenu={setContextMenu} contextMenu={contextMenu}
                          directory={directory} setSnackbar={setSnackbar} closeMenu={closeContextMenu}/>

            <FileHeader directory={directory} currentFile={currentFile} setDirectory={setDirectory}
                        setCurrentFile={setCurrentFile} updateFiles={updateFiles} setSnackbar={setSnackbar}
                        selectedCount={selectedFiles.length} selectionMode={selectionMode} setSelectionMode={setSelectionMode}
                        onSelectAll={toggleSelectAll} onArchive={archiveSelected} onUnarchive={unarchiveSelected}
                        onDelete={deleteSelected} onDownload={downloadSelected} 
                        allSelected={selectedFiles.length === files.length && files.length > 0}
                        clearSelection={clearSelection}/>

            {!currentFile && <FileView files={files} changeDirectory={changeDirectory} click={click}
                                        handleContextMenu={handleContextMenu} selectionMode={selectionMode}
                                        selectedFiles={selectedFiles} toggleSelection={toggleFileSelection}
                                        directory={directory}/>}

            {currentFile && <FileEditor currentFile={currentFile} directory={directory}
                                        setSnackbar={setSnackbar} setCurrentFile={setCurrentFile}/>}
        </>
    );
}