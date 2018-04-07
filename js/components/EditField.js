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
import { Icon, Input, colors, Text } from 'react-native-elements'
import DatePicker from 'react-native-datepicker'
import ModalSelector from 'react-native-modal-selector'

class EditField extends React.Component {

  render() {

    const value = this.props.value
    const fieldSpec = this.props.fieldSpec
    const onChangeField = this.props.onChangeField

    switch(fieldSpec.type) {
      case 'String':
        return (
          <Input
            placeholder={fieldSpec.label}
            value={value}
            onChangeText={(text) => onChangeField(fieldSpec.name, text)} 
          />
        )

      case 'DateTime':
        const currentDateValue = new Date(value)
        return (
          <View style={{flexDirection:'row'}}> 
            <TouchableOpacity onPress={() => this.refs['datePicker'].onPressDate()}>
              <Input
                pointerEvents='none'
                placeholder={fieldSpec.label}
                value={isNaN(currentDateValue.getTime()) ? '' : currentDateValue.toLocaleString()}
                editable={false}
              />
            </TouchableOpacity>
            <DatePicker
              ref='datePicker'
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
              onDateChange={(date) => onChangeField(fieldSpec.name, new Date(date))}
            />
          </View>
        )

      default:
        console.log(`Don't know how to handle field  ${JSON.stringify(fieldSpec)}`)
        return null
    }
  }
}

export default EditField
