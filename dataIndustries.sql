\c biztime

-- DROP TABLE IF EXISTS invoices;
-- DROP TABLE IF EXISTS companies;

-- CREATE TABLE companies (
--     code text PRIMARY KEY,
--     name text NOT NULL UNIQUE,
--     description text
-- );

-- CREATE TABLE invoices (
--     id serial PRIMARY KEY,
--     comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
--     amt float NOT NULL,
--     paid boolean DEFAULT false NOT NULL,
--     add_date date DEFAULT CURRENT_DATE NOT NULL,
--     paid_date date,
--     CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
-- );

DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS industries;

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    ind_code text NOT NULL REFERENCES industries ON DELETE CASCADE,
    PRIMARY KEY (comp_code, ind_code)
);


INSERT INTO industries (code, industry)
  VALUES ('manu', 'Manufacturing'),
         ('tech', 'Technology'),
         ('fin', 'Finance'),
         ('eng', 'Engineering'),
         ('comp', 'Computer');

INSERT INTO companies_industries (comp_code, ind_code)
  VALUES ('apple', 'manu'),
         ('apple', 'tech'),
         ('apple', 'comp'),
         ('grummandata', 'comp');

-- INSERT INTO companies
--   VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
--          ('ibm', 'IBM', 'Big blue.');

-- INSERT INTO invoices (comp_Code, amt, paid, paid_date)
--   VALUES ('apple', 100, false, null),
--          ('apple', 200, false, null),
--          ('apple', 300, true, '2018-01-01'),
--          ('ibm', 400, false, null);
--
-- -- test select to show all companies and industries
-- SELECT comp.code, comp.name, ind.code, ind.industry 
-- FROM companies AS comp 
-- LEFT JOIN companies_industries AS ci ON comp.code = ci.comp_code
-- LEFT JOIN industries AS ind ON ind.code = ci.ind_code
-- ;

-- -- test select to show all industries and companies
SELECT ind.code, ind.industry, comp.code 
FROM industries AS ind 
LEFT JOIN companies_industries AS ci ON ind.code = ci.ind_code
LEFT JOIN companies AS comp ON comp.code = ci.comp_code;