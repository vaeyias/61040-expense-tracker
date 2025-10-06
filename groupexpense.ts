/**
 * GroupExpenseTrackingAIAugmented
 *
 * Purpose: Allows users to record and manage shared expenses within a group.
 * Supports AI-assisted suggestions for new expenses using Gemini LLM.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * === Models / State ===
 */

// Represents a user in the system
export interface User {
    username: string;
}

// Represents a single expense shared within a group
export interface GroupExpense {
    title: string; // Expense title
    description: string; // Detailed description
    category: string; // Expense category, e.g., Food, Transport
    totalCost: number; // Total cost of the expense
    payer: User; // Who paid for this expense
    date: Date; // When the expense occurred
    debtMapping: Map<User, number>; // How much each user owes
}

// Represents a group of users sharing expenses
export interface Group {
    name: string; // Group name
    creator: User; // User who created the group
    users: User[]; // Users in the group
    expenses: GroupExpense[]; // All expenses in the group
}

// Global state for all users and groups
export const Users: User[] = [];
export const Groups: Group[] = [];

/**
 * === Gemini LLM Wrapper ===
 * Handles requests to Gemini AI for AI-assisted expense suggestions
 */
export interface Config {
    apiKey: string; // API key for Gemini access
}

export class GeminiLLM {
    private apiKey: string;

    constructor(config: Config) {
        this.apiKey = config.apiKey;
    }

    // Sends a prompt to Gemini and returns its text response
    async executeLLM(prompt: string): Promise<string> {
        try {
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash-lite',
                generationConfig: { maxOutputTokens: 500 },
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }
}

/**
 * === Actions / Methods ===
 * Handles creation of groups, managing users, adding/editing/deleting expenses, and AI suggestions
 */
export class GroupExpenseTrackingAIAugmented {

    /**
     * Create a new group
     */
    createGroup(groupName: string, creator: User): Group {
        if (!creator) throw new Error('Creator must exist');
        const group: Group = { name: groupName, creator, users: [creator], expenses: [] };
        Groups.push(group);
        console.log(`✅ Group "${groupName}" created by ${creator.username}`);
        return group;
    }

    /**
     * User can leave a group if they owe or are owed nothing
     */
    leaveGroup(group: Group, user: User) {
        if (!group) throw new Error('Group must exist');
        if (!group.users.includes(user)) throw new Error('User not in group');

        // Check if user has any debts or credits
        for (const expense of group.expenses) {
            if (expense.debtMapping.get(user) && expense.debtMapping.get(user)! > 0) {
                throw new Error('User cannot leave, still owes or is owed money in the group');
            }
        }

        // Remove user
        group.users = group.users.filter(u => u !== user);
        console.log(`✅ ${user.username} left group "${group.name}"`);
    }

    /**
     * Add a friend to a group
     */
    addUser(user: User, friend: User, group: Group) {
        if (!group || !user || !friend) throw new Error('Group and users must exist');
        if (!group.users.includes(user)) throw new Error('User must be in group');
        if (user === friend) throw new Error('User cannot add themselves');

        if (!group.users.includes(friend)) {
            group.users.push(friend);
            console.log(`✅ ${friend.username} added to group "${group.name}" by ${user.username}`);
        }
    }

    /**
     * Remove a user from the group (only by owner)
     */
    removeUser(owner: User, user: User, group: Group) {
        if (!group || !owner || !user) throw new Error('Group and users must exist');
        if (group.creator !== owner) throw new Error('Only owner can remove users');

        group.users = group.users.filter(u => u !== user);
        console.log(`✅ ${user.username} removed from group "${group.name}" by owner ${owner.username}`);
    }

    /**
     * Add a manual group expense
     */
    addGroupExpense(
        payer: User,
        group: Group,
        title: string,
        description: string,
        category: string,
        totalCost: number,
        date: Date,
        debtMapping: Map<User, number>
    ): GroupExpense {
        if (!group || !payer) throw new Error('Group and payer must exist');
        if (!group.users.includes(payer)) throw new Error('Payer must be in group');
        if (totalCost <= 0) throw new Error('Total cost must be positive');

        const sumDebts = Array.from(debtMapping.values()).reduce((a, b) => a + b, 0);
        if (Math.abs(sumDebts - totalCost) > 0.01) throw new Error('Debt mapping does not sum to total cost');

        for (const amount of debtMapping.values()) {
            if (amount < 0) throw new Error('Debt mapping must be positive');
        }

        const expense: GroupExpense = { title, description, category, totalCost, payer, date, debtMapping };
        group.expenses.push(expense);

        console.log(`✅ Expense "${title}" added by ${payer.username} in group "${group.name}"`);
        return expense;
    }

