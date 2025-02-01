$(document).ready(function() {
    // Add helper function for German number format
    function parseGermanNumber(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/\s/g, '').replace(',', '.')) || 0;
    }

    function formatGermanNumber(value) {
        return parseFloat(value).toFixed(2).replace('.', ',');
    }

    // Update the saveTableData function to track edit state
    function saveTableData() {
        const tableData = [];
        const table = $('#sapTable').DataTable();
        
        table.rows().every(function() {
            const $row = $(this.node());
            // Convert input values to numbers before saving
            const verkauft = parseInt($row.find('.verkauft').val()) || 0;
            const schwund = parseInt($row.find('.schwund').val()) || 0;
            const rabbatiert = parseInt($row.find('.rabbatiert').val()) || 0;

            const rowData = {
                sap: $row.find('td:nth-child(2)').text(),
                article: $row.find('td:nth-child(3)').text(),
                stueck: $row.find('td:nth-child(4)').text(),
                ek: $row.find('td:nth-child(5)').text(),
                netto: $row.find('td:nth-child(6)').text(),
                spanne: $row.find('td:nth-child(7)').text(),
                brutto: $row.find('td:nth-child(8)').text(),
                verkauft: verkauft,
                schwund: schwund,
                rabbatiert: rabbatiert,
                sumVerkauft: $row.find('.sumVerkauft').text(),
                sumRabbatiert: $row.find('.sumRabbatiert').text(),
                sumGesamt: $row.find('.sumGesamt').text(),
                sumProfit: $row.find('.sumProfit').text(),
                isEditing: $row.find('.edit-row').hasClass('save')
            };
            tableData.push(rowData);
        });

        try {
            localStorage.setItem('tableData', JSON.stringify(tableData));
            console.log('Data saved:', tableData);
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    // Update the loadTableData function to handle calculated values
    function loadTableData() {
        try {
            const savedData = localStorage.getItem('tableData');
            if (savedData) {
                const tableData = JSON.parse(savedData);
                console.log('Loading data:', tableData);
                const table = $('#sapTable').DataTable();
                
                // Clear existing rows
                table.clear();
                
                // Add saved rows
                tableData.forEach(rowData => {
                    const newRow = $(getNewRowHtml());
                    
                    if (rowData.isEditing) {
                        // If row was in edit mode, restore with input fields
                        const cells = newRow.find('td');
                        for (let i = 1; i < 8; i++) {
                            let cell = $(cells[i]);
                            let value = '';
                            
                            switch(i) {
                                case 1: value = rowData.sap; break;
                                case 2: value = rowData.article; break;
                                case 3: value = rowData.stueck; break;
                                case 4: value = rowData.ek; break;
                                case 5: value = rowData.netto; break;
                                case 6: value = rowData.spanne; break;
                                case 7: value = rowData.brutto; break;
                            }
                            
                            let input = $('<input>')
                                .val(value)
                                .addClass('ui input')
                                .css('width', '100%');

                            if (i === 3) {
                                input.attr('type', 'number').attr('min', '0');
                            } else if (i === 4 || i === 5 || i === 7) {
                                input.attr('type', 'number').attr('step', '0.01');
                            }

                            cell.html(input);
                        }
                        
                        // Change edit icon to save icon
                        newRow.find('.edit-row')
                            .removeClass('edit outline')
                            .addClass('save')
                            .attr('title', 'Save changes');
                    } else {
                        // Normal cell values - Add null checks
                        newRow.find('td:nth-child(2)').text(rowData.sap || '');
                        newRow.find('td:nth-child(3)').text(rowData.article || '');
                        newRow.find('td:nth-child(4)').text(rowData.stueck || '0');
                        newRow.find('td:nth-child(5)').text(rowData.ek || '0.00');
                        newRow.find('td:nth-child(6)').text(rowData.netto || '0.00');
                        newRow.find('td:nth-child(7)').text(rowData.spanne || '0.00%');
                        newRow.find('td:nth-child(8)').text(rowData.brutto || '0.00');
                    }
                    
                    // Set input values with strict value preservation
                    newRow.find('.verkauft').val(rowData.verkauft !== undefined && rowData.verkauft !== null ? rowData.verkauft : '0');
                    newRow.find('.schwund').val(rowData.schwund !== undefined && rowData.schwund !== null ? rowData.schwund : '0');
                    newRow.find('.rabbatiert').val(rowData.rabbatiert !== undefined && rowData.rabbatiert !== null ? rowData.rabbatiert : '0');
                    
                    // Force values to be treated as numbers
                    newRow.find('.number-input').each(function() {
                        $(this).val(parseInt($(this).val()) || 0);
                    });
                    
                    // Set calculated values with default 0.00 €
                    newRow.find('.sumVerkauft').text(rowData.sumVerkauft || '0.00 €');
                    newRow.find('.sumRabbatiert').text(rowData.sumRabbatiert || '0.00 €');
                    newRow.find('.sumGesamt').text(rowData.sumGesamt || '0.00 €');
                    newRow.find('.sumProfit').text(rowData.sumProfit || '0.00 €');

                    // Explicitly set numeric values and trigger calculation
                    const inputs = {
                        verkauft: rowData.verkauft,
                        schwund: rowData.schwund,
                        rabbatiert: rowData.rabbatiert
                    };

                    Object.entries(inputs).forEach(([key, value]) => {
                        const input = newRow.find(`.${key}`);
                        // Set value and ensure it's a number
                        const numValue = parseInt(value) || 0;
                        input.val(numValue);
                        // Force input event to trigger calculations
                        input.trigger('input');
                    });
                    
                    table.row.add(newRow);
                });
                
                table.draw();
                // Force recalculation after draw
                initializeAllCalculations();
                updateStats();
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }

    // Move loadTableData call to after DataTable initialization
    var table = $('#sapTable').DataTable({
        // Update DOM structure for better control layout
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
        pageLength: 10, // Show 10 rows per page
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]], // Page length options
        orderMulti: true, // Enable multi-column sorting
        order: [], // Default no sort
        columnDefs: [
            { orderable: false, targets: 0 }, // Disable sorting on actions column
            { type: 'num', targets: [3,4,5,7,8,9,11,12,13,14] } // Numeric sorting for number columns
        ],
        hover: true,
        stripeClasses: false,  // Disable row striping
        rowClass: 'ui-state-default',  // Base row class for consistent styling
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

    // Initialize table and load data
    loadTableData();

    // Move Add Row button to custom position
    $('.add-row-button').appendTo('.add-button');

    // Enable Shift+Click for multi-column sort
    $('#sapTable thead th').on('click', function(e) {
        if (!e.shiftKey) {
            $('#sapTable thead th').not(this).removeClass('sorting_asc sorting_desc');
        }
    });

    function validateInputs(row) {
        const maxStueck = parseInt(row.find('td:nth-child(4)').text());
        const verkauft = parseInt(row.find('.verkauft').val()) || 0;
        const schwund = parseInt(row.find('.schwund').val()) || 0;
        const rabbatiert = parseInt(row.find('.rabbatiert').val()) || 0;
        
        const total = verkauft + schwund + rabbatiert;
        
        // Reset error states
        row.find('.number-input').removeClass('input-error');
        row.find('.error-message').removeClass('visible');
        
        if (total > maxStueck) {
            const excess = total - maxStueck;
            const currentInput = $(event.target);
            const newValue = Math.max(0, currentInput.val() - excess);
            
            currentInput.val(newValue);
            currentInput.addClass('input-error');
            const errorMessage = currentInput.siblings('.error-message');
            errorMessage
                .text(`Maximum total is ${maxStueck}`)
                .addClass('visible')
                .delay(2000)
                .queue(function() {
                    $(this).removeClass('visible').dequeue();
                    currentInput.removeClass('input-error').dequeue();
                });
            
            return true;
        }
        return true;
    }

    // Helper function to check if any inputs have values
    function hasInputValues(row) {
        return ['verkauft', 'schwund', 'rabbatiert'].some(className => 
            parseFloat(row.find('.' + className).val()) > 0
        );
    }

    // Modify the event binding to use event delegation for dynamic rows
    $('#sapTable').on('input', '.number-input', function() {
        const input = $(this);
        const value = input.val();
        
        // Ensure empty or invalid values become 0
        if (value === '' || isNaN(value)) {
            input.val(0);
        }
        
        // Force numerical value
        input.val(parseInt(input.val()) || 0);
        
        let row = input.closest('tr');
        
        if (!validateInputs(row)) {
            // Reset the changed input to 0
            $(this).val(0);
            return;
        }
        
        // Skip calculation if all inputs are 0
        if (!hasInputValues(row)) {
            // Reset all sum fields to 0
            row.find('.sumVerkauft, .sumRabbatiert, .sumGesamt, .sumProfit').text('0.00 €');
            updateStats();
            return;
        }
        
        // Get values
        let verkauft = parseFloat(row.find('.verkauft').val()) || 0;
        let schwund = parseFloat(row.find('.schwund').val()) || 0;
        let rabbatiert = parseFloat(row.find('.rabbatiert').val()) || 0;
        
        // Get prices
        let bruttoText = row.find('td:nth-child(8)').text();
        let ekText = row.find('td:nth-child(5)').text();
        let bruttoPrice = parseGermanNumber(bruttoText);
        let ekPrice = parseGermanNumber(ekText);
        
        console.log('Values:', { verkauft, schwund, rabbatiert, bruttoPrice, ekPrice });

        // Calculate normal sales
        let sumVerkauft = verkauft * bruttoPrice;
        
        // Calculate rabbatiert (fixed formula)
        let discountedPrice = bruttoPrice * 0.5;  // 50% discount
        let naturalrabattBonus = discountedPrice * 0.25;  // 25% of discounted price only (was using full price before)
        let finalRabbatPrice = discountedPrice + naturalrabattBonus;
        let sumRabbatiert = rabbatiert * finalRabbatPrice;
        
        // Calculate total sums
        let sumGesamt = sumVerkauft + sumRabbatiert;
        
        // Calculate total EK cost and profit
        let totalPieces = parseInt(row.find('td:nth-child(4)').text()); // Get total Stück
        let totalEKCost = totalPieces * ekPrice; // Total EK cost for all pieces
        let sumProfit = sumGesamt - totalEKCost; // Total revenue minus total EK cost
        
        console.log('Totals:', {
            sumGesamt: sumGesamt,
            totalPieces: totalPieces,
            totalEKCost: totalEKCost,
            sumProfit: sumProfit
        });

        // Update display
        row.find('.sumVerkauft').text(sumVerkauft.toFixed(2) + ' €');
        row.find('.sumRabbatiert').text(sumRabbatiert.toFixed(2) + ' €');
        row.find('.sumGesamt').text(sumGesamt.toFixed(2) + ' €');
        row.find('.sumProfit').text(sumProfit.toFixed(2) + ' €');
        
        updateStats(); // Add this line at the end
        saveTableData(); // Add save to storage at the end
    });

    // Row template for new rows
    function getNewRowHtml() {
        return `
            <tr>
                <td class="actions-column">
                    <div class="row-actions">
                        <i class="edit outline icon edit-row" title="Edit row"></i>
                        <i class="trash alternate outline icon delete-row" title="Delete row"></i>
                    </div>
                </td>
                <td>0</td>
                <td>New Article</td>
                <td>0</td>
                <td>0.00</td>
                <td>0.00</td>
                <td>33.00%</td>
                <td>0.00</td>
                <td>
                    <div class="input-container">
                        <input type="number" class="number-input verkauft" min="0" value="0">
                        <div class="error-message"></div>
                    </div>
                </td>
                <td>
                    <div class="input-container">
                        <input type="number" class="number-input schwund" min="0" value="0">
                        <div class="error-message"></div>
                    </div>
                </td>
                <td>
                    <div class="input-container">
                        <input type="number" class="number-input rabbatiert" min="0" value="0">
                        <div class="error-message"></div>
                    </div>
                </td>
                <td class="calculated sumVerkauft">0.00 €</td>
                <td class="calculated sumRabbatiert">0.00 €</td>
                <td class="calculated sumGesamt">0.00 €</td>
                <td class="calculated sumProfit">0.00 €</td>
            </tr>
        `;
    }

    // Update add row functionality to maintain current page
    $('.add-row-button').on('click', function() {
        let table = $('#sapTable').DataTable();
        let currentPage = table.page();
        let newRow = $(getNewRowHtml());
        
        // Add row and redraw maintaining current page
        table.row.add(newRow).draw(false);

        // Initialize inputs in the new row
        newRow.find('.number-input').each(function() {
            $(this).val(0);
        });
        
        // Go to the last page if we're not already there
        let pageInfo = table.page.info();
        if (currentPage !== pageInfo.pages - 1) {
            table.page('last').draw(false);
        }
        
        saveTableData();
    });

    // Replace the existing edit row functionality with this updated version
    $('#sapTable').on('click', '.edit-row', function() {
        let row = $(this).closest('tr');
        let icon = $(this);
        
        // If already in edit mode, save the changes
        if (icon.hasClass('save')) {
            let cells = row.find('td');
            
            // Save input values back to cells
            for (let i = 1; i < 8; i++) {
                let cell = $(cells[i]);
                let input = cell.find('input');
                let value = input.val();
                
                // Format numbers with German number format
                if (i === 4 || i === 5 || i === 7) { // EK, Netto, Brutto
                    value = formatGermanNumber(parseGermanNumber(value));
                }
                
                cell.html(value);
            }

            // Restore edit icon
            icon
                .removeClass('save')
                .addClass('edit outline')
                .attr('title', 'Edit row');
                
            // Recalculate row if there are any input values
            if (hasInputValues(row)) {
                forceCalculateRow(row);
                updateStats();
            }
            
            saveTableData(); // Add this line before the return
            return;
        }

        // Convert cells to input fields for editing
        let cells = row.find('td');

        // Skip first column (actions)
        for (let i = 1; i < 8; i++) {
            let cell = $(cells[i]);
            let currentValue = cell.text();
            
            // Parse value if it's a number field
            if (i === 4 || i === 5 || i === 7) { // EK, Netto, Brutto
                currentValue = parseGermanNumber(currentValue);
            }
            
            // Create input field with auto-save
            let input = $('<input>')
                .val(currentValue)
                .addClass('ui input')
                .css('width', '100%')
                .on('change keyup', function() {
                    // Auto-save on change or keyup
                    let value = $(this).val();
                    if (i === 4 || i === 5 || i === 7) { // EK, Netto, Brutto
                        value = parseGermanNumber(value);
                    }
                    // Update calculations immediately
                    if (hasInputValues(row)) {
                        forceCalculateRow(row);
                        updateStats();
                    }
                    saveTableData();
                });

            // Handle numeric fields
            if (i === 3) { // Stück
                input.attr('type', 'number').attr('min', '0');
            } else if (i === 4 || i === 5 || i === 7) { // EK, Netto, Brutto
                input.attr('type', 'number').attr('step', '0.01');
            }

            cell.html(input);
        }

        // Change edit icon to save icon
        icon
            .removeClass('edit outline')
            .addClass('save')
            .attr('title', 'Save changes');
    });

    // Update delete row handler
    $('#sapTable').on('click', '.delete-row', function() {
        if (confirm('Are you sure you want to delete this row?')) {
            let table = $('#sapTable').DataTable();
            let row = $(this).closest('tr');
            let currentPage = table.page();
            
            // Remove row without redrawing
            table.row(row).remove();
            
            // Get info about table state after removal
            let pageInfo = table.page.info();
            let totalRows = pageInfo.recordsDisplay;
            let rowsPerPage = pageInfo.length;
            
            // Calculate what page we should be on after deletion
            let lastPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);
            let targetPage = Math.min(currentPage, lastPage);
            
            // Go to the calculated page and redraw
            table.page(targetPage).draw(false);
            
            saveTableData();
            updateStats();
        }
    });

    // Existing event handlers will work with new rows automatically
    // because they're using event delegation ($(document).on)

    function updateStats() {
        let totalProfit = 0;
        let totalRevenue = 0;
        let discountedSales = 0;
        let totalLoss = 0;
        let itemsSold = 0;
        let discountItems = 0;
        let lostItems = 0;

        const table = $('#sapTable').DataTable();
        table.rows().every(function() {
            const row = $(this.node());
            
            // Get values from the row
            const schwund = parseInt(row.find('.schwund').val()) || 0;
            const verkauft = parseInt(row.find('.verkauft').val()) || 0;
            const rabbatiert = parseInt(row.find('.rabbatiert').val()) || 0;
            const ekPrice = parseGermanNumber(row.find('td:nth-child(5)').text());
            
            // Calculate totals
            totalProfit += parseFloat(row.find('.sumProfit').text().replace('€', '').trim()) || 0;
            totalRevenue += parseFloat(row.find('.sumGesamt').text().replace('€', '').trim()) || 0;
            discountedSales += parseFloat(row.find('.sumRabbatiert').text().replace('€', '').trim()) || 0;
            
            // Calculate loss based on EK price and schwund quantity
            totalLoss += schwund * ekPrice;
            
            // Update counters
            itemsSold += verkauft;
            discountItems += rabbatiert;
            lostItems += schwund;
        });

        // Update stats display with proper formatting
        $('#totalProfit').text(totalProfit.toFixed(2) + ' €');
        $('#totalRevenue').text(totalRevenue.toFixed(2) + ' €');
        $('#discountedSales').text(discountedSales.toFixed(2) + ' €');
        $('#totalLoss').text(totalLoss.toFixed(2) + ' €');
        $('#itemsSold').text(itemsSold);
        $('#discountItems').text(discountItems);
        $('#lostItems').text(lostItems);
        $('#profitMargin').text(((totalProfit / totalRevenue * 100) || 0).toFixed(1) + '%');
    }

    // Initial stats update
    updateStats();

    // Trigger calculations for any inputs with values on page load
    function initializeCalculations() {
        $('.number-input').each(function() {
            if (parseFloat($(this).val()) > 0) {
                $(this).trigger('change');
            }
        });
    }

    // Initialize after DataTable is ready
    $('#sapTable').on('init.dt', function() {
        initializeCalculations();
        loadTableData(); // Load saved data when table is initialized
    });

    // Force calculation for a specific row
    function forceCalculateRow(row) {
        if (!hasInputValues(row)) {
            return;
        }
        calculateRow(row); // Use the same calculation logic
    }

    // Initialize all calculations
    function initializeAllCalculations() {
        $('#sapTable tbody tr').each(function() {
            const row = $(this);
            const hasValues = ['verkauft', 'schwund', 'rabbatiert'].some(className => 
                parseFloat(row.find('.' + className).val()) > 0
            );
            if (hasValues) {
                forceCalculateRow(row);
            }
        });
        updateStats();
    }

    // Call initialization after table is fully loaded
    var table = $('#sapTable').DataTable();
    table.on('draw.dt', function() {
        initializeAllCalculations();
    });

    // Immediate initialization for first load
    initializeAllCalculations();

    // Add clipboard initialization
    initializeClipboard($('#sapTable'), {
        formatGermanNumber,
        parseGermanNumber,
        forceCalculateRow,
        hasInputValues,
        updateStats,
        saveTableData
    });

    // Add backup functionality
    const backup = initializeBackup($('#sapTable'), { saveTableData });
    
    // Add backup buttons to DataTables buttons
    const buttons = table.buttons();
    buttons.container().prepend(`
        <button class="ui button backup-btn">
            <i class="download icon"></i> Backup
        </button>
        <label class="ui button restore-btn">
            <i class="upload icon"></i> Restore
            <input type="file" accept=".json" style="display: none;">
        </label>
    `);

    // Add button event handlers
    $('.backup-btn').on('click', backup.downloadBackup);
    $('.restore-btn input').on('change', function(e) {
        if (e.target.files.length > 0) {
            if (confirm('This will override all current data. Are you sure?')) {
                backup.restoreBackup(e.target.files[0]);
            }
        }
    });

    // Initialize reports
    const reports = initializeReports($('#sapTable'));
    
    // Add NR Report button to DataTables buttons
    buttons.container().append(`
        <button class="ui teal button nr-report-btn">
            <i class="file alternate outline icon"></i> NR Report
        </button>
    `);

    // Add NR Report button handler
    $('.nr-report-btn').on('click', reports.generateNRReport);

    // Add debounce function at the top of the file
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Modify number input handler to use multiple events and debounce
    $('#sapTable').on('change input blur', '.number-input', debounce(function(e) {
        const input = $(this);
        const currentValue = parseInt(input.val()) || 0;
        
        // Always force a valid number
        input.val(currentValue);
        
        let row = input.closest('tr');
        calculateRow(row);
        saveTableData();
    }, 100));

    function calculateRow(row) {
        // Get and validate all input values
        const inputs = {
            verkauft: parseInt(row.find('.verkauft').val()) || 0,
            schwund: parseInt(row.find('.schwund').val()) || 0,
            rabbatiert: parseInt(row.find('.rabbatiert').val()) || 0
        };

        // Skip if all values are 0
        if (Object.values(inputs).every(v => v === 0)) {
            row.find('.sumVerkauft, .sumRabbatiert, .sumGesamt, .sumProfit').text('0.00 €');
            updateStats();
            return;
        }

        // Get prices (ensure proper parsing)
        const bruttoPrice = parseGermanNumber(row.find('td:nth-child(8)').text());
        const ekPrice = parseGermanNumber(row.find('td:nth-child(5)').text());
        
        // Calculate normal sales
        const sumVerkauft = inputs.verkauft * bruttoPrice;
        
        // Calculate discounted sales
        const discountedPrice = bruttoPrice * 0.5; // 50% off
        const naturalrabattBonus = discountedPrice * 0.25; // 25% of discounted price
        const finalRabbatPrice = discountedPrice + naturalrabattBonus;
        const sumRabbatiert = inputs.rabbatiert * finalRabbatPrice;
        
        // Calculate total revenue
        const sumGesamt = sumVerkauft + sumRabbatiert;
        
        // Calculate costs including lost items (Schwund)
        const lostItemsCost = inputs.schwund * ekPrice;        // Cost of lost items
        const soldItemsCost = (inputs.verkauft + inputs.rabbatiert) * ekPrice;  // Cost of sold items
        const totalCost = soldItemsCost + lostItemsCost;       // Total cost including lost items
        
        // Calculate final profit (revenue minus all costs)
        const sumProfit = sumGesamt - totalCost;

        // Update display with calculated values
        row.find('.sumVerkauft').text(sumVerkauft.toFixed(2) + ' €');
        row.find('.sumRabbatiert').text(sumRabbatiert.toFixed(2) + ' €');
        row.find('.sumGesamt').text(sumGesamt.toFixed(2) + ' €');
        row.find('.sumProfit').text(sumProfit.toFixed(2) + ' €');
        
        updateStats();
    }

    // Modify loadTableData to use the new calculation function
    function loadTableData() {
        try {
            const savedData = localStorage.getItem('tableData');
            if (savedData) {
                const tableData = JSON.parse(savedData);
                console.log('Loading data:', tableData);
                
                table.clear();
                
                tableData.forEach(rowData => {
                    const newRow = $(getNewRowHtml());
                    
                    // Set text values with strict defaults
                    newRow.find('td:nth-child(2)').text(rowData.sap || '0');
                    newRow.find('td:nth-child(3)').text(rowData.article || 'New Article');
                    newRow.find('td:nth-child(4)').text(rowData.stueck || '0');
                    newRow.find('td:nth-child(5)').text(rowData.ek || '0.00');
                    newRow.find('td:nth-child(6)').text(rowData.netto || '0.00');
                    newRow.find('td:nth-child(7)').text(rowData.spanne || '33.00%');
                    newRow.find('td:nth-child(8)').text(rowData.brutto || '0.00');
                    
                    // Set input values with strict numeric conversion
                    ['verkauft', 'schwund', 'rabbatiert'].forEach(field => {
                        const value = parseInt(rowData[field]) || 0;
                        newRow.find(`.${field}`).val(value);
                    });

                    // Set calculated values with defaults
                    newRow.find('.sumVerkauft').text(rowData.sumVerkauft || '0.00 €');
                    newRow.find('.sumRabbatiert').text(rowData.sumRabbatiert || '0.00 €');
                    newRow.find('.sumGesamt').text(rowData.sumGesamt || '0.00 €');
                    newRow.find('.sumProfit').text(rowData.sumProfit || '0.00 €');
                    
                    table.row.add(newRow);
                });
                
                table.draw();
                
                // Recalculate all rows after draw
                table.rows().every(function() {
                    calculateRow($(this.node()));
                });
                
                updateStats();
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }

    // Update initialization sequence
    let isInitialized = false;

    // Update initialization sequence
    $('#sapTable').on('init.dt', function() {
        if (!isInitialized) {
            isInitialized = true;
            setTimeout(() => {
                loadTableData();
                initializeAllCalculations();
                updateStats();
            }, 100);
        }
    });

    // Prevent multiple initialization
    if (!isInitialized) {
        isInitialized = true;
        setTimeout(() => {
            loadTableData();
            initializeAllCalculations();
            updateStats();
        }, 100);
    }

    // Initialize marketing reports
    const marketing = initializeMarketing($('#sapTable'));
    
    // Add Marketing Report button to DataTables buttons
    buttons.container().append(`
        <button class="ui blue button marketing-report-btn">
            <i class="chart bar outline icon"></i> Marketing Report
        </button>
    `);

    // Add Marketing Report button handler
    $('.marketing-report-btn').on('click', marketing.generateMarketingReport);
});