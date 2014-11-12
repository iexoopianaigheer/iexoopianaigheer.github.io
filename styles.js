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

var styles = {

    colors: function (type, opacity) {
        return 'rgba(' + {
            FERRY:  '190, 228, 248',
            SUBWAY: '255, 99, 25',
            RAIL:   '0, 152, 95',
            TRAM:   '52, 178, 52',
            BUS:    '0, 122, 201',
        }[type] + ', ' + opacity + ')';
    },

    vehicleMarkerStrokeStyle: new ol.style.Stroke({
        color: '#616365',
        width: 2,
    }),

    fillBlack: new ol.style.Fill({
        color: '#000000',
    }),

    fillWhite: new ol.style.Fill({
        color: '#ffffff',
    }),

    strokeBlack: new ol.style.Stroke({
        color: '#000000',
        width: 2,
    }),

    strokeWhite: new ol.style.Stroke({
        color: '#ffffff',
        width: 2,
    }),

    vehicleStyleFunction: function(feature, resolution) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 9,
                fill: new ol.style.Fill({
                    color: styles.colors(feature.get('routeType'), 1),
                }),
                stroke: styles.vehicleMarkerStrokeStyle,
            }),
            text: new ol.style.Text({
                font: '10px sans-serif medium',
                text: feature.get('line'),
                fill: styles.fillBlack,
                stroke: styles.strokeWhite,
            }),
        })];
    },

    selectedFeatureFunction: function(feature, resolution) {
        switch (feature.get('type')) {
            case 'stop':
                return styles.selectedStops(feature.get('routeType'));
            case 'vehicle':
                return styles.selectedVehicleFunction(feature, resolution);
        }
    },

    selectedVehicleFunction: function(feature, resolution) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: '#dddddc',
                }),
                stroke: new ol.style.Stroke({
                    color: styles.colors(feature.get('routeType'), 1),
                    width: 3,
                }),
            }),
            text: new ol.style.Text({
                font: '11px sans-serif medium',
                text: feature.get('line'),
                fill: styles.fillBlack,
                stroke: styles.strokeWhite,
            }),
        })];
    },

    selectedRoute: function(type) {
        return [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: styles.colors(type, 1),
                width: 4,
            }),
        })]
    },

    selectedStops: function(routeType) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: styles.fillWhite,
                stroke: styles.strokeBlack,
            }),
        })]
    },

    stopAtZoomLevel: [
        [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: new ol.style.Fill({ color: 'rgba(200,200,200,0.8)' }),
                stroke: new ol.style.Stroke({ color: '#000', width: 1.4 }),
            }),
        })],
        [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({ color: 'rgba(200,200,200,0.8)' }),
                stroke: new ol.style.Stroke({ color: '#000', width: 1.6 }),
            }),
        })],
        [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 9,
                fill: new ol.style.Fill({ color: 'rgba(200,200,200,0.8)' }),
                stroke: new ol.style.Stroke({ color: '#000', width: 1.8 }),
            }),
        })],
        [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 11,
                fill: new ol.style.Fill({ color: 'rgba(200,200,200,0.8)' }),
                stroke: new ol.style.Stroke({ color: '#000', width: 2 }),
            }),
        })],
        [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 14,
                fill: new ol.style.Fill({ color: 'rgba(200,200,200,0.8)' }),
                stroke: new ol.style.Stroke({ color: '#000', width: 2.4 }),
            }),
        })],
    ],

    filteringStyle: function(style, filter) {
        return function(feature, resolution) {
            if (filter(feature)) {
                return style(feature, resolution);
            }
            return null;
        };
    },

}
