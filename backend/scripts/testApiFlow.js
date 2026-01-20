#!/usr/bin/env node

/**
 * Test API Flow Script
 * 
 * Simulates the exact flow of an API request to debug why pages aren't loading
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
const { schemaAll, getSchema } = require('../utils/schemaHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'ztENGGzFYxSQ4+6EZjfJJVOAhQgUKvQQJWILBCiXRdZBLPyVXqAhqJYBYWvHiXZqYDGHDQHCQQQQQQQQQQ==';

async function testApiFlow() {
    console.log('\n========================================');
    console.log('🔍 Testing API Flow');
    console.log('========================================\n');
    
    try {
        // Step 1: Get user from database
        console.log('Step 1: Fetching user from database...');
        const userResult = await pool.query(
            'SELECT u.*, s.schema_name, s.code FROM public.users u JOIN public.schools s ON u.primary_school_id = s.id WHERE u.email = $1',
            ['admin@school.com']
        );
        
        if (userResult.rows.length === 0) {
            console.log('❌ User not found');
            await pool.end();
            return;
        }
        
        const user = userResult.rows[0];
        console.log('✅ User found:', user.email);
        console.log('   - Role:', user.role);
        console.log('   - School ID:', user.primary_school_id);
        console.log('   - Schema:', user.schema_name);
        
        // Step 2: Generate JWT token (simulating login)
        console.log('\nStep 2: Generating JWT token...');
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            schoolId: user.primary_school_id,
            schoolCode: user.code,
            schemaName: user.schema_name
        }, JWT_SECRET, { expiresIn: '24h' });
        
        console.log('✅ Token generated');
        
        // Step 3: Verify token (simulating authenticateToken middleware)
        console.log('\nStep 3: Verifying token...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified');
        console.log('   - userId:', decoded.userId);
        console.log('   - schemaName:', decoded.schemaName);
        console.log('   - schoolId:', decoded.schoolId);
        
        // Step 4: Simulate request object
        console.log('\nStep 4: Creating mock request object...');
        const mockReq = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                schoolId: decoded.schoolId,
                schemaName: decoded.schemaName,
                primary_school_id: user.primary_school_id
            },
            schemaName: decoded.schemaName,
            schoolId: decoded.schoolId
        };
        
        console.log('✅ Mock request created');
        console.log('   - req.schemaName:', mockReq.schemaName);
        console.log('   - req.schoolId:', mockReq.schoolId);
        console.log('   - req.user.schemaName:', mockReq.user.schemaName);
        
        // Step 5: Test getSchema helper
        console.log('\nStep 5: Testing getSchema helper...');
        const schema = getSchema(mockReq);
        console.log('✅ getSchema returned:', schema);
        
        if (!schema) {
            console.log('❌ ERROR: getSchema returned null!');
            console.log('   This is why the API calls are failing.');
            await pool.end();
            return;
        }
        
        // Step 6: Test incident types query
        console.log('\nStep 6: Testing incident types query...');
        const incidentTypes = await schemaAll(mockReq, 'SELECT * FROM incident_types ORDER BY name');
        console.log('✅ Incident types query successful');
        console.log('   - Count:', incidentTypes.length);
        console.log('   - Sample:', incidentTypes.slice(0, 3).map(t => t.name));
        
        // Step 7: Test merit types query
        console.log('\nStep 7: Testing merit types query...');
        const meritTypes = await schemaAll(mockReq, 'SELECT * FROM merit_types ORDER BY name');
        console.log('✅ Merit types query successful');
        console.log('   - Count:', meritTypes.length);
        console.log('   - Sample:', meritTypes.slice(0, 3).map(t => t.name));
        
        console.log('\n========================================');
        console.log('✅ ALL TESTS PASSED');
        console.log('========================================\n');
        
        console.log('The backend API is working correctly.');
        console.log('The issue must be on the frontend side:');
        console.log('1. Token not being stored in localStorage');
        console.log('2. Token not being sent in Authorization header');
        console.log('3. Browser cache preventing fresh token');
        console.log('4. CORS or network issue\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

testApiFlow();
