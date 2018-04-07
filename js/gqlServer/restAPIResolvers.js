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

import {net, forceUtil} from 'react-native-force'
import DataLoader from 'dataloader'

netCreate = forceUtil.promiser(net.create)
netRetrieve = forceUtil.promiser(net.retrieve)
netUpdate = forceUtil.promiser(net.update)
netDel = forceUtil.promiser(net.del)
netQuery = forceUtil.promiser(net.query)

// ui api
const uiLayout = (objType, mode, callback, error) => net.sendRequest('/services/data', `/${net.getApiVersion()}/ui-api/layout/${objType}`, callback, error, "GET", {mode : mode})
const uiObjectInfo = (objType, callback, error) => net.sendRequest('/services/data', `/${net.getApiVersion()}/ui-api/object-info/${objType}`, callback, error)

netUiLayout = forceUtil.promiser(uiLayout)
netUiObjectInfo = forceUtil.promiser(uiObjectInfo)

//
// Note: you need to create custom object on server called Task__c with at least the following custom fields
// - Due_Date__c : DateTime
// - Done__c: Checkbox
//

const makeResolvers = () => {


	// Response processors
	const processUserSoqlResponse = (response) => { 
		return response.records.map((row) => {
			return {
					Id: row.Id,
					fields: {
						FirstName: row.FirstName,
						LastName: row.LastName
					}
				}
		})
	}

	const processTaskSoqlResponse = (fieldInfos, response) => { 
		return response.records.map((row) => {
			const task = {
				Id: row.Id,
				OwnerId: row.OwnerId,
				fields: {
				}				
			}

			Object.keys(fieldInfos).forEach((apiName) => {
				task.fields[apiName] = row[apiName]
			})

			return task
		})
	}


	const extractFieldSpecs = (fieldInfos, response) => {
		const layoutItems = []
		response.sections.forEach(
			(s) => s.layoutRows.forEach(
				(lr) => lr.layoutItems.forEach(
					(li) => layoutItems.push(li)
					)
				)
			)

		return layoutItems
			.filter((li) => !!li.layoutComponents[0].apiName)
			.map((li) => {
				const apiName = li.layoutComponents[0].apiName
				return {
					name: apiName,
					type: fieldInfos[apiName].dataType,
					label: li.label
				}
			})
	}

	// Data loaders
	const peopleLoader = new DataLoader((ids) => {
		const inClause = ids.map((id) => `'${id}'`).join(',')
		console.log(`===> SERVER SOQL: User ${inClause}`)	
		return netQuery(`select Id, FirstName, LastName from User where Id in (${inClause})`)
				.then(processUserSoqlResponse)
	})

	const objectFieldsLoader = new DataLoader((objTypes) => {
		console.log(`===> SERVER OBJECT-INFO ${objTypes[0]}`)	
		return netUiObjectInfo(objTypes[0])
		.then((response) => [response.fields])
	}, {batch: false})

	return {	
	    Query: {
	    	people: () => {
	    		console.log('===> SERVER SOQL: all User')
	    		return netQuery(`select Id, FirstName, LastName from User LIMIT 256`)
    				.then(processUserSoqlResponse)
		    		.then((people) => {
						people.forEach((person) => {
							peopleLoader.prime(person.Id, person)
						})	    			
						return people
		    		})
	    	},

	    	tasks: () => {
	    		console.log('===> SERVER SOQL: all Task__c')
	    		return objectFieldsLoader.load('Task__c')
	    			.then((infos) => { 
	    				fieldInfos = infos; 
	    				return netQuery(`select ${Object.keys(fieldInfos).join(',')} from Task__c LIMIT 256`)
	    			})
					.then((response) => { 
						return processTaskSoqlResponse(fieldInfos, response) 
					})
	    	},

	    	taskLayout: (_, { mode }) => {
	    		console.log(`===> SERVER LAYOUT: Task__c ${mode}`)
	    		var fieldInfos;
	    		return objectFieldsLoader.load('Task__c')	    		
	    			.then((infos) => { 
	    				fieldInfos = infos; 
	    				return netUiLayout('Task__c', 'Create') 
	    			})
	    			.then((response) => { 
	    				return extractFieldSpecs(fieldInfos, response) 
	    			})
	    	},
	    },

	    Mutation: {
            addTask: (_, { ownerId, fieldInputs }) => {            
	    		console.log(`===> SERVER CREATE Task__c`)  
			    return netCreate('Task__c', {...fieldInputs, OwnerId: ownerId})
			        .then((response) => {
			        	return {
			        		Id: response.id,
			        		OwnerId: ownerId,
			        		fields: fieldInputs
			        	}
			        })
	        },
	        updateTask: (_, { taskId, fieldInputs }) => {
	    		console.log(`===> SERVER UPDATE: Task__c ${taskId}`)        	
			    return netUpdate('Task__c', taskId, fieldInputs)
			        .then((response) => {
			        	return {
			        		Id: taskId,
			        		fields: fieldInputs
			        	}
			        })
	        },
	        deleteTask: (_, { taskId }) => {
	    		console.log(`===> SERVER DELETE: Task__c ${taskId}`)        	
			    return netDel('Task__c', taskId)
			        .then((response) => {
			        	return {
			        		Id: taskId
			        	}
			        })        	
	        }
	    },

	    Task: {
	        owner: (task) => {
	        	return peopleLoader.load(task.OwnerId)
	        }
	    },    
	}
}

export default makeResolvers