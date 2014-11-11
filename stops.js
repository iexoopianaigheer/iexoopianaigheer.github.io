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

var stops = {

    loader: function(extent, resolution, projection) {
        data.stopsInExtent('HSL', extent, projection, function(stopData) {
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
    },

};
