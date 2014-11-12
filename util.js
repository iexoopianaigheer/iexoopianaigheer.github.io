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

    fetchJSON: function(url, callback, silent) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function(ev) { callback(req); };
        if (!silent) {
            req.onloadend = function(ev) { loading.dec() };
            loading.inc();
        }
        req.send();
    },

    geometryEquals: function(a, b) {
        return util.arrayEquals(a.getCoordinates(), b.getCoordinates());
    },

};
