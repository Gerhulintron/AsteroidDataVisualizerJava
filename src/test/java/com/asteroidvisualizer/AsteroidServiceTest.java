package com.asteroidvisualizer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;
class AsteroidServiceTest {
 final ObjectMapper mapper = new ObjectMapper();
 final AsteroidService service = new AsteroidService(mapper, "DEMO_KEY");
 final LocalDate date = LocalDate.of(2026, 11, 2);
 @Test void selectsEarthApproachForRequestedDateAndComputesMidpoint() throws Exception {
  var root = mapper.readTree("""
   {"near_earth_objects":{"2026-11-02":[{"id":"1","name":"Test","estimated_diameter":{"meters":{"estimated_diameter_min":10,"estimated_diameter_max":30}},"is_potentially_hazardous_asteroid":false,"close_approach_data":[{"close_approach_date":"2026-11-01","orbiting_body":"Earth","miss_distance":{"kilometers":"999"}},{"close_approach_date":"2026-11-02","orbiting_body":"Earth","miss_distance":{"kilometers":"123"},"relative_velocity":{"kilometers_per_second":"4.5"}}]}]}}
   """);
  var a = service.parse(date, root).asteroids().getFirst();
  assertEquals(20d, a.diameterM()); assertEquals(123d, a.missDistanceKm()); assertEquals(4.5, a.velocityKmS());
 }
 @Test void emptyDayIsValid() throws Exception { assertTrue(service.parse(date, mapper.readTree("{\"near_earth_objects\":{\"2026-11-02\":[]}}")).asteroids().isEmpty()); }
 @Test void malformedResponseFails() throws Exception { assertThrows(ResponseStatusException.class, () -> service.parse(date, mapper.readTree("{}"))); }
 @Test void invalidNumbersAreMissingNotZero() throws Exception {
  for (String input : new String[]{"null", "\"NaN\"", "-1", "\"unknown\"", "true"}) assertNull(AsteroidService.number(mapper.readTree(input)));
  assertEquals(0d, AsteroidService.number(mapper.readTree("0")));
 }
 @Test void demoIsClearlyLabelledAndDoesNotNeedNetwork() { var r = service.fetch(date, true); assertTrue(r.source().startsWith("DEMO")); assertEquals(4, r.asteroids().size()); }
 @Test void invalidDateRejected() { assertThrows(ResponseStatusException.class, () -> new AsteroidController(service).asteroids("2026-02-30", true)); }
}
