var data = {

    otpUrls: {
        HSL: 'http://dev.hsl.fi/opentripplanner-api-webapp/ws',
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
    },

    interpretJORE: function(routeId) {
        //if citynavi.config.id != "helsinki"
        //    # no JORE codes in use, assume bus
        //    [mode, routeType, route] = ["BUS", 3, routeId]
        if (routeId.match(/^1019/)) {
            return ["FERRY", "Ferry"];
        } else if (routeId.match(/^1300/)) {
            return ["SUBWAY", routeId.substring(4,5)];
        } else if (routeId.match(/^300/)) {
            return ["RAIL", routeId.substring(4,5)];
        } else if (routeId.match(/^10(0|10)/)) {
            return ["TRAM", routeId.replace(/^10(?:([^0]\d\D?)|0(\d\D?)).*$/, '$1$2')];
        } else if (routeId.match(/^(1|2|4).../)) {
            return ["BUS", routeId.replace(/^.0*/, '')];
        }

        // unknown, assume bus
        return ["BUS", routeId];
    },

    pollSiri: function(agencyId, callback, interval) {
        var url = data.siriUrls[agencyId];
        var run = function() {
            util.fetchJSON(url, function(req) { callback(req.response) }, true);
        };
        window.setInterval(run, interval);
        run();
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

    routeData: function(agencyId, routeId, callback) {
        var url = data.otpUrls[agencyId] + '/transit/routeData?id=' + routeId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.routeData[0]) {
                callback(req.response.routeData[0]);
            } else {
                console.debug(req);
            }
        });
    },

    routesForStop: function(agencyId, routeId, callback) {
        var url = data.otpUrls[agencyId] + '/transit/routesForStop?id=' + routeId
            + '&agency=' + agencyId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.routes) {
                callback(req.response.routes);
            } else {
                console.debug(req);
            }
        });
    },

    stopData: function(agencyId, routeId, callback) {
        var url = data.otpUrls[agencyId] + '/transit/stopData?id=' + routeId
            + '&agency=' + agencyId;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.stops[0]) {
                callback(req.response.stops[0]);
            } else {
                console.debug(req);
            }
        });
    },

    stopsInExtent: function(agencyId, extent, projection, callback) {
        extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
        var url = data.otpUrls[agencyId] + '/transit/stopsInRectangle?'
            + 'agency=' + agencyId
            + '&leftUpLat=' + extent[1]
            + '&leftUpLon=' + extent[0]
            + '&rightDownLat=' + extent[3]
            + '&rightDownLon=' + extent[2];
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.stops) {
                callback(req.response.stops);
            } else {
                console.debug(req);
            }
        });
    },

};
