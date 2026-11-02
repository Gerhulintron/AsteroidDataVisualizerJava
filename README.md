# Asteroid Data Visualizer

A **Java 21 / Spring Boot** web application for exploring NASA near-Earth asteroid data through sortable tables and customizable 2D illustrations.

Choose a date, compare reported close approaches to Earth, style the visualization, and download it as a PNG. The application runs locally in your browser; no wallet, Web3, database, Docker, Node.js or IDE is required to run it.

## Technology

| Component | Implementation |
| --- | --- |
| Backend | Java 21, Spring Boot **3.5.16**, Spring Web |
| Frontend | HTML, CSS and plain JavaScript using the browser Canvas API |
| Data | NASA Near Earth Object Web Service (**NeoWs**) |
| Build | Maven Wrapper, pinned to Maven **3.9.9** |
| Tests | JUnit/Spring MVC; optional JavaScript tests and Python palette audit |

This version does **not** use p5.js or React. Spring Boot serves the page and fetches/normalizes NASA data; the browser draws the visualization.

## Features

- Date-based NASA NeoWs queries, plus clearly labelled synthetic demo data.
- Sortable table with asteroid name, estimated diameter midpoint/range, miss distance, relative speed and potentially-hazardous classification.
- **Linear** and **Layered** visualization modes.
- **317-colour curated palette**, with the original six-colour palette available.
- White, black or no asteroid borders; background presets and a custom colour picker.
- Immediate style changes without refetching data.
- PNG download of the current visualization at **2× display resolution**.
- Server-side API key, request timeouts and a bounded in-memory cache.

## Requirements

- A **JDK 21** installation, including `java` and `javac`.
- A modern browser with Canvas support.
- Internet for the first source build and for live NASA requests.

Maven is downloaded automatically by the included wrapper. Source builds cache dependencies in your user `.m2` directory; allow several hundred MB of free space. Synthetic demo mode avoids NASA requests, but a first source build still needs its dependencies. Notepad++ or any text editor is sufficient for editing.

## Run from source

Open a terminal in the project directory containing `pom.xml`. Keep `.mvn`, `mvnw` and `mvnw.cmd` with the source.

### Windows — Command Prompt

Use the development launcher with your JDK folder:

```bat
run-windows.cmd "C:\path\to\jdk-21"
```

Alternatively, set a project-specific variable for this terminal session:

```bat
set "ASTEROID_JAVA_HOME=C:\path\to\jdk-21"
run-windows.cmd
```

The supplied launchers have a default Eclipse Adoptium JDK location. Override it as above if it does not match your installation. They use `setlocal`, so their Java/PATH changes do **not** modify global environment settings or other development tools.

With `JAVA_HOME` already configured to JDK 21, you can use Maven directly:

```bat
mvnw.cmd spring-boot:run
```

### Linux / macOS

With JDK 21 available and `JAVA_HOME` pointing to it when needed:

```sh
chmod +x mvnw
./mvnw spring-boot:run
```

Wait for `Started Application`, then open **http://localhost:8080**. Choose a date and click **Explore date**. Stop the server with **Ctrl+C**.

By default the app binds to **127.0.0.1 only**; this is a local application, not a production deployment configuration.

### Prebuilt ZIP package

If your downloaded ZIP includes `AsteroidVisualizerJava.jar`, you can start it without Maven/dependency downloads:

```bat
start-windows.cmd "C:\path\to\jdk-21"
```

Or, with Java 21 selected:

```sh
java -jar AsteroidVisualizerJava.jar
```

A source checkout does not need to contain the prebuilt JAR. Use the source instructions or build it yourself. The prebuilt launcher runs the bundled binary; **source edits will not appear until rebuilt**.

## NASA API key and demo mode

