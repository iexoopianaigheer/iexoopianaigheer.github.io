var vehicleSource = new ol.source.Vector();
var vehicleLayer = new ol.layer.Vector({
    source: vehicleSource,
    style: styles.vehicleStyleFunction,
});

var selectionSource = new ol.source.Vector();
var selectionLayer = new ol.layer.Vector({
    source: selectionSource,
    style: null,
});

var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
        }),
        selectionLayer,
        vehicleLayer,
    ],
    view: new ol.View({
        center: ol.proj.transform([25.13382, 60.21938], 'EPSG:4326', 'EPSG:3857'),
        zoom: 14,
    })
,});

function readPolylineFromPoints(text) {
    var stride = 2;
    var flatCoordinates = ol.format.Polyline.decodeDeltas(text, stride, 1e5);
    var coordinates = [];
    var i = 0;
    for (var j = 0; j < flatCoordinates.length; j += stride) {
      coordinates[i++] = flatCoordinates.slice(j, j + stride).reverse();
    }
    coordinates.length = i;

    return new ol.Feature(new ol.geom.LineString(coordinates));
}

function onFeatureSelect(feature, routeData) {
    var variant = 0;
    var direction = feature.get('direction');
    for (i in routeData.directions) {
        if (direction == routeData.directions[i]) {
            variant = i;
            break;
        }
    }

    var route = routeData.variants[variant];
    var line = readPolylineFromPoints(route.geometry.points);
    line.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    line.setStyle(styles.selectedRoute(feature.get('type')));

    var coords = new Array();
    route.stops.forEach(function (stop) {
        coords.push([stop.lon, stop.lat]);
    });

    var points = new ol.Feature({ geometry: new ol.geom.MultiPoint(coords) });
    points.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    points.setStyle(styles.selectedStops(feature.get('type')));

    selectionSource.addFeatures([line, points])
}

function distance(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx*dx + dy*dy);
}

map.on('singleclick', function(ev) {
    selectionSource.clear();

    var feature = vehicleSource.getClosestFeatureToCoordinate(ev.coordinate);
    var featureCoordinate = feature.getGeometry().getCoordinates();
    if (distance(map.getPixelFromCoordinate(featureCoordinate), ev.pixel) < 15) {
        var lineRef = feature.get('lineRef');
        var url = 'http://dev.hsl.fi/opentripplanner-api-webapp/ws/transit/routeData?id=' + lineRef;
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function(ev) {
            if (req.response)
                onFeatureSelect(feature, req.response.routeData[0]);
            else
                console.debug(req);
        };
        req.send();
    }
});

var vehicleXfeature = {};

function interpretJORE(routeId) {
    if (routeId.match(/^1019/)) {
        return ["FERRY", 4, "Ferry"];
    } else if (routeId.match(/^1300/)) {
        return ["SUBWAY", 1, routeId.substring(4,5)];
    } else if (routeId.match(/^300/)) {
        return ["RAIL", 2, routeId.substring(4,5)];
    } else if (routeId.match(/^10(0|10)/)) {
        return ["TRAM", 0, routeId.replace(/^..0*/, '')];
    } else if (routeId.match(/^(1|2|4).../)) {
        return ["BUS", 3, routeId.replace(/^.0*/, '')];
    }

    // unknown, assume bus
    return ["BUS", 3, routeId];
}

function featureFromActivity(journey) {
    var ret = null;

    var vehicleRef = journey.VehicleRef.value;
    var lineRef = journey.LineRef.value;

    if (lineRef == '0') {
        vehicleXfeature[vehicleRef] = undefined;
        return undefined;
    }

    var jore = interpretJORE(lineRef);
    var feature = vehicleXfeature[vehicleRef];

    if (!feature) {
        feature = new ol.Feature({
            vehicleRef: vehicleRef,
        });
        vehicleXfeature[vehicleRef] = feature;
        ret = feature
    }
    feature.set('bearing', journey.Bearing);
    feature.set('delay', journey.Delay);
    feature.set('direction', journey.DirectionRef.value);
    feature.set('line', jore[2]);
    feature.set('lineRef', lineRef);
    feature.set('type', jore[0]);
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
        vehicleSource.addFeatures(features);
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
