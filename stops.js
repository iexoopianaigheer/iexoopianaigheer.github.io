var stops = {

    loader: function(extent, resolution, projection) {
        data.stopsInExtent('HSL', extent, projection, function(data) {
            var n = data.length;
            var features = new Array(n);
            data.forEach(function(stop) {
                features[--n] = stops._featureFromStop(stop);
            });
            map.sources.stops.addFeatures(features);
        });
    },

    _featureFromStop: function(stop) {
        var feature = new ol.Feature({
            geometry: stops._geometryFromStop(stop),
            agencyId: stop.id.agencyId,
            localId: stop.id.id,
            stopCode: stop.stopCode,
            type: 'stop',
        });
        feature.setId(stop.id.agencyId + stop.id.id);
        return feature;
    },

    _geometryFromStop: function(stop) {
        return new ol.geom.Point(ol.proj.transform(
            [stop.stopLon, stop.stopLat],
            'EPSG:4326', 'EPSG:3857'));
    },

};
