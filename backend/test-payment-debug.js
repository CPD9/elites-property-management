const express = require('express');
require('dotenv').config();

console.log('🧪 Testing Paystack Integration...');

// Test 1: Check environment variables
console.log('\n📋 Environment Variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
console.log('PAYSTACK_SECRET_KEY:', process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.substring(0, 15) + '...' : 'MISSING');
console.log('PAYSTACK_PUBLIC_KEY:', process.env.PAYSTACK_PUBLIC_KEY ? process.env.PAYSTACK_PUBLIC_KEY.substring(0, 15) + '...' : 'MISSING');

// Test 2: Test Paystack SDK initialization
try {
    const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
    console.log('\n✅ Paystack SDK initialized successfully');
    
    // Test 3: Simple transaction initialization test
    const testTransaction = async () => {
        try {
            console.log('\n🔧 Testing Paystack transaction initialization...');
            const response = await Paystack.transaction.initialize({
                email: 'test@example.com',
                amount: 10000, // ₦100 in kobo
                reference: 'TEST_' + Date.now()
            });
            
            console.log('✅ Paystack test transaction successful!');
            console.log('Response status:', response.status);
            console.log('Authorization URL exists:', !!response.data.authorization_url);
            
        } catch (error) {
            console.log('❌ Paystack test transaction failed:');
            console.log('Error type:', error.constructor.name);
            console.log('Error message:', error.message);
            
            if (error.response) {
                console.log('HTTP status:', error.response.status);
                console.log('Response data:', error.response.data);
            }
        }
    };
    
    testTransaction();
    
} catch (error) {
    console.log('\n❌ Paystack SDK initialization failed:');
    console.log('Error:', error.message);
}

// Test 4: Database connection test
try {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const db = new sqlite3.Database(path.join(__dirname, 'tenant_management.db'));
    
    console.log('\n🗄️ Testing database connection...');
    
    // Test if payment_transactions table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='payment_transactions'", (err, row) => {
        if (err) {
            console.log('❌ Database error:', err.message);
        } else if (row) {
            console.log('✅ payment_transactions table exists');
            
            // Test table structure
            db.all("PRAGMA table_info(payment_transactions)", (err, columns) => {
                if (!err) {
                    console.log('📋 Table columns:', columns.map(c => c.name).join(', '));
                }
                db.close();
            });
        } else {
            console.log('❌ payment_transactions table does not exist');
            db.close();
        }
    });
    
} catch (error) {
    console.log('\n❌ Database connection failed:', error.message);
}

console.log('\n🏁 Test completed. Check the output above for any issues.');