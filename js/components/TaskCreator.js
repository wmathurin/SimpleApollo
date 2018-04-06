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
import { TouchableOpacity, View } from 'react-native'
import { Card, Button, Icon, Input, colors, Text } from 'react-native-elements'
import DatePicker from 'react-native-datepicker'
import ModalSelector from 'react-native-modal-selector'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'

import { personFragment, taskFragment, taskListQuery } from '../gql/queries'

const nameFromPerson = (person) => (person.fields.firstName == '' ? '' : person.fields.firstName + ' ') + person.fields.lastName

class TaskCreator extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = this.initialState()
  }

  initialState() {
    return {
      isAdding: false, 
      fields: {},
      whoId: '',
      whoName: '',
    }
  }

  addTask() {
    const ownerId = this.state.whoId
    const fieldInputs = this.state.fields

    this.props.addTask({
      variables: { ownerId, fieldInputs },
      update: (store, { data: { addTask: newTask } }) => {
        const data = store.readQuery({ query: taskListQuery });
        data.tasks.push(newTask)
        store.writeQuery({ query: taskListQuery, data });
      }
    })

    this.setState(this.initialState())
  }

  renderOwnerPicker() {
    const pickerData = this.props.data.people.map((person) => {
      return {
        key: person.id,
        label: nameFromPerson(person)
      }
    })

    return (
      <ModalSelector
        data={pickerData}
        onChange={(option) => {
          this.setState({whoId: option.key, whoName: option.label})
        }}
      >
        <Input
          placeholder='Owner'
          value={this.state.whoName}
          editable={false}
        />
      </ModalSelector>)
  }

  renderButtons() {
    return (
      <View style={{flexDirection:'row', justifyContent:'center'}}>   
        <Button
          disabled={this.state.title == '' || this.state.when == '' || this.state.whoId == ''}
          buttonStyle={{margin:10}}
          title='Save'
          onPress={() => this.addTask()}
        />
        <Button
            buttonStyle={{margin:10}}
            title='Cancel'
            onPress={() => this.setState(this.initialState())}
          />
      </View>)
  }

  onChangeField(fieldName, newValue) {
    const newFields = {...this.state.fields}
    newFields[fieldName] = newValue
    this.setState({fields: newFields})
  }

  renderField(fieldSpec) {
    switch(fieldSpec.type) {
      case 'STRING':
        return (
                <Input key={fieldSpec.name}
                  placeholder={fieldSpec.label}
                  value={this.state.fields[fieldSpec.name]}
                  onChangeText={(text) => this.onChangeField(fieldSpec.name, text)}
                />)          
      case 'DATETIME':
        const currentDateValue = new Date(this.state.fields[fieldSpec.name])
        return (
                <View style={{flexDirection:'row'}} key={fieldSpec.name}> 
                  <TouchableOpacity onPress={() => this.refs[`datePicker_${fieldSpec.name}`].onPressDate()}>
                    <Input
                      pointerEvents='none'
                      placeholder={fieldSpec.label}
                      value={isNaN(currentDateValue.getTime()) ? '' : currentDateValue.toLocaleString()}
                      editable={false}
                      />
                  </TouchableOpacity>
                  <DatePicker
                    ref={`datePicker_${fieldSpec.name}`}
                    date={currentDateValue}
                    style={{width:32}}
                    mode='datetime'
                    format='MM/DD/YYYY, h:mm:ss a'
                    confirmBtnText='Confirm'
                    cancelBtnText='Cancel'
                    customStyles={ {btnTextConfirm: {color: colors.primary} } }
                    showIcon={true}
                    hideText={true}
                    iconComponent={<Icon color='grey' name='calendar' type='font-awesome'/>}
                    onDateChange={(date) => this.onChangeField(fieldSpec.name, new Date(date).getTime())}
                  />
                </View>)
    }
  }

  render () {
    if (this.props.data.loading) {
      return (<Text style={{flex:1, textAlign:'center'}}>Loading</Text>);
    }

    console.log("data===>" + JSON.stringify(this.props.data))

    if (!this.state.isAdding) {
      return (
        <Button
          containerStyle={{alignItems:'stretch'}}
          title='Add To Do' 
          onPress={() => { 
            this.setState({isAdding: true}) 
          }}
        />)
    }
    else {
      return (
        <Card title='Add To Do' containerStyle={{marginBottom:16}}>
          {this.props.data.taskFieldSpecs.map((fieldSpec) => this.renderField(fieldSpec))}
          {this.renderOwnerPicker()}
          {this.renderButtons()}
        </Card>)
    }
  }
}

const addTaskMutation = gql`
  mutation addTask($ownerId: String!, $fieldInputs: JSON!) {
    addTask(ownerId: $ownerId, fieldInputs: $fieldInputs) {
      id
      ... taskFragment
    }
  }
${taskFragment}
`

const addTaskQuery = gql`
  query addTaskQuery($mode: String!) {
    people {
      id
      ... personFragment
    }
    taskFieldSpecs (mode: $mode) {
      name
      type 
      label
    }
  }
${personFragment}
`

const TaskCreatorWithData = compose(
  graphql(addTaskQuery, {options: { variables: { mode: 'CREATE'}}}),
  graphql(addTaskMutation, {name : 'addTask'})
  )(TaskCreator)

export default TaskCreatorWithData