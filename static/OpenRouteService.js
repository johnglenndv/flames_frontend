// OPENROUTE SERVICE (ORS) LOGIC - FETCH VERSION
let routingControl = null; // Dito i-se-save ang asul na linya
let waypoints = [];
let routeMarkers = []; 
let isCalculating = false; // Bantay para sa guard clause sa map.js

// API KEY NG MAP
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImEyYTEzN2QzOGRlNzQzNzQ5MTMwZTg1NzVkMTJlMzFiIiwiaCI6Im11cm11cjY0In0=';

// GATEWAY LOCATION FOR ROUTING
const gatewayLocation = { lat: 16.046962, lng: 120.342117 }; 

// Custom Icons
const greenIcon = L.icon({
    iconUrl: 'icons/StartingPoint.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [80, 80], iconAnchor: [38.5, 53], shadowSize: [80, 80], shadowAnchor: [28, 78], popupAnchor: [0, -78]
});

const redIcon = L.icon({
    iconUrl: 'icons/EndPoint.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [80, 80], iconAnchor: [38.5, 53], shadowSize: [80, 80], shadowAnchor: [28, 78], popupAnchor: [0, -78]
});

// 1. START SELECTION: Pindutin ang Calculate sa menu
document.getElementById('calc-route').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e);
    
    if (waypoints.length === 2) {
        // Kapag may 2 markers na, tawagin ang API para sa asul na ruta
        calculateRoute(waypoints[0], waypoints[1]);
        isCalculating = false; 
        document.getElementById('route-menu').style.display = 'none';
    } else {
        // I-activate ang marker mode kung wala pang sapat na markers
        isCalculating = true; 
        clearPreviousRoute();
        alert("Select Starting Point (Green) and Destination Point (Red)");
    }
});

// 2. MAP CLICK: Paglalagay ng Green at Red markers 
map.on('click', function(e) {
    if (!isCalculating) return;

    if (waypoints.length < 2) {
        waypoints.push(e.latlng);
        const currentIcon = (waypoints.length === 1) ? greenIcon : redIcon;
        const marker = L.marker(e.latlng, { icon: currentIcon }).addTo(map);
        routeMarkers.push(marker);
    }
});

// 3. API CALCULATION 
function calculateRoute(start, end) {
    // API URL para sa driving-car profile
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                // Kung mag-error pa rin ng 401, ito ang magsasabi sa console
                throw new Error('API Response Error: Check if Key is valid or Whitelist is set.');
            }
            return response.json();
        })
        .then(data => {
            
            const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
            const summary = data.features[0].properties.summary;

     
            if (routingControl) map.removeLayer(routingControl);
            routingControl = L.polyline(coords, {
                color: '#0f0097ff', 
                weight: 3, 
                opacity: 1
            }).addTo(map);

      
            const dist = (summary.distance / 1000).toFixed(2); // Meters to KM
            const time = Math.round(summary.duration / 60); // Seconds to Mins

            const infoBox = document.getElementById('route-info-box');
            if (infoBox) {
                infoBox.style.display = 'flex';
                // [NOTE: Updated color design para magmukhang gaya ng sa screenshot mo]
                document.getElementById('route-dist').innerHTML = `<img id="distance-icon" src="icons/distance.png"/> <span style="color: #2ecc71; font-weight: bold;">${dist} km</span>`;
                document.getElementById('route-time').innerHTML = `<img id="minutes-icon" src="icons/minutes.png"/> <span style="color: #f39c12; font-weight: bold;">~${time} mins</span>`;
            }
            
            // I-zoom ang mapa sa buong ruta
            map.fitBounds(routingControl.getBounds());
        })
        .catch(err => {
            console.error("Routing Error:", err);
            alert("Routing failed. No Roadway Available.");
        });
}

// 4. RESET / CLEAR FUNCTION
function clearPreviousRoute() {
    if (routingControl) {
        map.removeLayer(routingControl);
        routingControl = null;
    }
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];
    waypoints = [];
    document.getElementById('route-info-box').style.display = 'none';
}

document.getElementById('clear-route').addEventListener('click', clearPreviousRoute);
document.getElementById('close-info-btn').addEventListener('click', clearPreviousRoute);






//AUTOMATIC ROUTING FROM GATEWAY TO INCIDENT =====================================================================
function routeToIncident(destLat, destLng) {
    console.log("Routing from Gateway to Incident at:", destLat, destLng);

    // 1. Linisin muna ang lumang ruta
    clearPreviousRoute();

    // 2. I-set ang Start Point (Gateway) at Destination (Fire Incident)
    const startPoint = gatewayLocation;
    const endPoint = { lat: destLat, lng: destLng };

    // 3. I-push sa waypoints array
    waypoints[0] = startPoint;
    waypoints[1] = endPoint;

    // 4. Ilagay ang markers sa mapa (Green para sa Gateway, Red para sa Incident)
    const m1 = L.marker([startPoint.lat, startPoint.lng], { icon: greenIcon }).addTo(map);
    const m2 = L.marker([endPoint.lat, endPoint.lng], { icon: redIcon }).addTo(map);
    routeMarkers.push(m1, m2);

    // 5. I-trigger ang automatic calculation para sa asul na ruta at info box
    calculateRoute(startPoint, endPoint);

    // 6. I-zoom ang mapa papunta sa lokasyon ng sunog
    map.flyTo([destLat, destLng], 14);
}