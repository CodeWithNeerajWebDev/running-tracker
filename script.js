alert("JavaScript is working!");

let watchId = null;
let startTime = null;
let timerInterval = null;

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

function startRun() {
    if (watchId !== null) return;

    if (!startTime) {
        startTime = Date.now();
        totalDistance = 0;
        lastPosition = null;
    }

    statusDisplay.textContent = "Running...";

    timerInterval = setInterval(updateTime, 1000);

    if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
            updatePosition,
            locationError,
            {
                enableHighAccuracy: true,
                maximumAge: 0
            }
        );
    } else {
        statusDisplay.textContent = "GPS is not supported.";
    }
}

function updatePosition(position) {
    const currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    if (lastPosition !== null) {
        const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            currentPosition.latitude,
            currentPosition.longitude
        );

        totalDistance += distance;

        distanceDisplay.textContent =
            totalDistance.toFixed(2) + " km";

        updateSpeedAndPace();
    }

    lastPosition = currentPosition;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
}

function updateTime() {
    if (!startTime) return;

    const elapsed = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsed / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timeDisplay.textContent =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    updateSpeedAndPace();
}

function updateSpeedAndPace() {
    if (!startTime || totalDistance <= 0) return;

    const elapsedHours =
        (Date.now() - startTime) / 3600000;

    const speed = totalDistance / elapsedHours;

    speedDisplay.textContent =
        speed.toFixed(2) + " km/h";

    const elapsedMinutes =
        (Date.now() - startTime) / 60000;

    const pace = elapsedMinutes / totalDistance;

    const paceMinutes = Math.floor(pace);
    const paceSeconds =
        Math.floor((pace - paceMinutes) * 60);

    paceDisplay.textContent =
        paceMinutes + ":" +
        String(paceSeconds).padStart(2, "0") +
        " min/km";
}

function pauseRun() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    clearInterval(timerInterval);

    statusDisplay.textContent = "Paused";
}

function stopRun() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    clearInterval(timerInterval);

    statusDisplay.textContent = "Run finished";

    startTime = null;
    lastPosition = null;
}

function locationError(error) {
    statusDisplay.textContent =
        "Please allow location/GPS permission.";
}
