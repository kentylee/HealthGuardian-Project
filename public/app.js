// Extract latitude and longitude from the URL parameters
const params = new URLSearchParams(window.location.search);
const latitude = parseFloat(params.get('lat')) || 1.3521;  // Default latitude (Singapore)
const longitude = parseFloat(params.get('lang')) || 103.8198;  // Default longitude (Singapore)

// Initialize HERE Maps Platform
const platform = new H.service.Platform({
    'apikey': 'aOQcLbGyYVKVYBwMbK2CF1wyqbsxR86zsa7gs5ym58w' // Replace with your actual API key
});

const defaultLayers = platform.createDefaultLayers();
const map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
        zoom: 10,
        center: { lat: latitude, lng: longitude } // Hospital's location
    }
);

// Enable map interaction (pan, zoom, etc.)
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
const ui = H.ui.UI.createDefault(map, defaultLayers);

// Add marker for the hospital's location
const defaultLocation = { lat: latitude, lng: longitude };
const destinationMarker = new H.map.Marker(defaultLocation);
map.addObject(destinationMarker);

// Function to calculate and display the route
function calculateRoute(start, end) {
    const router = platform.getRoutingService();
    const routeRequestParams = {
        mode: 'fastest;car',
        waypoint0: `geo!${start.lat},${start.lng}`,
        waypoint1: `geo!${end.lat},${end.lng}`,
        representation: 'display'
    };

    router.calculateRoute(routeRequestParams, (result) => {
        if (result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            const lineString = new H.geo.LineString();

            // Loop through the polyline data to form the route
            route.sections[0].polyline.split(';').forEach((point) => {
                const [lat, lng] = point.split(',').map(Number);
                lineString.pushLatLngAlt(lat, lng);
            });

            const routeLine = new H.map.Polyline(lineString, {
                style: { strokeColor: 'blue', lineWidth: 5 }
            });
            map.addObject(routeLine);
            map.setViewBounds(routeLine.getBoundingBox(), true);
        }
    }, (error) => {
        console.error('Error calculating route:', error);
    });
}

// Function to get user's location and calculate the route
function getUserLocationAndRoute() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Add marker for the user's current location
            const userMarker = new H.map.Marker(userLocation);
            map.addObject(userMarker);

            // Center the map on the user's location
            map.setCenter(userLocation);
            map.setZoom(12);

            // Calculate the route from the user's location to the hospital
            calculateRoute(userLocation, defaultLocation);
        }, (error) => {
            console.error('Geolocation error:', error);
            // Fallback: Calculate route using default hospital location
            calculateRoute(defaultLocation, defaultLocation);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        // Fallback: Calculate route using default hospital location
        calculateRoute(defaultLocation, defaultLocation);
    }
}

// Call the function to get the user's location and calculate the route
getUserLocationAndRoute();
