'use strict';
class Jobs {
    /** Create a company (from data), update db, return new company data.
     *
     * data should be { handle, name, description, numEmployees, logoUrl }
     *
     * Returns { handle, name, description, numEmployees, logoUrl }
     *
     * Throws BadRequestError if company already in database.
     * */
  
    static async create({ id,title,salary,equity,company_handle }) {
      const duplicateCheck = await db.query(
            `SELECT handle
             FROM jobs
             WHERE id = $1`,
          [id]);
  
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Duplicate job: ${company_handle}`);
  
      const result = await db.query(
            `INSERT INTO jobs
             (id, title, salary, equity,company_handle)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, salary, equity,company_handle AS "company"`,
          [
            id,
            title,
            salary,
            equity,
            company_handle,
          ],
      );
      const company = result.rows[0];
  
      return company;
    }
  
    /** Find all jobs.
     *
     * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
     * */
  
    static async findAll(searchFilters = {}) {
      let filterQuery =
            `SELECT id, title, salary, equity,company_handle as "company"
             FROM jobs`;
  
      let queryValues = [];
      let sqlQuery = [];
      let { title, minSalary, hasEquity } = searchFilters;
      
      if (minSalary !== undefined) {
        queryValues.push(minSalary);
        sqlQuery.push(`salary >= $${queryValues.length}`);
      }
  
      if (hasEquity !== undefined && hasEquity === true) {
        queryValues.push(hasEquity);
        sqlQuery.push(`equity > 0`);
      }
      if (hasEquity !== undefined && hasEquity === false) {
        queryValues.push(hasEquity);
        sqlQuery.push(`equity < 0`);  
      }
  
      if (title !== undefined) {
        queryValues.push(`%${title}%`);
        sqlQuery.push(`title ILIKE $${queryValues.length}`);
      }
      
      if (sqlQuery.length > 0) {
        filterQuery += " WHERE " + sqlQuery.join(" AND ");
      }
      filterQuery = filterQuery + 'ORDER by title';
      let companiesRes = await db.query(filterQuery, queryValues);
      return companiesRes.rows;
    }
  
    /** Given a company handle, return data about company.
     *
     * Returns { handle, name, description, numEmployees, logoUrl, jobs }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/
  
    static async get(id) {
      const companyRes = await db.query(
            `SELECT id, title, salary, equity,company_handle AS "company"
             FROM jobs
             WHERE id = $1`,
          [id]);
  
      const job = companyRes.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      return job;
    }
  
    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
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
                                  company_handle AS "company"`;
      const result = await db.query(querySql, [...values, id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No company: ${id}`);
  
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
  
      if (!job) throw new NotFoundError(`No company: ${id}`);
    }
  }
  
  
  module.exports = Jobs;