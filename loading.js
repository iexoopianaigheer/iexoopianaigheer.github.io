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
            element.style.opacity = 0;
            var listener = function(ev) {
                element.removeEventListener('transitionend', listener);
                element.removeEventListener('webkitTransitionEnd', listener);
                element.style.visibility = "hidden";
                element.classList.remove('loading-animation');
            };
            element.addEventListener('transitionend', listener);
            element.addEventListener('webkitTransitionEnd', listener);
        }
    },

};
