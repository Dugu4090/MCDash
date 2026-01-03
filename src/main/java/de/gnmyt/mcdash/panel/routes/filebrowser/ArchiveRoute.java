package de.gnmyt.mcdash.panel.routes.filebrowser;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.gnmyt.mcdash.api.handler.DefaultHandler;
import de.gnmyt.mcdash.api.http.Request;
import de.gnmyt.mcdash.api.http.ResponseController;
import org.apache.commons.io.FileUtils;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.List;

public class ArchiveRoute extends DefaultHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String path() {
        return "archive";
    }

    /**
     * Creates a zip archive of selected files
     */
    @Override
    public void post(Request request, ResponseController response) throws Exception {
        if (!isStringInBody(request, response, "path")) return;
        if (!isStringInBody(request, response, "files")) return;

        String path = getStringFromBody(request, "path");
        String filesJson = getStringFromBody(request, "files");

        @SuppressWarnings("unchecked")
        List<String> files = mapper.readValue(filesJson, List.class);

        if (!FolderRoute.isValidExitingFolder(path)) {
            response.code(404).message("Folder not found");
            return;
        }

        if (files.isEmpty()) {
            response.code(400).message("No files selected");
            return;
        }

        String baseName = new File(path).getName();
        String archiveName = baseName + "_archive.zip";
        File archiveFile = new File(path, archiveName);

        try (FileOutputStream fos = new FileOutputStream(archiveFile);
             ZipArchiveOutputStream zos = new ZipArchiveOutputStream(fos)) {

            for (String fileName : files) {
                File file = new File(path, fileName);
                if (!file.exists()) continue;

                addFileToZip(zos, file, fileName);
            }
        }

        response.message("Archive created successfully: " + archiveName);
    }

    /**
     * Extracts a zip archive
     */
    @Override
    public void put(Request request, ResponseController response) throws Exception {
        if (!isStringInBody(request, response, "path")) return;
        if (!isStringInBody(request, response, "files")) return;

        String path = getStringFromBody(request, "path");
        String filesJson = getStringFromBody(request, "files");

        @SuppressWarnings("unchecked")
        List<String> files = mapper.readValue(filesJson, List.class);

        if (!FolderRoute.isValidExitingFolder(path)) {
            response.code(404).message("Folder not found");
            return;
        }

        for (String fileName : files) {
            File archiveFile = new File(path, fileName);
            if (!archiveFile.exists() || !fileName.endsWith(".zip")) continue;

            extractZip(archiveFile, new File(path));
            archiveFile.delete();
        }

        response.message("Archive extracted successfully");
    }

    private void addFileToZip(ZipArchiveOutputStream zos, File file, String entryName) throws Exception {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    addFileToZip(zos, child, entryName + "/" + child.getName());
                }
            }
        } else {
            try (FileInputStream fis = new FileInputStream(file)) {
                ZipArchiveEntry entry = new ZipArchiveEntry(entryName);
                zos.putArchiveEntry(entry);
                byte[] buffer = new byte[8192];
                int len;
                while ((len = fis.read(buffer)) > 0) {
                    zos.write(buffer, 0, len);
                }
                zos.closeArchiveEntry();
            }
        }
    }

    private void extractZip(File zipFile, File destDir) throws Exception {
        try (FileInputStream fis = new FileInputStream(zipFile);
             org.apache.commons.compress.archivers.zip.ZipFile zf = new org.apache.commons.compress.archivers.zip.ZipFile(zipFile)) {
            java.util.Enumeration<ZipArchiveEntry> entries = zf.getEntries();
            while (entries.hasMoreElements()) {
                ZipArchiveEntry entry = entries.nextElement();
                File entryFile = new File(destDir, entry.getName());
                if (entry.isDirectory()) {
                    entryFile.mkdirs();
                } else {
                    entryFile.getParentFile().mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(entryFile)) {
                        java.io.InputStream in = zf.getInputStream(entry);
                        byte[] buffer = new byte[8192];
                        int len;
                        while ((len = in.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
            }
        }
    }
}
