function onFeatureSelect(feature, routeData) {
    console.debug(routeData);

    //var variant = routeData.variants[0];
    //var direction = feature.get('direction');
    //if (direction) {
    //    for (i in routeData.directions) {
    //        if (direction == routeData.directions[i]) {
    //            variant = routeData.variants[i];
    //            break;
    //        }
    //    }
    //}

    var variant = routeData.variants[
        feature.get('direction') ? parseInt(feature.get('direction'), 10) : 0];

    var routeGeom = data.readGeometryFromEncodedPoints(variant.geometry.points);
    routeGeom.transform('EPSG:4326', 'EPSG:3857');
    var line = new ol.Feature(routeGeom);
    line.setStyle(styles.selectedRoute(feature.get('type')));

    var coords = new Array();
    variant.stops.forEach(function (stop) {
        coords.push([stop.lon, stop.lat]);
    });

    var points = new ol.Feature({ geometry: new ol.geom.MultiPoint(coords) });
    points.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    points.setStyle(styles.selectedStops(feature.get('type')));

    map.sources.selection.clear();
    map.sources.selection.addFeatures([line, points]);
    map.layers.selection.setVisible(true);
    //map.layers.vehicles.setVisible(false);

    //map.view.fitGeometry(routeGeom, map.map.getSize());
}

map.map.on('singleclick', function(ev) {
    var feature = map.sources.vehicles
        .getClosestFeatureToCoordinate(ev.coordinate);
    var featureCoordinate = feature.getGeometry().getCoordinates();
    if (util.distance(map.map.getPixelFromCoordinate(featureCoordinate), ev.pixel) < 15) {
        var lineRef = feature.get('lineRef');
        var url = 'http://dev.hsl.fi/opentripplanner-api-webapp/ws/transit/routeData?id=' + lineRef;
        util.fetchJSON(url, function(req) {
            if (req.response && req.response.routeData[0]) {
                onFeatureSelect(feature, req.response.routeData[0]);
            } else {
                console.debug(req);
            }
        });
        console.debug(feature.getProperties());
    } else {
        // deselect
        map.layers.selection.setVisible(false);
        map.layers.vehicles.setVisible(true);
    }
});

var vehicleXfeature = {};

function featureFromActivity(journey) {
    var ret = null;

    var vehicleRef = journey.VehicleRef.value;
    var lineRef = journey.LineRef.value;

    if (lineRef == '0') {
        vehicleXfeature[vehicleRef] = undefined;
        return undefined;
    }

    var jore = data.interpretJORE(lineRef);
    var feature = vehicleXfeature[vehicleRef];

    var geom = new ol.geom.Point(ol.proj.transform(
        [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
        'EPSG:4326', 'EPSG:3857'));
    if (!feature) {
        feature = new ol.Feature({
            geometry: geom,
            vehicleRef: vehicleRef,
            type: jore[0],
        });
        vehicleXfeature[vehicleRef] = feature;
        ret = feature
    } else {
        if (!util.arrayEquals(feature.getGeometry().getCoordinates(), geom.getCoordinates())) {
            feature.setGeometry(geom);
        }
    }

    // TODO: update only when necessary
    // TODO: remove stale entries, ie. gc
    feature.set('bearing', journey.Bearing);
    feature.set('delay', journey.Delay);
    feature.set('direction', journey.DirectionRef.value);
    feature.set('line', jore[2]);
    feature.set('lineRef', lineRef);
    //feature.set('journey', JSON.stringify(journey));
    //feature.setGeometry(new ol.geom.Point(ol.proj.transform(
    //    [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
    //    'EPSG:4326', 'EPSG:3857')));

    return ret;
}

function handleSiriData(data) {
    var activity = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;
    var features = new Array();
    for (i in activity) {
        var feature = featureFromActivity(activity[i].MonitoredVehicleJourney);
        if (feature) {
            features.push(feature);
        }
    }
    if (features.length > 0) {
        map.sources.vehicles.addFeatures(features);
    }
}

function updateVehiclesFromSiri() {
    var url = 'http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL';
    util.fetchJSON(url, function(req) { handleSiriData(req.response) });
}

function getStops() {
    var url = 'http://dev.hsl.fi/opentripplanner-api-webapp/ws/transit/stopsByName?agency=HSL&name=';
    util.fetchJSON(url, function(req) {
        var stops = new Array();
        req.response.stops.forEach(function(stop) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(
                    [stop.stopLon, stop.stopLat], 'EPSG:4326', 'EPSG:3857')),
                stopCode: stop.stopCode,
                id: stop.id.id,
                agency: stop.id.agencyId,
            });
            if (feature) {
                stops.push(feature);
            } else {
                console.debug(stop);
            }
        });

        map.sources.stops.addFeatures(stops);
    });
}

getStops();

updateVehiclesFromSiri();
window.setInterval(updateVehiclesFromSiri, 5 * 1000);

map.view.on('change:resolution', function(ev) {
    map.layers.stops.setVisible(ev.target.getZoom() > 13);
});
