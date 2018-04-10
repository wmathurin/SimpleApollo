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

import { ApolloProvider } from 'react-apollo'
import React, { Component } from 'react'
import { View } from 'react-native'
import { Header, Text, Icon } from 'react-native-elements'
import { Menu, MenuProvider, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import TaskList from './components/TaskList'
import TaskCreator from './components/TaskCreator'

import { typeDefs } from './gqlServer/schema'
import { makeClient } from './gql/client'
import makeMockResolvers from './gqlServer/mockResolvers'
import makeRestAPIResolvers from './gqlServer/restAPIResolvers'
import makeSmartSyncResolvers from './gqlServer/smartSyncResolvers'


export class App extends Component {
  constructor(...args) {
    super(...args);

    this.state = {makeResolvers: makeMockResolvers}
  }

  renderResolverMenu() {
    return (
          <Menu ref='menu' onSelect={(value) => this.setState({makeResolvers: value}) }>
            <MenuTrigger>
              <Icon name='menu' color='#fff'/>
            </MenuTrigger>
            <MenuOptions>
              <MenuOption value={makeMockResolvers} text='Use Mock Resolvers' />
              <MenuOption value={makeRestAPIResolvers} text='Use Rest API Resolvers' />
              <MenuOption value={makeSmartSyncResolvers} text='Use SmartSync Resolvers' />
            </MenuOptions>
          </Menu>)
  }

  render() {
    return (
      <ApolloProvider client={makeClient(typeDefs, this.state.makeResolvers())}>
        <MenuProvider>
          <View style={{flex:1, backgroundColor: '#fff'}}>
            <Header
              leftComponent={this.renderResolverMenu()}
              centerComponent={{ text: 'To Do\'s', style: { color: '#fff' } }}
            />
            <TaskList />
            <TaskCreator />                    
          </View>
        </MenuProvider>
      </ApolloProvider>
    );
  }
}
