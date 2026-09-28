let watchId = null;
let timerInterval = null;

let startTime = null;
let pausedTime = 0;
let pauseStart = null;

let totalDistance = 0;
let lastPosition = null;

const distanceDisplay = document.getElementById("distance");
const timeDisplay = document.getElementById("time");
const speedDisplay = document.getElementById("speed");
const paceDisplay = document.getElementById("pace");
const statusDisplay = document.getElementById("status");

document.getElementById("startBtn").addEventListener("click", startRun);
document.getElementById("pauseBtn").addEventListener("click", pauseRun);
document.getElementById("stopBtn").addEventListener("click", stopRun);


// ================= START / RESUME =================

function startRun() {

    if (watchId !== null) {
        return;
    }

    if (startTime === null) {
        startTime = Date.now();
        pausedTime = 0;
        totalDistance = 0;
        lastPosition = null;
    }

    // Resume from pause
    if (pauseStart !== null) {
        pausedTime += Date.now() - pauseStart;
        pauseStart = null;
    }

    statusDisplay.textContent = "Getting GPS location...";

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTime, 1000);

    if (!navigator.geolocation) {
        statusDisplay.textContent =
            "GPS is not supported by this browser.";
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        updatePosition,
        locationError,
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
        }
    );
}


// ================= GPS POSITION =================

function updatePosition(position) {

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Show GPS accuracy
    statusDisplay.textContent =
        "GPS active • Accuracy: " +
        Math.round(accuracy) +
        " m";

    // Ignore very inaccurate GPS readings
    if (!Number.isFinite(accuracy) || accuracy > 50) {
        return;
    }

    const currentPosition = {
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy
    };

    // First GPS point
    if (lastPosition === null) {
        lastPosition = currentPosition;
        statusDisplay.textContent =
            "GPS connected • Running...";
        return;
    }

    // Calculate distance from previous GPS point
    const distance = calculateDistance(
        lastPosition.latitude,
        lastPosition.longitude,
        currentPosition.latitude,
        currentPosition.longitude
    );

    // Ignore tiny GPS noise
    if (distance < 0.003) {
        return;
    }

    // Ignore suspiciously large GPS jumps
    if (distance > 0.1) {
        lastPosition = currentPosition;
        return;
    }

    totalDistance += distance;

    lastPosition = currentPosition;

    updateDisplays();
}


// ================= TIME =================

function updateTime() {

    if (startTime === null) {
        return;
    }

    let currentTime = Date.now();

    let elapsed =
        currentTime -
        startTime -
        pausedTime;

    // If currently paused, don't count pause time
    if (pauseStart !== null) {
        elapsed =
            pauseStart -
            startTime -
            pausedTime;
    }

    timeDisplay.textContent = formatTime(elapsed);
}


// ================= DISPLAY =================

function updateDisplays() {

    const elapsedSeconds =
        getActiveTime() / 1000;

    const distanceKm = totalDistance;

    distanceDisplay.textContent =
        distanceKm.toFixed(2) + " km";

    if (elapsedSeconds > 0 && distanceKm > 0) {

        const speed =
            distanceKm /
            (elapsedSeconds / 3600);

        speedDisplay.textContent =
            speed.toFixed(2) + " km/h";

        const pace =
            (elapsedSeconds / 60) /
            distanceKm;

        const paceMinutes =
            Math.floor(pace);

        const paceSeconds =
            Math.round((pace - paceMinutes) * 60);

        paceDisplay.textContent =
            paceMinutes +
            ":" +
            String(paceSeconds).padStart(2, "0") +
            " min/km";
    }
}


// ================= PAUSE =================

function pauseRun() {

    if (startTime === null || pauseStart !== null) {
        return;
    }

    pauseStart = Date.now();

    stopGPS();

    clearInterval(timerInterval);

    statusDisplay.textContent = "Paused";
}


// ================= STOP =================

function stopRun() {

    stopGPS();

    clearInterval(timerInterval);

    if (startTime !== null) {
        updateTime();
        updateDisplays();
    }

    statusDisplay.textContent = "Run finished";

    startTime = null;
    pausedTime = 0;
    pauseStart = null;
    lastPosition = null;
}


// ================= STOP GPS =================

function stopGPS() {

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}


// ================= GPS ERROR =================

function locationError(error) {

    if (error.code === 1) {
        statusDisplay.textContent =
            "Location permission denied";
    }

    else if (error.code === 2) {
        statusDisplay.textContent =
            "GPS location unavailable";
    }

    else if (error.code === 3) {
        statusDisplay.textContent =
            "GPS timeout - searching again...";
    }

    else {
        statusDisplay.textContent =
            "GPS error";
    }
}


// ================= DISTANCE =================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        toRadians(lat2 - lat1);

    const dLon =
        toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


function toRadians(degrees) {
    return degrees * Math.PI / 180;
}


// ================= ACTIVE TIME =================

function getActiveTime() {

    if (startTime === null) {
        return 0;
    }

    if (pauseStart !== null) {
        return (
            pauseStart -
            startTime -
            pausedTime
        );
    }

    return (
        Date.now() -
        startTime -
        pausedTime
    );
}


// ================= TIME FORMAT =================

function formatTime(milliseconds) {

    const totalSeconds =
        Math.floor(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );
}