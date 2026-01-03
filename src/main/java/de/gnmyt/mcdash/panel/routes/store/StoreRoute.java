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
import org.apache.commons.io.FileUtils;
import org.bukkit.Bukkit;
import org.bukkit.plugin.InvalidDescriptionException;
import org.bukkit.plugin.InvalidPluginException;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

import static java.nio.charset.StandardCharsets.UTF_8;

public class StoreRoute extends DefaultHandler {

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String ROOT_URL = "https://api.spiget.org/v2/";

    @Override
    public void get(Request request, ResponseController response) throws Exception {
        String query = request.getQuery().containsKey("query") ? getStringFromQuery(request, "query") : "";
        int page = request.getQuery().containsKey("page") ? getIntegerFromQuery(request, "page") : 1;

        String base = Objects.equals(query, "") ? "resources" : "search/resources/"
                + URLEncoder.encode(query, StandardCharsets.UTF_8.toString()).replace("+", "%20");

        HttpUrl url = HttpUrl.parse(ROOT_URL + base).newBuilder()
                .addQueryParameter("size", "100")
                .addQueryParameter("page", String.valueOf(page))
                .addQueryParameter("sort", "-downloads")
                .addQueryParameter("type", "plugin")
                .build();

        okhttp3.Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute();

        if (httpResponse.code() != 200) {
            response.type(ContentType.JSON).text(new ArrayBuilder().toJSON());
            return;
        }

        ArrayBuilder items = new ArrayBuilder();

        mapper.readTree(httpResponse.body().string()).forEach(item -> {
            // Include both external and non-external plugins that are JAR files
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

                new NodeBuilder(items).add("id", item.get("id").asInt())
                        .add("name", item.get("name").asText())
                        .add("description", description)
                        .add("icon", icon)
                        .add("downloads", item.has("downloads") ? item.get("downloads").asInt() : 0)
                        .add("version", version)
                        .add("external", item.has("external") && item.get("external").asBoolean())
                        .register();
            }
        });

        response.type(ContentType.JSON).text(items.toJSON());
    }

    @Override
    public void put(Request request, ResponseController response) throws Exception {
        if (!isStringInQuery(request, response, "id")) return;

        HttpUrl url = HttpUrl.parse(ROOT_URL + "resources/" + URLEncoder.encode(request.getQuery()
                .get("id"), UTF_8.toString())).newBuilder().build();

        okhttp3.Response httpResponse = client.newCall(new okhttp3.Request.Builder().url(url).build()).execute();

        if (httpResponse.code() != 200) {
            response.code(404).message("The item with the id '" + request.getQuery().get("id") + "' does not exist");
            return;
        }

        JsonNode node = mapper.readTree(httpResponse.body().string());
        String projectId = node.get("id").asText();
        String pluginName = node.get("name").asText();

        if (!node.get("file").get("type").asText().equals(".jar")) {
            response.code(400).message("The item with the id '" + request.getQuery().get("id") + "' is not a plugin");
            return;
        }

        String fileUrl = ROOT_URL + "resources/" + URLEncoder.encode(request.getQuery().get("id"), UTF_8.toString())
                + "/download";

        // Create safe filename from plugin name
        String safeFileName = pluginName.replaceAll("[^a-zA-Z0-9]", "_") + ".jar";
        File targetFile = new File("plugins/" + safeFileName);

        if (targetFile.exists()) {
            response.code(409).message("Plugin '" + pluginName + "' is already installed");
            return;
        }

        FileUtils.copyInputStreamToFile(client.newCall(new okhttp3.Request.Builder().url(fileUrl).build())
                .execute().body().byteStream(), targetFile);

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
