'use strict';

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /** Create a job (from data), update db, return new company data.
     *
     * data should be { title, salary, equity,company_handle }
     *
     * Returns { title, salary, equity,companyHandle }
     *
     * */
  
    static async create({title,salary,equity,companyHandle}) {
      const result = await db.query(
            `INSERT INTO jobs (title,
                               salary,
                               equity,
                               company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
          [title,salary,equity,companyHandle]);
      let job = result.rows[0];
  
      return job;
  }
  

  
    /** Find all jobs.
     *
     * Returns [{ title, salary, equity,companyHandle }, ...]
     * */
  
    static async findAll(searchFilters = {}) {
      let filterQuery = `SELECT j.id,
                         j.title,
                         j.salary,
                         j.equity,
                         j.company_handle AS "companyHandle",
                         c.name AS "companyName"
                         FROM jobs j LEFT JOIN companies AS c ON c.handle = j.company_handle`;
  
      let queryValues = [];
      let sqlQuery = [];
      const {title,minSalary,hasEquity} = searchFilters
      
      if (minSalary !== undefined) {
        queryValues.push(minSalary);
        sqlQuery.push(`salary >= $${queryValues.length}`);
      }
  
      if (hasEquity  === true) {
        sqlQuery.push(`equity > 0`);
      }
      if (hasEquity === false) {
        sqlQuery.push(`No equity for this position.`);  
      }
  
      if (title !== undefined) {
        queryValues.push(`%${title}%`);
        sqlQuery.push(`title ILIKE $${queryValues.length}`);
      }
      
      if (sqlQuery.length > 0) {
        filterQuery += " WHERE " + sqlQuery.join(" AND ");
      }
      filterQuery = filterQuery + ` ORDER by title`;
      let jobRes = await db.query(filterQuery, queryValues);
      return jobRes.rows;
    }
  
    /** Given a company handle, return data about company.
     *
     * Returns { title, salary, equity,companyHandle}
     *   where companies is [{ handle,name,description,num_employees,logo_url}, ...]
     *
     * Throws NotFoundError if not found.
     **/
  
    static async get(id) {
      const jobs = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`,
          [id]);
  
      const job = jobs.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
      const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, [job.companyHandle]);

      delete job.companyHandle;
      job.company = companiesRes.rows[0];
  
      return job;
    }
  
    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity,companyHandle}
     *
     * Returns {title, salary, equity,companyHandle}
     *
     * Throws NotFoundError if not found.
     */
  
    static async update(id, data) {
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {});
      const idVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id,
                                  title, 
                                  salary, 
                                  equity,
                                  company_handle AS "companyHandle"`;
      const result = await db.query(querySql, [...values, id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      return job;
    }
  
    /** Delete given company from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/
  
    static async remove(id) {
      const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
          [id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
    }
  }
  
  
  module.exports = Job;