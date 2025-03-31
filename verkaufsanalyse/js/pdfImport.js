// PDF Import functionality

// Initialize PDF Import
function initializePdfImport(table) {
    // Check if PDF.js is loaded
    if (!window.pdfjsLib) {
        console.error('PDF.js library not loaded. PDF import will not work.');
        return {
            handlePdfFileSelect: function() {
                alert('PDF.js library is not loaded. Please refresh the page and try again.');
            }
        };
    }

    // Event handler for file selection
    function handlePdfFileSelect(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const typedArray = new Uint8Array(e.target.result);
            
            // Don't show an initial loading message here - it causes duplicate notifications
            // Let the app.js notification be the only one shown initially
            
            // Process PDF with PDF.js
            processPdf(typedArray)
                .then(textContent => {
                    // Try to parse data using extractors if available
                    if (window.pdfExtractors) {
                        const extractor = window.pdfExtractors.getExtractorForContent(textContent);
                        try {
                            const data = extractor.extractData(textContent);
                            
                            // Use specialized display if available, otherwise default to raw
                            if (extractor.displayExtractedData && data.items && data.items.length > 0) {
                                extractor.displayExtractedData(data);
                                // Don't show any more notifications here - the modal itself is enough
                            } else {
                                window.pdfExtractors.rawDataExtractor.displayRawData(textContent);
                                // Only show a notification if we're displaying raw data
                                showPdfImportStatus('PDF loaded and raw data displayed', 'info');
                            }
                            
                        } catch (error) {
                            console.error('Error extracting data:', error);
                            window.pdfExtractors.rawDataExtractor.displayRawData(textContent);
                            showPdfImportStatus('Error parsing data format. Raw data displayed.', 'warning');
                        }
                    } else {
                        console.error('PDF Extractors not loaded');
                        displayRawData(textContent); // Fallback to local function
                        showPdfImportStatus('PDF loaded, but extractors not available', 'warning');
                    }
                })
                .catch(error => {
                    console.error('Error processing PDF:', error);
                    showPdfImportStatus('Error processing PDF: ' + error.message, 'error');
                });
        };
        
        reader.onerror = function() {
            showPdfImportStatus('Error reading PDF file', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // Process PDF using PDF.js
    async function processPdf(typedArray) {
        try {
            const pdf = await pdfjsLib.getDocument({data: typedArray}).promise;
            let textContent = '';
            
            // Add raw PDF metadata information
            textContent += `PDF METADATA:\n`;
            textContent += `Total Pages: ${pdf.numPages}\n`;
            textContent += `Fingerprint: ${pdf._pdfInfo.fingerprint}\n`;
            textContent += `====================================\n\n`;
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                
                // Add page metadata
                textContent += `===== PAGE ${i} =====\n`;
                textContent += `Rotation: ${page.rotate || 0}°\n`;
                textContent += `Size: ${page.view[2].toFixed(2)}x${page.view[3].toFixed(2)} units\n`;
                
                // Raw text items with their properties
                textContent += `\nRAW ITEMS:\n`;
                content.items.forEach((item, idx) => {
                    textContent += `[${idx}] "${item.str}" (x:${item.transform[4].toFixed(2)}, y:${item.transform[5].toFixed(2)})\n`;
                });
                
                // Plain text version (easier to read)
                textContent += `\nPLAIN TEXT:\n`;
                textContent += content.items.map(item => item.str).join(' ');
                textContent += `\n\n`;
            }
            
            console.log('PDF processing complete, content length:', textContent.length);
            return textContent;
        } catch (error) {
            console.error('PDF.js error:', error);
            throw new Error('Failed to process PDF: ' + error.message);
        }
    }
    
    // Display status message - prevent duplicate notifications
    function showPdfImportStatus(message, type) {
        // Remove any existing status messages first
        $('.pdf-import-status').remove();
        
        // Also remove any app.js notifications that might be showing
        $('.ui.message[style*="position: fixed"]').remove();
        
        const statusColors = {
            info: 'blue',
            success: 'green',
            warning: 'yellow',
            error: 'red'
        };
        
        const status = $(`
            <div class="ui ${statusColors[type]} message pdf-import-status">
                <i class="close icon"></i>
                <div class="header">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <p>${message}</p>
            </div>
        `);
        
        // Add to page
        status.prependTo('.ui.container');
        
        // Handle close button
        status.find('.close').on('click', function() {
            status.fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // Auto-remove after a delay (except for errors)
        if (type !== 'error') {
            setTimeout(() => {
                status.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
    }
    
    // Fallback function to display raw data if pdfExtractors not available
    function displayRawData(content) {
        // Create modal for displaying raw data
        const modal = $(`
            <div class="ui modal" style="display:block !important; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:80%; max-width:800px; max-height:90vh; background:white; z-index:1000; padding:20px; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:5px; overflow:auto;">
                <div class="header" style="font-size:1.2em; font-weight:bold; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;">
                    Raw PDF Content
                    <i class="close icon" style="float:right; cursor:pointer;">&times;</i>
                </div>
                <div class="content" style="margin-bottom:15px;">
                    <div class="ui form">
                        <div class="field">
                            <textarea readonly style="height: 400px; font-family: monospace; white-space: pre; overflow: auto; width:100%;">${escapeHtml(content)}</textarea>
                        </div>
                    </div>
                </div>
                <div class="actions" style="text-align:right; padding-top:10px; border-top:1px solid #eee;">
                    <button class="ui button copy-raw-data" style="background:#e0e1e2; padding:8px 15px; margin-right:10px; border:none; border-radius:4px; cursor:pointer;">Copy to Clipboard</button>
                    <button class="ui positive button close-modal" style="background:#2185d0; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer;">Close</button>
                </div>
            </div>
        `);
        
        // Create overlay
        const overlay = $('<div class="modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999;"></div>');
        
        // Add to body
        overlay.appendTo('body');
        modal.appendTo('body');
        
        // Handle close actions
        modal.find('.close, .close-modal').on('click', function() {
            modal.remove();
            overlay.remove();
        });
        
        // Close on overlay click
        overlay.on('click', function() {
            modal.remove();
            overlay.remove();
        });
        
        // Handle copy button
        modal.find('.copy-raw-data').on('click', function() {
            const textarea = modal.find('textarea')[0];
            textarea.select();
            document.execCommand('copy');
            $(this).text('Copied!').css('background', '#21ba45').css('color', 'white');
            setTimeout(() => {
                $(this).text('Copy to Clipboard').css('background', '#e0e1e2').css('color', 'rgba(0,0,0,.6)');
            }, 2000);
        });
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Return the public API
    return {
        handlePdfFileSelect: handlePdfFileSelect
    };
}

// Export the pdf import functions
window.pdfImport = {
    initializePdfImport: initializePdfImport
};
