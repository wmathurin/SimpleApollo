# GraphQL experiment


## Why GraphQL?
<details><summary>[expand]</summary>

**We want to build react native UI components with a clean separation from data sources**. 

Components should have a language to express their data needs (queries) or data changes (mutations) and we should have a runtime that understands that language and talks to our back-end servers and/or local stores on the mobile client.

Such a data query language alreadys exists and is called [**GraphQL**](http://graphql.org/).

It allows clients to define the structure of the data required, and exactly the same structure of the data is returned from the server. It is a strongly typed runtime which allows clients to dictate what data is needed. This avoids both the problems of over-fetching as well as under-fetching of data.

[source](https://en.wikipedia.org/wiki/GraphQL)

</details>

## How does one GraphQL?
<details><summary>[expand]</summary>

Typically one has a GraphQL client that talks to a GraphQL server.

### Client responsibilities
- send queries to the server,
- cache data returned by the server,
- keep local cache consistent after a mutation,
- provide integration with UI framework (composition of queries and decomposition of responses).

The UI integration is usually done by wrapping a component into a higher level component (HOC) which takes care of fetching the data and making it available to the component through its props (in the React case).

### Server responsibilities
- provide integration with back-end (decomposition of queries and composition of results),
- execute the requested mutations and queries.

The back-end integration is usually done through "resolvers" that can do things like get object by id, run named query or mutation etc.

Major GraphQL clients include Apollo Client and Relay. GraphQL servers are available for multiple languages, including JavaScript, Python, Ruby, Java, C#, Scala, Go, Elixir, Erlang, PHP, and Clojure. 

</details>


## How can we GraphQL?
<details><summary>[expand]</summary>

We need the GraphQL resolved in the mobile client.

For two reasons:
- our servers do not speak GraphQL (currently),
- we want to support the offline case with the same UI code/components.

### Are apps usually running a server in their client? ###
No.

However web apps sometimes do server side rendering (SSR): they pre-render the HTML on the server to speed up load time of JavaScript applications.
In essence, SSR means running the client on the server, which is equivalent to running a server on a client.

### Should the GraphQL server run in "native-land" or "javascript-land"? ###
There are no GraphQL server implementations available in Objective-C or Swift and therefore the "native-land" approach is probably not viable for iOS. Also a "native-land" approach could mean duplicate implementations.

### Conclusion
We should have a JavaScript GraphQL client and server running in "javascript-land" and use our native modules (aka bridges) to talk to our back-end servers and/or local stores.

</details>

## What GraphQL client and server should we use?

<details><summary>[expand]</summary>

There are several options:
- Relay (by Facebook) 
- Apollo 

There are good resources online comparing both. See [this one](https://blog.graph.cool/relay-vs-apollo-comparing-graphql-clients-for-react-apps-b40af58c1534) or [that one](https://www.codazen.com/choosing-graphql-client-apollo-vs-relay/).


We decided to prototype with **Apollo** for the following reasons:
- easier learning curve
- arguably just as feature rich
- supports SSR (server side rendering) out of the box - see [here](https://www.apollographql.com/docs/react/features/server-side-rendering.html#server-rendering)
- adoption has been steadily increasing and is now outpacing relay - see [apollo](https://www.npmjs.com/package/apollo-client) vs [relay](https://www.npmjs.com/package/graphql-relay)

With more time, we would prototype with Relay as well.

</details>

## History of the sample app

We tagged the repo every time we get to a logical stable point. Below is a description of every tag.

### 1_generated_app
<details><summary>[expand]</summary>

To generate a Mobile SDK application with React Native, we used [forcereact](https://www.npmjs.com/package/forcereact).
```shell
forcereact create --appname=SimpleApollo
```

</details>

### 2_upvote_app
<details><summary>[expand]</summary>

We created a simple app (following some example online) which shows a list of posts with their authors and where one can click on a post to "up-vote" it.
It is making use of GraphQL for querying and updating records.

The schema and the resolvers are defined in this [file](https://github.com/wmathurin/SimpleApollo/blob/2_upvote_app/js/local.js).

For the UI components, we used [React Native Elements](https://github.com/react-native-training/react-native-elements/tree/v1.0.0-beta3).
For the GraphQL client, we used the [Apollo GraphQL client](https://github.com/apollographql/apollo-client).
For the GraphQL server (SSR support), we used [Apollo Schema Link](https://www.apollographql.com/docs/link/links/schema.html).
</details>

### 3_todo_app_mock_resolvers
<details><summary>[expand]</summary>

We completely changed the application to give you a list of tasks (todos).
Each task has an owner and due date and can either be done or not.
The resolvers are still working only with mock data.
The main screen shows a task list which can be deleted or marked as complete or not.
There is an add button which brings up a card for creating a new task. It has a date picker (but the owner is always you - Owner picker was added later).

It is making use of GraphQL for querying and updating, adding and deleting records.

Key files:
- the [schema](https://github.com/wmathurin/SimpleApollo/blob/3_todo_app_mock_resolvers/js/gql/schema.js)
- the [resolvers](https://github.com/wmathurin/SimpleApollo/blob/3_todo_app_mock_resolvers/js/gql/mockResolvers.js)
- the [components](https://github.com/wmathurin/SimpleApollo/tree/3_todo_app_mock_resolvers/js/components)

</details>

### 4_todo_app_restapi_resolvers
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

### 5_todo_app_restapi_resolvers_dataloader
<details><summary>[expand]</summary>

To make things better, we introduced a [data loader](https://github.com/facebook/dataloader) for the users.
As a result, to render the list, the resolvers now run a SOQL query to get the tasks followed by a single SOQL query to get the users.
</details>

### 6_todo_app_owner_picker
<details><summary>[expand]</summary>

In this step, we added an owner picker in the component used for creating tasks: [TaskCreator](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/components/TaskCreator.js#L83).

We had to declare a [new query](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/gqlServer/schema.js#L53) in the schema.
We had to had a [resolver](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/gqlServer/restAPIResolvers.js#L64) for it.
And of course, we had to modify [TaskCreator](https://github.com/wmathurin/SimpleApollo/blob/6_todo_app_owner_picker/js/components/TaskCreator.js#L183) to indicate it needs that data.

</details>

### 7_todo_app_menu_for_resolvers
<details><summary>[expand]</summary>

Instead of having to change the code to switch "resolvers", we added a [menu](https://github.com/wmathurin/SimpleApollo/blob/7_todo_app_menu_for_resolvers/js/app.js#L48) in the header to do just that.

</details>


