# History of the sample app

We tagged the repo every time we get to a logical stable point. Below is a description of every tag.

## 1_generated_app
<details><summary>[expand]</summary>

To generate a Mobile SDK application with React Native, we used [forcereact](https://www.npmjs.com/package/forcereact).
```shell
forcereact create --appname=SimpleApollo
```

</details>

## 2_upvote_app
<details><summary>[expand]</summary>

We created a simple app (following some example online) which shows a list of posts with their authors and where one can click on a post to "up-vote" it.
It is making use of GraphQL for querying and updating records.

The schema and the resolvers are defined in this [file](https://github.com/wmathurin/SimpleApollo/blob/2_upvote_app/js/local.js).

For the UI components, we used [React Native Elements](https://github.com/react-native-training/react-native-elements/tree/v1.0.0-beta3).
For icons, we used [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons).
For the GraphQL client, we used the [Apollo GraphQL client](https://github.com/apollographql/apollo-client).
For the GraphQL server (SSR support), we used [Apollo Schema Link](https://www.apollographql.com/docs/link/links/schema.html).
</details>

## 3_todo_app_mock_resolvers
<details><summary>[expand]</summary>

We completely changed the application to give you a list of tasks (todos).
Each task has an owner and due date and can either be done or not.
The main screen shows a task list which can be deleted or marked as complete or not.
There is an add button which brings up a card for creating a new task. It has a date picker (but the owner is always you - Owner picker was added later).

It is making use of GraphQL for querying and updating, adding and deleting records.

The resolvers are still working only with mock data.

Key files:
- the [schema](https://github.com/wmathurin/SimpleApollo/blob/3_todo_app_mock_resolvers/js/gql/schema.js)
- the [resolvers](https://github.com/wmathurin/SimpleApollo/blob/3_todo_app_mock_resolvers/js/gql/mockResolvers.js)
- the [components](https://github.com/wmathurin/SimpleApollo/tree/3_todo_app_mock_resolvers/js/components)

</details>

## 4_todo_app_restapi_resolvers
<details><summary>[expand]</summary>

We created a custom object Task__c on the server with the following custom fields:
- Due_Date__c : DateTime
- Done__c: Checkbox

Added a new set of [resolvers](https://github.com/wmathurin/SimpleApollo/blob/4_todo_app_restapi_resolvers/js/gql/restapiResolvers.js) and changed the [app](https://github.com/wmathurin/SimpleApollo/blob/4_todo_app_restapi_resolvers/js/app.js#L36) to use them instead.

The new resolvers use our native bridges to get data from the server.

We made no attempt to optimize.
To render the list, the resolvers ends up running a [SOQL query](https://github.com/wmathurin/SimpleApollo/blob/4_todo_app_restapi_resolvers/js/gql/restapiResolvers.js#L47) to get the tasks followed by a retrieve for each [owner](https://github.com/wmathurin/SimpleApollo/blob/4_todo_app_restapi_resolvers/js/gql/restapiResolvers.js#L108) (even if they were the same).

**NB: UI components did not have to be changed at all.**
</details>

## 5_todo_app_restapi_resolvers_dataloader
<details><summary>[expand]</summary>

To make things better, we leverage [Facebook Dataloader](https://github.com/facebook/dataloader) for the users.
As a result, to render the list, the resolvers now run a SOQL query to get the tasks followed by a single SOQL query to get the users.
</details>

## 6_todo_app_owner_picker
<details><summary>[expand]</summary>

In this step, we added an owner picker in the component used for creating tasks: [TaskCreator](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/components/TaskCreator.js#L83).

We had to declare a [new query](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/gqlServer/schema.js#L53) in the schema.
We had to add a [resolver](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/gqlServer/restAPIResolvers.js#L64) for it.
And of course, we had to modify [TaskCreator](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/components/TaskCreator.js#L183) to indicate it needs that data.

</details>

## 7_todo_app_menu_for_resolvers
<details><summary>[expand]</summary>

Instead of having to change the code to switch "resolvers", we added a [menu](https://github.com/wmathurin/SimpleApollo/blob/7_todo_app_menu_for_resolvers/js/app.js#L48) in the header to do just that.

</details>


