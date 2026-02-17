var map = L.map('flames-map',{ zoomControl: false}).setView([16.046962, 120.342117], 12);

// Global cache for latest node data (updated by MQTT)
     window.nodeDataCache = {};

     // Storage for Leaflet marker objects
     window.nodeMarkers = {};
     

// 1. GLOBAL VARIABLES
window.currentLocationMarker = null;
window.currentLocationCircle = null;
const locateBtn = document.getElementById('locate-btn');
let savedMarkersList = [];

// 2. FUNCTION PARA LINISIN ANG MARKERS
function clearMyLocation() {
    if (window.currentLocationMarker) {
        map.removeLayer(window.currentLocationMarker);
        window.currentLocationMarker = null;
    }
    if (window.currentLocationCircle) {
        map.removeLayer(window.currentLocationCircle);
        window.currentLocationCircle = null;
    }
}

// 3. LOCATE BUTTON CLICK LOGIC
locateBtn.addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e); 
    clearMyLocation();
    map.locate({
        setView: false, 
        maxZoom: 18,
        enableHighAccuracy: true,
    });
});

// 4. PAGSULPOT NG MARKER AT CIRCLE
map.on('locationfound', function(e) {
    clearMyLocation();
    map.flyTo(e.latlng, 18, {
        animate: true,
        duration: 1
    });
    window.currentLocationCircle = L.circle(e.latlng, e.accuracy / 2, {
        color: '#ff914d',
        fillColor: '#ff914d',
        fillOpacity: 0.15
    }).addTo(map);

    var customIcon = L.icon({
        iconUrl: 'icons/locationmarker.png',
        iconSize: [50, 50],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    window.currentLocationMarker = L.marker(e.latlng,{icon: customIcon}).addTo(map)
            .bindPopup("You're here right now!").openPopup();
});

map.on('locationerror', function(e) {
    alert("Can't access your location. " + e.message);
});

// 5. LISTENERS PARA SA PAGBURA
map.on('click', function() {
    clearMyLocation();
});

map.on('dragstart', function() {
    clearMyLocation();
});

// Zoom Logic
document.getElementById('zoom-in').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    map.zoomOut();
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
    attribution: '© OpenStreetMap contributors' 
}).addTo(map);


var flamesIcon = L.icon({
    iconUrl: 'icons/Gateway.png', 
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// GATEWAY LOGIC
var gatewayMarker = L.marker([16.046962, 120.342117], { icon: flamesIcon }) 
    .addTo(map)
    .bindPopup("PHINMA Upang (F.L.A.M.E.S. Gateway)", {
        autoClose: false,
        closeOnClick: false,
        closeButton: true
    });

gatewayMarker.on('mouseover', function (e) { this.openPopup(); });
gatewayMarker.on('mouseout', function (e) { this.closePopup(); });
gatewayMarker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    this.openPopup(); 
    var currentZoom = map.getZoom();
    var targetZoom = (currentZoom === 12) ? 20 : 12; 
    map.flyTo(e.latlng, targetZoom, { animate: true, duration: 1.5 });
    resetNodeStatus();
});

var nodeIcon = L.icon({
    iconUrl: 'icons/Node.png', 
    iconSize: [50, 50],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});


function resetNodeStatus() {
    var statusContent = document.getElementById('status-content');
    var headerRight = document.getElementById('header-right');
    if (headerRight) headerRight.innerHTML = "Select a node";
    if (statusContent) {
        statusContent.style.alignItems = "center";
        statusContent.style.justifyContent = "flex-start";
        statusContent.style.opacity = "0.6";
        statusContent.innerHTML = '<p>Click a node to see its status.</p>'; 
    }
}

document.getElementById('home-btn').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    map.flyTo([16.043859, 120.335190], 12, { animate: true, duration: 1.5 });
    resetNodeStatus();
});

// NODES LOGIC


