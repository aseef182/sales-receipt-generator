'use strict';

// Initialize variables
let logoDataUrl = null;
let updateReceiptTimer;

// Initialize application
function init() {
    addItemRow();
    updateReceipt();
    updateDateTime();
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Static event listeners
    document.getElementById('add-item').addEventListener('click', addItemRow);
    document.getElementById('generate-receipt').addEventListener('click', generateReceipt);
    document.getElementById('print-receipt').addEventListener('click', printReceipt);
    document.getElementById('download-image').addEventListener('click', downloadImage);
    document.getElementById('download-pdf').addEventListener('click', downloadPDF);
    document.getElementById('clear-all').addEventListener('click', clearAll);

    // Store information updates with input validation
    document.getElementById('store-name').addEventListener('input', function () {
        document.getElementById('receipt-store-name').textContent = this.value || 'My Shop';
    });

    document.getElementById('store-address').addEventListener('input', function () {
        document.getElementById('receipt-address').textContent = this.value || '123 Main Street, City';
    });

    document.getElementById('store-phone').addEventListener('input', function () {
        document.getElementById('receipt-phone').textContent = 'Phone: ' + (this.value || '(123) 456-7890');
    });

    // Customer information updates
    document.getElementById('customer-name').addEventListener('input', function () {
        document.getElementById('receipt-customer').textContent = this.value || 'N/A';
        debouncedUpdateReceipt();
    });

    document.getElementById('customer-contact').addEventListener('input', function () {
        const contactContainer = document.getElementById('receipt-customer-contact-container');
        const contactContent = document.getElementById('receipt-customer-contact');

        if (this.value) {
            contactContainer.style.display = 'block';
            contactContent.textContent = this.value;
        } else {
            contactContainer.style.display = 'none';
        }
        debouncedUpdateReceipt();
    });

    // Logo upload with improved validation
    document.getElementById('store-logo').addEventListener('change', handleLogoUpload);

    // Payment details updates with numeric validation
    document.getElementById('discount').addEventListener('input', function () {
        // Ensure discount is not negative
        if (parseFloat(this.value) < 0) {
            this.value = 0;
        }
        debouncedUpdateReceipt();
    });

    document.getElementById('receipt-notes').addEventListener('input', function () {
        const notesSection = document.getElementById('receipt-notes-section');
        const notesContent = document.getElementById('receipt-notes-content');

        if (this.value) {
            notesSection.style.display = 'block';
            notesContent.textContent = this.value;
        } else {
            notesSection.style.display = 'none';
        }
        debouncedUpdateReceipt();
    });

    // Input delegation for dynamic elements
    document.addEventListener('input', function(e) {
        if (e.target.matches('.item-name-input, .item-qty-input, .item-price-input')) {
            debouncedUpdateReceipt();
        }
    });
    
    // Click delegation for remove buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-item')) {
            const row = e.target.closest('.item-row');
            if (document.querySelectorAll('.item-row').length > 1) {
                row.remove();
                updateReceipt();
            } else {
                showAlert('You must have at least one item.', 'danger');
            }
        }
    });

    // Update date/time every minute
    setInterval(updateDateTime, 60000);
}

// Function to debounce the updateReceipt function for better performance
function debouncedUpdateReceipt() {
    clearTimeout(updateReceiptTimer);
    updateReceiptTimer = setTimeout(updateReceipt, 300);
}

// Function to handle logo upload with improved validation
function handleLogoUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Logo file is too large. Please use an image under 5MB.', 'danger');
        e.target.value = ''; // Clear the file input
        return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
        showAlert('Please select an image file.', 'danger');
        e.target.value = ''; // Clear the file input
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        logoDataUrl = event.target.result;

        // Create a new image to check dimensions
        const img = new Image();
        img.onload = function () {
            // Check if image is too large (optional)
            if (img.width > 2000 || img.height > 2000) {
                showAlert('Image dimensions are very large. This may affect performance.', 'warning');
            }

            document.getElementById('logo-preview').src = logoDataUrl;
            document.getElementById('logo-preview').style.display = 'block';
            document.getElementById('receipt-logo').src = logoDataUrl;
            document.getElementById('receipt-logo').style.display = 'block';
            updateReceipt();
        };

        img.onerror = function () {
            showAlert('Error loading the image. Please try another file.', 'danger');
            e.target.value = ''; // Clear the file input
        };

        img.src = logoDataUrl;
    };

    reader.onerror = function () {
        showAlert('Error reading the image file.', 'danger');
        e.target.value = ''; // Clear the file input
    };

    reader.readAsDataURL(file);
}

