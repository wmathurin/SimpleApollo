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

const runSmartQuery = forceUtil.promiser(smartstore.runSmartQuery);
const upsertSoupEntries = forceUtil.promiser(smartstore.upsertSoupEntries);
const removeFromSoup = forceUtil.promiser(smartstore.removeFromSoup);
const retrieveSoupEntries = forceUtil.promiser(smartstore.retrieveSoupEntries);
 
//
// Note: you need to create custom object on server called Task__c with following custom fields
// - Due_Date__c : DateTime
// - Done__c: Checkbox
//
const uuidv4 = () => {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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

	// Hard coded meta-data
    const allTaskFieldSpecs = [
        { Id:uuidv4(), name:'Name', type: 'String', label: 'Title'},
        { Id:uuidv4(), name:'CreatedDate', type: 'DateTime', label: 'Created Date'},
        { Id:uuidv4(), name:'Due_Date__c', type: 'DateTime', label: 'Due Date'},
        { Id:uuidv4(), name:'Done__c', type: 'Boolean', label: 'Status'},
    ]

	const storeConfig = {isGlobalStore: false}

	const runSmartSql = (sql) => {
		return runSmartQuery(storeConfig, 
		{
			queryType:'smart', 
			smartSql: sql,
			pageSize: 256
		})
		.then((result) => {
			return result.currentPageOrderedEntries
		})
	}

	const fixDateFields = (obj) => {
		console.log("obj-1-->" + JSON.stringify(obj))
		Object.keys(obj).map((key) => {
			const value = obj[key]
			if (value instanceof Date || (value instanceof String && !isNaN(new Date(value).getTime()))) {
				obj[key] = new Date(value).toISOString()
			}
		})
		console.log("obj--2->" + JSON.stringify(obj))
		return obj
	}

	// Response processors
	const formatUser = (user) => {
		return {
			Id: user.Id,
			fields: {
				FirstName: user.FirstName,
				LastName: user.LastName
			}		
		}
	}

	const formatTask = (task) => {
		console.log("in-task==>" + JSON.stringify(task))
		const formattedTask = {
			Id: task.Id,
			OwnerId: task.OwnerId,
			fields: {
				Name: task.Name,
				Due_Date__c: task.Due_Date__c,
				Done__c: task.Done__c
			}				
		}
		console.log("out-task==>" + JSON.stringify(formattedTask))
		return formattedTask
	}

	const processUserSmartSqlResult = (rows) => { 
		console.log("rows====>" + JSON.stringify(rows))
		return rows
		.map((row) => formatUser(row[0]))
	}

	const processTaskSmartSqlResult = (rows) => { 
		console.log("rows====>" + JSON.stringify(rows))
		return rows
		.filter((row) => !row[0].__locally_deleted__)
		.map((row) => formatTask(row[0]))
	}

	// Data loader
	const peopleLoader = new DataLoader((ids) => {
		const inClause = ids.map((id) => `'${id}'`).join(',')
		return reSync(storeConfig, 'syncDownUsers')
		.then(() => runSmartSql(`select {User:_soup} from {User} where {User:Id} in (${inClause})`))
		.then(processUserSmartSqlResult)
	})	

	return {	
		Query: {
			people: () => {
				return reSync(storeConfig, 'syncDownUsers')
				.then(() => runSmartSql('select {User:_soup} from {User}'))
				.then(processUserSmartSqlResult)
				.then((people) => {
					people.forEach((person) => {
						peopleLoader.prime(person.Id, person)
					})	    			
					return people
				})
			},

			tasks: () => {
				return reSync(storeConfig, 'syncUpTasks')
				.then(() => reSync(storeConfig, 'syncDownTasks'))
				.then(() => runSmartSql('select {Task__c:_soup} from {Task__c}'))
				.then(processTaskSmartSqlResult)
			},

			taskLayout: (_, { mode }) => {
				switch (mode) {
					case 'Create': return allTaskFieldSpecs.filter((spec) => ['Name', 'Due_Date__c'].includes(spec.name))
					case 'Edit': 
					case 'View': return allTaskFieldSpecs.filter((spec) => ['Name', 'Due_Date__c', 'Done__c'].includes(spec.name))            
				}
			},

		},

		Mutation: {
            addTask: (_, { ownerId, fieldInputs }) => { 
            	console.log("HERE---->")
            	const newTask = { 
            		Id:`local_${uuidv4()}`, 
            		OwnerId: ownerId, 
            		...fieldInputs, 
            		CreatedDate:new Date(),
            		__local__:true, 
            		__locally_created__: true,
            		attributes: {
            			type: 'Task__c'
            		}
            	}

				return upsertSoupEntries(storeConfig, 'Task__c', [fixDateFields(newTask)])
				.then((tasks) => formatTask(tasks[0]))
			},
			updateTask: (_, { taskId, fieldInputs }) => {
				return runSmartSql(`select {Task__c:_soup} from {Task__c} where {Task__c:Id} = '${taskId}'`)
				.then((rows) => {
					const task = rows[0][0]
					const updatedTask = { ... task, ... fieldInputs, __local__: true, __locally_updated__: true }
					return upsertSoupEntries(storeConfig, 'Task__c', [updatedTask])
				})
				.then(() => {
					return {
						Id: taskId,
						fields: fieldInputs
					}
				})
			},
	        deleteTask: (_, { taskId }) => {
	        	return runSmartSql(`select {Task__c:_soup} from {Task__c} where {Task__c:Id} = '${taskId}'`)
	        	.then((rows) => {
	        		const task = rows[0][0]
	        		const deletedTask = { ... task, __local__: true, __locally_deleted__: true }
	        		return upsertSoupEntries(storeConfig, 'Task__c', [deletedTask])
	        	})
	        	.then(() => {
	        		return {
	        			Id: taskId,
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