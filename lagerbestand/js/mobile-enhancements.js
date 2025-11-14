/**
 * Mobile-Specific UI Enhancements
 * Provides additional functionality for mobile devices
 */

// Initialize mobile enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initMobileEnhancements();
});

/**
 * Initialize all mobile enhancements
 */
function initMobileEnhancements() {
    if (isMobileDevice()) {
        addCollapsibleSections();
        optimizeFABForMobile();
        addTouchFeedback();
        improveFormInputs();
        addMobileNavigation();
        preventZoomOnInputFocus();
        
        console.log('Mobile enhancements initialized');
    }
}

/**
 * Detect if device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

/**
 * Add collapsible sections to modals for better mobile UX
 */
function addCollapsibleSections() {
    // Add collapsible functionality to long modal sections
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('collapsible-header')) {
            const content = e.target.nextElementSibling;
            const icon = e.target.querySelector('.collapse-icon');
            
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
                
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            }
        }
    });
}

/**
 * Optimize FAB button for mobile
 */
function optimizeFABForMobile() {
    const fab = document.querySelector('.fab');
    
    if (!fab) return;

    // Ensure FAB doesn't interfere with scrolling
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        fab.style.opacity = '0.6';
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            fab.style.opacity = '1';
        }, 150);
    }, { passive: true });

    // Add ripple effect on touch
    fab.addEventListener('touchstart', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('fab-ripple');
        
        const rect = fab.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        
        fab.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }, { passive: true });
}

/**
 * Add tactile feedback to interactive elements
 */
function addTouchFeedback() {
    // Add active state feedback to buttons
    const interactiveElements = document.querySelectorAll('button, .tab, .btn, .card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '1';
        }, { passive: true });
        
        element.addEventListener('touchcancel', function() {
            this.style.opacity = '1';
        }, { passive: true });
    });
}

/**
 * Improve form inputs for mobile
 */
function improveFormInputs() {
    // Add proper input types for mobile keyboards
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Add clear button to text inputs
        if (input.type === 'text' || input.type === 'search') {
            addClearButton(input);
        }
        
        // Ensure proper keyboard on mobile
        if (input.name && input.name.includes('capacity')) {
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '[0-9]*');
        }
    });
}

/**
 * Add clear button to input fields
 */
function addClearButton(input) {
    if (input.parentElement.querySelector('.input-clear-btn')) {
        return; // Already has clear button
    }

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'input-clear-btn';
    clearBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    clearBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2em;
        cursor: pointer;
        padding: 5px;
        display: none;
    `;
    
    // Wrap input
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    wrapper.appendChild(clearBtn);
    
    // Show/hide clear button
    input.addEventListener('input', function() {
        clearBtn.style.display = this.value ? 'block' : 'none';
    });
    
    // Clear input on button click
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        clearBtn.style.display = 'none';
    });
}

/**
 * Add mobile-friendly navigation helpers
 */
function addMobileNavigation() {
    // Add back-to-top button
    const backToTop = document.createElement('button');
    backToTop.id = 'backToTop';
    backToTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2em;
    `;
    
    document.body.appendChild(backToTop);
    
    // Show/hide based on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.opacity = '1';
            backToTop.style.visibility = 'visible';
        } else {
            backToTop.style.opacity = '0';
            backToTop.style.visibility = 'hidden';
        }
    }, { passive: true });
    
    // Scroll to top on click
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    });
}

/**
 * Prevent zoom when focusing on input fields on iOS
 */
function preventZoomOnInputFocus() {
    // This is handled by setting font-size: 16px in CSS
    // but we can add viewport meta tag manipulation as backup
    const viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        const originalContent = viewport.getAttribute('content');
        
        document.addEventListener('focusin', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                viewport.setAttribute('content', originalContent + ', maximum-scale=1.0');
            }
        });
        
        document.addEventListener('focusout', function() {
            viewport.setAttribute('content', originalContent);
        });
    }
}

/**
 * Add swipe-to-delete functionality for list items (if needed)
 */
function addSwipeToDelete(itemSelector, deleteCallback) {
    const items = document.querySelectorAll(itemSelector);
    
    items.forEach(item => {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const minSwipeDistance = 50;
        const maxVerticalDistance = 30;
        
        item.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        item.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            const horizontalDistance = touchEndX - touchStartX;
            const verticalDistance = Math.abs(touchEndY - touchStartY);
            
            // Ignore if vertical movement is too large
            if (verticalDistance > maxVerticalDistance) {
                return;
            }
            
            // Swipe left
            if (horizontalDistance < -minSwipeDistance) {
                item.style.transform = 'translateX(-80px)';
                item.classList.add('swiped');
                showDeleteButton(item, deleteCallback);
            }
            // Swipe right
            else if (horizontalDistance > minSwipeDistance) {
                item.style.transform = 'translateX(0)';
                item.classList.remove('swiped');
                hideDeleteButton(item);
            }
        }, { passive: true });
    });
}

/**
 * Show delete button for swiped item
 */
function showDeleteButton(item, deleteCallback) {
    let deleteBtn = item.querySelector('.swipe-delete-btn');
    
    if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.className = 'swipe-delete-btn';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 80px;
            background: var(--danger-color);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
        `;
        
        deleteBtn.addEventListener('click', function() {
            if (deleteCallback) {
                deleteCallback(item);
            }
        });
        
        item.style.position = 'relative';
        item.appendChild(deleteBtn);
    }
    
    deleteBtn.style.display = 'flex';
}

/**
 * Hide delete button
 */
function hideDeleteButton(item) {
    const deleteBtn = item.querySelector('.swipe-delete-btn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
}

/**
 * Add orientation change handler
 */
window.addEventListener('orientationchange', function() {
    // Reload DataTables on orientation change for better layout
    if (typeof $ !== 'undefined' && $.fn.dataTable) {
        setTimeout(function() {
            $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
        }, 100);
    }
    
    // Adjust any custom layouts
    const event = new Event('resize');
    window.dispatchEvent(event);
});

/**
 * Add CSS for mobile enhancements
 */
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    .collapsible-content {
        max-height: 1000px;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }
    
    .collapsible-content.collapsed {
        max-height: 0;
    }
    
    .collapsible-header {
        cursor: pointer;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--bg-color);
        border-radius: 6px;
        margin-bottom: 10px;
    }
    
    .collapsible-header:active {
        opacity: 0.7;
    }
    
    .collapse-icon {
        transition: transform 0.3s ease;
    }
    
    .fab-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: fab-ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes fab-ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .input-clear-btn {
            min-width: 44px;
            min-height: 44px;
        }
        
        .back-to-top {
            bottom: 80px;
            right: 15px;
        }
    }
    
    @media (max-width: 480px) {
        .back-to-top {
            width: 44px;
            height: 44px;
            font-size: 1.1em;
            bottom: 70px;
        }
    }
`;

document.head.appendChild(mobileStyles);
