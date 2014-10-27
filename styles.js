var styles = {

    colors: {
        FERRY:  '#11d',
        SUBWAY: '#d60',
        RAIL:   '#00985f',
        TRAM:   '#3a2',
        BUS:    '#007ac9',
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
                    color: styles.colors[feature.get('type')],
                }),
                stroke: styles.strokeStyle,
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
                color: styles.colors[type],
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
