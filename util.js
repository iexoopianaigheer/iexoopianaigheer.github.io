var util = {

    arrayEquals: function(a, b) {
        var al = a.length;

        if (al != b.length) {
            return false;
        }

        for (var i = 0; i < al; ++i) {
            if (a[i] != b[i]) {
                return false;
            }
        }

        return true;
    },

    distance: function(a, b) {
        var dx = a[0] - b[0];
        var dy = a[1] - b[1];
        return Math.sqrt(dx*dx + dy*dy);
    },

    fetchJSON: function(url, callback) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function(ev) { callback(req) };
        req.send();
    },

    geometryEquals: function(a, b) {
        return util.arrayEquals(a.getCoordinates(), b.getCoordinates());
    },

};
