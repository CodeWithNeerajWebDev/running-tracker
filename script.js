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
    if (watchId !== null) {
        return;
    }

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
            totalDistance.toFixed(2) + "
