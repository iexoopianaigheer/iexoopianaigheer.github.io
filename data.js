var data = {

    interpretJORE: function(routeId) {
        //if citynavi.config.id != "helsinki"
        //    # no JORE codes in use, assume bus
        //    [mode, routeType, route] = ["BUS", 3, routeId]
        if (routeId.match(/^1019/)) {
            return ["FERRY", 4, "Ferry"];
        } else if (routeId.match(/^1300/)) {
            return ["SUBWAY", 1, routeId.substring(4,5)];
        } else if (routeId.match(/^300/)) {
            return ["RAIL", 2, routeId.substring(4,5)];
        } else if (routeId.match(/^10(0|10)/)) {
            return ["TRAM", 0, routeId.replace(/^10(?:([^0]\d\D?)|0(\d\D?)).*$/, '$1$2')];
        } else if (routeId.match(/^(1|2|4).../)) {
            return ["BUS", 3, routeId.replace(/^.0*/, '')];
        }

        // unknown, assume bus
        return ["BUS", 3, routeId];
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

};
