// File Handler Module
const FileHandler = {
    currentWorkbook: null,
    currentFile: null,

    /**
     * Initialize file handler
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * Set up event listeners for file input
     */
    setupEventListeners() {
        const { DROP_ZONE, FILE_INPUT, UPLOAD_BTN } = CONSTANTS.ELEMENTS;
        
        const dropZone = Utils.getElement(DROP_ZONE);
        const fileInput = Utils.getElement(FILE_INPUT);
        const uploadBtn = Utils.getElement(UPLOAD_BTN);

        // Upload button click
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }

        // Drag and drop
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                fileInput?.click();
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
                
                const { files } = e.dataTransfer;
                if (files && files.length > 0) {
                    this.processFile(files[0]);
                }
            });
        }
    },

    /**
     * Handle file selection from input
     * @param {Event} event - Change event
     */
    handleFileSelect(event) {
        const { files } = event.target;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    },

    /**
     * Process selected file
     * @param {File} file - Selected file
     */
    async processFile(file) {
        try {
            // Hide error messages
            UIRenderer.hideError();

            // Validate file size first
            const sizeError = this.validateFileSize(file);
            if (sizeError) {
                UIRenderer.showError(sizeError);
                return;
            }

            // Validate file type using magic numbers
            const typeValidation = await Utils.validateFileType(file);
            if (!typeValidation.valid) {
                const errorMsg = typeValidation.type === 'mismatch' 
                    ? `${typeValidation.message}\n\n${Utils.getMessage('FILE_CORRUPTED')}` 
                    : typeValidation.message;
                UIRenderer.showError(errorMsg);
                return;
            }

            // Store current file
            this.currentFile = file;

            // Show file info with validation result
            this.displayFileInfo(file, typeValidation);

            // Read file with enhanced error handling
            let workbook;
            try {
                workbook = await this.readFile(file);
            } catch (readError) {
                console.error('File read error:', readError);
                throw new Error(`${Utils.getMessage('FILE_READ_ERROR')}: ${readError.message || 'Unknown error'}`);
            }
            
            if (!workbook) {
                throw new Error(Utils.getMessage('FILE_CORRUPTED'));
            }
            
            if (!Utils.isValidWorkbook(workbook)) {
                throw new Error(Utils.getMessage('NO_SHEETS_FOUND'));
            }

            // Store workbook
            this.currentWorkbook = workbook;

            // Initialize data analyzer
            DataAnalyzer.init(workbook);

            // Show analysis section and sidebar search
            Utils.showElement(CONSTANTS.ELEMENTS.ANALYSIS_SECTION);
            const sidebarSearch = document.getElementById('sidebarSearch');
            if (sidebarSearch) {
                sidebarSearch.style.display = 'block';
            }

        } catch (error) {
            console.error('Error processing file:', error);
            UIRenderer.showError(error.message || Utils.getMessage('FILE_READ_ERROR'));
        }
    },

    /**
     * Validate file size
     * @param {File} file - File to validate
     * @returns {string|null} Error message or null if valid
     */
    validateFileSize(file) {
        if (file.size === 0) {
            return Utils.getMessage('FILE_CORRUPTED');
        }
        
        if (file.size > CONSTANTS.MAX_FILE_SIZE) {
            return Utils.getMessage('FILE_TOO_LARGE');
        }

        return null;
    },

    /**
     * Display file information
     * @param {File} file - File object
     * @param {Object} validation - Validation result (optional)
     */
    displayFileInfo(file, validation = null) {
        const { FILE_INFO, FILE_NAME, FILE_SIZE, FILE_DATE } = CONSTANTS.ELEMENTS;
        
        const fileInfoEl = Utils.getElement(FILE_INFO);
        const fileNameEl = Utils.getElement(FILE_NAME);
        const fileSizeEl = Utils.getElement(FILE_SIZE);
        const fileDateEl = Utils.getElement(FILE_DATE);

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = Utils.formatFileSize(file.size);
        if (fileDateEl) fileDateEl.textContent = Utils.formatDate(file.lastModified);

        Utils.showElement(fileInfoEl);
    },

    /**
     * Read file and parse as workbook
     * @param {File} file - File to read
     * @returns {Promise<Object>} SheetJS workbook object
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error(Utils.getMessage('FILE_READ_ERROR')));
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Get current workbook
     * @returns {Object|null} Current workbook or null
     */
    getWorkbook() {
        return this.currentWorkbook;
    },

    /**
     * Get current file
     * @returns {File|null} Current file or null
     */
    getFile() {
        return this.currentFile;
    }
};

// Make FileHandler available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}
