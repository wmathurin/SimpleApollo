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

import {smartstore, smartsync, forceUtil} from 'react-native-force'
import DataLoader from 'dataloader'

runSmartQuery = forceUtil.promiser(smartstore.runSmartQuery);
reSync = forceUtil.promiser(smartsync.reSync);

//
// Note: you need to create custom object on server called Task__c with following custom fields
// - Due_Date__c : DateTime
// - Done__c: Checkbox
//

const makeResolvers = () => {

	const storeConfig = {isGlobalStore: false}


	const runSmartSql = (sql) => {
		return runSmartQuery(storeConfig, 
							 {
								queryType:'smart', 
								smartSql: sql,
								pageSize: 256
							})		
	}

	// Response processors
	const processUserSmartSqllResult = (result) => { 
		return result.currentPageOrderedEntries.map((row) => {
			return {
					id: row.Id,
					firstName: row.FirstName,
					lastName: row.LastName
				}
		})
	}

	const processTaskSmartSqllResult = (result) => { 
		return result.currentPageOrderedEntries.map((row) => {
			return {
				id: row.Id,
				title: row.Name,
				createdDate: new Date(row.CreatedDate).getTime(),
				dueDate: new Date(row.Due_Date__c).getTime(),
				done: row.Done__c,
				ownerId: person.id,
			}
		})
	}

	// Data loader
	const peopleLoader = new DataLoader((ids) => {
		const inClause = ids.map((id) => `'${id}'`).join(',')
		console.log(`===> STORE SmartSql: User ${inClause}`)	
		return runSmartSql(`select {User:Id}, {User:FirstName}, {User:LastName} from {User} where {User:Id} in (${inClause})`)
		.then(processUserSmartSqllResult)
	})	

	return {	
	    Query: {
	    	people: () => {
	    		console.log('===> STORE SmartSql: all User')
	    		return runSmartSql('select {User:Id}, {User:FirstName}, {User:LastName} from {User} where {User:Id}')
	    		.then(processUserSmartSqllResult)
	    		.then((people) => {
	    			people.forEach((person) => {
	    				peopleLoader.prime(person.id, person)
	    			})	    			
	    			return people
	    		})
	    	},

	    	tasks: () => {
	    		console.log('===> STORE SmartSql: all Task__c')
				return runSmartSql('select Id, Name, FORMAT(CreatedDate), FORMAT(Due_Date__c), Done__c, OwnerId from Task__c')
				.then(processTaskSmartSqllResult)
	    	}
	    },

	    Mutation: {
	        addTask: (_, {input: { title, ownerId, dueDate}}) => {
	    		console.log(`===> STORE CREATE Task__c`)
	    		// TBD
	        },
	        updateTask: (_, { taskId, done }) => {
	    		console.log(`===> STORE UPDATE: Task__c ${taskId}`)
	    		// TBD
	        },
	        deleteTask: (_, { taskId }) => {
	    		console.log(`===> STORE DELETE: Task__c ${taskId}`)
	    		// TBD
	        }
	    },

	    Person: {
	        tasks: (person) => {
	    		console.log(`===> STORE SOQL: SmartSql for ${person.id}`)
				return runSmartSql(`select Id, Name, FORMAT(CreatedDate), FORMAT(Due_Date__c), Done__c from Task__c where OwnerId = ${person.id}`)
				.then(processTaskSmartSqllResult)
	        }
	    },

	    Task: {
	        owner: (task) => {
	        	return peopleLoader.load(task.ownerId)
	        }
	    },    
	}
}

export default makeResolvers