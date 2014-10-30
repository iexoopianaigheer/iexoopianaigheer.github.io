var map = {

    layers: {},

    sources: {
        base: new ol.source.XYZ({
            urls: [
                'http://a.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png',
                'http://b.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png',
            ],
        }),
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
