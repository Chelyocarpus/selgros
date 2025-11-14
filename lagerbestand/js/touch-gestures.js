/**
 * Touch Gestures Handler
 * Implements swipe gestures for mobile navigation using native touch events
 */

// Initialize touch gestures when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initTouchGestures();
});

/**
 * Initialize touch gestures for tab navigation
 */
function initTouchGestures() {
    // Get the tabs container
    const tabsContainer = document.querySelector('.tabs');
    const tabContentsContainer = document.querySelector('.container');
    
    if (!tabsContainer || !tabContentsContainer) {
        console.warn('Tabs container not found - touch gestures disabled');
        return;
    }

    // Initialize native touch event handlers
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    const minSwipeDistance = 50;
    const maxVerticalDistance = 100;

    // Track current tab
    const tabs = ['check', 'materials', 'archive', 'dashboard'];
    
    /**
     * Check if the swipe started on a scrollable element
     */
    function isSwipeOnScrollableElement(event) {
        const target = event.target;
        
        // Check if target or any parent is a scrollable table wrapper
        let element = target;
        while (element && element !== document.body) {
            // Check for table-responsive wrapper
            if (element.classList && element.classList.contains('table-responsive')) {
                return true;
            }
            
            // Check for DataTables wrapper
            if (element.classList && element.classList.contains('dataTables_wrapper')) {
                return true;
            }
            
            // Check for any element with horizontal scroll
            if (element.scrollWidth > element.clientWidth) {
                const overflow = window.getComputedStyle(element).overflowX;
                if (overflow === 'auto' || overflow === 'scroll') {
                    return true;
                }
            }
            
            // Check if it's inside a table
            if (element.tagName === 'TABLE' || element.tagName === 'TD' || element.tagName === 'TH') {
                return true;
            }
            
            element = element.parentElement;
        }
        
        return false;
    }
    
    /**
     * Get current active tab index
     */
    function getCurrentTabIndex() {
        for (let i = 0; i < tabs.length; i++) {
            const tabContent = document.getElementById(`${tabs[i]}Tab`);
            if (tabContent && tabContent.classList.contains('active')) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Switch to a specific tab
     */
    function switchToTab(tabName) {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabName);
        }
    }
    
    /**
     * Handle touch start
     */
    function handleTouchStart(event) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }
    
    /**
     * Handle touch end and detect swipe
     */
    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;
        
        // Don't switch tabs if swiping on a scrollable element
        if (isSwipeOnScrollableElement(event)) {
            return;
        }
        
        handleSwipe();
    }
    
    /**
     * Determine swipe direction and handle accordingly
     */
    function handleSwipe() {
        const horizontalDistance = touchEndX - touchStartX;
        const verticalDistance = Math.abs(touchEndY - touchStartY);
        
        // Ignore if vertical movement is too large (likely scrolling)
        if (verticalDistance > maxVerticalDistance) {
            return;
        }
        
        // Swipe left (next tab)
        if (horizontalDistance < -minSwipeDistance) {
            const currentIndex = getCurrentTabIndex();
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < tabs.length) {
                switchToTab(tabs[nextIndex]);
                
                // Provide haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
                
                // Announce to screen readers
                announceTabChange(tabs[nextIndex]);
            }
        }
        // Swipe right (previous tab)
        else if (horizontalDistance > minSwipeDistance) {
            const currentIndex = getCurrentTabIndex();
            const prevIndex = currentIndex - 1;
            
            if (prevIndex >= 0) {
                switchToTab(tabs[prevIndex]);
                
                // Provide haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
                
                // Announce to screen readers
                announceTabChange(tabs[prevIndex]);
            }
        }
    }
    
    // Add native touch event listeners
    tabContentsContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    tabContentsContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Initialize swipe gestures for horizontal scrolling in tables
    initTableSwipeGestures();

    // Initialize pull-to-refresh gesture (optional)
    initPullToRefresh();

    console.log('Touch gestures initialized');
}

/**
 * Initialize swipe gestures for table horizontal scrolling
 */
function initTableSwipeGestures() {
    // Add table-responsive class to all tables for mobile scrolling
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        // Skip if already wrapped
        if (table.parentElement.classList.contains('table-responsive')) {
            return;
        }

        // Wrap table in responsive container
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);

        // Track scroll to hide indicator
        wrapper.addEventListener('scroll', function() {
            if (this.scrollLeft > 10) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });
    });
}

/**
 * Initialize pull-to-refresh gesture
 */
function initPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const threshold = 80;

    document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        const currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;

        if (pullDistance > threshold && window.scrollY === 0) {
            // Visual feedback could be added here
            // For now, just log it
            console.log('Pull to refresh triggered');
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        
        isPulling = false;
        // Reset any pull-to-refresh UI
    }, { passive: true });
}

/**
 * Announce tab change to screen readers
 */
function announceTabChange(tabName) {
    const srAnnouncements = document.getElementById('srAnnouncements');
    if (srAnnouncements) {
        const tabNames = {
            'check': 'Check Stock',
            'materials': 'Manage Materials',
            'archive': 'Report Archive',
            'dashboard': 'Dashboard'
        };
        srAnnouncements.textContent = `Switched to ${tabNames[tabName] || tabName} tab`;
    }
}

/**
 * Add touch-friendly enhancements to DataTables
 */
function enhanceDataTablesForTouch() {
    // Wait for DataTables to initialize
    if (typeof $ !== 'undefined' && $.fn.dataTable) {
        $(document).on('init.dt', function(e, settings) {
            const api = new $.fn.dataTable.Api(settings);
            const wrapper = $(api.table().container());

            // Make pagination buttons larger for touch
            wrapper.find('.paginate_button').css({
                'min-width': '44px',
                'min-height': '44px',
                'padding': '10px 14px'
            });

            // Make search input touch-friendly
            wrapper.find('input[type="search"]').css({
                'font-size': '16px',
                'min-height': '44px'
            });

            // Make length select touch-friendly
            wrapper.find('select').css({
                'font-size': '16px',
                'min-height': '44px'
            });
        });
    }
}

// Apply DataTables enhancements when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceDataTablesForTouch);
} else {
    enhanceDataTablesForTouch();
}
