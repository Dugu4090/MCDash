package de.gnmyt.mcdash.panel.routes.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.gnmyt.mcdash.api.handler.DefaultHandler;
import de.gnmyt.mcdash.api.http.ContentType;
import de.gnmyt.mcdash.api.http.Request;
import de.gnmyt.mcdash.api.http.ResponseController;
import de.gnmyt.mcdash.api.json.ArrayBuilder;
import de.gnmyt.mcdash.api.json.NodeBuilder;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import org.apache.commons.io.FileUtils;
import org.bukkit.Bukkit;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static java.nio.charset.StandardCharsets.UTF_8;

public class StoreRoute extends DefaultHandler {

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SPIGET_URL = "https://api.spiget.org/v2/";
    private static final String HANGAR_URL = "https://hangar.papermc.io/api/v1";

    private static final String[] POPULAR_PAPER_PLUGINS = {
        "ViaVersion", "ViaBackwards", "ViaRewind", "Velocity", "PaperMC",
        "LuckPerms", "PlaceholderAPI", "EssentialsX", "GeyserMC", "Floodgate",
        "WorldEdit", "FastAsyncWorldEdit", "Chunky", "Spark", "Carpet",
        "Ledger", "Purpur", "Foliar", "ClothConfig", "Hydrogen"
    };

    @Override
    public void get(Request request, ResponseController response) throws Exception {
        String query = request.getQuery().containsKey("query") ? getStringFromQuery(request, "query") : "";
        int page = request.getQuery().containsKey("page") ? getIntegerFromQuery(request, "page") : 1;
        String source = request.getQuery().containsKey("source") ? getStringFromQuery(request, "source") : "all";

        List<PluginInfo> allPlugins = new ArrayList<>();

        if (source.equals("all") || source.equals("spiget")) {
            allPlugins.addAll(fetchSpigetPlugins(query, page));
        }

        if (source.equals("all") || source.equals("hangar")) {
            allPlugins.addAll(fetchHangarPlugins(query, page));
        }

        allPlugins.sort((a, b) -> Integer.compare(b.downloads, a.downloads));

        int startIndex = (page - 1) * 50;
        int endIndex = Math.min(startIndex + 50, allPlugins.size());

        ArrayBuilder items = new ArrayBuilder();

        if (startIndex < allPlugins.size()) {
            for (int i = startIndex; i < endIndex; i++) {
                PluginInfo plugin = allPlugins.get(i);
                new NodeBuilder(items).add("id", plugin.id)
                        .add("name", plugin.name)
                        .add("description", plugin.description)
                        .add("icon", plugin.icon)
                        .add("downloads", plugin.downloads)
                        .add("version", plugin.version)
                        .add("external", plugin.isExternal)
                        .add("source", plugin.source)
                        .register();
            }
        }

        response.type(ContentType.JSON).text(items.toJSON());
    }

    private List<PluginInfo> fetchSpigetPlugins(String query, int page) throws Exception {
        List<PluginInfo> plugins = new ArrayList<>();

        String base = query.isEmpty() ? "resources" : "search/resources/"
                + URLEncoder.encode(query, StandardCharsets.UTF_8.toString()).replace("+", "%20");

        HttpUrl url = HttpUrl.parse(SPIGET_URL + base).newBuilder()
                .addQueryParameter("size", "50")
                .addQueryParameter("page", String.valueOf(page))
                .addQueryParameter("sort", "-downloads")
                .addQueryParameter("type", "plugin")
                .build();

        try (Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute()) {
            if (httpResponse.code() != 200) {
                return plugins;
            }

            String body = httpResponse.body() != null ? httpResponse.body().string() : "";
            if (body.isEmpty()) return plugins;

            mapper.readTree(body).forEach(item -> {
                String fileType = item.has("file") && item.get("file").has("type") ? item.get("file").get("type").asText() : "";
                if (fileType.equals(".jar")) {
                    String icon = null;
                    if (item.has("icon") && item.get("icon").has("data")) {
                        icon = item.get("icon").get("data").asText();
                        if (icon.isEmpty()) icon = null;
                    }

                    String description = "";
                    if (item.has("tag")) description = item.get("tag").asText();
                    else if (item.has("description")) description = item.get("description").asText();

                    String version = "1.0";
                    if (item.has("version")) version = item.get("version").asText();
                    else if (item.has("currentVersion")) version = item.get("currentVersion").asText();

                    plugins.add(new PluginInfo(
                            "spiget_" + item.get("id").asInt(),
                            item.get("name").asText(),
                            description,
                            icon,
                            item.has("downloads") ? item.get("downloads").asInt() : 0,
                            version,
                            true
                    ));
                }
            });
        }

        return plugins;
    }

