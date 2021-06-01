'use strict';

const { BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");
const Job = require("./jobs");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    let newJob = {
        companyHandle: "c1",
        title: "New",
        salary: 1000,
        equity: '1',
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number)
        });
    });
});


/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id:testJobIds[0],
        title: "job1",
        salary: 100,
        equity: '1',
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[1],
        title: "job2",
        salary: 1,
        equity: '.1',
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: testJobIds[2],
        title: "job3",
        salary: 200,
        equity: '0',
        companyHandle: "c3",
        companyName: "C3",
      },
    ]);
  });
  test('find by min salary', async function () {
    let jobs = await Job.findAll({ minSalary: 100 });
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "job1",
        salary: 100,
        equity: '1',
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id : testJobIds[2],
        title: "job3",
        salary: 200,
        equity: '0',
        companyHandle: "c3",
        companyName: "C3",
      },
    ]);
  });
  test('find by has equity', async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id : testJobIds[0],
        title: "job1",
        salary: 100,
        equity: '1',
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id : testJobIds[1],
        title: "job2",
        salary: 1,
        equity: '.1',
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test('find by min salary & has equity', async function () {
    let jobs = await Job.findAll({ minSalary: 1, hasEquity:true });
    expect(jobs).toEqual([
      {
        id :testJobIds[0],
        title: "job1",
        salary: 100,
        equity: '1',
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id : testJobIds[1],
        title: "job2",
        salary: 1,
        equity: '.1',
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test('find by name', async function () {
    let jobs = await Job.findAll({ title: "job1" });
    expect(jobs).toEqual([
        {         
        id : testJobIds[0],
        title: "job1",
        salary: 100,
        equity: '1',
        
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobIds[0]);
    expect(job).toEqual({
      id: testJobIds[0],
      title: "Job1",
      salary: 100,
      equity: "0.1",
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get({ title: "nope" });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeFalsy();
    }
  });
});

/************************************** update */

describe("update", function () {
    let updateData = {
        title: "new",
        salary: 300,
        equity: '.5',
        
  };

    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateData,
        });
    });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, {
        title: "nope",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", testJobIds[0]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeFalsy();
    }
  });
});