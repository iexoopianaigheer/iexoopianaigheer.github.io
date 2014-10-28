var map = {

    layers: {},

    map: new ol.Map({
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform(
                [25.13382, 60.21938], 'EPSG:4326', 'EPSG:3857'),
            zoom: 12,
        }),
    }),

    sources: {
        base: new ol.source.XYZ({
            urls: [
                'http://a.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png',
                'http://b.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png',
            ],
        }),
        vehicles: new ol.source.Vector(),
        selection: new ol.source.Vector(),
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

// add layers to map
['base', 'selection', 'vehicles'].forEach(function(key) {
    map.map.addLayer(map.layers[key]);
});
