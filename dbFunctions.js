/** Database insert, update, select, and delete functions for BizTime. */

const db = require("./db");
const ExpressError = require("./expressError");


async function dbSelectAll(selectFields, table) {
    /*  dbSelectAll returns all rows from the specified table.
        Only columns specified in selectFields are returned.

        Returns:
            {
                success: true,
                sqlReturn: [all rows found in table],
                error: { message: "" }
            }
        OR for errors:
            {
                success: false,
                sqlReturn: "",
                error: { 
                    message: error that occurred 
                }
            }
    */

    // return a new Promise
    return new Promise(async function (resolve, reject) {

        let result;
        try {
            result = await db.query(`
                SELECT ${selectFields} 
                FROM ${table}  
            `);

            resolve(
                {
                    success: true,
                    sqlReturn: result.rows,
                    error: { message: "" }
                }
            )

        } catch (err) {
            resolve(
                {
                    success: false,
                    sqlReturn: "",
                    error: {
                        message: err
                    }
                }
            );

        }

    });

}


async function dbSelect(selectData, table) {
    /*  dbSelect returns rows from the specified table.
        that satisfy the selection criteria. Select is table agnostic.

        Only columns specified in selectFields are returned.

        selectData is an object that contains
        - criteria, string, the data for the WHERE clause, ie. 'pk = $1'
        - criteriaValues, array, the value(s) for each parameter on the WHERE
            clause.
        - selectFields, string, the fields to include in the select.

        table, string, the table for the SELECT

        Returns:
            {
                success: true,
                sqlReturn: [all rows found in table],
                error: { message: "" }
            }
        OR for errors:
            {
                success: false,
                sqlReturn: "",
                error: { 
                    message: error that occurred 
                }
            }
    */

    // debugger;
    // return a new Promise
    return new Promise(async function (resolve, reject) {

        let result;
        try {
            result = await db.query(`
                SELECT ${selectData.selectFields} 
                FROM ${table} 
                WHERE ${selectData.criteria} 
            `, selectData.criteriaValues);

            if (result.rows.length > 0) {
                if (result.rows.length === 1) {
                    resolve(
                        {
                            success: true,
                            sqlReturn: result.rows[0],
                            error: { message: "" }
                        }
                    )
                } else {
                    resolve(
                        {
                            success: true,
                            sqlReturn: result.rows,
                            error: { message: "" }
                        }
                    )
                }
            } else {
                // no rows returned
                resolve(
                    {
                        success: false,
                        sqlReturn: "",
                        error: {
                            message: "not found"
                        }
                    }
                )
            }

        } catch (err) {
            resolve(
                {
                    success: false,
                    sqlReturn: "",
                    error: {
                        message: err
                    }
                }
            );

        }

    });

}


async function dbInsert(insertData, table, returnFields = "*") {
    /*  dbInsert performs the db insert operation. It is table agnostic.

        insertData, object, needs to contain 3 objects / strings
        - argumentsNbr, string, the parameter numbers, '$1, $2, $3, ... $n' that is 
            build along with the values and returning argument arrays.
        - argumentsValues, array, the values to insert into the table. The values
            are in the same order as the argument numbers -- if $1 is the name, 
            then the first element in the arguments array must be the name value. 
        - argumentsName, string, the fields that are named on the RETURNING clause
            of the INSERT.
        table, string, the table to insert into.
         
        Function returns: 
        {
            success: true/false,
            insertReturn: {db value for each field in argumentsName string},
            error: {
                message: message text
            }
        }

    */

    // return a new Promise
    return new Promise(async function (resolve, reject) {

        let result;
        try {
            result = await db.query(`
                INSERT INTO ${table} (${insertData.argumentsName})  
                VALUES (${insertData.argumentsNbr}) 
                RETURNING ${returnFields} 
            `, insertData.argumentsValues);

            resolve(
                {
                    success: true,
                    sqlReturn: result.rows[0],
                    error: {
                        message: ""
                    }
                }
            )

        } catch (err) {
            // result = error;
            resolve(
                {
                    success: false,
                    insertReturn: "",
                    error: {
                        message: err
                    }
                }
            );

            // reject(
            //     {
            //         success: false,
            //         insertReturn: "",
            //         error: {
            //             message: err
            //         }
            //     }
            // );

        }

    });

}


