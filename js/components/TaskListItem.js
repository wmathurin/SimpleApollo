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
import { Icon, ListItem } from 'react-native-elements'
import { filter } from 'lodash'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

import { taskListQuery } from '../gql/queries'
import TaskToggler from './TaskToggler'

class TaskListItem extends React.Component {

  deleteTask () {
    const taskId = this.props.task.id
    this.props.deleteTask({
      variables: { taskId },
      update: (store, { data: { deleteTask: deletedTask } }) => {
        const data = store.readQuery({ query: taskListQuery });
        data.tasks = data.tasks.filter((task) => task.id != deletedTask.id)
        store.writeQuery({ query: taskListQuery, data });
      }
    })
  }

  fieldsToMap (fields) {
    var result = {}
    fields.forEach(({spec: {name}, value}) => result[name] = value)
    return result
  }

  render () {
    const task = this.props.task
    var taskFields = this.fieldsToMap(task.fields)
    var ownerFields = this.fieldsToMap(task.owner.fields)

    const subtitle = `who: ${ownerFields.firstName} ${ownerFields.lastName}\n`
      + `when: ${new Date(taskFields.dueDate).toLocaleString()}`

    return (<ListItem
              title={taskFields.title}
              subtitle={subtitle}
              subtitleNumberOfLines={2}
              leftIcon={<Icon raised name='delete' color='grey' size={18} onPress={() => this.deleteTask()}/>}
              rightIcon={<TaskToggler task={task} />}
            />)
  }
}

const deleteTaskMutation = gql`
  mutation deleteTask($taskId: String!) {
    deleteTask(taskId: $taskId) {
      id
    }
  }
`

const TaskListItemWithData = graphql(deleteTaskMutation, {name : 'deleteTask'})(TaskListItem)

export default TaskListItemWithData
