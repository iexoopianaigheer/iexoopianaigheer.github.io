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

var map = {

    cityExtents: {
        HSL: [
            23.8677978515625, 60.01820719756269,
            26.350708007812496, 60.48970392643919
        ],
        JOLI: [
            22.7911376953125, 61.17503266354878,
            24.78515625, 61.68726699130697
        ],
        'Oulun kaupunki': [
            24.5654296875, 64.69910544204765,
            26.411132812499996, 65.23830662451157
        ],
    },

    layers: {},

    map: new ol.Map({
        target: 'map',
    }),

    sources: {
        base: new ol.source.Stamen({ layer: 'toner' }),
        vehicles: new ol.source.Vector(),
        selection: new ol.source.Vector(),
    },

    view: new ol.View({
        center: ol.proj.transform(
            [25, 62.5], 'EPSG:4326', 'EPSG:3857'),
        zoom: 7,
    }),

    viewCenters: {
        HSL: [ 24.941024780273438, 60.171915590195724 ],
        JOLI: [ 23.77381324768066, 61.498662694465786 ],
        'Oulun kaupunki': [ 25.484333038330078, 65.01132184489164 ],
    },

    fitExtent: function(extent) {
        map._prevResolution = map.view.getResolution();
        map._prevCenter = map.view.getCenter();

        map.setAnimation(2000);
        map.view.setResolution(
            map.view.getResolutionForExtent(extent, map.map.getSize()) * 1.1);
        map.view.setCenter(ol.extent.getCenter(extent));
    },

    init: function(agencyId) {
        // stops source
        map.sources.stops = new ol.source.ServerVector({
            loader: map.stopsLoader(agencyId),
        });

        // construct layers
        map.layers.vehicles = new ol.layer.Vector({
            source: map.sources.vehicles,
            style: styles.vehicleStyleFunction,
        });
        map.layers.selection = new ol.layer.Vector({
            source: map.sources.selection,
            style: null,
        });
        map.layers.stops = new ol.layer.Vector({
            source: map.sources.stops,
            style: null,
            visible: false,
        });

        // view
        map.view.on('change:resolution', function(ev) {
            var zoom = (10 / ev.target.getResolution());
            if (~~zoom) {
                zoom = ~~(Math.log(zoom) / Math.LN2);
                map.layers.stops.setStyle(styles.stopAtZoomLevel[
                    Math.min(zoom, styles.stopAtZoomLevel.length - 1)]);
                map.layers.stops.setVisible(true);
            } else {
                map.layers.stops.setVisible(false);
            }
        });

        // map
        ['stops', 'selection', 'vehicles'].forEach(function(key) {
            map.map.addLayer(map.layers[key]);
        });
    },

    previousView: function() {
        map.setAnimation(500);
        map.view.setCenter(map._prevCenter);
        map.view.setResolution(map._prevResolution);
    },

    setAnimation: function(duration) {
        map.map.beforeRender(
            ol.animation.zoom({
                duration: duration,
                easing: ol.easing.inAndOut,
                resolution: map.view.getResolution(),
            }),
            ol.animation.pan({
                duration: duration,
                easing: ol.easing.inAndOut,
                source: map.view.getCenter(),
            })
        );
    },

    stopsLoader: function(agencyId) {
        return function(extent, resolution, projection) {
            data.stopsInExtent(agencyId, extent, projection, function(stopData) {
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
        };
    },

};

map.layers.base = new ol.layer.Tile({
    source: map.sources.base,
});
map.map.addLayer(map.layers.base);
map.map.setView(map.view);
