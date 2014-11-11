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

    map.fitExtent(routeGeom.getExtent());

    infoBox.setInfo(JSON.stringify(routeData, null, 4));
    infoBox.setVisible(true);
}

function onStopSelect(feature, stopData) {
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

            map.layers.vehicles.setVisible(false);
            var extent = map.sources.selection.getExtent();
            map.fitExtent(extent);
        });
    });

    if (stopData) {
        infoBox.setInfo(JSON.stringify(stopData, null, 4));
    } else {
        infoBox.setInfo('no info');
    }

    infoBox.setVisible(true);
}

function vehicleActivity(journey) {
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
        feature = data.featureFromJourney(journey);
        map.sources.vehicles.addFeature(feature);
    }
}

function handleSiriData(data) {
    data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity
            .forEach(function(activity) {
        vehicleActivity(activity.MonitoredVehicleJourney);
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
