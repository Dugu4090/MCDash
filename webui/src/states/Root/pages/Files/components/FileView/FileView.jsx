import {Box, Button, Checkbox, Stack, Typography} from "@mui/material";
import {Folder, InsertDriveFile} from "@mui/icons-material";
import {convertSize} from "./utils/FileUtil.js";
import {t} from "i18next";

export const FileView = ({files, changeDirectory, click, handleContextMenu, selectionMode, selectedFiles, toggleSelection}) => {
    return (
        <div style={{display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, flexDirection: "column"}}>
            {files.length === 0 &&
                <Button variant="outlined" color="secondary" onClick={() => changeDirectory("..")}>{t("files.go_back")}</Button>}
            {files.map((file) => (
                <Box key={file.name} display="flex" gap={1} padding={2}
                     onClick={(event) => click(file, event)}
                     backgroundColor={selectedFiles.includes(file.name) ? "rgba(59, 130, 246, 0.1)" : "background.darker"} 
                     borderRadius={2.5} style={{cursor: "pointer"}}
                     alignItems="center"
                     border={selectedFiles.includes(file.name) ? "1px solid" : "none"}
                     borderColor="primary.main"
                     onContextMenu={(e) => handleContextMenu(e, file)}>
                    {selectionMode && (
                        <Checkbox 
                            checked={selectedFiles.includes(file.name)}
                            onChange={(e) => { e.stopPropagation(); toggleSelection(file); }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    {file.is_folder && <Folder color="primary" style={{cursor: "pointer"}}/>}

                    {!file.is_folder && <InsertDriveFile color="primary"/>}

                    <Typography>{file.name}</Typography>

                    <Stack direction="row" alignItems="center" gap={1} marginLeft="auto">
                        {!file.is_folder && <Typography>{convertSize(file.size)}</Typography>}
                        <Typography>{new Date(file.last_modified).toLocaleString()}</Typography>
                    </Stack>
                </Box>
            ))}
        </div>
    );
}