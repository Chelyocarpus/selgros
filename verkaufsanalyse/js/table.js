// Table initialization and operations

// Row template for new rows - Make Rabatt Brutto readonly and fix display format
function getNewRowHtml() {
    return `
        <tr>
            <td class="actions-column">
                <div class="row-actions">
                    <i class="bars icon drag-handle" title="Drag to reorder"></i>
                    <i class="edit outline icon edit-row" title="Edit row"></i>
                    <i class="trash alternate outline icon delete-row" title="Delete row"></i>
                </div>
            </td>
            <td class="counter-cell"></td>
            <td>000000</td>
            <td>New Article</td>
            <td>0</td>
            <td>0,00</td>
            <td>0,00</td>
            <td>0,00</td>
            <td>
                <div class="input-container">
                    <input type="number" class="number-input verkauft" min="0" step="1" value="0">
                    <div class="error-message"></div>
                </div>
            </td>
            <td>
                <div class="input-container">
                    <input type="number" class="number-input schwund" min="0" step="1" value="0">
                    <div class="error-message"></div>
                </div>
            </td>
            <td>
                <div class="input-container">
                    <input type="number" class="number-input rabbatiert" min="0" step="1" value="0">
                    <div class="error-message"></div>
                </div>
            </td>
            <td>
                <div class="input-container rabatt-container">
                    <input type="text" class="currency-input rabatt-netto" value="0,00">
                    <div class="error-message"></div>
                </div>
            </td>
            <td class="rabatt-brutto">0,00</td>
            <td class="calculated sumVerkauft">0,00</td>
            <td class="calculated sumRabbatiert">0,00</td>
            <td class="calculated sumGesamt">0,00</td>
            <td class="calculated sumProfit">0,00</td>
        </tr>
    `;
}

// Initialize DataTable
function initializeDataTable() {
    return $('#sapTable').DataTable({
        dom: `
            <"table-controls"
                <"left-side"
                    <"add-button">B
                >
                <"right-side"f>
            >
            t
            <"bottom-controls"
                <"row"
                    <"seven wide column"l>
                    <"two wide column centered"i>
                    <"seven wide column right aligned"p>
                >
            >
        `,
        buttons: [
            { 
                extend: 'copyHtml5', 
                text: '<i class="copy icon"></i> Copy',
                className: 'ui button'
            },
            { 
                extend: 'excelHtml5', 
                text: '<i class="file excel outline icon"></i> Export to Excel',
                className: 'ui button'
            },
            { 
                extend: 'print', 
                text: '<i class="print icon"></i> Print',
                className: 'ui button'
            }
        ],
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        orderMulti: true,
        order: [],
        columnDefs: [
            { orderable: false, targets: 0 },
            { orderable: false, targets: 1 },
            { type: 'num', targets: [4,5,6,7,8,9,10,11,12,13,14] }
        ],
        // Enable row reordering
        rowReorder: {
            selector: '.drag-handle',
            dataSrc: 1, // Use the counter cell as the data source for reordering
            update: true
        },
        hover: true,
        stripeClasses: false,
        rowClass: 'ui-state-default',
        createdRow: function(row) {
            $(row).addClass('ui-state-default');
        },
        language: {
            paginate: {
                previous: '<i class="left chevron icon"></i>',
                next: '<i class="right chevron icon"></i>'
            },
            lengthMenu: "Show _MENU_ entries per page",
            info: "Showing _START_ to _END_ of _TOTAL_ entries"
        }
    });
}

// Update row counters
function updateRowCounters(table) {
    let counter = 1;
    table.rows().every(function(rowIdx) {
        $(this.node()).find('td.counter-cell').text(counter++);
    });
}

// Helper function to check if any inputs have values
const hasInputValues = row => {
    try {
        // First check quantity fields (integer inputs)
        const hasQuantities = ['verkauft', 'schwund', 'rabbatiert'].some(className => {
            const input = row.find('.' + className);
            return input.length > 0 && (parseInt(input.val()) > 0);
        });
        
        // Then check price fields (decimal inputs) - use proper decimal comparison
        const hasPrices = ['rabatt-netto', 'rabatt-brutto'].some(className => {
            const input = row.find('.' + className);
            if (!input.length) return false;
            
            // Parse with German decimal separator
            const value = window.utils.parseGermanNumber(input.val());
            return value > 0.001; // Use small epsilon for floating point comparison
        });
        
        return hasQuantities || hasPrices;
    } catch (e) {
        console.error('Error checking input values:', e);
        return false;
    }
};

// Custom confirm dialog
function showConfirmDialog(e, message, callback) {
    // Remove any existing confirm dialogs
    $('.custom-confirm-dialog').remove();
    
    const dialog = $(`
        <div class="custom-confirm-dialog">
            <div class="content">
                <p>${message}</p>
            </div>
            <div class="actions">
                <button class="ui negative mini button">No</button>
                <button class="ui positive mini button">Yes</button>
            </div>
        </div>
    `).appendTo('body');

    // Get viewport dimensions
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    // Calculate position
    let left = Math.min(Math.max(e.pageX, 0), vw - dialog.outerWidth());
    let top = Math.min(Math.max(e.pageY, 0), vh - dialog.outerHeight());

    // Position dialog
    dialog.css({
        position: 'fixed',
        top: top + 'px',
        left: left + 'px',
        display: 'block'
    });

    // Handle button clicks
    dialog.find('.negative.button').on('click', function() {
        dialog.remove();
        callback(false);
    });

    dialog.find('.positive.button').on('click', function() {
        dialog.remove();
        callback(true);
    });

    // Close dialog when clicking outside
    $(document).one('click', function(e) {
        if (!$(e.target).closest('.custom-confirm-dialog').length) {
            dialog.remove();
            callback(false);
        }
    });
}

// Initialize a newly added row
function initializeNewRow(row, autoEdit = false) {
    try {
        // Add highlight class for newly added rows
        row.addClass('new-row-highlight');
        
        // Remove highlighting after animation completes
        setTimeout(() => {
            row.removeClass('new-row-highlight');
        }, 1500);

        // Initialize inputs - ensure proper values for all input types
        row.find('.number-input').each(function() {
            $(this).val('0');
        });
        
        // Initialize currency inputs with proper format
        row.find('.currency-input').each(function() {
            $(this).val('0,00');
        });
        
        // Initialize Rabatt Brutto cell with proper format
        row.find('.rabatt-brutto').text('0,00');

        // Auto-edit if requested
        if (autoEdit) {
            // Trigger edit mode automatically for new rows
            setTimeout(() => {
                row.find('.edit-row').trigger('click');
                
                // Focus on the article field (most likely to be edited first)
                setTimeout(() => {
                    const articleInput = row.find('td:nth-child(4) input');
                    if (articleInput.length) {
                        articleInput.focus().select();
                    }
                }, 50);
            }, 50);
        }
    } catch (e) {
        console.error('Error initializing new row:', e);
    }

    return row;
}

// Export table functions
window.tableModule = {
    getNewRowHtml,
    initializeDataTable,
    updateRowCounters,
    hasInputValues,
    showConfirmDialog,
    initializeNewRow  // Add the new function to exports
};
