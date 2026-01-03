import {Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField} from "@mui/material";
import {t} from "i18next";
import {useState} from "react";
import {patchRequest} from "@/common/utils/RequestUtil.js";

export const RenameDialog = ({open, setOpen, file, directory, setFiles, setSnackbar}) => {
    const [newName, setNewName] = useState(file?.name || "");
    const [loading, setLoading] = useState(false);

    const handleRename = async () => {
        if (!newName.trim() || newName === file?.name) {
            setOpen(false);
            return;
        }

        setLoading(true);
        try {
            if (file?.is_folder) {
                await patchRequest("filebrowser/folder", {
                    path: "." + directory + file.name,
                    newName: newName
                });
            } else {
                await patchRequest("filebrowser/file", {
                    path: "." + directory + file.name,
                    newName: newName
                });
            }
            setFiles(files => files.map(f => 
                f.name === file.name ? {...f, name: newName} : f
            ));
            setSnackbar(t("files.renamed"));
            setOpen(false);
        } catch (error) {
            setSnackbar(t("files.rename_failed"));
        }
        setLoading(false);
    };

    const handleClose = () => {
        setOpen(false);
        setNewName(file?.name || "");
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{t("files.rename")}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label={t("files.new_name")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    sx={{mt: 1}}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{t("files.cancel")}</Button>
                <Button onClick={handleRename} variant="contained" disabled={loading}>
                    {t("files.rename")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameDialog;
