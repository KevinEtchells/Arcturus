/*global google*/
/*global enterZone*/

var maps = {};

(function () {
    
    "use strict";
    
    var currentPositionMarker,
        gameArea,
        mapMain;

    maps.init = function (settings) {
        
        var mapSettings,
            rectangle;

        // *** MAIN MAP ***
        mapMain = new google.maps.Map(document.querySelector("#map"), {
            scaleControl: true,
            zoom: 14,
            //center: {lng: zones[0].longitude, lat: zones[0].latitude}
            center: {lng: settings.gameArea[0].lng, lat: settings.gameArea[0].lat}
        });
        
        // show current position
        currentPositionMarker = new google.maps.Marker({
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                strokeColor: "blue",
                strokeWeight: 2,
                fillColor: "blue",
                fillOpacity: 0.4
            },
            map: mapMain
        });
        
        // *** SETTINGS MAP ***
        mapSettings = new google.maps.Map(document.querySelector("#game-area"), {
            scaleControl: true,
            zoom: 14,
            //center: {lng: zones[0].longitude, lat: zones[0].latitude}
            center: {lng: settings.gameArea[0].lng, lat: settings.gameArea[0].lat}
        });

        // game area
        gameArea = new google.maps.Polygon({
            strokeColor: "#24294f",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#24294f",
            fillOpacity: 0.35,
            paths: settings.gameArea,
            map: mapSettings,
            editable: true,
            draggable: true
        });

    };
    
    (function () {
        var zoneMarkers = [],
            zoneRadii = [];
        maps.showZones = function (zones, settings) {
            
            // if no zoneMarkers, create these
            if (!zoneMarkers.length) {
                zones.forEach(function (zone) {
                    var zoneMarker = new google.maps.Marker({
                            position: {lng: zone.longitude, lat: zone.latitude},
                            map: mapMain
                        }),
                        zoneRadius = new google.maps.Circle({
                            strokeColor: "red",
                            strokeWeight: 1,
                            fillColor: "red",
                            fillOpacity: 0.4,
                            center: {lng: zone.longitude, lat: zone.latitude},
                            radius: settings.ZONES_RADIUS,
                            map: mapMain
                        });
                    google.maps.event.addListener(zoneMarker, 'click', function () {
                        if (window.confirm("Manually enter this zone?")) {
                            enterZone(zone);
                        }
                    });
                    zoneMarkers.push(zoneMarker);
                    zoneRadii.push(zoneRadius);
                });
            }
            
            // set latest positions
            zones.forEach(function (zone, zoneIndex) {
                zoneMarkers[zoneIndex].setPosition({lng: zone.longitude, lat: zone.latitude});
                zoneRadii[zoneIndex].setCenter({lng: zone.longitude, lat: zone.latitude});
            });
        };
    }());

    
    maps.setPosition = function (lat, lng) {
        if (currentPositionMarker) {
            currentPositionMarker.setPosition({lat: lat, lng: lng});
        }
    };
    
    
    maps.getGameArea = function () {
        var points = [];
        gameArea.latLngs.b[0].b.forEach(function (point) {
            points.push({
                lat: point.lat(),
                lng: point.lng()
            });
        });
        return points;
    };
    
    
    maps.inGameArea = function (lat, lng) {
        return gameArea.containsLatLng(new google.maps.LatLng(lat, lng));
    };
    
}());