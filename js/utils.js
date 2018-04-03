/*global maps*/
/*global settings*/

var utils;

(function () {
    
    "use strict";

    utils = {
        
        pickRandomPoint: function (gameArea) {
            
            var outerPoints = {},
                pickPoint,
                point;
            
            // work out furthest extremities of gameArea
            gameArea.forEach(function (point) {
                if (!outerPoints.n || outerPoints.n < point.lat) {
                    outerPoints.n = point.lat;
                }
                if (!outerPoints.s || outerPoints.s > point.lat) {
                    outerPoints.s = point.lat;
                }
                if (!outerPoints.e || outerPoints.e < point.lng) {
                    outerPoints.e = point.lng;
                }
                if (!outerPoints.w || outerPoints.w > point.lng) {
                    outerPoints.w = point.lng;
                }
            });
            
            // create a new random zone:
            pickPoint = function () {
                point = {
                    latitude: (Math.random() * (outerPoints.n - outerPoints.s)) + outerPoints.s,
                    longitude: (Math.random() * (outerPoints.e - outerPoints.w)) + outerPoints.w
                };
            };
            
            // check point is defined and it fits within polygon
            while (!point || !maps.inGameArea(point.latitude, point.longitude)) {
                pickPoint();
            }

            return point;
            
        },

        createZones: function () {

            var attempts = 0,
                newZoneOkay,
                newZone,
                zones = [];

            while (zones.length < settings.ZONE_COUNT && attempts < 5000) {
                
                newZone = utils.pickRandomPoint(settings.gameArea);
                newZoneOkay = true;

                // check this doesn't overlap an existing zone:
                zones.forEach(function (zone) {
                    if (utils.distanceBetweenPoints(newZone, zone) < (settings.ZONES_RADIUS * settings.ZONE_SPACING_FACTOR)) {
                        newZoneOkay = false;
                    }
                });

                // if all checks okay, add it to the list of existing zones:
                if (newZoneOkay) {
                    newZone.name = "Zone " + (zones.length + 1);
                    newZone.index = zones.length; // used to determine key for DB writes
                    newZone.cost = Math.floor(Math.random() * (settings.ZONES_COST_MAX - settings.ZONES_COST_MIN)) + settings.ZONES_COST_MIN;
                    zones.push(newZone);
                }
                attempts = attempts + 1;
            }

            return zones;

        },

        distanceBetweenPoints: function (coords1, coords2) { // returns distance in metres
            var toRad = function (value) {
                    return value * Math.PI / 180;
                },
                R = 6371000,
                dLat = toRad(coords2.latitude - coords1.latitude),
                dLon = toRad(coords2.longitude - coords1.longitude),
                lat1 = toRad(coords1.latitude),
                lat2 = toRad(coords2.latitude),
                a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2),
                c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
                d = R * c;
            return d;
        }

    };
    
}());
