var hamburger = document.getElementById('hamburger');
var close = document.getElementById('close');
var drawer = document.getElementById('drawer');
var search = document.getElementById('search');
var searchBar = document.getElementById('searchbar');
var dropdowns = document.getElementsByClassName('dropdown');
if (search && searchBar) {
    search.addEventListener('click', function() {
        if (searchBar.classList.contains('visible')) {
            searchBar.classList.remove('visible');
            searchBar.getElementsByTagName('input')[0].blur();
        } else {
            searchBar.classList.add('visible');
            searchBar.getElementsByTagName('input')[0].focus();
        }
    });
}

if (close && drawer) {
    close.addEventListener('click', function() {
        drawer.classList.remove('visible');
    });
}

if (hamburger && drawer) {
    hamburger.addEventListener('click', function() {
        if (drawer.classList.contains('visible')) {
            drawer.classList.remove('visible');
        } else {
            drawer.classList.add('visible');
        }
    });
}
if (dropdowns) {
    for (var i = 0; i < dropdowns.length; i++) {
        (function(i) {
            dropdowns[i].addEventListener('click', function(e) {
                if (dropdowns[i] === e.target || dropdowns[i] === e.target.parentNode) {
                    var content = dropdowns[i].getElementsByTagName('ul')[0];
                    if (!content) return;
                    content.className = ('visible' === content.className)
                        ? ''
                        : 'visible';
                }
            });
        })(i);
    }
}