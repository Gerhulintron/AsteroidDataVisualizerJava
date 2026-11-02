package com.asteroidvisualizer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc
class ApplicationTest {
 @Autowired MockMvc mvc;
 @Test void demoEndpoint() throws Exception { mvc.perform(get("/api/asteroids?date=2026-11-02&demo=true")).andExpect(status().isOk()).andExpect(jsonPath("$.asteroids.length()").value(4)).andExpect(jsonPath("$.date").value("2026-11-02")); }
 @Test void rejectsBadDate() throws Exception { mvc.perform(get("/api/asteroids?date=bad")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists()); }
 @Test void missingDate() throws Exception { mvc.perform(get("/api/asteroids")).andExpect(status().isBadRequest()); }
}
