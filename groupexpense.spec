concept GroupExpenseTrackingAIAugmented
    purpose allows users to record and manage shared expenses within a group
    principle After a group is created, users can add, edit, or delete expenses. Each expense tracks the payer, total cost, and how costs are divided among members. The AI assistant can interpret natural language prompts to suggest expenses, predict appropriate cost splits, and categorize expenses.
    state
        a set of Groups with
            a name String
            a creator User
            a set of Users
            a set of GroupExpenses

        a set of GroupExpenses
            a title String
            a description String
            a category String
            a totalCost Number
            a payer User
            a date Date
            a debtMapping Map<User:Number>

    actions
        createGroup(groupName: String, creator: User, description: String): (group:Group)
            requires creator exists
            effect creates a new group with the given groupName, the creator, the set of users, the description, and the startDate/endDate set to None.

        leaveGroup(group:Group, user:User):
            requires group exists, user is part of group, and user does not owe/is not owed anything in the group
            effect removes the user from the group

        addUser(user: User, friend: User, group: Group):
            requires user exists, friend exists, group exists, user is in group and is friends with the friend. user is not equal to friend.
            effect adds friend to the group

        removeUser(owner: User, user:User, group:Group)
            requires owner exists, user exists, group exists, owner is in the group and is the owner of the group, user is in the group
            effect removes the user from the group

        addGroupExpense(payer:User, group:Group, title:String, description:String, category:String, totalCost:Number, date:Date, debtMapping:Map<User:Number>): (expense:GroupExpense)
            requires group and payer exist, payer is in group, totalCost > 0, all values in debtMapping are positive and sum to totalCost
            effect creates a GroupExpense with the given details and stores it in the group

        suggestExpenseWithAI(user:User, group:Group, prompt:String, currentDate:Date, llm: GeminiLLM):(expense:GroupExpense)
            requires group and user exists and user is in group
            effect takes the given prompt and returns a suggested expense with a predicted title, description, category, totalCost, date, cost split etc.

        editGroupExpense(payer:User, group:Group, oldExpense:GroupExpense, title:String, description:String, category:String, totalCost:Number, date:Date, debtMapping:Map<User:Number>): (newExpense:GroupExpense)
            requires payer and oldExpense exist, oldExpense is in group, payer is the payer of oldExpense
            effect updates the GroupExpense with the given details

        deleteGroupExpense(payer:User, group:Group, expense:GroupExpense): (expense:GroupExpense)
            requires payer and expense exist, expense is in group, payer is the payer of expense
            effect deletes the GroupExpense from the group

        getGroupSpendingByCategory(group:Group, category:String):(spending:Number)
            requires group exists and contains expenses with the given category
            effect sums the totalCost of all expenses with the given group and category.
