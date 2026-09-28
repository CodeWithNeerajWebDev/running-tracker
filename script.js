let watchId = null;
let timerInterval = null;

let startTime = null;
let pausedTime = 0;
let pauseStarted = null;

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


// =========================
// START / RESUME
// =========================

function startRun() {

    if (watchId !== null) {
        return;
    }

    // First start
    if (startTime === null) {
        startTime = performance.now();
        pausedTime = 0;
        totalDistance = 0;
        lastPosition = null;
    }

    // Resume after pause
    if (pauseStarted !== null) {
        pausedTime += performance.now() - pauseStarted;
        pauseStarted = null;
    }

    statusDisplay.textContent = "Getting GPS location...";

    clearInterval(timerInterval);
    timerInterval = setInterval(updateDisplay, 250);

    if (!("geolocation" in navigator)) {
        statusDisplay.textContent = "GPS is not supported.";
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        updatePosition,
        locationError,
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 15000
        }
    );
}


// =========================
// GPS POSITION
// =========================

function updatePosition(position) {

    const accuracy = position.coords.accuracy;

    // Ignore very inaccurate GPS readings
    if (!Number.isFinite(accuracy) || accuracy > 30) {
        statusDisplay.textContent =
            "GPS accuracy: " + Math.round(accuracy || 0) + " m";
        return;
    }

    const currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: accuracy,
        timestamp: position.timestamp
    };

    // First valid GPS point
    if (lastPosition === null) {
        lastPosition = currentPosition;

        statusDisplay.textContent =
            "GPS connected • Running...";

        return;
    }

    const distance = calculateDistance(
        lastPosition.latitude,
        lastPosition.longitude,
        currentPosition.latitude,
        currentPosition.longitude
    );

    const timeDifference =
        (currentPosition.timestamp - lastPosition.timestamp) / 1000;


    // Ignore invalid GPS jumps
    if (timeDifference <= 0) {
        return;
    }

    const gpsSpeed = distance / timeDifference; // km/s

    // Convert to km/h
    const speedKmH = gpsSpeed * 3600;


    // Ignore unrealistic jumps
    // 35 km/h is far above normal running speed
    if (speedKmH > 35) {
        statusDisplay.textContent =
            "GPS jump ignored";
        return;
    }


    // Ignore tiny GPS movement
    // This reduces GPS noise
    if (distance < 0.003) {
        return;
    }


    totalDistance += distance;

    lastPosition = currentPosition;

    updateStats();
}


// =========================
// DISTANCE CALCULATION
// =========================

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371; // Earth radius in km

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

function toRadians(value) {
    return value * Math.PI / 180;
}


// =========================
// ACTIVE TIME
// =========================

function getActiveTime() {

    if (startTime === null) {
        return 0;
    }

    let now = performance.now();

    let totalElapsed = now - startTime;

    // Remove paused time
    if (pauseStarted !== null) {
        totalElapsed -= pausedTime;
        totalElapsed -= now - pauseStarted;
    } else {
        totalElapsed -= pausedTime;
    }

    return Math.max(0, totalElapsed);
}


// =========================
// DISPLAY TIME
// =========================

function updateDisplay() {

    const activeMilliseconds = getActiveTime();

    const totalSeconds =
        Math.floor(activeMilliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor((totalSeconds % 3600) / 60);

    const seconds =
        totalSeconds % 60;

    timeDisplay.textContent =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    updateStats();
}


// =========================
// SPEED + PACE
// =========================

function updateStats() {

    const activeMilliseconds = getActiveTime();

    const activeHours =
        activeMilliseconds / 3600000;

    const activeMinutes =
        activeMilliseconds / 60000;


    // Distance
    distanceDisplay.textContent =
        totalDistance.toFixed(2) + " km";


    // Average speed
    if (totalDistance > 0 && activeHours > 0) {

        const averageSpeed =
            totalDistance / activeHours;

        speedDisplay.textContent =
            averageSpeed.toFixed(2) + " km/h";
    }


    // Average pace
    if (totalDistance > 0 && activeMinutes > 0) {

        const pace =
            activeMinutes / totalDistance;

        const paceMinutes =
            Math.floor(pace);

        const paceSeconds =
            Math.round((pace - paceMinutes) * 60);

        if (paceSeconds === 60) {

            paceDisplay.textContent =
                (paceMinutes + 1) + ":00 min/km";

        } else {

            paceDisplay.textContent =
                paceMinutes + ":" +
                String(paceSeconds).padStart(2, "0") +
                " min/km";
        }
    }
}


// =========================
// PAUSE
// =========================

function pauseRun() {

    if (watchId === null || startTime === null) {
        return;
    }

    pauseStarted = performance.now();

    navigator.geolocation.clearWatch(watchId);

    watchId = null;

    clearInterval(timerInterval);

    statusDisplay.textContent = "Paused";
}


// =========================
// STOP
// =========================

function stopRun() {

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = null;

    clearInterval(timerInterval);

    statusDisplay.textContent = "Run finished";

    startTime = null;
    pausedTime = 0;
    pauseStarted = null;
    totalDistance = 0;
    lastPosition = null;

    distanceDisplay.textContent = "0.00 km";
    timeDisplay.textContent = "00:00:00";
    speedDisplay.textContent = "0.00 km/h";
    paceDisplay.textContent = "0:00 min/km";
}


// =========================
// GPS ERROR
// =========================

function locationError(error) {

    if (error.code === 1) {

        statusDisplay.textContent =
            "Location permission denied.";

    } else if (error.code === 2) {

        statusDisplay.textContent =
            "GPS location unavailable.";

    } else if (error.code === 3) {

        statusDisplay.textContent =
            "GPS timeout. Searching again...";

    } else {

        statusDisplay.textContent =
            "GPS error.";
    }
}