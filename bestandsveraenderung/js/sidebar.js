// Sidebar Navigation Handler
const SidebarNavigation = {
    /**
     * Initialize sidebar navigation
     */
    init() {
        this.sidebar = document.getElementById('sidebar');
        this.mainWrapper = document.querySelector('.main-wrapper');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navItems = document.querySelectorAll('.nav-item');

        this.setupEventListeners();
        this.setupIntersectionObserver();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Desktop sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.openSidebar();
            });
        }

        // Navigation item clicks
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.navigateToSection(section);
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                this.sidebar.classList.contains('open') &&
                !this.sidebar.contains(e.target) &&
                !this.mobileMenuToggle.contains(e.target)) {
                this.closeSidebar();
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.sidebar.classList.remove('open');
            }
        });
    },

    /**
     * Setup Intersection Observer for auto-highlighting nav items
     */
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.setActiveNavItem(sectionId);
                }
            });
        }, options);

        // Observe all sections
        const sections = document.querySelectorAll('.analysis-section, .upload-section');
        sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
        });
    },

    /**
     * Toggle sidebar (desktop)
     */
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        this.mainWrapper.classList.toggle('sidebar-collapsed');
        
        // Update tooltips when collapsed
        if (this.sidebar.classList.contains('collapsed')) {
            this.addTooltips();
        } else {
            this.removeTooltips();
        }
    },

    /**
     * Add tooltips to nav items when sidebar is collapsed
     */
    addTooltips() {
        this.navItems.forEach(item => {
            const text = item.querySelector('span')?.textContent;
            if (text) {
                item.setAttribute('title', text);
            }
        });
    },

    /**
     * Remove tooltips from nav items
     */
    removeTooltips() {
        this.navItems.forEach(item => {
            item.removeAttribute('title');
        });
    },

    /**
     * Open sidebar (mobile)
     */
    openSidebar() {
        this.sidebar.classList.add('open');
    },

    /**
     * Close sidebar (mobile)
     */
    closeSidebar() {
        this.sidebar.classList.remove('open');
    },

    /**
     * Navigate to section
     * @param {string} sectionId - Section ID to navigate to
     */
    navigateToSection(sectionId) {
        let targetElement;

        if (sectionId === 'upload') {
            targetElement = document.querySelector('.upload-section');
        } else {
            targetElement = document.getElementById(sectionId);
        }

        if (targetElement) {
            const offset = 20;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            this.setActiveNavItem(sectionId);
        }
    },

    /**
     * Set active navigation item
     * @param {string} sectionId - Section ID
     */
    setActiveNavItem(sectionId) {
        this.navItems.forEach(item => {
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SidebarNavigation.init();
    });
} else {
    SidebarNavigation.init();
}
