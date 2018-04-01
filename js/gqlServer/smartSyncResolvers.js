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
		const x = result.currentPageOrderedEntries.map((row) => {
			return {
				id: row[0].Id,
				firstName: row[0].FirstName,
				lastName: row[0].LastName
			}
		})
		console.log("users====>" + JSON.stringify(x))
		return x
	}

	const processTaskSmartSqlResult = (result) => { 
		const x = result.currentPageOrderedEntries.map((row) => {
			return {
				id: row[0].Id,
				title: row[0].Name,
				createdDate: new Date(row[0].CreatedDate).getTime(),
				dueDate: new Date(row[0].Due_Date__c).getTime(),
				done: row[0].Done__c,
				ownerId: row[0].OwnerId,
			}
		})
		console.log("tasks====>" + JSON.stringify(x))
		return x		
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
						peopleLoader.prime(person.id, person)
					})	    			
					return people
				})
			},

			tasks: () => {
				return reSync(storeConfig, 'syncDownTasks')
				.then(() => runSmartSql('select {Task__c:_soup} from {Task__c}'))
				.then(processTaskSmartSqlResult)
			}
		},

		Mutation: {
			addTask: (_, {input: { title, ownerId, dueDate}}) => {
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
			updateTask: (_, { taskId, done }) => {
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

	    Person: {
	    	tasks: (person) => {
	    		return runSmartSql(`select {User:_soup} from {User} where {User:OwnerId} = '${person.id}'`)
	    		.then(processTaskSmartSqlResult)
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