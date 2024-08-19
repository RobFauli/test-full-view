/**
 * Infinite scroller for articles.
 * Require CSS to support transform using translateX.
 * This is optimized to use GPU instead og CPU.
 * (c) Publish Lab AS 2018
 */

if (!window.Dac) window.Dac = {}
var Dac = window.Dac;

Dac.AutoScroller = function(boxContainer, autoscroll, interval) {

    var autoscrollId = null;
    if (!boxContainer) return;
    var container = boxContainer.querySelector('ul.articles');
    if (!container) return;
    var articleList = container.children;
    if (!articleList.length) return;
    var leftNav = boxContainer.querySelector('span.left');
    var rightNav = boxContainer.querySelector('span.right');
    var currentIndex = 0;
    var elementWidth = articleList[0].offsetWidth;
    var visibleCount = Math.round(container.offsetWidth / elementWidth);
    var scrollWidth = container.offsetWidth / visibleCount;
    var intervalPeriod = interval || 4000;

    if (visibleCount >= articleList.length) return;
    var slots = [];

    var setupSlots = function() {
        slots = [];
        for (var i = 0; i < articleList.length; i++) {
            slots.push(new slot(articleList[i], scrollWidth));
        }
    }

    var resizeObserver;
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === container) {
                    var newElementWidth = articleList[0].offsetWidth;
                    if (newElementWidth !== elementWidth) {
                        elementWidth = newElementWidth;
                        scrollWidth = container.offsetWidth / visibleCount;
                        setupSlots();
                        repositionLast(1);
                    }        
                }
            }
        });
    }

    var start = function() {
        setupSlots();
        repositionLast(1);
        if (resizeObserver) { resizeObserver.observe(container); }
        if (autoscroll) {
            autoscrollId = window.setInterval(function() {
                if (!autoscroll) {
                    window.clearInterval(autoscrollId);
                    return;
                }
                step(1);
            }, intervalPeriod);
        }
    }

    var dotsContainer = boxContainer.querySelector('ul.dots');


    // Eks: "transition: transform 0.5s;" -> more than 500.
    // CSS-class "transformHidden" should move the element instantly and hide it.
    var slot = function(element, slotWidth) {
        this.element = element;
        this.slotWidth = slotWidth;
        this.xPos = 0;

        this.step = function(amount, hidden) {
            this.xPos -= this.slotWidth * amount;
            this.move(this.xPos, hidden);
        }

        this.reset = function() {
            this.xPos = 0;
            this.move(0);
        }

        this.move = function(xPos, hidden) {
            var el = this.element;
            if (hidden) {
                el.classList.add('transformHidden');
            } else {
                el.classList.remove('transformHidden');
            }
            el.style.transform = 'translateX(' + xPos + 'px)'; // transitionend 
            // if (hidden) {
            //     window.setTimeout(function() {
            //         el.classList.remove('transformHidden');
            //     }, 150);
            // }
        }

        var self = this;
        return {
            step: function(amount, hidden) {
                self.step(amount, hidden);
            },
            reset: function() {
                self.reset();
            }
        }
    }

    var step = function(amount, hidden) {
        var oldIndex = currentIndex;
        currentIndex += amount;
        if (Math.abs(currentIndex) >= slots.length) {
            currentIndex = 0;
        }
        slots.forEach(function(obj) {
            obj.step(amount, hidden);
        })
        if (amount > 0) {
            repositionFirst(Math.abs(amount));
        } else if (amount < 0) {
            repositionLast(Math.abs(amount));
        }
        updateDots(currentIndex, oldIndex);
    }

    var repositionFirst = function(count) {
        var first = slots.shift();
        first.step(-2 - slots.length, true);
        window.setTimeout(function() {
            first.step(1);
        }, 50);
        slots.push(first);
        count--;
        if (count > 0) repositionFirst(count);
    }

    var repositionLast = function(count) {
        var last = slots.pop();
        slots.unshift(last);
        last.step(slots.length, true);
        count--;
        if (count > 0) repositionLast(count);
    }

    var slideToPrevious = function() {
        step(-1);
        autoscroll = false;
    }

    var slideToNext = function() {
        step(1);
        autoscroll = false;
    }

    if (leftNav) {
        leftNav.addEventListener('click', slideToPrevious, false);
    }
    if (rightNav) {
        rightNav.addEventListener('click', slideToNext, false);
    }

    function getIndex(element) {
        var nodes = Array.prototype.slice.call(element.parentNode.children);
        return nodes.indexOf(element);
    }

    function dotClicked(event) {
        event.preventDefault();
        event.stopPropagation();
        var index = getIndex(this);
        if (index > -1) {
            step(index - currentIndex, true);
        }
        autoscroll = false;
    }

    function updateDots(newIndex, oldIndex) {
        if (!dotsContainer) return;
        var oldEl = dotsContainer.children[oldIndex];
        if (oldEl) oldEl.classList.remove('selected');
        var newEl = dotsContainer.children[newIndex];
        if (newEl) newEl.classList.add('selected');
    }


    if (dotsContainer) {
        for (var i = 0; i < dotsContainer.children.length; i++) {
            dotsContainer.children[i].addEventListener('click', dotClicked, false);
        }
        updateDots(0);
    }

    start();
}
