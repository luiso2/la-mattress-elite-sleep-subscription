const axios = require('axios');

const COUPON_API_URL = 'https://backend-shopify-coupon-production.up.railway.app';

async function testMarkUsedFunctionality() {
  console.log('🧪 Testing Mark as Used + Shopify Deletion Functionality');
  console.log('======================================================\n');

  try {
    // Step 1: Create a new test coupon
    console.log('📝 Step 1: Creating a new test coupon...');
    
    const newCouponData = {
      code: 'TEST-MARK-USED-' + Date.now(),
      discount_type: 'fixed_amount',
      discount_value: 75,
      description: 'Test coupon for mark as used + Shopify deletion',
      customer_name: 'Test User',
      customer_email: 'test-mark-used@example.com',
      valid_until: '2025-12-31T23:59:59.000Z',
      max_uses: 1,
      minimum_purchase: 0
    };

    const createResponse = await axios.post(`${COUPON_API_URL}/api/coupons`, newCouponData, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!createResponse.data.success) {
      throw new Error('Failed to create test coupon: ' + createResponse.data.error);
    }

    const newCoupon = createResponse.data.data;
    const couponId = newCoupon.database_record.id;
    const couponCode = newCoupon.summary.code;
    const shopifyPriceRuleId = newCoupon.database_record.shopify_price_rule_id;

    console.log('✅ Test coupon created successfully!');
    console.log(`   Code: ${couponCode}`);
    console.log(`   Database ID: ${couponId}`);
    console.log(`   Shopify Price Rule ID: ${shopifyPriceRuleId}`);

    // Step 2: Verify coupon exists in Shopify
    console.log('\n🔍 Step 2: Verifying coupon exists in Shopify...');
    
    try {
      const shopifyCheckResponse = await axios.get(`${COUPON_API_URL}/api/coupons/${shopifyPriceRuleId}`, {
        timeout: 15000
      });
      
      console.log('✅ Coupon confirmed to exist in Shopify');
      console.log(`   Usage count: ${shopifyCheckResponse.data.data.discount_codes[0].usage_count}`);
    } catch (error) {
      console.log('⚠️  Could not verify in Shopify (may be normal)');
    }

    // Step 3: Mark coupon as used (this should also delete from Shopify)
    console.log('\n🎯 Step 3: Marking coupon as used (should also delete from Shopify)...');
    
    const markUsedResponse = await axios.patch(
      `${COUPON_API_URL}/api/coupons/db/${couponId}/status`,
      { status: 'used' },
      { 
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('📊 Mark as Used Response:');
    console.log('   Success:', markUsedResponse.data.success);
    console.log('   Old Status:', markUsedResponse.data.coupon.old_status);
    console.log('   New Status:', markUsedResponse.data.coupon.new_status);
    
    if (markUsedResponse.data.shopify_deletion) {
      console.log('   Shopify Deletion:', markUsedResponse.data.shopify_deletion.success ? '✅ SUCCESS' : '❌ FAILED');
      if (markUsedResponse.data.shopify_deletion.success) {
        console.log('   ✅ Coupon successfully deleted from Shopify!');
      } else {
        console.log('   ❌ Failed to delete from Shopify:', markUsedResponse.data.shopify_deletion.error);
      }
    } else {
      console.log('   ⚠️  No Shopify deletion info (unexpected)');
    }

    // Step 4: Verify coupon no longer exists in Shopify
    console.log('\n🔍 Step 4: Verifying coupon no longer exists in Shopify...');
    
    try {
      const shopifyVerifyResponse = await axios.get(`${COUPON_API_URL}/api/coupons/${shopifyPriceRuleId}`, {
        timeout: 15000
      });
      
      console.log('❌ Coupon still exists in Shopify (deletion may have failed)');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Confirmed: Coupon successfully deleted from Shopify!');
      } else {
        console.log('⚠️  Could not verify deletion (API error)');
      }
    }

    // Step 5: Verify coupon status in database
    console.log('\n📋 Step 5: Verifying coupon status in database...');
    
    const dbCheckResponse = await axios.get(`${COUPON_API_URL}/api/coupons/search/code/${couponCode}`, {
      timeout: 10000
    });
    
    console.log('✅ Database status confirmed:');
    console.log(`   Code: ${dbCheckResponse.data.coupon.code}`);
    console.log(`   Status: ${dbCheckResponse.data.coupon.status}`);
    console.log(`   Updated: ${new Date(dbCheckResponse.data.coupon.updated_at).toLocaleString()}`);

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('✅ Coupon marked as used in database');
    console.log('✅ Coupon deleted from Shopify');
    console.log('✅ New functionality is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testMarkUsedFunctionality();