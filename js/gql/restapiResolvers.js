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

import {oauth, net, forceUtil} from 'react-native-force'

netCreate = forceUtil.promiser(net.create)
netRetrieve = forceUtil.promiser(net.retrieve)
netUpdate = forceUtil.promiser(net.update)
netDel = forceUtil.promiser(net.del)
netQuery = forceUtil.promiser(net.query)
getAuthCredentials = forceUtil.promiser(oauth.getAuthCredentials)

// Resolvers
const resolvers = {
    Query: {
    	currentUserId:() => getAuthCredentials().then((creds) => creds.userId),

    	tasks: () => {
    		console.log('===> SERVER CALL: SOQL')
    		return netQuery('select Id, Name, FORMAT(CreatedDate), FORMAT(Due_Date__c), Done__c, OwnerId from Task__c')
	    		.then((response) => { 
	    			return response.records.map((row) => {
	    				return {
	    					id: row.Id,
	    					title: row.Name,
	    					createdDate: new Date(row.CreatedDate).getTime(),
	    					dueDate: new Date(row.Due_Date__c).getTime(),
	    					done: row.Done__c,
	    					ownerId: row.OwnerId,
	    				}
	    			})
	    		})
    	}
    },

    Mutation: {
        addTask: (_, {input: { title, ownerId, dueDate}}) => {
    		console.log(`===> SERVER CREATE Task__c`)        	
		    return netCreate('Task__c', {Name: title, ownerId, Due_Date__c: new Date(dueDate).toISOString(), Done__c: false})
		        .then((response) => {
		        	return {
		        		id: response.id,
		        		title,
		        		dueDate,
		        		ownerId,
		        		done: false
		        	}
		        })
        },
        updateTask: (_, { taskId, done }) => {
    		console.log(`===> SERVER UPDATE: Task__c ${taskId}`)        	
		    return netUpdate('Task__c', taskId, {Done__c: done})
		        .then((response) => {
		        	return {
		        		id: taskId,
		        		done
		        	}
		        })
        },
        deleteTask: (_, { taskId }) => {
    		console.log(`===> SERVER DELETE: Task__c ${taskId}`)        	
		    return netDel('Task__c', taskId)
		        .then((response) => {
		        	return {
		        		id: taskId
		        	}
		        })        	
        }
    },

    Person: {
        tasks: (person) => {
        	// TBD
        	return []
        }
    },

    Task: {
        owner: (task) => {
    		console.log(`===> SERVER RETRIEVE: User ${task.ownerId}`)        	
        	return netRetrieve('User', task.ownerId, 'Id, FirstName, LastName')
        		.then((response) => {
        			return {
	        			id: response.Id,
	        			firstName: response.FirstName,
	        			lastName: response.LastName
        			}
        		})
        }
    },    
}

export default resolvers