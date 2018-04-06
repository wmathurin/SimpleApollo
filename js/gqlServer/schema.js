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

export const typeDefs = `
scalar JSON

enum ModeType {
    CREATE
    UPDATE
    VIEW
    LIST
    ALL
}

enum FieldType {
    STRING
    NUMBER
    DATETIME
    CHECKBOX
}

type FieldSpec {
    id: String!
    name: String!
    type: FieldType
    label: String!
}

type Field {
    id: String!
    spec: FieldSpec!
    value: JSON 
}

input FieldInput {
    name: String!
    value: JSON 
}

interface SObject {
    id: String!
    fields: [Field]
}

type Task implements SObject {
    id: String!
    fields: [Field]
    owner: Person!
}

type Person implements SObject {
    id: String!
    fields: [Field]
}

# the schema allows the following query:
type Query {

    people: [Person]    
    tasks: [Task]
    peopleFieldSpecs (mode: String!): [FieldSpec]
    taskFieldSpecs (mode: String!): [FieldSpec]
    
}

# the schema allows the following mutation:
type Mutation {

    addTask (ownerId: String!, fieldInputs: [FieldInput]!): Task
    updateTask (taskId: String!, fieldInputs: [FieldInput]!): Task
    deleteTask (taskId: String!): Task

}

`;