    private List<PluginInfo> fetchHangarPlugins(String query, int page) throws Exception {
        List<PluginInfo> plugins = new ArrayList<>();

        if (!query.isEmpty()) {
            String queryLower = query.toLowerCase();
            for (String pluginName : POPULAR_PAPER_PLUGINS) {
                if (pluginName.toLowerCase().contains(queryLower)) {
                    PluginInfo info = fetchHangarPluginBySlug(pluginName);
                    if (info != null) {
                        plugins.add(info);
                    }
                }
            }

            if (plugins.isEmpty()) {
                PluginInfo direct = fetchHangarPluginBySlug(query);
                if (direct != null) {
                    plugins.add(direct);
                }
            }

            return plugins;
        }

        HttpUrl.Builder urlBuilder = HttpUrl.parse(HANGAR_URL + "/projects").newBuilder()
                .addQueryParameter("limit", "50")
                .addQueryParameter("offset", String.valueOf((page - 1) * 50));

        HttpUrl url = urlBuilder.build();

        try (Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute()) {
            if (httpResponse.code() != 200) {
                return plugins;
            }

            String body = httpResponse.body() != null ? httpResponse.body().string() : "";
            if (body.isEmpty()) return plugins;

            JsonNode root = mapper.readTree(body);
            if (root.has("result")) {
                root.get("result").forEach(project -> {
                    String name = project.has("name") ? project.get("name").asText() : "Unknown";
                    String namespace = project.has("namespace") ? project.get("namespace").asText() : "";
                    String description = project.has("description") ? project.get("description").asText() : "";
                    String avatarUrl = project.has("avatarUrl") ? project.get("avatarUrl").asText() : null;

                    plugins.add(new PluginInfo(
                            "hangar_" + namespace,
                            name,
                            description,
                            avatarUrl,
                            0,
                            "latest",
                            true
                    ));
                });
            }
        }

        return plugins;
    }

    private PluginInfo fetchHangarPluginBySlug(String slug) {
        try {
            String normalizedSlug = slug.trim().replace(" ", "");
            HttpUrl url = HttpUrl.parse(HANGAR_URL + "/projects/" + normalizedSlug).newBuilder().build();

            try (Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute()) {
                if (httpResponse.code() != 200) {
                    return null;
                }

                String body = httpResponse.body() != null ? httpResponse.body().string() : "";
                if (body.isEmpty()) return null;

                JsonNode project = mapper.readTree(body);

                JsonNode stats = project.has("stats") ? project.get("stats") : null;
                int downloads = stats != null && stats.has("downloads") ? stats.get("downloads").asInt() : 0;

                String namespace = "";
                if (project.has("namespace") && project.get("namespace").has("slug")) {
                    namespace = project.get("namespace").get("slug").asText();
                }

                String avatarUrl = project.has("avatarUrl") ? project.get("avatarUrl").asText() : null;

                return new PluginInfo(
                        "hangar_" + namespace,
                        project.has("name") ? project.get("name").asText() : slug,
                        project.has("description") ? project.get("description").asText() : "",
                        avatarUrl,
                        downloads,
                        "latest",
                        true
                );
            }
        } catch (Exception e) {
            return null;
        }
    }

