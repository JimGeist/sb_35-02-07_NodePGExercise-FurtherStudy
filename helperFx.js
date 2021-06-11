/* helper functions, mostly validators */

function validateRequired(fieldList, source, allRequired = true) {
    /* Using fieldList, validateRequired, ensures the 
        field exists in the source and cleans the value 
        by removing leading and trailing spaces.

        fieldList is an array of fields. The fields must
         match spelling and case of the key in source.
        source is the source object, typically the request 
         object body.
        
        returns an object with an allValid true/false, the fields 
         and the cleaned values when all valid OR
        an error when any of the fields did not pass the validation.
        {
            allValid: true / false,
            fields {
                keys from fieldList: cleaned values from source obj
            },
            error: errors encountered
        }
         
    */

    const fields = {}
    let allValid = true;
    let ctr = 0;

    let errorValidation = "";
    let errorDelim = "";
    debugger;
    for (const key of fieldList) {
        // if (source[key]) works . . . until source[key] refers to a boolean :/
        //  a boolean set to false no less. Soo the below code is used in place.
        //  I wish I can say it came out of my brain, but it came out of vscode 
        //  when you type 'for' and select forin from the suggestions. 
        // I imagine typeof(source[key]) === "string" is not the best either.
        if (Object.hasOwnProperty.call(source, key)) {
            // key exists 
            if (typeof (source[key]) === "string") {
                fields[key] = source[key].trim();
            } else {
                fields[key] = source[key]
            }

            // keep a count of how many keys were found. We will need to
            //  know when no keys exist when all are not required.
            ctr++;
        } else {
            if (allRequired) {
                // key is missing and all keys are required
                allValid = false;
                errorValidation = `${errorValidation}${errorDelim}'${key}'`;
                errorDelim = ", "
            }
        }
    }

    // build and return results
    if (allValid) {
        return {
            allValid: allValid,
            fields: fields,
            nbrOfFields: ctr,
            error: "",
        };
    } else {
        // Field(s) x required. Missing x,y,z. 
        errorValidation = `Field(s) ${fieldList} required. Missing ${errorValidation}.`;
        return {
            allValid: allValid,
            fields: {},
            error: errorValidation
        }
    }

}


function prepareInsertData(requiredKeys, optionalKeys, requestBody) {
    /*  prepareInsertData prepares Company or Invoice data from the request for eventual
         insert into the database.
        requiredKeys, array, name of each required (not nullable) field. The requestBody
         oject is checked for these fields.
        optionalKeys, arra, name of each optional (nullable) field. These fields will not
         cause an error if missing.
        requestBody, object, the request object body that should contain the keys and values
         for the fields listed in requiredKeys.
    
    */

    // make sure non-blank values exist for code and name.
    // Order of requiredKeys in the list must match the order expected by the insert!!
    // const requiredKeys = ["code", "name"];
    const resultsValidation = validateRequired(requiredKeys, requestBody);

    if (resultsValidation.allValid === false) {
        // bad request (400) -- all fields are needed when adding a company.
        // const errorValidation = new Error(resultsValidation["error"]);
        // errorValidation.status = 400;
        // return next(errorValidation);
        return {
            success: false,
            error: resultsValidation["error"]
        }
    }

    const insertValues = [];
    let ctr = 1;
    let insertArgs = "";
    let insertNames = "";
    let insertDelim = ""
    for (const key of requiredKeys) {
        insertValues.push(resultsValidation.fields[key])
        // build the argument string, $1, $2, ... for the insert by adding to 
        //  insertArgs string each time through the loop.
        insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
        insertNames = `${insertNames}${insertDelim}${key}`;
        ctr++;
        insertDelim = ", ";
    }

    if (optionalKeys.length > 0) {
        // check whether a value exists for the optional key in requestBody.
        let tester;
        for (const key of optionalKeys) {
            if (Object.hasOwnProperty.call(optionalKeys, key)) {
                // optionalKeys were not validated so we need to check them
                if (typeof (requestBody[key]) === "string") {
                    // We have a string. trim and save it when it has a non-zero length.
                    tester = requestBody[key].trim();
                    if (tester.length > 0) {
                        insertValues.push(tester);
                        // the args, names, and ctr stuff are duplicated because
                        //  after trimming, we may have an empty string which we
                        //  can ignore.
                        insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
                        insertNames = `${insertNames}${insertDelim}${key}`;
                        ctr++;
                        insertDelim = ", ";
                    }
                } else {
                    insertValues.push(requestBody[key]);
                    insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
                    insertNames = `${insertNames}${insertDelim}${key}`;
                    ctr++;
                    insertDelim = ", ";
                }
            }

        }
    }

    return {
        success: true,
        insertData: {
            argumentsNbr: insertArgs,
            argumentsName: insertNames,
            argumentsValues: insertValues
        }
    };

}


