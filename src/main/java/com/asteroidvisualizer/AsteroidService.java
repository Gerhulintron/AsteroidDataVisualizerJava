package com.asteroidvisualizer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.*;
import java.time.*;
import java.util.*;

@Service
public class AsteroidService {
    public record Asteroid(String id, String name, Double minDiameterM, Double maxDiameterM,
                           Double diameterM, Double missDistanceKm, Double velocityKmS, Boolean hazardous) {}
    public record Result(LocalDate date, String source, List<Asteroid> asteroids) {}
    private record Cached(Instant expires, Result result) {}
    private final Map<LocalDate, Cached> cache = new LinkedHashMap<>();
    private final ObjectMapper mapper;
    private final String key;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    public AsteroidService(ObjectMapper mapper, @Value("${nasa.api-key}") String key) {
        this.mapper = mapper; this.key = key;
    }
    public synchronized Result fetch(LocalDate date, boolean demo) {
        if (demo) return demo(date);
        var hit = cache.get(date);
        if (hit != null && hit.expires().isAfter(Instant.now())) return hit.result();
        String url = "https://api.nasa.gov/neo/rest/v1/feed?start_date=" + date + "&end_date=" + date
                + "&api_key=" + URLEncoder.encode(key, StandardCharsets.UTF_8);
        try {
            var response = client.send(HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20)).header("Accept", "application/json").GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 429) throw unavailable("NASA rate limit reached. Wait before retrying, set your own NASA_API_KEY, or select demo data.");
            if (response.statusCode() == 401 || response.statusCode() == 403)
                throw unavailable("NASA rejected the API key or request. Check NASA_API_KEY, or select demo data.");
            if (response.statusCode() != 200) throw unavailable("NASA is unavailable (HTTP " + response.statusCode() + "). Try again later or select demo data.");
            Result result = parse(date, mapper.readTree(response.body()));
            cache.put(date, new Cached(Instant.now().plusSeconds(600), result));
            if (cache.size() > 32) cache.remove(cache.keySet().iterator().next());
            return result;
        } catch (ResponseStatusException e) { throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); throw unavailable("NASA request interrupted. Please retry.");
        } catch (Exception e) {
            // Never return/log the request URL: it contains the API key.
            throw unavailable("Could not load NASA data. Check your internet connection or select demo data.");
        }
    }
    static ResponseStatusException unavailable(String message) { return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message); }
    Result parse(LocalDate date, JsonNode root) {
        JsonNode rows = root.path("near_earth_objects").path(date.toString());
        if (!rows.isArray()) throw unavailable("NASA returned an unexpected data format. Please retry later.");
        List<Asteroid> items = new ArrayList<>();
        for (JsonNode row : rows) {
            JsonNode approach = null;
            for (JsonNode candidate : row.path("close_approach_data")) {
                if (date.toString().equals(candidate.path("close_approach_date").asText())
                        && "Earth".equalsIgnoreCase(candidate.path("orbiting_body").asText())) {
                    approach = candidate; break;
                }
            }
            if (approach == null) continue;
            var diameter = row.path("estimated_diameter").path("meters");
            Double min = number(diameter.path("estimated_diameter_min"));
            Double max = number(diameter.path("estimated_diameter_max"));
            Double mid = min != null && max != null && max >= min ? min / 2 + max / 2 : null;
            var hazardous = row.path("is_potentially_hazardous_asteroid");
            items.add(new Asteroid(row.path("id").asText(), row.path("name").asText("Unnamed"), min, max, mid,
                    number(approach.path("miss_distance").path("kilometers")),
                    number(approach.path("relative_velocity").path("kilometers_per_second")),
                    hazardous.isBoolean() ? hazardous.asBoolean() : null));
        }
        return new Result(date, "NASA NeoWs", List.copyOf(items));
    }
    static Double number(JsonNode node) {
        if (!node.isNumber() && !node.isTextual()) return null;
        try { double n = Double.parseDouble(node.asText()); return Double.isFinite(n) && n >= 0 ? n : null; }
        catch (NumberFormatException e) { return null; }
    }
    private Result demo(LocalDate date) {
        return new Result(date, "DEMO — synthetic sample data", List.of(
            new Asteroid("demo-1", "Sample Aurora", 80d, 160d, 120d, 620000d, 12.4, false),
            new Asteroid("demo-2", "Sample Cobalt", 230d, 470d, 350d, 3100000d, 19.2, true),
            new Asteroid("demo-3", "Sample Ember", 12d, 28d, 20d, 170000d, 7.8, false),
            new Asteroid("demo-4", "Sample Nova", 50d, 110d, 80d, 1900000d, 15.1, false)));
    }
}
