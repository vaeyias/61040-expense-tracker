/**
 * GroupExpenseTrackingAIAugmented AI Test Cases
 *
 * Demonstrates AI-assisted expense suggestions for a group.
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
 * Test case: AI-assisted expenses for "Vacation 2025"
 */
export async function testAIVacationExpenses(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: Naming Members not in Group');
    console.log('============================================');

    const system = new GroupExpenseTrackingAIAugmented();
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };
    const charlie: User = { username: 'Charlie' };

    // Create group and add users
    const group: Group = system.createGroup('Vacation 2025', alice);
    system.addUser(alice, bob, group);
    system.addUser(alice, charlie, group);


    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Expense 1
    const prompt = "I bought a red shirt for Dave for $25 and I bought a baseball for myself it was $50";
    console.log(`\n✏️   Alice adds an AI expense: "${prompt}"`);
    const expense = await system.suggestExpenseWithAI(alice, group, prompt, new Date(), llm);
    console.log('\n🤖 AI Suggested Expense Details:');
    console.log('---------------------------------');
    console.log(`💰 Title:       ${expense.title}`);
    console.log(`📂 Category:    ${expense.category}`);
    console.log(`💰 Payer:       ${expense.payer.username}`);

    console.log(`💵 Total Cost:  $${expense.totalCost.toFixed(2)}`);
    console.log(`🗓 Date:         ${expense.date.toLocaleString()}`);
    console.log(`📝 Description: ${expense.description}`);
    console.log(`👥 Group:       ${group.name}`);
    console.log('💸 Cost Splits:');

    expense.debtMapping.forEach((amount, user) => {
        console.log(`   - ${user.username}: $${amount.toFixed(2)}`);
    });
}
export async function testMath(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Testing LLM Math');
    console.log('============================================');

    const system = new GroupExpenseTrackingAIAugmented();
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };
    const charlie: User = { username: 'Charlie' };
    const dave: User = { username: 'Dave' };


    // Create group and add users
    const group: Group = system.createGroup('Fall 2025', alice);
    system.addUser(alice, bob, group);
    system.addUser(alice, charlie, group);
    system.addUser(bob,dave,group);

    system.removeUser(alice,dave,group)

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Expense
    const prompt = "Last night, we had a dinner that cost $50, 15% tip. Bob fronted the cost.";
    console.log(`\n✏️   Alice adds an AI expense: "${prompt}"`);
    const expense = await system.suggestExpenseWithAI(alice, group, prompt, new Date(), llm);
    console.log('\n🤖 AI Suggested Expense Details:');
    console.log('---------------------------------');
    console.log(`💰 Title:       ${expense.title}`);
    console.log(`📂 Category:    ${expense.category}`);
    console.log(`💰 Payer:       ${expense.payer.username}`);
    console.log(`💵 Total Cost:  $${expense.totalCost.toFixed(2)}`);
    console.log(`🗓 Date:         ${expense.date.toLocaleString()}`);
    console.log(`📝 Description: ${expense.description}`);
    console.log(`👥 Group:       ${group.name}`);
    console.log('💸 Cost Splits:');

    expense.debtMapping.forEach((amount, user) => {
        console.log(`   - ${user.username}: $${amount.toFixed(2)}`);
    });

}

export async function testRounding(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Testing Unequal Splits and Rounding');
    console.log('============================================');

    const system = new GroupExpenseTrackingAIAugmented();
    const alice: User = { username: 'Alice' };
    const bob: User = { username: 'Bob' };
    const charlie: User = { username: 'Charlie' };

    const group: Group = system.createGroup('Bday Party', alice);
    system.addUser(alice, bob, group);
    system.addUser(alice, charlie, group);

    system.leaveGroup(group,bob)

    system.addUser(charlie,bob,group)

    const config = loadConfig();
    const llm = new GeminiLLM(config);


    const prompt = "Last week, I bought Alice a $5.23745692873 cake. I paid for a $30 game for me and Charlie";
    console.log(`\n✏️   Bob adds an AI expense: "${prompt}"`);
    const expense = await system.suggestExpenseWithAI(bob, group, prompt, new Date(), llm);
    console.log('\n🤖 AI Suggested Expense Details:');
    console.log('---------------------------------');
    console.log(`💰 Title:       ${expense.title}`);
    console.log(`📂 Category:    ${expense.category}`);
    console.log(`💰Payer: ${expense.payer.username}`)
    console.log(`💵 Total Cost:  $${expense.totalCost.toFixed(2)}`);
    console.log(`🗓 Date:         ${expense.date.toLocaleString()}`);
    console.log(`📝 Description: ${expense.description}`);
    console.log(`👥 Group:       ${group.name}`);
    console.log('💸 Cost Splits:');

    expense.debtMapping.forEach((amount, user) => {
        console.log(`   - ${user.username}: $${amount.toFixed(2)}`);
    });



}
/**
 * Main function to run the AI-only test case
 */
async function main(): Promise<void> {
    console.log('🎓 GroupExpenseTrackingAIAugmented AI Test Suite');
    console.log('================================================\n');

    try {
        await testMath();
        await testAIVacationExpenses();

        await testRounding();
        console.log('\n🎉 AI-only test case completed successfully!');
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    main();
}