// Function to update the receipt preview with improved performance
function updateReceipt() {
    // Update items and calculations
    const itemRows = document.querySelectorAll('.item-row');
    const itemsBody = document.getElementById('receipt-items-body');

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();

    let subtotal = 0;

    itemRows.forEach(function (row) {
        const nameInput = row.querySelector('.item-name-input');
        const qtyInput = row.querySelector('.item-qty-input');
        const priceInput = row.querySelector('.item-price-input');

        const name = nameInput.value || 'Item';
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const itemTotal = qty * price;

        if (qty > 0 && price > 0) {
            subtotal += itemTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${name}</td>
            <td>${qty}</td>
            <td>₨${price.toFixed(2)}</td>
            <td>₨${itemTotal.toFixed(2)}</td>
        `;
            fragment.appendChild(tr);
        }
    });

    // Clear and append all rows at once (better performance)
    itemsBody.innerHTML = '';
    itemsBody.appendChild(fragment);

    // Update discount and total
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);

    // Show/hide discount row
    const discountRow = document.getElementById('discount-row');
    if (discount > 0) {
        document.getElementById('receipt-discount').textContent = discount.toFixed(2);
        discountRow.style.display = 'flex';
    } else {
        discountRow.style.display = 'none';
    }
}

// Function to update the date and time
function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeString = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('receipt-date').textContent = `Date: ${dateString} ${timeString}`;
}

// Function to add a new item row with improved structure and accessibility
function addItemRow() {
    const itemList = document.getElementById('item-list');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';

    // Add proper ARIA attributes
    newRow.setAttribute('role', 'group');
    newRow.setAttribute('aria-label', 'Item entry');

    const timestamp = Date.now();
    newRow.innerHTML = `
    <div class="form-group item-name">
        <label for="item-name-${timestamp}">Item Name</label>
        <input type="text" id="item-name-${timestamp}" class="item-name-input" placeholder="Enter item name">
    </div>
    <div class="form-group item-qty">
        <label for="item-qty-${timestamp}">Quantity</label>
        <input type="number" id="item-qty-${timestamp}" class="item-qty-input" placeholder="0" min="1" value="1">
    </div>
    <div class="form-group item-price">
        <label for="item-price-${timestamp}">Price (₨)</label>
        <input type="number" id="item-price-${timestamp}" class="item-price-input" placeholder="0.00" min="0" step="0.01">
    </div>
    <button type="button" class="remove-item btn-danger" aria-label="Remove item" tabindex="0"><i class="fas fa-times"></i></button>
`;

    itemList.appendChild(newRow);

    // Add keyboard support for remove button
    const removeButton = newRow.querySelector('.remove-item');
    removeButton.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
}

// Function to generate a receipt image with better error handling
function generateReceipt() {
    if (!validateForm()) return;

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';

    // Set a timeout to catch hangs
    const timeoutId = setTimeout(() => {
        loadingOverlay.style.display = 'none';
        showAlert('Image generation is taking too long. Try using a smaller logo or fewer items.', 'warning');
    }, 10000); // 10 second timeout

    const receipt = document.getElementById('receipt');

    // Use html2canvas to create an image
    html2canvas(receipt, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false
    }).then(function (canvas) {
        clearTimeout(timeoutId); // Clear the timeout
        const imgData = canvas.toDataURL('image/png');
        const img = document.getElementById('generated-image');
        img.src = imgData;
        img.style.display = 'block';

        // Show download buttons
        document.getElementById('download-buttons').style.display = 'flex';

        loadingOverlay.style.display = 'none';
        showAlert('Receipt image generated successfully!', 'success');
    }).catch(function (error) {
        clearTimeout(timeoutId); // Clear the timeout
        console.error('Error generating receipt:', error);
        loadingOverlay.style.display = 'none';

        // More detailed error message based on error type
        if (error.message && error.message.includes('tainted')) {
            showAlert('Error: Unable to process the logo image. Try using a different image format.', 'danger');
        } else {
            showAlert('Error generating receipt image. Please try again or use the print option instead.', 'danger');
        }
    });
}

// Function to print the receipt directly
function printReceipt() {
    if (!validateForm()) return;
    window.print();
}

// Function to download the generated image
function downloadImage() {
    const img = document.getElementById('generated-image');
    if (!img.src || img.src === window.location.href) {
        showAlert('Please generate a receipt image first.', 'danger');
        return;
    }

    try {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `receipt-${formatDate(new Date())}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading image:', error);
        showAlert('Error downloading image. Please try again.', 'danger');
    }
}

// Function to download PDF version of the receipt with improved jsPDF check
function downloadPDF() {
    const img = document.getElementById('generated-image');
    if (!img.src || img.src === window.location.href) {
        showAlert('Please generate a receipt image first.', 'danger');
        return;
    }

    try {
        // Check if jsPDF is available - improved check
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            showAlert('PDF generation requires jsPDF library which is missing.', 'warning');
            downloadImage(); // Fallback to image
            return;
        }

        // Get the correct constructor
        const PDF = typeof jsPDF !== 'undefined' ? jsPDF : jspdf;
        const pdf = new PDF();

        const imgProps = pdf.getImageProperties(img.src);
        const width = pdf.internal.pageSize.getWidth();
        const height = (imgProps.height * width) / imgProps.width;

        pdf.addImage(img.src, 'PNG', 0, 0, width, height);
        pdf.save(`receipt-${formatDate(new Date())}.pdf`);
    } catch (error) {
        console.error('Error creating PDF:', error);
        showAlert('Error creating PDF. Downloading as image instead.', 'warning');
        downloadImage();
    }
}

// Function to format date for filenames
function formatDate(date) {
    return date.toISOString()
        .replace(/T/, '-')
        .replace(/\..+/, '')
        .replace(/:/g, '');
}

// Function to validate the form with improved validation showing all errors
function validateForm() {
    const storeName = document.getElementById('store-name').value.trim();
    const itemRows = document.querySelectorAll('.item-row');
    let issues = [];

    if (!storeName) {
        issues.push('Please enter a business name.');
    }

    let validItemCount = 0;
    itemRows.forEach(function (row, index) {
        const nameInput = row.querySelector('.item-name-input');
        const qtyInput = row.querySelector('.item-qty-input');
        const priceInput = row.querySelector('.item-price-input');

        const name = nameInput.value.trim();
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);

        if (name && !isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
            validItemCount++;
        } else if (name || (!isNaN(qty) && qty > 0) || (!isNaN(price) && price > 0)) {
            // If at least one field is filled, highlight what's missing
            if (!name) nameInput.classList.add('input-error');
            if (isNaN(qty) || qty <= 0) qtyInput.classList.add('input-error');
            if (isNaN(price) || price <= 0) priceInput.classList.add('input-error');

            issues.push(`Item #${index + 1} has incomplete information.`);
        }

        // Remove error class on focus
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function () {
                this.classList.remove('input-error');
            }, { once: true });
        });
    });

    if (validItemCount === 0) {
        issues.push('Please add at least one valid item with name, quantity, and price.');
    }

    if (issues.length > 0) {
        // Show all issues instead of just the first one
        showAlert(`Please fix the following issues: <ul>${issues.map(issue => `<li>${issue}</li>`).join('')}</ul>`, 'danger');
        return false;
    }

    return true;
}

