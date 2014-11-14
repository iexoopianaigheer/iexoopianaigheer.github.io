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

var loading = {

    refCount: 0,

    dec: function() {
        loading.refCount = Math.max(0, loading.refCount - 1);
        if (!loading.refCount) {
            loading.setLoadingVisible(false);
        }
    },

    inc: function() {
        if (!loading.refCount++) {
            loading.setLoadingVisible(true);
        }
    },

    getElement: function() {
        if (!loading.element) {
            loading.element = document.getElementById('loading');
        }
        return loading.element;
    },

    setLoadingVisible: function(visible) {
        var element = loading.getElement();
        if (visible) {
            element.classList.add('loading-animation');
            element.style.visibility = "visible";
            element.style.opacity = 1;
        } else {
            var listener = function(ev) {
                element.removeEventListener('transitionend', listener);
                element.removeEventListener('webkitTransitionEnd', listener);
                element.style.visibility = "hidden";
                element.classList.remove('loading-animation');
            };
            element.addEventListener('transitionend', listener);
            element.addEventListener('webkitTransitionEnd', listener);
            element.style.opacity = 0;
        }
    },

};

var infoBox = {

    getContainer: function() {
        if (!infoBox.container) {
            infoBox.container = document.getElementById('info');
        }
        return infoBox.container;
    },

    getContent: function() {
        if (!infoBox.content) {
            infoBox.content = document.getElementById('content');
        }
        return infoBox.content;
    },

    appendTimetableInfo: function(stopTimes) {
        var times = dom.createChildNode(infoBox.getContent(), 'div', 'times');

        stopTimes.stopTimes.forEach(function(stopTime) {
            var phase = stopTime.phase;
            if (phase && phase !== 'departure') {
                return;
            }

            var date = new Date(stopTime.time * 1000);
            var minutes = ('0' + date.getMinutes()).substr(-2);
            var id = stopTime.trip.id.id;
            var line = undefined;
            switch (routa.config.agencyId) {
                case 'HSL':
                    line = data.interpretLineRef(id.substring(0, id.indexOf('_')))[1];
                    break;
            }

            var row = dom.createChildNode(times, 'div', 'time-row');
            dom.createChildNode(row, 'div', 'hours', date.getHours());
            dom.createChildNode(row, 'div', 'minutes', minutes);
            if (line !== undefined) {
                dom.createChildNode(row, 'div', 'line', line);
            }
            dom.createChildNode(row, 'div', 'destination', stopTime.direction);
        });
    },

    setVisible: function(visible) {
        var element = infoBox.getContainer();
        if (visible) {
            map.map.once('click', function(ev) {
                infoBox.setVisible(false);
                map.previousView();
            });
            element.style.visibility = "visible";
            element.style.opacity = 1;
        } else {
            var listener = function(ev) {
                element.removeEventListener('transitionend', listener);
                element.removeEventListener('webkitTransitionEnd', listener);
                element.style.visibility = "hidden";
            };
            element.addEventListener('transitionend', listener);
            element.addEventListener('webkitTransitionEnd', listener);
            element.style.opacity = 0;
        }
        return element;
    },

    setInfo: function(info, style) {
        var element = infoBox.getContent();
        while (element.lastChild) {
            element.removeChild(element.lastChild);
        };

        if (info instanceof Array) {
            info.forEach(function(e) {
                element.appendChild(e);
            });
        } else {
            if (info instanceof Element) {
                element.appendChild(info);
            } else {
                var e = document.createElement('pre');
                e.textContent = info;
                element.appendChild(e);
            }
        }

        if (style) {
            var container = infoBox.getContainer();
            container.className = '';
            if (style instanceof Array) {
                style.forEach(function(cls) {
                    container.classList.add(cls);
                });
            } else {
                container.classList.add(style);
            }
        }
    },

    setRouteInfo: function(variant, shortName) {
        console.debug(variant);
        var heading = document.createElement('h1');
        heading.textContent = shortName  + ': '
            + variant.route.longName;
        infoBox.setInfo(heading, 'line');
    },

    setStopInfo: function(feature, stopData) {
        var routes = document.createElement('div');
        routes.classList.add('routes');

        stopData.sort().forEach(function(route) {
            var e = document.createElement('div');
            e.classList.add('route');

            var shortName = document.createElement('div');
            shortName.classList.add('short-name');
            shortName.textContent = route.routeShortName;
            e.appendChild(shortName);

            var longName = document.createElement('div');
            longName.classList.add('long-name');
            longName.textContent = route.routeLongName;
            e.appendChild(longName);

            routes.appendChild(e);
        });

        var heading = document.createElement('h1');
        var stopCode = feature.get('stopCode');
        heading.textContent = feature.get('name')
            + (stopCode ? ' (' + stopCode + ')' : '');

        infoBox.setInfo([heading, routes], 'stop');
    },

};

var dom = {

    createChildNode: function(parent, tag, classList, textContent) {
        var e = dom.createNode(tag, classList, textContent);
        if (parent) {
            parent.appendChild(e);
        }

        return e;
    },

    createNode: function(tag, classList, textContent) {
        var e = document.createElement(tag);

        if (classList) {
            if (classList instanceof Array) {
                classList.forEach(function(cls) {
                    e.classList.add(cls);
                });
            } else {
                e.classList.add(classList);
            }
        }

        if (textContent != undefined) {
            e.textContent = textContent;
        }

        return e;
    },

};