document.addEventListener('DOMContentLoaded', function() {
    const viewAllBtn = document.querySelector('.view-all-btn');
    const hideBtn = document.getElementById('hide-btn');
    const counterView = document.querySelector('.pinned-main-content');
    const listView = document.getElementById('list-pinned-view');

    viewAllBtn.addEventListener('click', function() {
        counterView.style.display = 'none';
        listView.style.display = 'flex';
        // Nag-aadjust na ang height base sa CSS max-height
        listView.parentElement.style.height = 'auto'; 
    });

    hideBtn.addEventListener('click', function() {
        listView.style.display = 'none';
        counterView.style.display = 'flex';
        listView.parentElement.style.height = ''; 
    });
});

// PINNED LOCATION LOGIC
let tempMarker;

var savedPinIcon = L.icon({
    iconUrl: 'icons/Pinpoint.png', 
    iconSize: [60, 60],               
    iconAnchor: [30, 60],               
    popupAnchor: [0, -60]               
});

//RIGHT CLICK FOR PINPOINTING LOC 
map.on('contextmenu', onMapClick); 



function onMapClick(e) {

 if (isCalculating === true) { 
        return; 
    }
    
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    if (tempMarker) map.removeLayer(tempMarker);

    const popupContent = `
        <div class="custom-popup"> 
            <label>Location Name</label>
            <input type="text" id="loc-name" placeholder="e.g., Evacuation Center">
            <label>Description</label>
            <textarea id="loc-desc" placeholder="(Optional)"></textarea>
            <label>Coordinates</label>
            <div class="coords-display">${lat}, ${lng}</div>
            <div class="popup-buttons">
                <button onclick="saveLocation(${lat}, ${lng})" class="save-btn">Save Pinned Location</button>
                <button onclick="cancelSave()" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    tempMarker = L.marker([lat, lng], { icon: savedPinIcon }).addTo(map)
        .bindPopup(popupContent, { minWidth: 250, closeButton: false, closeOnClick: false })
        .openPopup();
}

function cancelSave() {
    if (tempMarker) map.removeLayer(tempMarker);
    map.closePopup();
}

function saveLocation(lat, lng) {
    const name = document.getElementById('loc-name').value || "Unnamed Location";
    const desc = document.getElementById('loc-desc').value || "No description provided.";
    
    const savedMarker = L.marker([lat, lng], { icon: savedPinIcon }).addTo(map);
    const markerId = Date.now();
    savedMarker._id = markerId;

    const savedPopupContent = `
        <div class="saved-location-popup" style="color: white; font-family: Arial;">
            <strong style="color: #f75b00ff; font-size: 15px;">${name}</strong>
            <p style="margin-top: 5px; font-size: 12px;">${desc}</p>
            <p style="color: #f9f9f9ff; font-size: 11px">${lat}, ${lng}</p>
        </div>
    `;

    savedMarker.bindPopup(savedPopupContent, { autoClose: false, closeOnClick: false, closeButton: true });

    savedMarker.on('mouseover', function() { this.openPopup(); });
    savedMarker.on('mouseout', function() { this.closePopup(); });
    
    savedMarker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        this.openPopup();
        map.flyTo(e.latlng, 18, { animate: true, duration: 1.5 });
    });

    const listWrapper = document.getElementById('list-pinned-view');
    if (listWrapper) {
        const newItem = document.createElement('div');
        newItem.id = `record-${markerId}`;
        newItem.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px; 
            background: rgba(255,255,255,0.05); 
            border-radius: 8px; 
            cursor: pointer; 
            margin-top: 10px;
            border-left: 4px solid #f75b00;
            width: 100%;
            flex-shrink: 0;
        `;
        
        newItem.innerHTML = `
            <div style="flex-grow: 1; overflow: hidden;" onclick="zoomToPinned(${lat}, ${lng}, ${markerId})">
                <strong style="color: #fff; display: block; font-size: 14px; overflow: hidden;
                 text-overflow: ellipsis; white-space: nowrap;">${name}</strong>

                <small style="color: #aaa; font-size: 12px; display: block; margin-top: 4px;">${desc}</small>
            </div>

            <button class="delete-btn-loc" onclick="deletePinned(${markerId})" style="border: none; border-radius: 7px;
             padding: 5px; background:transparent; cursor: pointer; display: flex; align-items: center; margin-left: 15px;">

             <style>
                .delete-btn-loc:hover{
                        background: red !important; 
                      
                        
                }
             </style>

                 <img src="https://img.icons8.com/material-outlined/20/ffffff/trash.png"/>
            </button>



        `;
        listWrapper.appendChild(newItem);
    }

    savedMarkersList.push(savedMarker);

    // Counter Logic
    const container = document.querySelector('.pinned-main-content');
    if (container) {
        const allElements = container.querySelectorAll('h1, h2, h3, p, span, div');
        allElements.forEach(el => {
            if (!isNaN(el.innerText.trim()) && el.innerText.trim() !== "") {
                let count = parseInt(el.innerText);
                el.innerText = count + 1;
            }
        });
    }
  
    if (tempMarker) map.removeLayer(tempMarker);
    map.closePopup();
}