Get an API key from [NASA Open APIs](https://api.nasa.gov/), then set `NASA_API_KEY` in the terminal used to start the application.

Windows Command Prompt:

```bat
set "NASA_API_KEY=your-key-here"
run-windows.cmd "C:\path\to\jdk-21"
```

Linux / macOS:

```sh
export NASA_API_KEY="your-key-here"
./mvnw spring-boot:run
```

Without a key, the application uses NASA's shared `DEMO_KEY`. Its restrictive rate limits can cause requests to fail; a personal key is recommended for regular use. Successful live responses are cached for ten minutes, up to 32 dates.

The **Use synthetic demo data** checkbox is separate from `DEMO_KEY`: it generates local sample data without contacting NASA. Synthetic results are explicitly labelled and are never silently substituted for failed live requests.

**Never commit API keys or other secrets.** The NASA key stays server-side; browser requests use the local `/api/asteroids` endpoint. `.env` files are not loaded automatically.

## Understanding the visualization

Each circle represents an asteroid's Earth close approach on the selected date. Circle size reflects the **midpoint of NASA's estimated diameter range**, not a directly measured average.

- **Linear:** circles are spread horizontally in stable identity order, not actual sky position. The gap between each circle's bottom and the blue horizon increases with reported miss distance.
- **Layered:** all circles share a horizontal centre. Larger circles are drawn first, behind smaller circles. Miss distance controls the **bottom-of-circle to top-of-horizon gap**, independently of diameter. Positive distances retain a visible gap. Overlap may obscure objects; the table retains all records.

Sizes and distances have separate, date-relative display scales. The views are **illustrative, not true scale, orbital trajectories or impact predictions**. Do not compare pixel sizes across dates or between view modes. Colours are artistic choices, not physical properties or hazard ratings. NASA's potentially-hazardous classification does **not** mean an impact is predicted. Missing measurements remain unknown and may be omitted from the illustration.

### Palettes and design

The default curated palette has **317 unique hex colours**, preserving **320 distinct name/hex entries across 317 names** from the supplied collection. Duplicate hex values are used once for assignment; duplicate names with different values are retained rather than overwritten. The original data is preserved in `palette-source/COLOUR_CONSTANTS.py.txt` and is never executed.

Colours are assigned deterministically by asteroid ID, keeping table swatches and circles consistent. Palette, border and background choices apply to both views without new NASA requests. The horizon stays blue. Choices remain while switching views or loading another date, but are not persisted after refreshing the page.

### PNG export

After loading data, click **Download PNG**. It captures the current canvas and design at twice the displayed width and height, without refetching data or changing the view.

Filenames use the **loaded date** and selected mode, for example `asteroid-data-2026-11-02-layered.png`; demo exports add `-demo`. The image contains the visualization, not the surrounding page title, controls or table. Your browser controls the save location.

## Tests and build

Windows launchers accept the same optional JDK-folder argument:

```bat
test-windows.cmd "C:\path\to\jdk-21"
build-windows.cmd "C:\path\to\jdk-21"
```

Or use the wrapper with Java 21 configured:

```sh
./mvnw test
./mvnw package
java -jar target/asteroid-visualizer-java-0.1.0.jar
```

On Windows, replace `./mvnw` with `mvnw.cmd`. `package` runs the Java tests and creates the executable JAR under `target/`; it does not replace a separately supplied root-level prebuilt JAR.

The nine Java tests cover parsing, validation, demo data and Spring MVC endpoints without requiring NASA network access. Optional maintainer checks:

```sh
node --test tests/*.test.cjs
python3 tests/verify-palette-source.py
```

Use a modern Node.js version supporting `node:test`; on Windows, Python may be invoked as `python` or `py -3`. These optional tools are **not needed to run or build the Java app**. The JavaScript suite covers geometry, design controls, palette preservation and PNG export logic with canvas/DOM mocks. The Python audit parses the original palette as data without executing it. These tests do not replace real-browser visual/download checks.

## Project structure

```text
src/main/java/com/asteroidvisualizer/   Spring Boot app, controller, NASA service
src/main/resources/application.properties
src/main/resources/static/             HTML, CSS, canvas/layout/design/export code
src/test/                             Java tests and test configuration
tests/                                Optional JS tests and palette audit
palette-source/                       Original curated colour data as text
.mvn/wrapper/                         Maven Wrapper configuration
pom.xml                               Dependencies and build configuration
*-windows.cmd                         Local Java launch/test/build helpers
```

## Troubleshooting

- **JDK not found:** pass the folder containing `bin\java.exe` and `bin\javac.exe` to the Windows launcher, or configure `JAVA_HOME` when using Maven directly.
- **Port 8080 in use:** set `PORT=8081` in the launching environment, then open `http://localhost:8081`.
- **NASA errors:** check connectivity/key, wait after rate limiting, or explicitly select synthetic demo data.
- **Dependency download/TLS errors:** check proxy/firewall and trust configuration. Do not disable certificate verification. Maven proxy settings belong in your user `.m2/settings.xml`.
- **Edits not showing:** stop and restart the source runner, then hard-refresh the browser. The prebuilt launcher does not rebuild source. Open the Spring Boot URL, not `index.html` directly.
- **PNG download fails:** load data first, retry, and check browser download permissions. Export errors appear beside the download button.
- **Low disk space:** `target/` is disposable build output; deleting Maven's reusable dependency cache forces downloads again.

## References

- [NASA Open APIs](https://api.nasa.gov/)
- [Spring Boot documentation](https://docs.spring.io/spring-boot/3.5/)
- [Apache Maven Wrapper](https://maven.apache.org/tools/wrapper/)
