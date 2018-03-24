/*
 * Copyright (c) 2018-present, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import { View } from 'react-native'
import { Text, List, ListItem, Card } from 'react-native-elements';
import { graphql, ApolloProvider } from 'react-apollo';
import gql from 'graphql-tag';
import TaskCreator from './taskcreator'
import TaskToggler from './tasktoggler'

// The data prop, which is provided by the wrapper below contains,
// a `loading` key while the query is in flight and tasks when ready
function TaskList({ data: { loading, tasks } }) {

  if (loading) {
    return (<Text h1>Loading</Text>);
  } else {
    return (
      <View>
        <List>
                {[...tasks].sort((x, y) => y.dueDate < x.dueDate).map(task => {
                    return (
                      <ListItem
                        key={task.id}
                        title={task.title}
                        subtitle={`who: ${task.owner.firstName} ${task.owner.lastName}`}
                        rightIcon={<TaskToggler task={task} />}
                      />
                    );
                })}
                <ListItem 
                  title={<TaskCreator/>}
                  subtitle={`who: Me`}
                />
        </List>
      </View>
    );
  }
}

// The `graphql` wrapper executes a GraphQL query and makes the results
// available on the `data` prop of the wrapped component (TastList here)
export default graphql(gql`
  query allTasks {
    tasks {
      id
      title
      dueDate
      done
      owner {
        id
        firstName
        lastName
      }
    }
  }
`)(TaskList);