function zoomToPinned(lat, lng, id) {
    map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
    const targetMarker = savedMarkersList.find(m => m._id === id);
    if (targetMarker) targetMarker.openPopup();
}

function deletePinned(id) {
    if (confirm("Delete this pinned location?")) {
        const markerIndex = savedMarkersList.findIndex(m => m._id === id);
        if (markerIndex > -1) {
            map.removeLayer(savedMarkersList[markerIndex]);
            savedMarkersList.splice(markerIndex, 1);
        }

        const recordElement = document.getElementById(`record-${id}`);
        if (recordElement) recordElement.remove();

        const container = document.querySelector('.pinned-main-content');
        if (container) {
            const allElements = container.querySelectorAll('h1, h2, h3, p, span, div');
            allElements.forEach(el => {
                if (!isNaN(el.innerText.trim()) && el.innerText.trim() !== "") {
                    let count = parseInt(el.innerText);
                    if (count > 0) el.innerText = count - 1;
                }
            });
        }
    }
}


// ==========================================
// ROUTE PLANNER UI LOGIC
// ==========================================
const routeBtn = document.getElementById('route-btn');
const routeMenu = document.getElementById('route-menu');

// Pagpindot sa Orange Button (Toggle Menu)
routeBtn.addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    
    const rect = routeBtn.getBoundingClientRect();
    
    // Itapat ang menu sa top level ng button
    routeMenu.style.top = rect.top + "px";
    
    // Ang 'right' ng menu ay dapat magmula sa layo ng button mula sa kanang dulo ng screen
    // Halimbawa: Distansya mula kanan + Lapad ng button + konting gap
    const offsetRight = window.innerWidth - rect.left + 5;
    routeMenu.style.right = offsetRight + "20px";
    routeMenu.style.left = "auto"; // Siguraduhing naka-disable ang left positioning

    if (routeMenu.style.display === 'flex') {
        routeMenu.style.display = 'none';
    } else {
        routeMenu.style.display = 'flex';
    }
});

// Siguraduhin na mawawala ang menu pag clinick ang mapa mismo
map.on('click', function() {
    routeMenu.style.display = 'none';
});

// Next steps placeholder
document.getElementById('calc-route').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    console.log("Calculate clicked");
});

document.getElementById('clear-route').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    console.log("Clear clicked");
});


// PARA HINDI MAGKAROON NG COLOR GRAY SA MAP PAG INAADJUST UNG SCREEN SIZE //////////////////////////////////////////////
const mapObserver = new ResizeObserver(() => {
    if (typeof map !== 'undefined' && map !== null) {
        // Pilitin ang Leaflet na i-check ang bagong dimensions
        map.invalidateSize();
        console.log("Map resized automatically");
    }
});

// 2. Simulan ang pagbabantay sa iyong map div
const mapContainer = document.getElementById('flames-map');
if (mapContainer) {
    mapObserver.observe(mapContainer);
}
// PARA HINDI MAGKAROON NG COLOR GRAY SA MAP PAG INAADJUST UNG SCREEN SIZE //////////////////////////////////////////////





// Function para sa pag-search ///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==========================================
// INTEGRATED SEARCH BAR LOGIC
// ==========================================

let searchDebounceTimer; 

