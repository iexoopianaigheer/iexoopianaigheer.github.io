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