async function dbUpdate(whereCriteria, updateData, table) {
    /*  dbUpdate performs an update on an existing entry in the database. 
        The update is table agnostic.
        whereCriteria, object, contains the database field name for the primary key and 
         and the value as follow:
            whereCriteria = {
                pk: "code",
                value: req.params.code
            }

        updateData, object, contains 3 arrays
        - argumentsNbr, array, the parameter numbers, '$1, $2, $3, ... $n' that is 
            build along with the values and field names arrays.
        - argumentsValues, array, the values for the update. The values are in the same 
            order as the argument numbers and field names. 
        - argumentsName, array, the fields that are named in the SET clauses and also the
            on the RETURNING clause of the UPDATE. 
        table, string, the table with data to update.
         
        Function returns: 
        {
            success: true/false,
            insertReturn: {db value for each field in argumentsName string},
            error: {
                message: message text
            }
        }

    */

    let setClause = "";
    let returningClause = `${whereCriteria.pk}, `;
    let delim = "";
    let idx = 0;
    for (field of updateData.argumentsName) {
        setClause = `${setClause}${delim}${field} = ${updateData.argumentsNbr[idx]}`;
        returningClause = `${returningClause}${delim}${field}`;
        delim = ", ";
        idx++;
    }
    // where clause is 'pk' = $x  
    // updateData.argumentsNbr has all the $ parameters for the set clause. The length
    //  of the array + 1 is the parameter value for the where.
    let whereClause = `${whereCriteria.pk} = $${(updateData.argumentsNbr.length) + 1}`;
    // argumentsValues align with parameterized $s. Need to include the where value too!
    updateData.argumentsValues.push(whereCriteria.value);
    // debugger;

    // return a new Promise    
    return new Promise(async function (resolve, reject) {

        let result;
        try {
            result = await db.query(`
                UPDATE ${table} 
                SET ${setClause} 
                WHERE ${whereClause}
                RETURNING ${returningClause} 
            `, updateData.argumentsValues);

            if (result.rows.length > 0) {
                resolve(
                    {
                        success: true,
                        sqlReturn: result.rows[0],
                        error: { message: "" }
                    })
            } else {
                resolve(
                    {
                        success: false,
                        sqlReturn: {},
                        error: { message: "not found" }
                    }
                )
            }

        } catch (err) {
            resolve(
                {
                    success: false,
                    sqlReturn: "",
                    error: {
                        message: err
                    }
                }
            );

        }

    });


}


async function dbDelete(deleteData, table) {
    /*  dbDelete deletes row(s) from a table. dbDelete is table agnostic.

        deleteData, object, needs to contain 2 objects / strings
        - criteria, string, this is criteria for the where clause. As an example, 
            for companies, 'code=$1' and for invoices 'id=$1'.
        - criteriaValues, array, the values that replace the $1 ... $n in the 
            parameterized where clause. A value must exist for each $n.
        - argumentsName, string, the fields that are named on the RETURNING clause
            of the DELETE.
        table, string, the table to delete from.
         
        Function returns: 
        {
            success: true/false,
            message: {status: "deleted"},    // message is {} when success=false
            deleted: [deleted row(s)],       // deleted key and value are not present 
                                             //  when success=false
            error: { message: message text } // error is {} when success=true
        }

    */

    // return a new Promise
    return new Promise(async function (resolve, reject) {

        let result;
        try {
            result = await db.query(`
                DELETE FROM ${table}  
                WHERE ${deleteData.criteria} 
                RETURNING ${deleteData.argumentsName}
            `, deleteData.criteriaValues);

            if (result.rows.length > 0) {
                resolve(
                    {
                        success: true,
                        message: { status: "deleted" },
                        deleted: result.rows,
                        error: { message: "" }
                    })
            } else {
                resolve(
                    {
                        success: false,
                        message: {},
                        error: { message: "not found" }
                    }
                )
            }

        } catch (err) {
            // result = error;
            resolve(
                {
                    success: false,
                    message: {},
                    error: {
                        message: err
                    }
                }
            );

        }

    });


}


module.exports = {
    dbSelectAll: dbSelectAll
    , dbSelect: dbSelect
    , dbInsert: dbInsert
    , dbDelete: dbDelete
    , dbUpdate: dbUpdate
}