/*  routa.js
 *  Copyright (C) 2014  Antti Tanhuanpää
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var data = {

    otpUrls: {
        HSL: 'http://dev.hsl.fi/opentripplanner-api-webapp/ws',
        JOLI: 'http://178.217.128.220/otp-rest-servlet/ws',
        'Oulun kaupunki': 'http://navi.oulunliikenne.fi/otp-rest-servlet/ws',
    },

    routeTypes: [
        'TRAM',
        'SUBWAY',
        'RAIL',
        'BUS',
        'FERRY',
    ],

    siriUrls: {
        HSL: 'http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL',
        JOLI: 'http://data.itsfactory.fi/siriaccess/vm/json',
    },

    getRouteVariant: function(routeData, direction) {
        var variant = 0;
        if (direction) {
            variant = parseInt(direction);
        }
        variant = Math.min(Math.max(variant, 0), routeData.variants.length - 1);
        return routeData.variants[variant];
    },

    interpretLineRef: function(routeId) {
        var agencyId = routa.config.agencyId;
        if (agencyId !== 'HSL') {
            if (agencyId === 'JOLI') {
                return ["BUS", routeId, routeId.replace(/\D+$/, '')];
            }
            return ["BUS", routeId, routeId];
        }

        if (routeId.match(/^1019/)) {
            return ["FERRY", "Ferry", routeId];
        } else if (routeId.match(/^1300/)) {
            return ["SUBWAY", routeId.substring(4,5), routeId];
        } else if (routeId.match(/^300/)) {
            return ["RAIL", routeId.substring(4,5), routeId];
        } else if (routeId.match(/^10(0|10)/)) {
            var line = routeId.replace(/^10(?:([^0]\d\D?)|0(\d[A-Za-z]?)).*$/, '$1$2');
            return ["TRAM", line, routeId.replace(/(\D)\d+$/, '$1')];
        } else if (routeId.match(/^(1|2|4).../)) {
            return ["BUS", routeId.replace(/^.0*/, ''), routeId];
        }

        // unknown, assume bus
        return ["BUS", routeId];
    },

    featureFromJourney: function(journey) {
        var lineRef = journey.LineRef.value;
        var vehicleRef = journey.VehicleRef.value;
        var feature = new ol.Feature({
            vehicleRef: vehicleRef,
            type: 'vehicle',
        });
        feature.setId(vehicleRef);
        data.updateFeatureFromJourney(feature, journey);

        return feature;
    },

    featureFromStop: function(stop) {
        if (routa.config.agencyId != 'Oulun kaupunki'
                && !stop.stopCode) {
            return null;
        }

        var geom = new ol.geom.Point(ol.proj.transform(
                [stop.stopLon, stop.stopLat],
                'EPSG:4326', 'EPSG:3857'));
        var feature = new ol.Feature({
            geometry: geom,
            agencyId: stop.id.agencyId,
            localId: stop.id.id,
            name: stop.stopName,
            stopCode: stop.stopCode,
            type: 'stop',
        });
        feature.setId(stop.id.agencyId + stop.id.id);

        return feature;
    },

    pollSiri: function(agencyId, callback, interval) {
        var url = data.siriUrls[agencyId];
        if (!url) {
            return undefined;
        }

        var run = function() {
            util.fetchJSON(url, function(req) { callback(req.response) }, true);
        };
        var timer = window.setInterval(run, interval);
        run();

        return timer;
    },

    readGeometryFromEncodedPoints: function(text) {
        var flatCoords = ol.format.Polyline.decodeDeltas(text, 2, 1e5);
        var coordinates = new Array(flatCoords.length / 2);
        var nCoords = coordinates.length;

        flatCoords.reverse();
        for (var i = 0, j = 0; i < nCoords; ++i) {
          j = (nCoords - i - 1) * 2;
          coordinates[i] = flatCoords.slice(j, j + 2);
        }

        return new ol.geom.LineString(coordinates);
    },

    routeData: function(agencyId, routeId, success, failure) {
        var url = data.otpUrls[agencyId] + '/transit/routeData?id=' + routeId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.routeData[0]) {
                success(req.response.routeData[0]);
            } else if (failure) {
                failure(req);
            } else {
                console.debug(req);
            }
        });
    },

    routesForStop: function(agencyId, routeId, success, failure) {
        var url = data.otpUrls[agencyId] + '/transit/routesForStop?id=' + routeId
            + '&agency=' + agencyId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.routes) {
                success(req.response.routes);
            } else if (failure) {
                failure(req);
            } else {
                console.debug(req);
            }
        });
    },

    stopData: function(agencyId, routeId, success, failure) {
        var url = data.otpUrls[agencyId] + '/transit/stopData?id=' + routeId
            + '&agency=' + agencyId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.stops[0]) {
                success(req.response.stops[0]);
            } else if (failure) {
                failure(req);
            } else {
                console.debug(req);
            }
        });
    },

    stopsInExtent: function(agencyId, extent, projection, success, failure) {
        extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
        var url = data.otpUrls[agencyId] + '/transit/stopsInRectangle?'
            + 'agency=' + agencyId
            + '&leftUpLat=' + extent[1]
            + '&leftUpLon=' + extent[0]
            + '&rightDownLat=' + extent[3]
            + '&rightDownLon=' + extent[2];
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.stops) {
                success(req.response.stops);
            } else if (failure) {
                failure(req);
            } else {
                console.debug(req);
            }
        });
    },

    updateFeatureFromJourney: function(feature, journey) {
        var oldGeom = feature.getGeometry();
        var newGeom = new ol.geom.Point(ol.proj.transform(
            [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
            'EPSG:4326', 'EPSG:3857'));

        if (oldGeom !== undefined && util.geometryEquals(oldGeom, newGeom)) {
            return false;
        }

        var lineInfo = data.interpretLineRef(journey.LineRef.value);
        feature.setGeometry(newGeom);
        feature.set('bearing', journey.Bearing);
        feature.set('delay', journey.Delay);
        feature.set('direction', journey.DirectionRef.value);
        feature.set('line', lineInfo[1]);
        feature.set('lineRef', lineInfo[2]);
        feature.set('routeType', lineInfo[0]);

        return true;
    },

};