function handleSearch(query) {
    const suggestionsBox = document.getElementById('suggestionsBox');
    const clearBtn = document.getElementById('clearSearch');
    const searchIcon = document.querySelector('.search-icon-inside');

    // Control visibility of icons
    if (query.length > 0) {
        if (clearBtn) clearBtn.style.display = 'block'; 
        if (searchIcon) searchIcon.classList.add('hide-icon'); 
    } else {
        clearSearchInput();
        return;
    }

    // Debounce to avoid too many API calls
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        if (query.length < 3) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Nominatim API for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
            .then(response => response.json())
            .then(data => {
                suggestionsBox.innerHTML = '';
                if (data.length > 0) {
                    suggestionsBox.style.display = 'block';
                    const item = data[0];
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.innerText = item.display_name;
                    
                    // Sa click, lilipad ang mapa at gagawa ng ruta
                    div.onclick = () => selectSuggestedLocation(item.lat, item.lon, item.display_name);
                    suggestionsBox.appendChild(div);
                } else {
                    suggestionsBox.style.display = 'none';
                }
            })
            .catch(err => console.error("Search Error:", err));
    }, 500); 
}

function selectSuggestedLocation(lat, lng, name) {
    const searchInput = document.getElementById('mapSearchInput');
    const suggestionsBox = document.getElementById('suggestionsBox');
    
    if (searchInput) searchInput.value = name;
    if (suggestionsBox) suggestionsBox.style.display = 'none';

    const destLat = parseFloat(lat);
    const destLng = parseFloat(lng);

    // MOTION: Fly to the searched location
    map.flyTo([destLat, destLng], 15, {
        animate: true,
        duration: 1.5
    });

    // REUSE: Tawagin ang function na 'routeToIncident' mula sa ORS.js
    // Ito ang susi para hindi masira ang Route Planner at Incident logic mo
    if (typeof routeToIncident === "function") {
        routeToIncident(destLat, destLng);
    } else {
        console.error("Function routeToIncident not found in OPENROUTESERVICE.JS");
    }
}

function clearSearchInput() {
    const searchInput = document.getElementById('mapSearchInput');
    const clearBtn = document.getElementById('clearSearch');
    const suggestionsBox = document.getElementById('suggestionsBox');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (suggestionsBox) suggestionsBox.style.display = 'none';

    const searchIcon = document.querySelector('.search-icon-inside');
    if (searchIcon) searchIcon.classList.remove('hide-icon');

    // REUSE: Tawagin ang clear function para linisin ang mapa
    if (typeof clearPreviousRoute === "function") {
        clearPreviousRoute();
    }
}

// Create or update marker for a node
function createOrUpdateNodeMarker(nodeId, lat, lon) {
    if (!lat || !lon) return;

    const data = window.nodeDataCache[nodeId] || {};

    // Remove old marker if exists
    if (window.nodeMarkers[nodeId]) {
        map.removeLayer(window.nodeMarkers[nodeId]);
    }

    // Create new marker
    const marker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(getNodePopupContent(nodeId, data));

    // Click → update status card + fly to location
    marker.on('click', function(e) {
        map.flyTo([lat, lon], 16);
        updateNodeStatusCard(nodeId);
        this.openPopup();
    });

    window.nodeMarkers[nodeId] = marker;
}

// Popup content when hovering/clicking marker
function getNodePopupContent(nodeId, data) {
    return `
        <strong>${nodeId}</strong><br>
        Temp: ${data.temp ?? '--'}°C | Hum: ${data.hum ?? '--'}%<br>
        Flame: ${data.flame === 1 ? '🔥 ALERT' : 'Normal'}<br>
        Smoke: ${data.smoke ?? 0}<br>
        Last: ${data.received_at ? new Date(data.received_at).toLocaleString('en-PH') : 'Waiting...'}
    `;
}

// Update the Node Status card in dashboard.html
function updateNodeStatusCard(nodeId) {
    const statusContent = document.getElementById('status-content');
    const headerRight = document.getElementById('header-right');

    if (!statusContent || !headerRight) return;

    headerRight.innerHTML = `${nodeId} • Live`;

    const data = window.nodeDataCache[nodeId];
    if (!data) {
        statusContent.innerHTML = "<p>No recent data for this node.</p>";
        return;
    }

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

// Close suggestions on map interaction
map.on('contextmenu click dragstart', function() {
    const suggestionsBox = document.getElementById('suggestionsBox');
    if (suggestionsBox) suggestionsBox.style.display = 'none';
});