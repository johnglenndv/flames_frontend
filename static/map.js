// ==================== UPDATED map.js - DYNAMIC NODES + REAL-TIME ====================

var map = L.map('flames-map', { zoomControl: false }).setView([16.046962, 120.342117], 12);

// Global storage for latest node data
window.nodeDataCache = {};   // e.g. { "Node1": { temp: 29.8, flame: 0, ... } }

// Gateway marker (fixed)
var flamesIcon = L.icon({
    iconUrl: 'icons/Gateway.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

var gatewayMarker = L.marker([16.046962, 120.342117], { icon: flamesIcon })
    .addTo(map)
    .bindPopup("PHINMA Upang (F.L.A.M.E.S. Gateway)");

// Node icon
var nodeIcon = L.icon({
    iconUrl: 'icons/Node.png',
    iconSize: [50, 50],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

// Dynamic markers storage
window.nodeMarkers = {};

// ==================== CREATE / UPDATE MARKER ====================
function createOrUpdateNodeMarker(nodeId, lat, lon, data) {
    if (!lat || !lon) return;

    // If marker already exists, just update popup
    if (window.nodeMarkers[nodeId]) {
        const marker = window.nodeMarkers[nodeId];
        marker.setLatLng([lat, lon]);
        marker.getPopup().setContent(getNodePopupContent(nodeId, data));
        return;
    }

    // Create new marker
    const marker = L.marker([lat, lon], { icon: nodeIcon })
        .addTo(map)
        .bindPopup(getNodePopupContent(nodeId, data), {
            autoClose: false,
            closeOnClick: false
        });

    // Click handler
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        this.openPopup();
        map.flyTo(e.latlng, 18, { animate: true, duration: 1.5 });
        updateNodeStatusCard(nodeId, data);
    });

    window.nodeMarkers[nodeId] = marker;
}

// Popup content for marker
function getNodePopupContent(nodeId, data) {
    return `
        <strong>${nodeId}</strong><br>
        Temp: ${data.temp ?? '--'}°C | Hum: ${data.hum ?? '--'}%<br>
        Flame: ${data.flame === 1 ? '🔥 ALERT' : 'Normal'}<br>
        Smoke: ${data.smoke ?? 0}
    `;
}

// ==================== UPDATE STATUS CARD (when clicked) ====================
function updateNodeStatusCard(nodeId, data) {
    const statusContent = document.getElementById('status-content');
    const headerRight = document.getElementById('header-right');

    if (headerRight) headerRight.innerHTML = `${nodeId} • Live`;

    const flameText = data.flame === 1 
        ? '<span style="color:#ff0000; font-weight:bold;">DETECTED 🔥 ALERT!</span>'
        : 'Normal';

    const smokeText = data.smoke > 500 
        ? '<span style="color:#ff8800; font-weight:bold;">HIGH SMOKE!</span>'
        : data.smoke;

    statusContent.innerHTML = `
        <strong>Node:</strong> ${nodeId}<br>
        <strong>Temperature:</strong> ${data.temp ?? '--'} °C<br>
        <strong>Humidity:</strong> ${data.hum ?? '--'} %<br>
        <strong>Flame:</strong> ${flameText}<br>
        <strong>Smoke:</strong> ${smokeText}<br>
        <strong>Location:</strong> ${data.lat ? data.lat.toFixed(6) : '--'}, ${data.lon ? data.lon.toFixed(6) : '--'}<br>
        <strong>RSSI / SNR:</strong> ${data.rssi ?? '--'} dBm / ${data.snr ?? '--'} dB<br>
        <strong>Last Update:</strong> ${data.received_at ? new Date(data.received_at).toLocaleString('en-PH') : 'Just now'}
    `;
}

// ==================== MQTT REAL-TIME LISTENER ====================
const MQTT_BROKER = "wss://528e719c19214a19b07c0e7322298267.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_TOPIC = "lora/uplink";

const client = mqtt.connect(MQTT_BROKER, {
    username: "Uplink01",
    password: "Uplink01",
    reconnectPeriod: 5000
});

client.on('connect', () => {
    console.log("✅ MQTT Connected - Real-time node updates active");
    client.subscribe(MQTT_TOPIC);
});

client.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        const payload = data.payload || {};
        const nodeId = payload.node;

        if (!nodeId) return;

        // Store latest data
        window.nodeDataCache[nodeId] = {
            temp: payload.temp,
            hum: payload.hum,
            flame: payload.flame,
            smoke: payload.smoke,
            lat: payload.lat,
            lon: payload.lon,
            rssi: data.rssi,
            snr: data.snr,
            received_at: data.received_at
        };

        // Create / update marker on map
        if (payload.lat && payload.lon) {
            createOrUpdateNodeMarker(nodeId, payload.lat, payload.lon, window.nodeDataCache[nodeId]);
        }

        // If this node is currently selected, update status card
        const currentHeader = document.getElementById('header-right').innerHTML;
        if (currentHeader.includes(nodeId)) {
            updateNodeStatusCard(nodeId, window.nodeDataCache[nodeId]);
        }

    } catch (e) {
        console.error("MQTT parse error:", e);
    }
});

// Initial load from API (fallback)
window.addEventListener("load", () => {
    fetch("https://api-production-32ac.up.railway.app/nodes")
        .then(r => r.json())
        .then(nodes => {
            nodes.forEach(n => {
                if (n.latitude && n.longitude) {
                    createOrUpdateNodeMarker(n.node_id, n.latitude, n.longitude, n);
                }
            });
        });
});