"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAdmin, validTokenAndAdmin } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { title,salary,equity,companyHandle }
 *
 * Returns { title,salary,equity,companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { title,salary,equity,companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - min salary
 * - equity
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const filters = req.query;
	// convert string form of salary filter to number, if present
	if (filters.minSalary !== undefined) filters.minSalary = +filters.minSalary;
	// check if hasEquity filter is equal to string form of 'true'. If so, set boolean of true to hasEquity, otherwise, set to false
	filters.hasEquity = filters.hasEquity === 'true';

	// validate the info against the job search schema; if not validated, throw error
	try {
		const result = jsonschema.validate(filters, jobSearchSchema);
		if (!result.valid) {
			let listOfErrors = result.errors.map((e) => e.stack);
			throw new BadRequestError(listOfErrors);
		}

		// use model method to query db with applied filters and return the jobs object
		const jobs = await Job.findAll(filters);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[handle]  =>  { company }
 *
 *  Job is { title,salary,equity,companyHandle }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

 router.get('/:id', async function(req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { title,salary,equity }
 *
 * Returns { title,salary,equity,companyHandle }
 *
 * Authorization required: login
 */

router.patch("/:id", validTokenAndAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;