function prepareUpdateData(requestKeys, requestBody) {
    /*  prepareUpdateData prepares Company data from the request for eventual
         update of an existing company.

        requestKeys, array, is the list of fields we need to check for in requestBody.
         This is an update, so all fields are optional, but at least one is required.

        Update request are issued regardless of whether the data has changed. 

        When no issues occurred while validating fields, function returns
            {
                success: true,
                updateData: {
                    argumentsNbr: [array of $1, $1, ..n],
                    argumentsName: [array of field names],
                    argumentsValues: [array of field values]
                }
            }
        When an error occurred (no requestKeys),
            {
                success: false,
                error: `Field(s) ${fields} are needed for an update. No fields were provided.`
            }
    */

    // debugger

    // validate the request keys. Third parm is false because all requestKeys are NOT required.
    const resultsValidation = validateRequired(requestKeys, requestBody, false);

    // NOTE: no need to check whether resultsValidation.allValid === false
    //  since all fields listed in requestKeys are not required.

    // resultsValidation.fields has the set of fields and cleaned values as
    //  key: value. For the update, we need to split out the keys, values, 
    //  and build a $ paramter list.
    if (resultsValidation.nbrOfFields === 0) {
        // no fields were in request body.
        // build field list for message that resembles
        //  "field1 or field2" OR "field1, field2, or field3"
        let fields = "";
        let fieldsDelim = "";
        let ctr = 1;
        for (const field of requestKeys) {
            fields = `${fields}${fieldsDelim}'${field}'`;
            if (ctr + 1 === requestKeys.length) {
                // add ' or ' to the delimitor. This is the delimiter before the last
                //  field. Handle the two spaces when delimitor already is set to ", ".
                fieldsDelim = (`${fieldsDelim} or `).replace("  ", " ");
            } else {
                fieldsDelim = ", ";
            }
            ctr++;
        }
        return {
            success: false,
            error: `Field(s) ${fields} are needed for an update. No fields were provided.`
        }
    }

    const insertValues = [];
    const fieldValues = [];
    const fieldNames = [];
    const updateArgs = [];
    let ctr = 1;
    for (const key in resultsValidation.fields) {
        // console.log(`for: ctr=${ctr}, key=${key}, resultsValidation.fields[key]= ${resultsValidation.fields[key]}`)
        fieldValues.push(resultsValidation.fields[key]);
        fieldNames.push(key);
        updateArgs.push(`$${ctr}`);
        ctr++;
    }

    return {
        success: true,
        updateData: {
            argumentsNbr: updateArgs,
            argumentsName: fieldNames,
            argumentsValues: fieldValues
        }
    };

}


function checkNumbers(inNumber) {
    /*  checks the values in inNumber to make sure it is indeed a number. 
       
        When inNumber is a number, function returns:
            {
            "numberIsValid": true,
            "validatedNumber": inNumber // where inNumber is returned as a number, not a string.
            }
        When a non-number is encountered, function returns:
            {
            "numberIsValid": false,
            "message" = 'nums=${inNumber}' is invalid. '${inNumber}' is not a number.`
            }
  
    */

    const results = {};

    let nbrText = inNumber * 1;
    if (isNaN(nbrText)) {
        results["numberIsValid"] = false;
        results["message"] = `'${inNumber}' is invalid. '${inNumber}' is not a number.`;
        return results;
    }

    results["numberIsValid"] = true;
    results["validatedNumber"] = inNumber * 1;

    return results;

}


module.exports = {
    checkNumbers: checkNumbers
    , prepareInsertData: prepareInsertData
    , prepareUpdateData: prepareUpdateData
    , validateRequired: validateRequired
};
