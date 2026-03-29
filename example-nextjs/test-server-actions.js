#!/usr/bin/env node

/**
 * Server Actions Test Script for NodeSH
 * 
 * This script demonstrates how to use Server Actions from the NodeSH console.
 * 
 * Usage:
 *   1. Start NodeSH: npx nodesh
 *   2. Run: .server-actions
 *   OR
 *   Run directly: node test-server-actions.js
 */

const { NextJSLoader } = require('@eftech93/nodesh');

async function testServerActions() {
  console.log('🧪 Testing Next.js Server Actions\n');
  console.log('=' .repeat(50));

  const loader = new NextJSLoader({
    rootPath: __dirname,
  });

  // Load server actions
  await loader.loadServerActions();

  console.log('\n📋 Available Server Actions:');
  console.log('-'.repeat(50));
  
  const actions = Object.keys(loader.context).filter(k => 
    k.endsWith('Action') && typeof loader.context[k] === 'function'
  );
  
  actions.forEach(action => {
    console.log(`  • ${action}()`);
  });

  console.log('\n🚀 Running Server Action Tests...\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get all users
    console.log('\n1️⃣  Testing: userGetUsersAction()');
    console.log('-'.repeat(50));
    const users = await loader.context.userGetUsersAction();
    console.log('   Result:', JSON.stringify(users, null, 2));

    // Test 2: Get a specific user
    console.log('\n2️⃣  Testing: userGetUserByIdAction("1")');
    console.log('-'.repeat(50));
    const user = await loader.context.userGetUserByIdAction('1');
    console.log('   Result:', JSON.stringify(user, null, 2));

    // Test 3: Create a new user
    console.log('\n3️⃣  Testing: userCreateUserAction()');
    console.log('-'.repeat(50));
    const newUser = await loader.context.userCreateUserAction({
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    });
    console.log('   Created:', JSON.stringify(newUser, null, 2));

    // Test 4: Search users
    console.log('\n4️⃣  Testing: userSearchUsersAction("john")');
    console.log('-'.repeat(50));
    const searchResults = await loader.context.userSearchUsersAction('john');
    console.log('   Found:', JSON.stringify(searchResults, null, 2));

    // Test 5: Create an order
    console.log('\n5️⃣  Testing: orderCreateOrderAction()');
    console.log('-'.repeat(50));
    const newOrder = await loader.context.orderCreateOrderAction({
      userId: '1',
      items: [
        { productId: 'P1', name: 'Widget', quantity: 2, price: 29.99 },
        { productId: 'P2', name: 'Gadget', quantity: 1, price: 49.99 }
      ],
      status: 'pending'
    });
    console.log('   Created:', JSON.stringify(newOrder, null, 2));

    // Test 6: Get orders
    console.log('\n6️⃣  Testing: orderGetOrdersAction()');
    console.log('-'.repeat(50));
    const orders = await loader.context.orderGetOrdersAction();
    console.log('   Result:', JSON.stringify(orders, null, 2));

    // Test 7: Get order statistics
    console.log('\n7️⃣  Testing: orderGetOrderStatsAction()');
    console.log('-'.repeat(50));
    const stats = await loader.context.orderGetOrderStatsAction();
    console.log('   Statistics:', JSON.stringify(stats, null, 2));

    // Test 8: Update order status
    if (newOrder && newOrder.id) {
      console.log(`\n8️⃣  Testing: orderUpdateOrderStatusAction("${newOrder.id}", "processing")`);
      console.log('-'.repeat(50));
      const updated = await loader.context.orderUpdateOrderStatusAction(
        newOrder.id, 
        'processing'
      );
      console.log('   Updated:', JSON.stringify(updated, null, 2));
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All Server Action tests completed!');
    console.log('='.repeat(50) + '\n');

    // Print summary for console usage
    console.log('📖 How to use in NodeSH Console:\n');
    console.log('  1. Start NodeSH:');
    console.log('     $ npx nodesh\n');
    console.log('  2. Call server actions directly:');
    console.log('     > await userGetUsersAction()');
    console.log('     > await userCreateUserAction({ name: "Alice", email: "alice@example.com" })');
    console.log('     > await orderCreateOrderAction({ userId: "1", items: [...], status: "pending" })');
    console.log('     > await orderGetOrderStatsAction()\n');
    console.log('  3. See all available actions:');
    console.log('     > .help\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testServerActions();
}

module.exports = { testServerActions };
