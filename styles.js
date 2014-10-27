var styles = {

    colors: function (type, opacity) {
        return 'rgba(' + {
            FERRY:  '16, 16, 208',
            SUBWAY: '208, 96, 0',
            RAIL:   '0, 152, 95',
            TRAM:   '48, 160, 32',
            BUS:    '0, 122, 201',
        }[type] + ', ' + opacity + ')';
    },

    vehicleMarkerStrokeStyle: new ol.style.Stroke({
        color: '#f0f0f0',
        width: 2,
    }),

    fillBlack: new ol.style.Fill({
        color: '#000000',
    }),

    textStroke: new ol.style.Stroke({
        color: '#ffffff',
        width: 2,
    }),

    vehicleStyleFunction: function(feature, resolution) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 12,
                fill: new ol.style.Fill({
                    color: styles.colors(feature.get('type'), 0.6),
                }),
                stroke: styles.vehicleMarkerStrokeStyle,
            }),
            text: new ol.style.Text({
                text: feature.get('line'),
                fill: styles.fillBlack,
                stroke: styles.textStroke,
            }),
        })];
    },

    selectedRoute: function (type) {
        return [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: styles.colors(type, 1),
                width: 4,
            }),
        })]
    },

    selectedStops: function(type) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: styles.fillBlack,
            }),
        })]
    },

}
