var stops = {

    loader: function(extent, resolution, projection) {
        data.stopsInExtent('HSL', extent, projection, function(stopData) {
            var features = new Array(stopData.length);
            var i = 0;
            stopData.forEach(function(stop) {
                var feature = data.featureFromStop(stop);
                if (feature) {
                    features[i++] = feature;
                }
            });
            features.length = i;
            map.sources.stops.addFeatures(features);
        });
    },

};
