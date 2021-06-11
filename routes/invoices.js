/** Routes for invoices of BizTime. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const { checkNumbers, prepareInsertData, prepareUpdateData } = require("../helperFx");
const { dbSelect, dbSelectAll, dbDelete, dbInsert, dbUpdate } = require("../dbFunctions");
const { response } = require("express");
const router = express.Router();


/** GET {/invoices}/ ; return {invoices: [{id, comp_code}, ...]}  */
router.get("/", async function (req, res, next) {
    //  route gets and returns all invoices in the invoices table.
    //
    //  return:
    //      {invoices: [{id, comp_code}, ...]}

    const results = await dbSelectAll("id, comp_code", "invoices");

    if (results.success) {
        return res.json({ invoices: results.sqlReturn })
    } else {
        const errorSelect = new Error(results.error.message);
        errorSelect.status = 400;
        return next(errorSelect);
    }


});


/** GET {/invoices}/[id] ; return {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}} */
router.get("/:id", async function (req, res, next) {
    /*  Route return details about the invoice specified by id. Company details are 
         also included.
        Returns:
         {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
     
        '404' is returned when the invoice is not found.
    */

    let idIn;

    const nbrTest = checkNumbers(req.params.id);
    if (nbrTest.numberIsValid) {
        idIn = nbrTest.validatedNumber;
    } else {
        const errorSelect = new Error(`Invoice id ${nbrTest.message}`);
        errorSelect.status = 400;
        return next(errorSelect);
    }

    const selectData = {
        criteria: "id = $1",
        criteriaValues: [idIn],
        selectFields: "id, amt, paid, add_date, paid_date, comp_code"
    }

    const resultsInvoice = await dbSelect(selectData, "invoices");

    if (resultsInvoice.success) {
        // we need to do a company lookup, but for now, just throw back the invoice.
        // Invoice was a primary key lookup. Only one value should have been returned.
        selectData.criteria = "code = $1";
        selectData.criteriaValues = [resultsInvoice.sqlReturn.comp_code];
        selectData.selectFields = "code, name, description";

        const resultsCompany = await dbSelect(selectData, "companies");

        if (resultsCompany.success) {
            delete resultsInvoice.sqlReturn.comp_code;
            resultsInvoice.sqlReturn["company"] = resultsCompany.sqlReturn
        }

        return res.json({ invoice: resultsInvoice.sqlReturn });

    } else {
        if (resultsInvoice.error.message === "not found") {
            const errorSelect = new Error(`Invoice '${req.params.id}' was not found.`);
            errorSelect.status = 404;
            return next(errorSelect);
        } else {
            const errorSelect = new Error(resultsInvoice.error.message);
            errorSelect.status = 400;
            return next(errorSelect);
        }

    }

})


/** POST {/invoices}/ ; Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}  */
router.post("/", async function (req, res, next) {
    //  Route adds an invoice. comp_code and amt are required and need to have values in 
    //   the request body. paid, add_date are optional and have default valued defined
    //   because they are not nullable.
    //   paid_date is optional and nullable.
    //  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

    const requiredKeys = ["comp_code", "amt"];
    const optionalKeys = ["paid", "add_date", "paid_date"];

    const resultsPreparation = prepareInsertData(requiredKeys, optionalKeys, req.body);
    if (resultsPreparation.success === false) {
        // An error occurred while validating the data when success is false.
        // const errorValidation = new Error(resultsPreparation["error"]);
        // bad request (400) -- required fields are missing.
        const errorValidation = new Error(resultsPreparation.error);
        errorValidation.status = 400;
        return next(errorValidation);
    }

    const resultsInsert = await dbInsert(resultsPreparation.insertData, "invoices", `${requiredKeys}`);

    if (resultsInsert.success) {
        // successful insert - return results
        return res.json({ invoice: resultsInsert.sqlReturn });
    } else {
        const errorInsert = new Error(resultsInsert.error.message);
        errorInsert.status = 400;
        return next(errorInsert);
    }

})



/** PUT {/invoices}/[id] ; returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}   */
router.put("/:id", async function (req, res, next) {
    //  Route updates the invoice indicated by id. comp_code, amt, paid, and paid_date are updatable
    //   fields. Fields and values are in request body.
    //  Successful update returns the changed invoice:
    //   {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
    //  404 is returned when the invoice id was not found.

    const verifyNumber = checkNumbers(req.params.id);
    if (verifyNumber.numberIsValid === false) {
        const errorIdNotNumeric = new Error(`Invoice id ${verifyNumber.message}`);
        errorIdNotNumeric.status = 400;
        return next(errorIdNotNumeric);
    }

    // not sure why the assignment only listed amt as getting passed in the json body. Updates to 
    //  company code, paid (true/false) and paid_date should possible as well. My luck, I will probably
    //  find out why soon enough! 
    const optionalKeys = ["comp_code", "amt", "paid", "paid_date"]

    const resultsPreparation = prepareUpdateData(optionalKeys, req.body);
    if (resultsPreparation.success === false) {
        const errorUpdate = new Error(resultsPreparation.error);
        errorUpdate.status = 404;
        return next(errorUpdate);
    }

    const criteria = {
        pk: "id",
        value: verifyNumber.validatedNumber
    }
    const resultsUpdate = await dbUpdate(criteria, resultsPreparation.updateData, "invoices");

    if (resultsUpdate.success) {
        return res.json({ invoice: resultsUpdate.sqlReturn })
    } else {
        if (resultsUpdate.error.message === "not found") {
            const errorUpdate = new Error(`Invoice '${req.params.id}' was not found.`);
            errorSelect.status = 404;
            return next(errorSelect);
        } else {
            const errorSelect = new Error(resultsUpdate.error.message);
            errorSelect.status = 400;
            return next(errorSelect);
        }
    }
    //     Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}


})




/** DELETE {/invoices}/[id] ; returns {status: "deleted"}  */
router.delete("/:id", async function (req, res, next) {
    //  Route delete the invoice specified by id. 
    //  When invoice successfully deleted, Returns: {status: "deleted"}
    //  and a 404 / not found when invoice id was not found.

    let idIn;

    const nbrTest = checkNumbers(req.params.id);
    if (nbrTest.numberIsValid) {
        idIn = nbrTest.validatedNumber;
    } else {
        const errorDelete = new Error(`Invoice id ${nbrTest.message}`);
        errorDelete.status = 400;
        return next(errorDelete);
    }

    const deleteData = {
        criteria: 'id = $1',
        criteriaValues: [idIn],
        argumentsName: "id, amt, paid, add_date, paid_date, comp_code"
    }

    const resultsDelete = await dbDelete(deleteData, "invoices");
    if (resultsDelete.success) {
        return res.json({ deleted: resultsDelete.deleted });
        // return res.json(resultsDelete.message);
    } else {
        if (resultsDelete.error.message === "not found") {
            const errorSelect = new Error(`Invoice '${req.params.id}' was not found.`);
            errorSelect.status = 404;
            return next(errorSelect);
        } else {
            const errorSelect = new Error(resultsDelete.error.message);
            errorSelect.status = 400;
            return next(errorSelect);
        }
    }
})


module.exports = router;