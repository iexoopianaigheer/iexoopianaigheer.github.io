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
        map.layers.base = new ol.layer.Tile({
            source: map.sources.base,
        });
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
        ['base', 'stops', 'selection', 'vehicles'].forEach(function(key) {
            map.map.addLayer(map.layers[key]);
        });
        map.map.setView(map.view);
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
