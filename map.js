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

    sources: {
        base: new ol.source.Stamen({ layer: 'toner' }),
        vehicles: new ol.source.Vector(),
        selection: new ol.source.Vector(),
        stops: new ol.source.ServerVector({
            loader: stops.loader,
        }),
    },

    map: new ol.Map({
        target: 'map',
    }),

    view: new ol.View({
        center: ol.proj.transform(
            [25.13382, 60.21938], 'EPSG:4326', 'EPSG:3857'),
        zoom: 12,
    }),

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

    fitExtent: function(extent) {
        map._prevResolution = map.view.getResolution();
        map._prevCenter = map.view.getCenter();

        map.setAnimation(2000);
        map.view.setResolution(
            map.view.getResolutionForExtent(extent, map.map.getSize()) * 1.1);
        map.view.setCenter(ol.extent.getCenter(extent));
    },

    previousView: function() {
        map.setAnimation(500);
        map.view.setCenter(map._prevCenter);
        map.view.setResolution(map._prevResolution);
    },

};

// construct layers
map.layers['base'] = new ol.layer.Tile({
    source: map.sources.base,
});
map.layers['vehicles'] = new ol.layer.Vector({
    source: map.sources.vehicles,
    style: styles.vehicleStyleFunction,
});
map.layers['selection'] = new ol.layer.Vector({
    source: map.sources.selection,
    style: null,
});
map.layers['stops'] = new ol.layer.Vector({
    source: map.sources.stops,
    style: null,
    visible: false,
});

['base', 'stops', 'selection', 'vehicles'].forEach(function(key) {
    map.map.addLayer(map.layers[key]);
});
map.map.setView(map.view);
