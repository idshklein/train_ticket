const JERUSALEM_STATION_ID = "680";
const DEFAULT_OTHER_STATION = "2800";

const state = {
  direction: "from-jerusalem",
  stations: [],
  pairs: {},
  meta: null,
};

const elements = {
  directionGroup: document.getElementById("directionGroup"),
  stationLabel: document.getElementById("stationLabel"),
  voucherForm: document.getElementById("voucherForm"),
  otherStation: document.getElementById("otherStation"),
  tripDate: document.getElementById("tripDate"),
  tripTime: document.getElementById("tripTime"),
  trainNumber: document.getElementById("trainNumber"),
  scheduleType: document.getElementById("scheduleType"),
  trainType: document.getElementById("trainType"),
  statusText: document.getElementById("statusText"),
};

function setDefaultDate() {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 5 ? 2 : day === 6 ? 1 : 0;
  now.setDate(now.getDate() + offset);

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  elements.tripDate.value = localDate;
}

function isSupportedWeekday(value) {
  if (!value) {
    return false;
  }

  const day = new Date(`${value}T12:00:00`).getDay();
  return day >= 0 && day <= 4;
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const normalizedHours = String(hours % 24).padStart(2, "0");
  return `${normalizedHours}:${minutesText}`;
}

function getPairKey(otherStationId) {
  return state.direction === "from-jerusalem"
    ? `${JERUSALEM_STATION_ID}_${otherStationId}`
    : `${otherStationId}_${JERUSALEM_STATION_ID}`;
}

function getAvailableStations() {
  return state.stations
    .filter((station) => String(station.stationId) !== JERUSALEM_STATION_ID)
    .filter((station) => (state.pairs[getPairKey(String(station.stationId))] || []).length > 0)
    .sort((a, b) => a.stationName.localeCompare(b.stationName, "he"));
}

function renderStationOptions() {
  const previousValue = elements.otherStation.value;
  const stations = getAvailableStations();
  elements.stationLabel.textContent = state.direction === "from-jerusalem" ? "תחנת יעד" : "תחנת מוצא";
  elements.otherStation.innerHTML = [
    '<option value="">בחר תחנה</option>',
    ...stations.map(
      (station) => `<option value="${station.stationId}">${station.stationName} (${station.stationId})</option>`
    ),
  ].join("");

  if (stations.some((station) => String(station.stationId) === previousValue)) {
    elements.otherStation.value = previousValue;
  } else if (stations.some((station) => String(station.stationId) === DEFAULT_OTHER_STATION)) {
    elements.otherStation.value = DEFAULT_OTHER_STATION;
  } else if (stations[0]) {
    elements.otherStation.value = String(stations[0].stationId);
  }
}

function getTripOptions() {
  const otherStationId = elements.otherStation.value;
  if (!otherStationId) {
    return [];
  }
  return state.pairs[getPairKey(otherStationId)] || [];
}

function renderTimeOptions() {
  const options = getTripOptions();
  const previousValue = elements.tripTime.value;

  elements.tripTime.innerHTML = [
    '<option value="">בחר שעה</option>',
    ...options.map(
      (option) => `<option value="${formatTime(option.departureTime)}">${formatTime(option.departureTime)} ← ${formatTime(option.arrivalTime)} • רכבת ${option.trainNumber}</option>`
    ),
  ].join("");

  if (options.some((option) => formatTime(option.departureTime) === previousValue)) {
    elements.tripTime.value = previousValue;
  } else if (options[0]) {
    elements.tripTime.value = formatTime(options[0].departureTime);
  }

  syncTrainNumberToTime();
}

function updateStatus() {
  if (!isSupportedWeekday(elements.tripDate.value)) {
    elements.tripTime.innerHTML = '<option value="">אין יכולת לעשות לסופשים</option>';
    elements.trainNumber.value = "";
    elements.statusText.textContent = "אין יכולת לעשות לסופשים.";
    return;
  }

  const options = getTripOptions();
  renderTimeOptions();

  if (!elements.otherStation.value || !options.length) {
    elements.statusText.textContent = "";
    return;
  }

  elements.statusText.textContent = "";
}

function syncTrainNumberToTime() {
  const selectedOption = getTripOptions().find(
    (option) => formatTime(option.departureTime) === elements.tripTime.value
  );

  elements.trainNumber.value = selectedOption ? String(selectedOption.trainNumber || "") : "";
}

function handleDirectionClick(event) {
  const button = event.target.closest(".direction-btn");
  if (!button) {
    return;
  }

  state.direction = button.dataset.direction;
  document.querySelectorAll(".direction-btn").forEach((item) => {
    item.classList.toggle("active", item === button);
  });

  renderStationOptions();
  updateStatus();
}

function handleSubmit(event) {
  event.preventDefault();

  if (!isSupportedWeekday(elements.tripDate.value)) {
    elements.statusText.textContent = "אין יכולת לבצע הזמנה לסופשים. נא לבחור יום ראשון עד חמישי.";
    return;
  }

  const otherStationId = elements.otherStation.value;
  if (!otherStationId || !elements.tripTime.value) {
    elements.statusText.textContent = "יש לבחור תחנה ושעה מתוך הרשימה.";
    return;
  }

  const fromStation = state.direction === "from-jerusalem" ? JERUSALEM_STATION_ID : otherStationId;
  const toStation = state.direction === "from-jerusalem" ? otherStationId : JERUSALEM_STATION_ID;

  const params = new URLSearchParams({
    page: "trip-reservation",
    fromStation,
    toStation,
    date: elements.tripDate.value,
    time: elements.tripTime.value,
    scheduleType: elements.scheduleType.value || "1",
    trainType: elements.trainType.value || "empty",
  });

  if (elements.trainNumber.value.trim()) {
    params.set("trainNumber", elements.trainNumber.value.trim());
  }

  window.location.href = `https://www.rail.co.il/?${params.toString()}`;
}

async function loadData() {
  try {
    const response = await fetch("rail_times_index.json");
    const data = await response.json();
    state.stations = data.stations || [];
    state.pairs = data.pairs || {};
    state.meta = data;

    renderStationOptions();
    updateStatus();
  } catch (error) {
    elements.statusText.textContent = "טעינת נתוני ה-GTFS נכשלה.";
    console.error(error);
  }
}

function registerEvents() {
  elements.directionGroup.addEventListener("click", handleDirectionClick);
  elements.otherStation.addEventListener("change", updateStatus);
  elements.tripDate.addEventListener("change", updateStatus);
  elements.tripTime.addEventListener("change", syncTrainNumberToTime);
  elements.voucherForm.addEventListener("submit", handleSubmit);
}

setDefaultDate();
registerEvents();
loadData();