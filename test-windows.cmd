@echo off
setlocal
cd /d "%~dp0"
if not "%~1"=="" set "ASTEROID_JAVA_HOME=%~1"
if not defined ASTEROID_JAVA_HOME set "ASTEROID_JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot"
set "JAVA_HOME=%ASTEROID_JAVA_HOME%"
set "PATH=%JAVA_HOME%\bin;%PATH%"
if not exist "%JAVA_HOME%\bin\javac.exe" (
 echo JDK not found at "%JAVA_HOME%".
 echo Pass your JDK 21 folder as the first argument, or set ASTEROID_JAVA_HOME.
 exit /b 1
)
"%JAVA_HOME%\bin\java.exe" -version
call mvnw.cmd test
set "RESULT=%ERRORLEVEL%"
endlocal & exit /b %RESULT%
