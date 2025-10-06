/**
 * GroupExpenseTrackingAIAugmented Test Cases
 *
 * Demonstrates group creation, adding/removing users, adding expenses manually,
 * and AI-assisted expense suggestions using Gemini LLM.
 */

import { GroupExpenseTrackingAIAugmented, Group, User, GroupExpense, GeminiLLM, Config } from './groupexpense';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 1: Create a group and add users
 */
export async function testGroupCreationAndUserManagement(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Group Creation and User Management');
    console.log('===================================================');

    const system = new GroupExpenseTrackingAIAugmented();

    // Users
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };
    const charlie: User = { username: 'Charlie' };

    // Create group
    console.log("Alice creates a group called Trip Planning")
    const group: Group = system.createGroup('Trip Planning', alice);

    // Add users
    console.log("Alice adds Bob and Charlie to the group")
    system.addUser(alice, bob, group);
    system.addUser(alice, charlie, group);

    console.log(`Group "${group.name}" members: ${group.users.map(u => u.username).join(', ')}`);

    // Remove a user
    console.log("Alice removes Charlie from the group")
    system.removeUser(alice, charlie, group);
    console.log(`After removing Charlie, members: ${group.users.map(u => u.username).join(', ')}`);

    // Leave a group
    console.log("bob leaves the group")
    system.leaveGroup(group,bob)
    console.log(`After bob leaves: ${group.users.map(u => u.username).join(', ')}`);


}

/**
 * Test case 2: Add manual expenses and validate debt mappings
 */
export async function testManualExpenses(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: Manual Expenses');
    console.log('================================');


    const system = new GroupExpenseTrackingAIAugmented();
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };

    console.log("Alice creates a group called Dinner Night and adds Bob")
    const group = system.createGroup('Dinner Night', alice);
    system.addUser(alice, bob, group);

    // Manual expense
    const debtMapping = new Map<User, number>([
        [alice, 20],
        [bob, 10]
    ]);

    console.log("Alice adds a $30 expense to Dinner Night called Pizza Dinner where Alice split is $20 and Bob's split is $10")

    const expense: GroupExpense = system.addGroupExpense(
        alice,
        group,
        'Pizza Dinner',
        'Ordered pizza for everyone',
        'Food',
        30,
        new Date(),
        debtMapping
    );



console.log(
  `Added expense "${expense.title}" with total cost ${expense.totalCost}.\n` +
  `Alice's split: ${expense.debtMapping.get(alice)}\n` +
  `Bob's split: ${expense.debtMapping.get(bob)}\n` +
  `Category: ${expense.category}\n` +
  `Date: ${expense.date}\n` +
  `Number of Expenses in Group: ${(group.expenses).length}\n`
);
}


/**
 * Test case 3: AI-assisted expense suggestion
 */
export async function testAISuggestExpense(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: AI-Assisted Expense Suggestion');
    console.log('==============================================');

    const system = new GroupExpenseTrackingAIAugmented();
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };
    const charlie: User = { username: 'Charlie' };

    const group = system.createGroup('Weekend Trip', alice);
    system.addUser(alice, bob, group);
    system.addUser(alice, charlie, group);

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const prompt = "Yesterday's grocery shopping trip cost $250. I bought eggs, tomatoes, and pasta";

    console.log(`Alice uses the AI quick fill tool and gives the prompt: '${prompt}'`)
    const expense = await system.suggestExpenseWithAI(alice, group, prompt, new Date(), llm);

    console.log('\n🤖 AI Suggested Expense Details:');
    console.log('---------------------------------');
    console.log(`💰 Title:       ${expense.title}`);
    console.log(`📂 Category:    ${expense.category}`);
    console.log(`Payer: ${expense.payer}`)
    console.log(`💵 Total Cost:  $${expense.totalCost.toFixed(2)}`);
    console.log(`🗓 Date:        ${expense.date.toLocaleString()}`);
    console.log(`📝 Description: ${expense.description}`);
    console.log(`👥 Group:       ${group.name}`);
    console.log('💸 Cost Splits:');

    expense.debtMapping.forEach((amount, user) => {
        console.log(`   - ${user.username}: $${amount.toFixed(2)}`);
    });


}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 GroupExpenseTrackingAIAugmented Test Suite');
    console.log('==============================================\n');

    try {
        await testGroupCreationAndUserManagement();
        await testManualExpenses();
        await testAISuggestExpense();

        console.log('\n🎉 All test cases completed successfully!');
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
