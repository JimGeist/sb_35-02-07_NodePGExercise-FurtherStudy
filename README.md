# sb_35-01-11_NodePGExercise

## Assignment Details

Build a REST-ful backend API server for a simple company / invoice tracker. Code needed to take advantage of express routing.

A lot of time went into this exercise. Not because of difficulty, but to truly embrace separations of concerns and to learn node.js better. There were a decent amount of items that came up when the code - the biggest one was adding code for promises. I am truly hoping that all the hours banked on exercises like this one will pay off.


Application has the following routes:

**`GET /companies`** - returns all companies. 

- Response: `companies: [{code, name}, ...]`


**`GET /companies/<code>`** - returns the company and any invoices for the provided `code`. Response is a 404 when a company for `code` was not found.

- Response (no invoices): `company: {code, name, description}` 

- Response (when company has invoices): `company: {code, name, description, invoices: [{id, amt}, ...]}`


**`POST /companies`** - adds a new company. The request must include the `code` and `name`.

- Request data: `{"code": "cisco", "name": "Cisco Systems"}`, desription is optional.

- Response: `company: {code, name, description}`


**`PUT /companies/<code>`** - modifies a companies name and/or description. Response is a 404 when a company for `code` was not found.

- Request data: `{name, desription}` Either a name or a description are required. 

- Response: `company: {code, name, description}`


**`DELETE /companies/<code>`** - deletes the company with `code`. Deleting the company also deletes any invoices for the company.

- Response: `{status: "deleted"}`


The `/invoices/` routes also follow the same structure as the companies. 


## Technology Stack
- **Front-end**: n/a
- **Back-end**: Node.js and Postgres.


## Additional Details

**Enhancements**
- Best attempts were made to keep the routes as void of business logic as possible. Modules were created for database queries (`dbFunctions.js`) and helper functions (`helperFx.js`). 
- Database queries are in their own module, `dbFunctions.js`. Get `/companies` and `/companies/<coode>` are the only calls that do not fully take advantage of the queries.  
- Functions exist to retrieve the data from the request body instead of doing this in the route. The pieces created to validate company fields were generic enough that the functions also worked to validate invoice values.
- Database functions are not table specific. The validators build the parameterized ($-numbered) string, and arrays of values and field names. 
- Code has more comments than usual in the body of a function more so I have a good reference point. I definitely found a benefit of clearly listing the inputs and returns at the top of the function because it made setting up the calls easier.
- The invoices calls were implemented with ease because the database functions and validators already existed from the companies route build out. The only database functions that were created for invoices were dbSelect and dbSelectAll. I did not go back to the get `/companies` routes to use the db functions. Get `companies/<code>` partially uses dbSelect function call. It calls the function to get the invoices based on company code. And again, the where clauses are parameterized and easily accomodated the where comp_code = xxxx.


**Difficulties**

Wow. I kind of went bat-crap crazy on this one. There were pieces of Node.js that I just was not familiar with. A lot of this exercise was typing in code instead of cutting and pasting. The Express Error and really shell of the program in app.js is not something I can create on my own.

Breaking up the code brought up issues that forced me to implement promises. It also made me realize that my functions, while getting better length wise are still too long, but they do focus on one task -- instead of get data, validate data, and stuff data in table.

While on the topic of promises, the database functions do not have a `reject` only `resolve`, even in the `catch(err)`. When the `catch` did use a `reject`, the program would hang and not return anything and would work fine when the `reject` was changed to `resolve`.

When checking whether the 'key' exists in the request body, the falsey `if (source[key])` did work . . until we had `source[paid]`, a boolean, and sometimes a false boolean. Field existed but it was getting ignored. The workaround was to use `if (Object.hasOwnProperty.call(source, key))`. I know about `Object.keys(source)` to get a list of keys in the object. I only became aware of `if (Object.hasOwnProperty.call(source, key))` because vscode would inject it when a forin loop was selected from the suggestions.

While best attempts were made to keep the routes clear of business logic, there are still bits were returns from validators are checked. I am not sure what the approach is and I tend to return the error to the place where the function was called and handle the error. 


