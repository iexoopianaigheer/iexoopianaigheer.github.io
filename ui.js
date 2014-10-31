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

    getElement: function() {
        if (!infoBox.element) {
            infoBox.element = document.getElementById('info');
        }
        return infoBox.element;
    },

    setVisible: function(visible) {
        var element = infoBox.getElement();
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

    setInfo: function(info) {
        var element = document.getElementById('info');
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
    },

};
