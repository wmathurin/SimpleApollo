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

import React from 'react'
import { Text, List, ListItem, ButtonGroup } from 'react-native-elements'
import { View, ScrollView, RefreshControl } from 'react-native'
import { graphql } from 'react-apollo'

import TaskListItem from './TaskListItem'
import { taskListQuery } from '../gql/queries'

class TaskList extends React.Component {

  constructor(...args) {
    super(...args)
    this.state = {
      refreshing: false,
      filter: null // null means:  show all, true means: show done, false means: show not done
    } 
  }

  onChangeFilter(newFilter) {
    this.setState({filter: newFilter})
  }

  onRefresh() {
    this.props.data.refetch()
      .then(() => this.setState({refreshing: false}))
  }

  renderFilterButtonGroup() {
    const labels = ["All", "Done", "Not Done"]
    const filterValues = [null, true, false]
    const selectedIndex = filterValues.indexOf(this.state.filter)

    return (
           <ButtonGroup
             onPress={(index) => this.onChangeFilter(filterValues[index])}
             selectedIndex={selectedIndex}
             buttons={labels}
           />
      )
  }

  render () {
    if (this.props.data.loading) {
      return (<Text style={{flex:1, textAlign:'center'}}>Loading</Text>);
    }

    console.log('data===>' + JSON.stringify(this.props.data))

    return (
      <View style={{flex:1}}>
        {this.renderFilterButtonGroup()}
        <ScrollView style={{flex:1}}
          refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshing}
                      onRefresh={() => this.onRefresh()}                    
                    />
                  }        
        >
          <List>
            {
              [...this.props.data.tasks]
              .filter((task) => this.state.filter == null ? true : task.fields.done == this.state.filter)
              .sort((x, y) => y.fields.dueDate < x.fields.dueDate)
              .map(task => (<TaskListItem key={task.id} task={task} />))
            }
          </List>
        </ScrollView>
      </View>
    );
  }

}

const TaskListWithData = graphql(taskListQuery)(TaskList)

export default TaskListWithData