import React from 'react';
import { Text, List, ListItem } from 'react-native-elements';
import { graphql, ApolloProvider } from 'react-apollo';
import gql from 'graphql-tag';
import PostUpvoter from './postupvoter'

// The data prop, which is provided by the wrapper below contains,
// a `loading` key while the query is in flight and posts when ready
function PostList({ data: { loading, posts } }) {

  if (loading) {
    return <Text h1>Loading</Text>;
  } else {
      return (
      <List>
              {[...posts].sort((x, y) => y.votes - x.votes).map(post => {
                  let rightIcon = (<PostUpvoter postId={post.id} />);
                  return (
                    <ListItem
                      key={post.id}
                      title={post.title}
                      subtitle={`by ${post.author.firstName} ${post.author.lastName}`}
                      badge={{value:post.votes}}
                      rightIcon={rightIcon}
                    />
                  );
              })}
      </List>
     );
  }
}

// The `graphql` wrapper executes a GraphQL query and makes the results
// available on the `data` prop of the wrapped component (PostList here)
export default graphql(gql`
  query allPosts {
    posts {
      id
      title
      votes
      author {
        id
        firstName
        lastName
      }
    }
  }
`)(PostList);
