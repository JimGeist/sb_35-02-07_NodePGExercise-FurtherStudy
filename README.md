# sb_35-02-07_NodePGExercise-FurtherStudy

## Assignment Details

Build a REST-ful backend API server for a simple company / invoice tracker. Code needed to take advantage of express routing.

Further Study portion involved writing test cases (didn't happen), using slugify, allow paying of invoices, adding a many-to-many relationship for companies and industries. A company may have 0:M industries and an 
industry may have 0:M companies. 

The following routes were added to support the new company and industry relationship

**`GET /industries`** - returns all industries and company codes for all companies in that industry. 

- Response: `industries: [{code, industry, companies: [code, ...]}, ...]}`


**`POST /industries/<code>`** - associates a company, company code passed in via request data, with the industry code.

- Request data: `{"code": company code}`.

- Response: `industry: {code, industry, companies: [code, ...]}} `



**`POST /industries`** - adds a new industry. The request only needs to include the `industry` because the code is 'slugified' from `industry`.

- Request data: `{"industry": industry text}`

- Response: `industry: {code, industry}`

 
## Technology Stack
- **Front-end**: n/a
- **Back-end**: Node.js and Postgres.


## Additional Details

**Enhancements**
- Refactored the select routes dbSelect and dbSelectAll to (hopefully) correctly implement a promise. The previous version had the `try` / `catch` within the promise. The adjusted code utilizes `.then()` and `.catch`. HOWEVER, `.then()` and `.catch()` both call the `resolve` callback -- `reject` _STILL_ is not used. Calling `reject` in the `.catch()` hangs up the program. The hangup goes away when the `reject` in the `.catch()` is changed to a `resolve`. Messaging is handled by the functions within the route that called the db function.  
- slugify was used for the industry code, not the company code. I wish more discretion was used in some of these exercises -- using text as a primary key to a table?? Really? Additionally, logic should exist to keep trying to insert using variations of the 'slug' since the industry code (or company code) is no longer exposed to the caller.


**Unimplemented Requirements**
- slugify company codes when a company is added.
- Invoice payment was not implemented.
- test cases.
Not that any of the above were difficult, just that it is time to end work on BizTime. 


**Difficulties**
- dbSelectAll was 'fixed' by using `.then()` and `.catch()` within the Promise. HOWEVER, `.then()` and `.catch()` both call the `resolve` callback -- `reject` _STILL_ is not used. Calling `reject` in the `.catch()` hangs up the program and the only way anything is returned from the `.catch()` is when `reject` is changed to `resolve`. From what I have read, the critical piece is that the promise has both `.then()` and `.catch()`, but they make no mention of requiring both `resolve` and `reject`.
- Not really a difficulty, but adding the industries to the company in the `get` was fulfilled by a select on a joined table of industry and companies_industries, similar to how invoices were included for a company. The join, `companies_industries AS ci LEFT JOIN industries AS ind ON ind.code = ci.ind_code` was passed in as the table name for the `FROM` clause. 
- A reduce was crafted to format the data returned from the select query to the format expected by the API. The reduce just felt overly complicated . . . so not sure what my issue is there  :/