    private static class PluginInfo {
        final String id;
        final String name;
        final String description;
        final String icon;
        final int downloads;
        final String version;
        final boolean isExternal;
        final String source;

        PluginInfo(String id, String name, String description, String icon, int downloads, String version, boolean isExternal) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.downloads = downloads;
            this.version = version;
            this.isExternal = isExternal;
            this.source = id.contains("_") ? id.substring(0, id.indexOf("_")) : "unknown";
        }
    }

    @Override
    public void put(Request request, ResponseController response) throws Exception {
        if (!isStringInQuery(request, response, "id")) return;

        String pluginId = request.getQuery().get("id");
        String source = pluginId.contains("_") ? pluginId.substring(0, pluginId.indexOf("_")) : "spiget";
        String actualId = pluginId.contains("_") ? pluginId.substring(pluginId.indexOf("_") + 1) : pluginId;

        String pluginName;
        String fileUrl;

        switch (source) {
            case "hangar":
                String namespace = actualId;
                HttpUrl infoUrl = HttpUrl.parse(HANGAR_URL + "/projects/" + namespace).newBuilder().build();

                try (Response infoResponse = client.newCall(new okhttp3.Request.Builder().url(infoUrl).build()).execute()) {
                    if (infoResponse.code() != 200) {
                        response.code(404).message("The plugin with the id '" + pluginId + "' does not exist");
                        return;
                    }

                    String infoBody = infoResponse.body() != null ? infoResponse.body().string() : "";
                    if (infoBody.isEmpty()) {
                        response.code(404).message("The plugin with the id '" + pluginId + "' does not exist");
                        return;
                    }

                    JsonNode hangarNode = mapper.readTree(infoBody);
                    pluginName = hangarNode.has("name") ? hangarNode.get("name").asText() : namespace;
                }

                fileUrl = HANGAR_URL + "/projects/" + namespace + "/latest/download";
                break;

            case "spiget":
            default:
                HttpUrl url = HttpUrl.parse(SPIGET_URL + "resources/" + URLEncoder.encode(actualId, UTF_8.toString())).newBuilder().build();

                try (Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute()) {
                    if (httpResponse.code() != 200) {
                        response.code(404).message("The item with the id '" + pluginId + "' does not exist");
                        return;
                    }

                    String body = httpResponse.body() != null ? httpResponse.body().string() : "";
                    if (body.isEmpty()) {
                        response.code(404).message("The item with the id '" + pluginId + "' does not exist");
                        return;
                    }

                    JsonNode node = mapper.readTree(body);
                    pluginName = node.get("name").asText();

                    if (!node.get("file").get("type").asText().equals(".jar")) {
                        response.code(400).message("The item with the id '" + pluginId + "' is not a plugin");
                        return;
                    }
                }

                fileUrl = SPIGET_URL + "resources/" + URLEncoder.encode(actualId, UTF_8.toString()) + "/download";
                break;
        }

        String safeFileName = pluginName.replaceAll("[^a-zA-Z0-9]", "_") + ".jar";
        File targetFile = new File("plugins/" + safeFileName);

        if (targetFile.exists()) {
            response.code(409).message("Plugin '" + pluginName + "' is already installed");
            return;
        }

        try (okhttp3.Response downloadResponse = client.newCall(new okhttp3.Request.Builder().url(fileUrl).build()).execute()) {
            if (downloadResponse.body() != null) {
                FileUtils.copyInputStreamToFile(downloadResponse.body().byteStream(), targetFile);
            }
        }

        runSync(() -> {
            try {
                Bukkit.getPluginManager().loadPlugin(targetFile);
            } catch (Exception e) {
                FileUtils.deleteQuietly(targetFile);
                response.code(400).json("message=\"The plugin '" + pluginName
                                + "' is not valid\"", "error=\"" + e.getMessage() + "\"");
                return;
            }
            response.message("Plugin '" + pluginName + "' has been installed successfully");
        });
    }
}
