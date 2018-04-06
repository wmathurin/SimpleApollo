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
import { CheckBox } from 'react-native-elements'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

class TaskToggler extends React.Component {

  toggleTask() {
    const taskId = this.props.task.id
    const done = !this.props.task.fields.done
    const fieldInputs = { done }

    this.props.updateTask({variables: {taskId, fieldInputs}})
  }

  render() {
    const task = this.props.task
    return (
      <CheckBox
        iconRight
        checked={task.fields.done}
        onPress={() => this.toggleTask()}
      />
    )
  }
}


const updateTaskMutation = gql`
  mutation updateTask($taskId: String!, $fieldInputs: JSON!) {
    updateTask(taskId: $taskId, fieldInputs: $fieldInputs) {
      id
      fields
    }
  }
`

const TaskTogglerWithData = graphql(updateTaskMutation, {name : 'updateTask'})(TaskToggler)

export default TaskTogglerWithData