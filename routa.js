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

    var variant = data.getRouteVariant(routeData, feature.get('direction'));
    (feature.get('routeType') === 'BUS'
            ? [variant]
            : routeData.variants
    ).forEach(function(v) {
        var routeGeom = data.readGeometryFromEncodedPoints(v.geometry.points);
        var line = new ol.Feature(routeGeom);
        line.setStyle(styles.selectedRoute(feature.get('routeType')));

        map.sources.selection.addFeature(line);

    });

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

    map.sources.selection.addFeature(points);
    map.layers.selection.setVisible(true);

    map.fitExtent(map.sources.selection.getExtent());

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
        data.updateFeatureFromJourney(feature, journey);
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

function getCityFromPosition(position) {
    var agencyId = undefined;
    ['HSL', 'JOLI', 'Oulun kaupunki'].some(function(k) {
        if (ol.extent.containsCoordinate(map.cityExtents[k], position)) {
            agencyId = k;
            return true;
        }
        return false;
    });
    return agencyId;
}

function selectCity() {
    var container = dom.createChildNode(document.body, 'div', 'city-select');
    var clickHandler = function(agencyId) {
        return function(ev) {
            document.body.removeChild(container);
            init(agencyId);
        };
    };

    var e;
    e = dom.createChildNode(container, 'div', 'button', 'Helsingin seutu');
    e.addEventListener('click', clickHandler('HSL'));

    e = dom.createChildNode(container, 'div', 'button', 'Tampere');
    e.addEventListener('click', clickHandler('JOLI'));

    e = dom.createChildNode(container, 'div', 'button', 'Oulu');
    e.addEventListener('click', clickHandler('Oulun kaupunki'));
}

function init(agencyId, coords) {
    window.routa = {
        config: {
            agencyId: agencyId,
        },
    };

    map.setAnimation(1000);
    if (coords) {
        map.view.setCenter(ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857'));
        map.view.setZoom(13); //TODO
    } else {
        coords = map.viewCenters[agencyId];
        map.view.setCenter(ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857'));
        map.view.setZoom(11);
    }
    map.init(agencyId);

    data.pollSiri(agencyId, handleSiriData, 5 * 1000);

    var select = new ol.interaction.Select({
        style: styles.selectedVehicleFunction,
    });
    map.map.addInteraction(select);

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
                data.routeData(agencyId, feature.get('lineRef'), function(routeData) {
                    onVehicleSelect(feature, routeData);
                });
            } else if (type === 'stop') {
                data.routesForStop(agencyId, feature.get('localId'), function(stopData) {
                    onStopSelect(feature, stopData);
                });
            }
        } else {
            onVehicleSelect();
            onStopSelect();
        }
    });
}

window.addEventListener('load', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            console.debug(pos);
            var coords = [pos.coords.longitude, pos.coords.latitude];
            var agencyId = getCityFromPosition(coords);
            if (agencyId) {
                init(agencyId, coords);
            } else {
                selectCity();
            }
       }, selectCity);
    } else {
        selectCity();
    }
});
