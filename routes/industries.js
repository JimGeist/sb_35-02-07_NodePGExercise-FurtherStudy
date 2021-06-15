/** Routes for industries for BizTime. */

const db = require("../db");
const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const { prepareInsertData } = require("../helperFx");
const { dbSelectIndustryJoin, dbInsert } = require("../dbFunctions");
const router = express.Router();


/** GET {/industries}/ ; return {industries: [{code, industry, companies: [code, ...]}, ...]}  */
router.get("/", async function (req, res, next) {
    //  route gets and returns all industries in the industries table and codes of all 
    //   the companies that are affiliated with the industry.
    //
    //  return:
    //      {industries: [{code, industry, companies: [code, ...]}, ...]}

    const results = await dbSelectIndustryJoin();

    if (results.success) {
        return res.json({ industries: results.sqlReturn })
    } else {
        const errorSelect = new Error(results.error.message);
        errorSelect.status = 400;
        return next(errorSelect);
    }

});


/** POST {/industries}/[code] ; return {industry: {code, industry, companies: [code, ...]}} */
router.post("/:code", async function (req, res, next) {
    /*  Route associates a company, code passed in request body, with the industry indicated by the 
         code in the params / url.
        Returns:
         {industry: {code, industry, companies: [code, ...]}}
     
        '404' is returned when the industry or company is not found.

        post over put because a row will get inserted into the companies_industries table.

    */

    const requiredKeys = ["code"];
    const optionalKeys = [];

    const indCode = req.params.code;

    const resultsPreparation = prepareInsertData(requiredKeys, optionalKeys, req.body);
    if (resultsPreparation.success === false) {
        // An error occurred while validating the data when success is false.
        // const errorValidation = new Error(resultsPreparation["error"]);
        // bad request (400) -- required fields are missing.
        const errorValidation = new Error(resultsPreparation.error);
        errorValidation.status = 400;
        return next(errorValidation);
    }

    // add the indCode to the argumentsNbr, argumentsName, and argumentsValues
    let nbrOfValues = resultsPreparation.insertData.argumentsValues.length + 1;
    resultsPreparation.insertData.argumentsNbr = `${resultsPreparation.insertData.argumentsNbr}, $${nbrOfValues}`;
    // Company is in argumentsName as 'code'. For the companies_industries table, we need it as comp_code.
    // Rewrite the string and use 'comp_code' instead of 'code' and add 'ind_code'.
    resultsPreparation.insertData.argumentsName = `comp_code, ind_code`;
    resultsPreparation.insertData.argumentsValues.push(indCode);

    const resultsInsert = await dbInsert(resultsPreparation.insertData, "companies_industries",
        resultsPreparation.insertData.argumentsName);

    if (resultsInsert.success) {
        // successful insert - select to get the companies.
        const selectData = {
            criteria: "WHERE ind.code = $1",
            criteriaValues: [indCode]
        }
        const results = await dbSelectIndustryJoin(selectData);
        if (results.success) {
            return res.status(201).json({ industry: results.sqlReturn });
        } else {
            const errorSelect = new Error(results.error.message);
            errorSelect.status = 400;
            return next(errorSelect);
        }

    } else {
        const errorInsert = new Error(resultsInsert.error.message);
        errorInsert.status = 400;
        return next(errorInsert);
    }


})


/** POST {/industries}/ ; Returns: {industry: {code, industry}}  */
router.post("/", async function (req, res, next) {
    //  Route adds an industry. industry is required and needs to have a value in 
    //   the request body. code is generated via slugify.
    //  Returns: {industry: {code, industry}}

    const requiredKeys = ["industry"];
    const optionalKeys = [];

    const resultsPreparation = prepareInsertData(requiredKeys, optionalKeys, req.body);
    if (resultsPreparation.success === false) {
        // An error occurred while validating the data when success is false.
        // const errorValidation = new Error(resultsPreparation["error"]);
        // bad request (400) -- required fields are missing.
        const errorValidation = new Error(resultsPreparation.error);
        errorValidation.status = 400;
        return next(errorValidation);
    }

    // Build a slugify code for the industry. 
    // Ideally, since the user has no control over the slug, code would exist that would check the 
    //  slug against the industries table to ensure the slugified code is unique and automatically
    //  alter the slug via sequence numbers until a unique slugified code is found.
    let code = slugify(resultsPreparation.insertData.argumentsValues[0], {
        replacement: '-',  // replace spaces with replacement character, defaults to `-`
        lower: true,       // convert to lower case, defaults to `false`
        locale: 'en'       // language code of the locale to use
    })

    // add the code to the argumentsNbr, argumentsName, and argumentsValues
    let nbrOfValues = resultsPreparation.insertData.argumentsValues.length + 1;
    resultsPreparation.insertData.argumentsNbr = `${resultsPreparation.insertData.argumentsNbr}, $${nbrOfValues}`;
    resultsPreparation.insertData.argumentsName = `${resultsPreparation.insertData.argumentsName}, code`;
    resultsPreparation.insertData.argumentsValues.push(code);

    const resultsInsert = await dbInsert(resultsPreparation.insertData, "industries", `code, ${requiredKeys}`);

    if (resultsInsert.success) {
        // successful insert - return results
        return res.json({ invoice: resultsInsert.sqlReturn });
    } else {
        const errorInsert = new Error(resultsInsert.error.message);
        errorInsert.status = 400;
        return next(errorInsert);
    }

})


module.exports = router;