package com.asteroidvisualizer;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.*;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.Map;
@RestController
public class AsteroidController {
    private final AsteroidService service;
    public AsteroidController(AsteroidService service) { this.service = service; }
    @GetMapping("/api/asteroids")
    public AsteroidService.Result asteroids(@RequestParam String date, @RequestParam(defaultValue="false") boolean demo) {
        try {
            if (!date.matches("\\d{4}-\\d{2}-\\d{2}")) throw new DateTimeParseException("Invalid", date, 0);
            return service.fetch(LocalDate.parse(date), demo);
        } catch (DateTimeParseException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid date in YYYY-MM-DD format."); }
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason() == null ? "Request failed." : e.getReason()));
    }
}
