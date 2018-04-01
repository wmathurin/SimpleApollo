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

The back-end integration is usually done through "resolvers" that can do things like get object by id, run query or mutation (which are defined in the schema).

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
- [Relay (by Facebook)](https://facebook.github.io/relay/)
- [Apollo](https://www.apollographql.com/)

There are good resources online comparing both. See [this one](https://blog.graph.cool/relay-vs-apollo-comparing-graphql-clients-for-react-apps-b40af58c1534) or [that one](https://www.codazen.com/choosing-graphql-client-apollo-vs-relay/).

We decided to prototype with **Apollo** for the following reasons:
- easier learning curve,
- arguably just as feature rich,
- supports SSR (server side rendering) out of the box - see [here](https://www.apollographql.com/docs/react/features/server-side-rendering.html#server-rendering),
- adoption has been steadily increasing and is now outpacing relay - see [apollo](https://www.npmjs.com/package/apollo-client) vs [relay](https://www.npmjs.com/package/graphql-relay).

With more time, we would prototype with Relay as well.

</details>

## Steel Threads

<details><summary>[expand]</summary>

To establish feasibility of the above approach and determine work needed in support libraries, we want to build sample proof-of-concept applications of increasing complexities.

1. (Steel Thread 1) Application that knows the object types and field sets it deals with at compile time and works only online
2. (Steel Thread 2) 1 but with fields sets known at run time (layout driven)
3. (Steel Thread 3) 1 but working offline also

Not in scope:
- When both object types and field sets are known at run time (generic object browser),
- Run time meta data (2) and offline,
- Abstracting styles away from UI components (to be able to swap 'design').

### Application

The sample application is a simple To Do application.

It should have a screen listing the To Do's and a 'Add' button to create a new To Do.

A To Do should have:
- a title,
- due date, 
- owner (lookup field),
- status (done or not).

The list screen should:
- show the todos,
- allow user to refresh (with a pull to request),
- allow user to change status of a to do,
- allow user to delete a to do.

The add screen should:
- allow user to choose a title,
- allow user to pick a due date with a picker,
- allow user to pick owner with a pick list.


### Notes

This application allows us to exercise the following GraphQL features:
- queries (including refetch),
- mutations that modify a record in place (the status change),
- mutations that create or delete records (and the cache beyond the record).

This application does NOT exercise the following GraphQL features:
- queries with pagination,
- subscriptions.

</details>

## Steel Thread 1: Online with static meta data

<details><summary>[expand]</summary>

See [STEPS](https://github.com/wmathurin/SimpleApollo/blob/dev/STEPS.md) for a step by step history of the development of the application.

### GrapQL client and server
For the GraphQL client, we used the [Apollo GraphQL client](https://github.com/apollographql/apollo-client).
For the GraphQL server (SSR support), we used [Apollo Schema Link](https://www.apollographql.com/docs/link/links/schema.html).

### UI components

We composed 3rd party UI components to build our UI. We did not do any styling beyond the occasional `flex:1` to stretch a component or a few color changes.

We used the following UI libraries:
- [react native elements](https://github.com/react-native-training/react-native-elements/tree/v1.0.0-beta3),
- [react native vector icons](https://github.com/oblador/react-native-vector-icons),
- [react native date picker](https://github.com/xgfe/react-native-datepicker),
- [react native modal selector](https://github.com/peacechen/react-native-modal-selector).

### Key code

Code that would typically reside on the server:
- [schema](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/gqlServer/schema.js),
- [resolvers](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/gqlServer/restAPIResolvers.js).

Code that would typically reside on the client:
- [queries](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/gql/queries.js),
- [helper class](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/gql/client.js) to build GraphQL client.

Key components:
- [component for list](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/components/TaskList.js) and [list item](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/components/TaskListItem.js),
- [component for creating a new to do](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/components/TaskCreator.js),
- [component for changing status](https://github.com/wmathurin/SimpleApollo/blob/8_todo_app_android_support_pull_to_refresh/js/components/TaskToggler.js).

### Findings

The bulk of the time was learning GraphQL/Apollo. Running the apollo server library along side the apollo client library was pretty easy.
Switching from mock resolvers to resolvers using REST APIs was very fast (and did not require any code change in the UI).
There might not be much code that needs to move to support libraries.


</details>

