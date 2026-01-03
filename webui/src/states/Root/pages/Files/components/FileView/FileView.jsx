import {Box, Checkbox, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography} from "@mui/material";
import {Folder, InsertDriveFile, MoreVert, ContentCopy, Edit, Archive, Delete, Download} from "@mui/icons-material";
import {convertSize} from "./utils/FileUtil.js";
import {t} from "i18next";
import {useState} from "react";

export const FileView = ({files, changeDirectory, click, handleContextMenu, selectionMode, selectedFiles, toggleSelection, directory}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuFile, setMenuFile] = useState(null);

    const openMenu = (event, file) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuFile(file);
    };

    const closeMenu = () => {
        setAnchorEl(null);
        setMenuFile(null);
    };

    const isSelected = (fileName) => selectedFiles.includes(fileName);

    if (files.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="text.secondary">{t("files.empty_directory")}</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1, 
                mt: 2,
                borderRadius: 2,
                overflow: 'hidden',
            }}>
                {files.map((file) => (
                    <Box
                        key={file.name}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1.5,
                            bgcolor: isSelected(file.name) ? 'rgba(59, 130, 246, 0.08)' : 'background.card',
                            border: isSelected(file.name) ? '1px solid' : '1px solid transparent',
                            borderColor: 'primary.main',
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: isSelected(file.name) ? 'rgba(59, 130, 246, 0.12)' : 'action.hover',
                                '& .file-actions': {
                                    opacity: 1,
                                },
                            },
                        }}
                        onClick={(e) => click(file, e)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                        <Checkbox
                            checked={isSelected(file.name)}
                            onChange={(e) => {
                                e.stopPropagation();
                                toggleSelection(file);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ color: 'text.secondary' }}
                        />

                        {file.is_folder ? (
                            <Folder sx={{ color: 'warning.main', fontSize: 28 }} />
                        ) : (
                            <InsertDriveFile sx={{ color: 'text.secondary', fontSize: 28 }} />
                        )}

                        <Typography sx={{ 
                            flex: 1, 
                            fontWeight: 500,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {file.name}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ width: 100, textAlign: 'right' }}>
                            {!file.is_folder && convertSize(file.size)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ width: 150, textAlign: 'right' }}>
                            {new Date(file.last_modified).toLocaleString()}
                        </Typography>

                        <IconButton
                            className="file-actions"
                            size="small"
                            onClick={(e) => openMenu(e, file)}
                            sx={{ 
                                opacity: selectionMode ? 0 : 1,
                                color: 'text.secondary',
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={closeMenu}>
                    <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
                    <ListItemText>{t("files.copy")}</ListItemText>
                </MenuItem>
                <MenuItem onClick={closeMenu}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <ListItemText>{t("files.rename")}</ListItemText>
                </MenuItem>
                <MenuItem onClick={closeMenu}>
                    <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                    <ListItemText>{t("files.download")}</ListItemText>
                </MenuItem>
                <MenuItem onClick={closeMenu}>
                    <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
                    <ListItemText>{t("files.archive")}</ListItemText>
                </MenuItem>
                <MenuItem onClick={closeMenu} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>{t("files.delete")}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}