    /**
     * Suggest a new expense via AI
     */
    async suggestExpenseWithAI(
        inputter: User,
        group: Group,
        prompt: string,
        currentDate: Date,
        llm: GeminiLLM
    ): Promise<GroupExpense> {
        if (!group || !inputter) throw new Error('Group and inputter must exist');
        if (!group.users.includes(inputter)) throw new Error('Inputter must be in group');

        const usersList = group.users.map(u => u.username).join(', ');
        const llmPrompt = `
                            You are an assistant calculates the cost splits for each involved member. Be precise with math and reasoning. If the prompt mentions specific recipients or who paid, use that information to assign the cost correctly.
                            The person giving the prompt is: ${inputter.username}
                            Group name: ${group.name}
                            Group members: ${usersList}
                            Prompt: ${prompt}
                            Prompt written on : ${currentDate}


                            Return JSON like:
                            {
                            "title": "string",
                            "payer": "username" // username must be a group member
                            "description": "string",
                            "category": "Food|Lodging|Transport|Shopping|Other",
                            "totalCost": number, // positive numbers only
                            "date": Date
                            "debtMapping": { "username": number } # username should be a group member, number cannot be negative
                            }

                            Ensure:
                            - NUMBERS CANNOT BE NEGATIVE
                            - Make sure all usernames in debtMapping are group members
                            - Make sure round all costs to two decimal places
                            - double check your math and reasoning
                            - JSON only
                            `;

        const responseText = await llm.executeLLM(llmPrompt);

        let cleanedText=""
        if (responseText.startsWith('```')) {
            const firstNewline = responseText.indexOf('\n');
            const lastBackticks = responseText.lastIndexOf('```');
            cleanedText = responseText.slice(firstNewline + 1, lastBackticks).trim();
}



        let parsed: { title: string; description: string; payer:string, category: string; date:Date, totalCost: number; debtMapping: Record<string, number> };
        try {
            parsed = JSON.parse(cleanedText);
        } catch {
            throw new Error(`Failed to parse LLM output: ${cleanedText}`);
        }

        // Validators

        // cost should be nonnegative
        if (parsed.totalCost <= 0) throw new Error('Negative totalCost from LLM');

        // all costs are positive
        if (parsed.totalCost <= 0) throw new Error('Invalid totalCost from LLM');

        for (const [username, amount] of Object.entries(parsed.debtMapping)) {
            if (amount < 0 || isNaN(amount)) {
                throw new Error(`Invalid debt amount for ${username}: ${amount}. All amounts must be nonegative numbers.`);
            }
        }


        // all users are in the group
        for (const username of Object.keys(parsed.debtMapping)) {
            if (!group.users.some(u => u.username === username)) {
                throw new Error(`LLM included unknown user: ${username}`);
            }
        }


        // category is valid
        const allowedCategories = ['Food', 'Lodging', 'Transport', 'Shopping', 'Other'];
        if (!allowedCategories.includes(parsed.category)) {
            throw new Error(`Invalid category "${parsed.category}". Must be one of: ${allowedCategories.join(', ')}`);
        }


        const debtMap = new Map<User, number>();
        for (const [username, amount] of Object.entries(parsed.debtMapping)) {
            const userObj = group.users.find(u => u.username === username)!;
            debtMap.set(userObj, amount);
        }

        const expense: GroupExpense = {
            title: parsed.title,
            description: parsed.description,
            category: parsed.category,
            totalCost: parsed.totalCost,
            payer: group.users.find(u => u.username === parsed.payer)!,
            date: parsed.date,
            debtMapping: debtMap,
        };

        group.expenses.push(expense);
        console.log(`✅ AI-suggested expense "${expense.title}" with total cost ${expense.totalCost} added in group "${group.name}"`);
        return expense;
    }
}
