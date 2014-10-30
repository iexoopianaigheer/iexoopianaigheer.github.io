function onVehicleSelect(feature, routeData) {
    // handle de-select
    if (!feature) {
        map.layers.selection.setVisible(false);
        map.sources.selection.clear();
        map.layers.vehicles.setStyle(styles.vehicleStyleFunction);
        return;
    }

    var variant = routeData.variants[
        feature.get('direction') ? parseInt(feature.get('direction'), 10) : 0];

    var routeGeom = data.readGeometryFromEncodedPoints(variant.geometry.points);
    routeGeom.transform('EPSG:4326', 'EPSG:3857');
    var line = new ol.Feature(routeGeom);
    line.setStyle(styles.selectedRoute(feature.get('routeType')));

    var n = variant.stops.length;
    var coords = new Array(n);
    variant.stops.forEach(function (stop) {
        coords[--n] = [stop.lon, stop.lat];
    });

    var points = new ol.Feature({ geometry: new ol.geom.MultiPoint(coords) });
    points.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    points.setStyle(styles.selectedStops(feature.get('routeType')));

    var lineRef = feature.get('lineRef');
    var style = styles.filteringStyle(styles.vehicleStyleFunction, function(f) {
        return f.get('lineRef') === lineRef;
    });
    map.layers.vehicles.setStyle(style);

    map.sources.selection.addFeatures([line, points]);
    map.layers.selection.setVisible(true);
    //map.layers.vehicles.setVisible(false);

    //map.view.fitGeometry(routeGeom, map.map.getSize());
}

function onStopSelect(feature, stopData) {
    console.debug(stopData);

    if (!feature) {
        map.layers.selection.setVisible(false);
        map.layers.vehicles.setVisible(true);
        return;
    }

    map.sources.selection.clear();
    map.layers.selection.setVisible(true);

    var remaining = stopData.length;
    stopData.forEach(function(route) {
        data.routeData(route.id.agencyId, route.id.id, function(routeData) {

            var variant = routeData.variants[0];
            if (routeData.variants.length > 1) {
                routeData.variants.some(function(v) {
                    if (v.stops.some(function(s) {
                        return s.id.id === feature.id && s.id.agencyId === feature.agencyId;
                    })) {
                        variant = v;
                        return true;
                    }
                    return false;
                });
            }

            var routeGeom = data.readGeometryFromEncodedPoints(
                variant.geometry.points);
            routeGeom.transform('EPSG:4326', 'EPSG:3857');
            var line = new ol.Feature(routeGeom);
            line.setStyle(styles.selectedRoute(
                data.routeTypes[route.routeType]));
            map.sources.selection.addFeature(line);

            if (--remaining) {
                return;
            }
        });
    });
}

function featureFromJourney(journey) {
    var geom = new ol.geom.Point(ol.proj.transform(
        [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
        'EPSG:4326', 'EPSG:3857'));
    var lineRef = journey.LineRef.value;
    var vehicleRef = journey.VehicleRef.value;
    var jore = data.interpretJORE(lineRef);

    var feature = new ol.Feature({
        bearing: journey.Bearing,
        delay: journey.Delay,
        direction: journey.DirectionRef.value,
        geometry: geom,
        line: jore[1],
        lineRef: lineRef,
        routeType: jore[0],
        vehicleRef: vehicleRef,
        type: 'vehicle',
    });
    feature.setId(vehicleRef);

    return feature;
}

function featureFromActivity(journey) {
    var vehicleRef = journey.VehicleRef.value;
    var lineRef = journey.LineRef.value;
    var feature = map.sources.vehicles.getFeatureById(vehicleRef);

    // TODO: remove stale entries, ie. gc
    if (lineRef == '0') {
        if (feature) {
            map.sources.vehicles.removeFeature(feature);
        }
    } else if (feature) {
        // update an existing feature
        var jore = data.interpretJORE(lineRef);
        var oldGeom = feature.getGeometry();
        var newGeom = new ol.geom.Point(ol.proj.transform(
            [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
            'EPSG:4326', 'EPSG:3857'));

        if (!util.geometryEquals(oldGeom, newGeom)) {
            // but only if it moved
            feature.setGeometry(newGeom);
            feature.set('bearing', journey.Bearing);
            feature.set('delay', journey.Delay);
            feature.set('direction', journey.DirectionRef.value);
            feature.set('line', jore[1]);
            feature.set('lineRef', lineRef);
        }
    } else {
        feature = featureFromJourney(journey);
        map.sources.vehicles.addFeature(feature);
    }
}

function handleSiriData(data) {
    data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity
            .forEach(function(activity) {
        featureFromActivity(activity.MonitoredVehicleJourney);
    });
}

data.pollSiri('HSL', handleSiriData, 5 * 1000);

map.view.on('change:resolution', function(ev) {
    var zoom = (10 / ev.target.getResolution());
    if (~~zoom) {
        zoom = Math.min(~~Math.log2(zoom), styles.stopAtZoomLevel.length - 1);
        map.layers.stops.setStyle(styles.stopAtZoomLevel[zoom]);
        map.layers.stops.setVisible(true);
    } else {
        map.layers.stops.setVisible(false);
    }
});

var select = new ol.interaction.Select({
    style: styles.selectedVehicleFunction,
});
map.map.addInteraction(select);
map.map.addInteraction(new ol.interaction.KeyboardPan());
map.map.addInteraction(new ol.interaction.KeyboardZoom());

map.map.on('singleclick', function(ev) {
    map.layers.base.once('precompose', function(ev) {
        select.dispatchChangeEvent();
    });
});

select.on('change', function(ev) {
    var feature = ev.target.getFeatures().item(0);
    if (feature) {
        console.debug(feature);
        var type = feature.get('type');
        var agency = feature.get('agency');
        if (type === 'vehicle') {
            data.routeData('HSL', feature.get('lineRef'), function(routeData) {
                onVehicleSelect(feature, routeData);
            });
        } else if (type === 'stop') {
            data.routesForStop('HSL', feature.get('localId'), function(stopData) {
                onStopSelect(feature, stopData);
            });
        }
    } else {
        onVehicleSelect();
        onStopSelect();
    }
});
