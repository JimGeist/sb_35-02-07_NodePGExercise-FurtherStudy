/** Routes for companies of BizTime. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const { prepareInsertData, prepareUpdateData } = require("../helperFx");
const { dbDelete, dbInsert, dbSelect, dbUpdate } = require("../dbFunctions");
const { response } = require("express");
const router = express.Router();


/** GET {/companies}/ ; return{companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {

    try {
        const results = await db.query(
            `SELECT code, name FROM companies`);
        return res.json({ companies: results.rows });

    } catch (error) {
        return next(error);
    }

});

/** GET {/companies}/[code] ; return {company: {code, name, description}} **/
router.get("/:code", async function (req, res, next) {

    const inCode = req.params.code;

    try {
        const results = await db.query(
            `SELECT code, name, description 
            FROM companies 
            WHERE code = $1`, [inCode]
        );

        if (results.rows.length > 0) {
            // get the invoices for the company.
            const selectData = {
                criteria: 'comp_code = $1',
                criteriaValues: [inCode],
                selectFields: "id, amt"
            }

            const resultsInvoices = await dbSelect(selectData, "invoices");
            if (resultsInvoices.success) {
                results.rows[0]["invoices"] = resultsInvoices.sqlReturn;
            }







            return res.json({ company: results.rows[0] });
        } else {
            let errorNotFound = new Error(`A company was not found for code '${inCode}'.`);
            errorNotFound.status = 404;
            throw errorNotFound;
        }

    } catch (error) {
        return next(error)
    }

});


/** POST {/companies}/ ; return new company object {company: {code, name, description}} **/
router.post("/", async function (req, res, next) {
    // Route adds a new company is added by using JSON inputs for code, name, and description
    // Returns new company object {company: {code, name, description}}
    // debugger

    // make sure non-blank values exist for code and name.
    // Order of requiredKeys in the list must match the order expected by the insert!!
    const requiredKeys = ["code", "name"];
    const resultsPreparation = prepareInsertData(requiredKeys, ["description"], req.body);
    if (resultsPreparation.success === false) {
        // An error occurred while validating the data when success is false.
        // const errorValidation = new Error(resultsPreparation["error"]);
        // bad request (400) -- required fields are missing.
        const errorValidation = new Error(resultsPreparation.error);
        errorValidation.status = 400;
        return next(errorValidation);
    }

    const resultsInsert = await dbInsert(resultsPreparation.insertData, "companies");

    if (resultsInsert.success) {
        // successful insert - return results
        return res.json({ company: resultsInsert.sqlReturn });
    } else {
        const errorInsert = new Error(resultsInsert.error.message);
        errorInsert.status = 400;
        return next(errorInsert);
    }

});


/** PUT {/companies}/[code] ; return edited company object {company: {code, name, description}} **/
router.put("/:code", async function (req, res, next) {
    // Existing company idenified by code is upadated JSON inputs for name and description
    // Returns edited company object {company: {code, name, description}} when successful or
    //  404 / Company not found when the code was not found.

    // make sure non-blank values exist for code and name.
    // Order of requiredKeys in the list must match the order expected by the insert!!
    const requiredKeys = ["name", "description"];
    const resultsPreparation = prepareUpdateData(requiredKeys, req.body);

    if (resultsPreparation.success === false) {
        // An error occurred while validating the data when success is false.
        // bad request (400) -- fields are missing.
        const errorValidation = new Error(resultsPreparation.error);
        errorValidation.status = 400;
        return next(errorValidation);
    }

    // Update of a company is by the primary key 'code'. value is 
    const criteria = {
        pk: "code",
        value: req.params.code
    }
    const resultsUpdate = await dbUpdate(criteria, resultsPreparation.updateData, "companies");

    if (resultsUpdate.success) {
        // successful update - return results
        return res.json({ company: resultsUpdate.sqlReturn });
    } else {
        if (resultsUpdate.error.message === "not found") {
            const errorUpdate = new Error(`A company was not found for code '${req.params.code}'.`);
            errorUpdate.status = 404;
            return next(errorUpdate);
        } else {
            const errorUpdate = new Error(resultsUpdate.error.message);
            errorUpdate.status = 400;
            return next(errorUpdate);
        }

    }

});


// /** PUT {/companies}/[code] ; return edited company object {company: {code, name, description}} **/
// router.put("/:code", async function (req, res next) {
//     // Existing company idenified by code is upadated JSON inputs for name and description
//     // Returns edited company object {company: {code, name, description}} when successful or
//     //  404 / Company not found when the code was not found.

//     const valueList = [];
//     const code = req.params.code;
//     let updates = "";

//     const requiredKeys = ["name", "description"];
//     const resultsValidation = validateRequired(requiredKeys, req.body, false);
//     validateResults

//     try {
//         const result = await db.query(`
//             UPDATE companies 
//             SET ${updates} 
//             WHERE code = $1
//         `, valueList);

//     } catch (error) {
//         return next(error);
//     }

// });


/** DELETE {/companies}/[code] ; return deleted message {company: {status: "deleted"}} **/
router.delete("/:code", async function (req, res, next) {
    // Deletes a company idenified by code.
    // Returns {company: {status: "deleted"}} upon successful deletion or
    //  404 / Company not found when the code was not found.

    const code = req.params.code;
    const deleteData = {
        criteria: "code=$1",
        criteriaValues: [code],
        argumentsName: "code, name, description",
    }
    const resultsDelete = await dbDelete(deleteData, "companies");

    if (resultsDelete.success) {
        // return res.json({ deleted: resultsDelete.deleted });
        return res.json(resultsDelete.message);

    } else {
        if (resultsDelete.error.message === "not found") {
            const errorDelete = new Error(`A company was not found for code '${code}'.`);
            errorDelete.status = 404;
            return next(errorDelete);
        } else {
            const errorDelete = new Error(resultsDelete.error.message);
            errorDelete.status = 400;
            return next(errorDelete);
        }

    }

});


module.exports = router;