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

import { find, findIndex, filter } from 'lodash'
import GraphQLJSON from 'graphql-type-json'

const makeResolvers = () => {

    // Mock data
    var seq = 1
    const now = (new Date()).getTime()
    const due = now + 3600*8*1000
    var me = { id:`${seq++}`, fields: { firstName:'Wolfgang', lastName:'Mathurin' } }
    var allPeople = [ me ]
    var allTasks = [ 
        { id:`${seq++}`, ownerId: me.id, fields: { title:'Get milk',  createdDate:now, dueDate:due, done:false } },
        { id:`${seq++}`, ownerId: me.id, fields: { title:'Clean car', createdDate:now, dueDate:due, done:false } }, 
    ]

    // Mock meta-data
    const allTaskFieldSpecs = [
        { id:`${seq++}`, name:'title', type: 'STRING', label: 'Title'},
        { id:`${seq++}`, name:'createdDate', type: 'DATETIME', label: 'Created Date'},
        { id:`${seq++}`, name:'dueDate', type: 'DATETIME', label: 'Due Date'},
        { id:`${seq++}`, name:'done', type: 'CHECKBOX', label: 'Status'},
    ]

    const allPersonFieldSpecs = [
        { id:`${seq++}`, name:'firstName', type: 'STRING', label: 'First Name'},
        { id:`${seq++}`, name:'lastName', type: 'STRING', label: 'Last Name'},
    ]

    return {
        JSON: GraphQLJSON,

        Query: {

            people: () => allPeople,

            tasks: () => allTasks,

            peopleFieldSpecs: (_, { mode }) => allPersonFieldSpecs,

            taskFieldSpecs: (_, { mode }) => {
                switch (mode) {
                    case 'CREATE': return allTaskFieldSpecs.filter((spec) => ['title', 'dueDate'].includes(spec.name))
                    case 'UPDATE': return allTaskFieldSpecs.filter((spec) => ['title', 'dueDate', 'done'].includes(spec.name))
                    case 'LIST': return allTaskFieldSpecs.filter((spec) => ['title', 'dueDate', 'done'].includes(spec.name))            
                    case 'ALL': return allTaskFieldSpecs
                }
            }
        },

        Mutation: {

            addTask: (_, { ownerId, fieldInputs }) => {            
                const newTask = { id:`${seq++}`, ownerId: ownerId, fields: { ...fieldInputs, createdDate:(new Date()).getTime() } }
                allTasks.push(newTask)
                console.log("new task" + JSON.stringify(newTask))
                return newTask
            },
            updateTask: (_, { taskId, fieldInputs }) => {
                const task = find(allTasks, {id: taskId })
                if (!task) {
                    throw new Error(`Couldn't find task with id ${task.id}`)
                }
                task.fields = { ...task.fields, ...fieldInputs}
                return task
            },
            deleteTask: (_, { taskId }) => {
                const task = find(allTasks, {id: taskId })
                if (!task) {
                    throw new Error(`Couldn't find task with id ${task.id}`)
                }
                allTasks = allTasks.filter((task) => task.id != taskId)
                return task
            }
        },

        Task: {
            owner: (task) => find(allPeople, { id: task.ownerId }),
        },
    }
}

export default makeResolvers