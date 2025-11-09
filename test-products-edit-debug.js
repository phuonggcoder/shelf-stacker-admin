/**
 * DEBUG SCRIPT FOR PRODUCTS EDIT MODAL
 * Copy and paste into Browser Console to test
 */

console.log('🔍 DEBUG: Products Edit Modal Test\n');
console.log('=' .repeat(60));

// Test 1: Check if functions exist
console.log('\n📋 Test 1: Check Functions');
console.log('-'.repeat(60));
console.log('editBook:', typeof window.editBook);
console.log('showEditBookModal:', typeof showEditBookModal);
console.log('AdminServices:', typeof window.AdminServices);
console.log('AdminServices.getBook:', typeof window.AdminServices?.getBook);
console.log('AdminServices.updateBook:', typeof window.AdminServices?.updateBook);
console.log('AdminUIComponents:', typeof AdminUIComponents);
console.log('AdminUIComponents.createModal:', typeof AdminUIComponents?.createModal);

// Test 2: Get first product ID
console.log('\n📋 Test 2: Get First Product');
console.log('-'.repeat(60));
try {
    const productsTable = document.querySelector('#products-table tbody');
    if (productsTable) {
        const firstRow = productsTable.querySelector('tr');
        if (firstRow) {
            const editBtn = firstRow.querySelector('button[onclick*="editBook"]');
            if (editBtn) {
                const onclickAttr = editBtn.getAttribute('onclick');
                const bookIdMatch = onclickAttr.match(/editBook\('([^']+)'\)/);
                if (bookIdMatch) {
                    const testBookId = bookIdMatch[1];
                    console.log('✅ Found first product ID:', testBookId);
                    console.log('💡 You can test with: editBook("' + testBookId + '")');
                    
                    // Test 3: Try to load book data
                    console.log('\n📋 Test 3: Load Book Data');
                    console.log('-'.repeat(60));
                    window.AdminServices.getBook(testBookId)
                        .then(book => {
                            console.log('✅ Book data loaded:', {
                                id: book._id,
                                title: book.title,
                                stock: book.stock,
                                price: book.price
                            });
                            
                            // Test 4: Try to open modal
                            console.log('\n📋 Test 4: Open Edit Modal');
                            console.log('-'.repeat(60));
                            try {
                                editBook(testBookId);
                                setTimeout(() => {
                                    const modal = document.querySelector('.admin-modal-overlay');
                                    const form = modal?.querySelector('form');
                                    const saveBtn = modal?.querySelector('.admin-modal-footer .btn-primary');
                                    
                                    console.log('Modal opened:', !!modal);
                                    console.log('Form found:', !!form);
                                    console.log('Save button found:', !!saveBtn);
                                    
                                    if (modal && form && saveBtn) {
                                        console.log('✅ Modal structure is correct!');
                                        
                                        // Test 5: Check button handlers
                                        console.log('\n📋 Test 5: Check Button Handlers');
                                        console.log('-'.repeat(60));
                                        console.log('Save button onclick:', saveBtn.getAttribute('onclick'));
                                        console.log('Save button type:', saveBtn.getAttribute('type'));
                                        console.log('Save button disabled:', saveBtn.disabled);
                                        
                                        // Check if form has submit handler
                                        const formHasSubmitHandler = form.onsubmit !== null;
                                        console.log('Form onsubmit:', form.onsubmit);
                                        
                                        // Try to find event listeners (if possible)
                                        console.log('\n💡 Manual Test:');
                                        console.log('1. Change stock value in form');
                                        console.log('2. Click "Lưu" button');
                                        console.log('3. Watch console for logs');
                                        
                                        // Add test listener
                                        saveBtn.addEventListener('click', function(e) {
                                            console.log('🔔 Save button clicked!', e);
                                        }, { once: true });
                                        
                                        form.addEventListener('submit', function(e) {
                                            console.log('🔔 Form submit triggered!', e);
                                        }, { once: true });
                                        
                                    } else {
                                        console.error('❌ Modal structure incomplete!');
                                        if (!modal) console.error('  - Modal not found');
                                        if (!form) console.error('  - Form not found');
                                        if (!saveBtn) console.error('  - Save button not found');
                                    }
                                }, 1000);
                            } catch (error) {
                                console.error('❌ Error opening modal:', error);
                                console.error(error.stack);
                            }
                        })
                        .catch(error => {
                            console.error('❌ Error loading book:', error);
                            console.error('Error message:', error.message);
                        });
                } else {
                    console.warn('⚠️  Could not extract book ID from onclick');
                }
            } else {
                console.warn('⚠️  Edit button not found in first row');
            }
        } else {
            console.warn('⚠️  No rows found in products table');
        }
    } else {
        console.warn('⚠️  Products table not found');
    }
} catch (error) {
    console.error('❌ Error in test:', error);
}

// Helper function to test edit directly
window.testEditBook = function(bookId) {
    console.log('🧪 Testing editBook with ID:', bookId);
    try {
        editBook(bookId);
        console.log('✅ editBook called successfully');
        
        setTimeout(() => {
            const modal = document.querySelector('.admin-modal-overlay');
            console.log('Modal exists:', !!modal);
            
            if (modal) {
                const form = modal.querySelector('form');
                const saveBtn = modal.querySelector('.admin-modal-footer .btn-primary');
                console.log('Form:', !!form);
                console.log('Save button:', !!saveBtn);
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    }
};

console.log('\n' + '=' .repeat(60));
console.log('💡 USAGE:');
console.log('  1. Wait for tests to complete');
console.log('  2. Or manually test: testEditBook("BOOK_ID")');
console.log('  3. Check console for any errors');
console.log('=' .repeat(60));

