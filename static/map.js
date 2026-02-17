var map = L.map('flames-map',{ zoomControl: false}).setView([16.046962, 120.342117], 12); 

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

var nodesData = [
    { name: "Malasiqui", coords: [15.931320, 120.427939], temp: "28&deg;C", humidity: "68%", smoke: "Clear", flame: "Negative" },
    { name: "San Carlos", coords: [15.937700, 120.343361], temp: "45&deg;C", humidity: "66%", smoke: "Positive", flame: "Alert" },
    { name: "Binmaley", coords: [16.028410, 120.269180], temp: "30&deg;C", humidity: "71%", smoke: "Clear", flame: "Negative" }
];

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
nodesData.forEach(function(node) {
    var marker = L.marker(node.coords, { icon: nodeIcon })
        .addTo(map)
        .bindPopup(node.name, {
            autoClose: false,
            closeOnClick: false,
            closeButton: true
        }); 

    marker.on('mouseover', function () { this.openPopup(); });
    marker.on('mouseout', function () { this.closePopup(); });
    
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e); 
        this.openPopup(); 
        map.flyTo(e.latlng, 18, { animate: true, duration: 1.5 });

        var statusContent = document.getElementById('status-content');
        var headerRight = document.getElementById('header-right');
        if (headerRight) headerRight.innerHTML = ""; 
        statusContent.style.alignItems = "stretch";
        statusContent.style.opacity = "1";
        
        statusContent.innerHTML = `
        <div class="node-popup-container">
            <div class="node-location">
                <p>Location:   <span class="val">${node.name}</span></p>
            </div>

            <div class="node-data-grid">
                <div class="left-data">
                    <p><img src="icons/temperature.png" class="node-icon">Temp: <span class="val">${node.temp}</span></p>
                    <p><img src="icons/humidity.png" class="node-icon">Humidity: <span class="val">${node.humidity}</span></p>
                </div>

                <div class="right-data">
                    <p><img src="icons/smoke.png" class="node-icon">Smoke: <span class="val">${node.smoke}</span></p>
                    <p><img src="icons/flame.png" class="node-icon">Flame: <span class="val">${node.flame}</span></p>
                </div>
            </div>
        </div>
        `;
    });
});

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

// Close suggestions on map interaction
map.on('contextmenu click dragstart', function() {
    const suggestionsBox = document.getElementById('suggestionsBox');
    if (suggestionsBox) suggestionsBox.style.display = 'none';
});