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

import {net, smartstore, smartsync, forceUtil} from 'react-native-force'
import DataLoader from 'dataloader'

const runSmartQuery = forceUtil.promiser(smartstore.runSmartQuery);
const upsertSoupEntries = forceUtil.promiser(smartstore.upsertSoupEntries);
const removeFromSoup = forceUtil.promiser(smartstore.removeFromSoup);
const retrieveSoupEntries = forceUtil.promiser(smartstore.retrieveSoupEntries);
 
// ui api
const uiLayout = (objType, mode, callback, error) => net.sendRequest('/services/data', `/${net.getApiVersion()}/ui-api/layout/${objType}`, callback, error, "GET", {mode : mode})
const uiObjectInfo = (objType, callback, error) => net.sendRequest('/services/data', `/${net.getApiVersion()}/ui-api/object-info/${objType}`, callback, error)

netUiLayout = forceUtil.promiser(uiLayout)
netUiObjectInfo = forceUtil.promiser(uiObjectInfo)


//
// Note: you need to create custom object on server called Task__c with following custom fields
// - Due_Date__c : DateTime
// - Done__c: Checkbox
//
const uuidv4 = () => {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		)
}

const promiserNoRejection = (func) => {
	var retfn = function() {
		var args = Array.prototype.slice.call(arguments)

		return new Promise(function(resolve, reject) {
			// then() will be called wether it succeeded or failed
			const callback = () => {
				try {
					resolve.apply(null, arguments)
				}
				catch (err) {
					console.error(err.stack);
				}
			}
			args.push(callback) 
			args.push(callback)
			console.debug("-----> Calling " + func.name)
			func.apply(null, args)
		});
	};
	return retfn;
}

const reSync = promiserNoRejection(smartsync.reSync);

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
	const processUserSmartSqlResult = (result) => { 
		return result.currentPageOrderedEntries.map((row) => {
			return {
				Id: row[0].Id,
				fields: {
					FirstName: row[0].FirstName,
					LastName: row[0].LastName
				}
			}
		})
	}

	const processTaskSmartSqlResult = (fieldInfos, result) => { 
		return result.currentPageOrderedEntries.map((row) => {
			const task = {
				Id: row[0].Id,
				OwnerId: row[0].OwnerId,
				fields: {
				}				
			}

			Object.keys(fieldInfos).forEach((apiName) => {
				task.fields[apiName] = row[0][apiName]
			})

			return task
		})
	}

	// Data loader
	const peopleLoader = new DataLoader((ids) => {
		const inClause = ids.map((id) => `'${id}'`).join(',')
		return reSync(storeConfig, 'syncDownUsers')
		.then(() => runSmartSql(`select {User:_soup} from {User} where {User:Id} in (${inClause})`))
		.then(processUserSmartSqlResult)
	})	

	const objectFieldsLoader = new DataLoader((objTypes) => {
		console.log(`===> SERVER OBJECT-INFO ${objTypes[0]}`)	
		return netUiObjectInfo(objTypes[0])
		.then((response) => [response.fields])
	}, {batch: false})	

	return {	
		Query: {
			people: () => {
				return reSync(storeConfig, 'syncDownUsers')
				.then(() => runSmartSql('select {User:_soup} from {User}'))
				.then(processUserSmartSqlResult)
				.then((people) => {
					people.forEach((person) => {
						peopleLoader.prime(person.id, person)
					})	    			
					return people
				})
			},

			tasks: () => {
				return objectFieldsLoader.load('Task__c')
	    			.then((infos) => { 
	    				fieldInfos = infos; 
	    				return reSync(storeConfig, 'syncDownTasks')
	    			})
	    			.then(() => runSmartSql('select {Task__c:_soup} from {Task__c}'))
					.then((result) => { 
						return processTaskSmartSqlResult(fieldInfos, result) 
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
				// return upsertSoupEntries(storeConfig, 'Task__c', [{
				// 	Id:`local_${uuidv4()}`,
				// 	Name:title, 
				// 	OwnerId:ownerId, 
				// 	Due_Date__c:new Date(dueDate).toISOString()
				// }])
				// .then((result) => {
				// 	return {
				// 		id: result[0].Id,
				// 		title,
				// 		dueDate,
				// 		ownerId,
				// 		done: false
				// 	}
				// })
			},
	        updateTask: (_, { taskId, fieldInputs }) => {
	    		// return runSmartSql(`select {Task__c:_soup} from {Task__c} where {Task__c:Id} = '${taskId}'`)
	    		// .then(processTaskSmartSqlResult)
	    		// .then((tasks) => {
	    		// 	return upsertSoupEntries(storeConfig, 'Task__c', [{
	    		// 		... tasks[0],
	    		// 		done: done
	    		// 	}])
	    		// })
		     //    .then(() => {
		     //    	return {
		     //    		id: taskId,
		     //    		done
		     //    	}
		     //    })
	        },
	        deleteTask: (_, { taskId }) => {
	        	// return removeFromSoup(storeConfig, 'Task__c', {queryType:'exact', indexPath:'Id', matchKey:taskId, order: 'ascending', pageSize:1})
	        	// .then(() => {
	        	// 	return {
	        	// 		id: taskId
	        	// 	}
	        	// })        				        
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