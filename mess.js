function onFeatureSelect(feature, routeData) {
    console.debug(feature.getProperties());
    console.debug(routeData);

    var variant = routeData.variants[0];
    var direction = feature.get('direction');
    if (direction) {
        for (i in routeData.directions) {
            if (direction == routeData.directions[i]) {
                variant = routeData.variants[i];
                break;
            }
        }
    }

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

    map.sources.selection.addFeatures([line, points]);
}

function distance(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx*dx + dy*dy);
}

map.map.on('singleclick', function(ev) {
    map.sources.selection.clear();

    var feature = map.sources.vehicles
        .getClosestFeatureToCoordinate(ev.coordinate);
    var featureCoordinate = feature.getGeometry().getCoordinates();
    if (distance(map.map.getPixelFromCoordinate(featureCoordinate), ev.pixel) < 15) {
        var lineRef = feature.get('lineRef');
        var url = 'http://dev.hsl.fi/opentripplanner-api-webapp/ws/transit/routeData?id=' + lineRef;
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function(ev) {
            if (req.response && req.response.routeData[0]) {
                onFeatureSelect(feature, req.response.routeData[0]);
            } else {
                console.debug(req);
            }
        };
        req.send();
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

    if (!feature) {
        feature = new ol.Feature({
            vehicleRef: vehicleRef,
        });
        vehicleXfeature[vehicleRef] = feature;
        ret = feature
    }

    // TODO: update only when necessary
    // TODO: remove stale entries, ie. gc
    feature.set('bearing', journey.Bearing);
    feature.set('delay', journey.Delay);
    feature.set('direction', journey.DirectionRef.value);
    feature.set('line', jore[2]);
    feature.set('lineRef', lineRef);
    feature.set('type', jore[0]);
    feature.set('journey', journey);
    feature.setGeometry(new ol.geom.Point(ol.proj.transform(
        [journey.VehicleLocation.Longitude, journey.VehicleLocation.Latitude],
        'EPSG:4326', 'EPSG:3857')));

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
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'json';
    req.onload = function(ev) { handleSiriData(req.response) };
    req.send();
}

updateVehiclesFromSiri();
window.setInterval(updateVehiclesFromSiri, 5 * 1000);
