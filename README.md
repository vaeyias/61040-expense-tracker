## Original Concept
```
concept GroupExpenseTracking
    purpose allows users to record and manage shared expenses within a group
    principle after a group is created, users can add expenses to the group. each expense tracks the payer and the total cost, and how costs are divided between different users
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

        editGroupExpense(payer:User, group:Group, oldExpense:GroupExpense, title:String, description:String, category:String, totalCost:Number, date:Date, debtMapping:Map<User:Number>): (newExpense:GroupExpense)
            requires payer and oldExpense exist, oldExpense is in group, payer is the payer of oldExpense
            effect updates the GroupExpense with the given details

        deleteGroupExpense(payer:User, group:Group, expense:GroupExpense): (expense:GroupExpense)
            requires payer and expense exist, expense is in group, payer is the payer of expense
            effect deletes the GroupExpense from the group

        getGroupSpendingByCategory(group:Group, category:String):(spending:Number)
            requires group exists and contains expenses with the given category
            effect sums the totalCost of all expenses with the given group and category.
```


## AI-Augmented Concept
The only change is an additional action: `suggestExpenseWithAI`.

```
concept GroupExpenseTrackingAIAugmented
    purpose allows users to record and manage shared expenses within a group
    principle after a group is created, users can add expenses to the group. each expense tracks the payer and the total cost, and how costs are divided between different users
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

        suggestExpenseWithAI(payer:User, group:Group, prompt:String, currentDate:Date, llm: GeminiLLM):(expense:GroupExpense)
            requires group and payer exists and payer is in group
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
```


## Sketches

![UI_sketch](/assets/AIexpense.jpeg)


### User Journey
Jay joins the shared expense group for a weekend outting in Maine with friends. They just had dinner and Jay fronts the bill and wants to quickly add the expense on Moneta before he forgets. Jay and his friends start to leave the restaurant and Jay feels rushed; so Jay decides to use the AI expense suggestion feature: he clicks the Quick Fill button and types a quick note into the system: “Paid $120 and left a $20 tip for steak dinner.” The LLM parses his message and automatically suggests an expense titled "Steak Dinner", categorizing it under Food, calculating the total cost, and splitting the amount evenly among the group members. Jay reviews the suggestion in the console, confirming the description, category, and individual cost splits before approving the expense. Jay doesn't really like the suggested title decides to tweak the title to "Day 2 Steak Dinner" before posting the expense to the group. Jay is satisfied with not having to manually enter each detail.

## Rich Test Cases

### Original Prompt:

```
You are an assistant that suggests a group expense that calculates the cost splits for each involved member.

The person giving the prompt is: ${inputter.username}
Group name:  ${group.name}
Group members: ${usersList}
Prompt: ${prompt}
Prompt written on : ${currentDate}

Return JSON like:
{
  "title": "string",
  "payer": "username"
  "description": "string",
  "category": "Food|Lodging|Transport|Shopping|Other",
  "totalCost": number,
  "date": Date
  "debtMapping": { "username": number }
}
```
### Test Case #1: Handing Arithmetic Reasoning
I tested whether the system could handle simple arithmetic reasoning from natural language. The input described a $50 dinner plus a 15\% tip, paid by Bob. The AI typically produced consistent totals and correct splits but sometimes failed when the phrasing varied. For instance, “and 15% tip” versus “plus 15\% tip”. After rewording the input to make the math explicit ("plus 15% tip”), the model’s reliability improved. I also noticed that it struggled to split the total cost and the splits would often not sum to the total cost. So, I added a line to the prompt to tell the LLM to make sure the splits sum to total cost. This added issues with negative numbers for some reason. The LLM would randomly assign negative values for some members. So, I adjusted the prompt to specify that all values should be nonnegative. This improved the reliability of the outputs; however, the LLM still makes a lot of mistakes.

**Prompt Variant #1**
```
You are an assistant that calculates the cost splits for each involved member and suggests a details for a group expense.

The person giving the prompt is: ${inputter.username}
Group name: ${group.name}
Group members: ${usersList}
Prompt: ${prompt}
Prompt written on : ${currentDate}

Return JSON like:
{
  "title": "string",
  "payer": "username"
  "description": "string",
  "category": "Food|Lodging|Transport|Shopping|Other",
  "totalCost": number, // number must be positive
  "date": Date
  "debtMapping": { "username": number } // number cannot be negative
}

Ensure:
- Make sure the numbers in debtMapping sum to totalCost
- NUMBERS CANNOT BE NEGATIVE
- Make sure to split the cost evenly if it does not specify who is involved;
```

### Test Case #2: Members not in Group
I tested how the LLM handled prompts that mentioned people who were not part of the active group. Using the input “I bought a red shirt for Dave for $25 and a baseball for myself for $50,” the goal was to see whether the system correctly filtered out “Dave,” who wasn’t registered as a group member. Ideally, the LLM would not include Dave in the debtMaping. Before my mitigation, the output always included Dave in the expense. I found a fix by adding "all usernames in debtMapping must be from group members" in my LLM prompt. This effectively fixed the issue of not including Dave in the expense most of the time. However, another issue came up where it wouldn't know what to do about the $25 and so the total cost and sum of the splits would be mismatched. Additionally, sometimes it would not include the $50 in the payer's split for some reason. I tried adding some other checks in the prompt to fix this, but it was not effective.

**Prompt Variation #2**
'''
You are an assistant calculates the cost splits for each involved member.
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
- Make sure the numbers in debtMapping sum to totalCost
- NUMBERS CANNOT BE NEGATIVE
- Make sure to split the cost evenly if it does not specify who is involved;
- Make sure all usernames in debtMapping are group members
'''

### Test Case #3: Unequal Splits and Rounding

The final test case focused on getting accurate splits and handling rounding. I tested whether the AI and system could correctly process an expense described as costing $5.23745692873. The LLM rounded the costs most of the time, but occasionally left the cost unrounded. So, I fixed it by specifying to round to two decimal places in the prompt and it made the LLM a lot more reliable.

As for improving the accuracy of unequal splits, I had a lot of trouble. I tested with the prompt: "Last week, I bought Alice a $5.23745692873 cake. I paid for a $30 game for me and Charlie". In the previous prompt variations, I added 'Make sure to split the cost evenly if it does not specify who is involved'. I think this really confused the LLM and made unequal splits harder for the LLM. So, I decided to remove it in this variation. This stopped the LLM from just splitting the total cost evenly. However, the LLM was still very inconsistent. So, I kept trying different wordings and tried to prompt the LLM to do more checks. When I added to the beginning "Be precise with math and reasoning. If the prompt mentions specific recipients or who paid, use that information to assign the cost correctly." The LLM became a lot more reliable and accurate with unequal splits.

**Prompt Variation #3**
```
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
- JSON only
- double check your math and reasoning
```


## Validations

Even with the revised prompts, several issues can still arise from the LLM’s outputs. **First**, the LLM might generate negative costs which would be illogical in my system. So, I check to make for the total cost and each split is nonnegative. **Secondly**, the model might hallucinate categories that don’t exist within the acceptable set of categories. For instance, it could classify “train tickets” under a new, unrecognized category like “transportations” instead of the predefined “transportation.” To address this, a category validator checks that the category returned by the LLM is one of the valid, predefined categories and throws an error if it is not. **Lastly**, the LLM may still include members in the expense that do not exist in the group. So, I make a validator that checks that all involved members in the expense are part of the group.