// Function to show alerts with improved styling and HTML support
function showAlert(message, type) {
    const alertElement = document.getElementById('alert');
    alertElement.innerHTML = message; // Use innerHTML instead of textContent
    alertElement.className = 'alert alert-' + type;
    alertElement.style.display = 'block';

    // Add a close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'alert-close';
    closeBtn.onclick = function () {
        alertElement.style.display = 'none';
    };
    alertElement.appendChild(closeBtn);

    // Auto-hide after 5 seconds
    setTimeout(function () {
        if (alertElement.style.display !== 'none') {
            alertElement.style.display = 'none';
        }
    }, 5000);
}

// Function to clear all form data with confirmation
function clearAll() {
    if (confirm('Are you sure you want to clear all data?')) {
        // Reset store info to default values
        document.getElementById('store-name').value = 'My Shop';
        document.getElementById('store-address').value = '123 Main Street, City';
        document.getElementById('store-phone').value = '(123) 456-7890';

        // Update receipt text
        document.getElementById('receipt-store-name').textContent = 'My Shop';
        document.getElementById('receipt-address').textContent = '123 Main Street, City';
        document.getElementById('receipt-phone').textContent = 'Phone: (123) 456-7890';

        // Clear logo
        document.getElementById('store-logo').value = '';
        document.getElementById('logo-preview').style.display = 'none';
        document.getElementById('receipt-logo').style.display = 'none';
        logoDataUrl = null;

        // Clear customer info
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-contact').value = '';
        document.getElementById('receipt-customer').textContent = 'N/A';
        document.getElementById('receipt-customer-contact-container').style.display = 'none';

        // Clear items
        document.getElementById('item-list').innerHTML = '';
        addItemRow();

        // Clear payment details
        document.getElementById('discount').value = '0';
        document.getElementById('receipt-notes').value = '';
        document.getElementById('receipt-notes-section').style.display = 'none';

        // Clear generated image
        document.getElementById('generated-image').src = '';
        document.getElementById('generated-image').style.display = 'none';
        document.getElementById('download-buttons').style.display = 'none';

        // Remove any error styling
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });

        // Update receipt
        updateReceipt();
        updateDateTime();

        showAlert('All data has been cleared.', 'success');
    }
}

// Initialize the application
init();