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

import { makeExecutableSchema} from 'graphql-tools'
import { find, findIndex, filter } from 'lodash'
import { SchemaLink } from 'apollo-link-schema'
import { InMemoryCache } from 'apollo-cache-inmemory' 
import ApolloClient from 'apollo-client'

import { Alert } from 'react-native'

// Types
const typeDefs = `
type Person {
    id: String!
    firstName: String!
    lastName: String!
    tasks: [Task]
}

type Task {
    id: String!
    title: String!
    owner: Person!
    createdDate: Float!
    dueDate: Float!
    done: Boolean!
}

input TaskInput {
    title: String!
    ownerId: String!
    dueDate: Float!
}

# the schema allows the following query:
type Query {
    tasks: [Task]!
}

# this schema allows the following mutation:
type Mutation {
    addTask (
    input: TaskInput       
    ) : Task

    updateTask (
    taskId: String!
    done: Boolean!
    ) : Task
}
`;

// Starting data
var seq = 1
const now = (new Date()).getTime()
const due = now + 3600*8*1000
var allPeople = [ { id:`${seq++}`, firstName:'Wolfgang', lastName:'Mathurin' } ]
var allTasks = [ 
    { id:`${seq++}`, title:'Get milk', ownerId: allPeople[0].id, createdDate:now, dueDate:due, done:false },
    { id:`${seq++}`, title:'Clean car', ownerId: allPeople[0].id, createdDate:now, dueDate:due, done:false }, 
]

// Resolvers
const resolvers = {
    Query: {
        tasks: () => allTasks,
    },
    Mutation: {
        addTask: (_, {input: { title, ownerId, dueDate}}) => {
            const newTask = { id:`${seq++}`, title: title, ownerId: ownerId, createdDate:(new Date()).getTime(), dueDate: dueDate, done:false }
            allTasks.push(newTask)
            return newTask
        },
        updateTask: (_, { taskId, done }) => {
            const task = find(allTasks, {id: taskId })
            if (!task) {
                throw new Error(`Couldn't find task with id ${task.id}`)
            }
            task.done = done
            return task
        },
    },
    Person: {
        tasks: (person) => filter(allTasks, { ownerId: person.id }),
    },
    Task: {
        owner: (task) => find(allPeople, { id: task.ownerId }),
    },
}


const logger = {
    log: (e) => console.log(e)
}

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    logger
})

export const makeClient = () => { return new ApolloClient({
      ssr: true,
      link: new SchemaLink({schema}),
      cache: new InMemoryCache(),
      dataIdFromObject: r => r.id,
    })
}

