
const { sqlForPartialUpdate } = require("./sql");



describe("sqlForPartialUpdate", function () {
    test("works: 1 item", function () {
        const results = sqlForPartialUpdate(
            { key1: 'val' },
            { key1: 'key_name' });
        expect(results).toEqual({
        setCols: `"key_name"=$1`,
        values: ["val"],
      });
    });
  
    test("works: multiple items", function () {
        const results = sqlForPartialUpdate(
            { keyOne: "val1", keyTwo:'val2' },
            { keyOne: 'key_name1', keyTwo:'key_name2' });
        expect(results).toEqual({
        setCols: `"key_name1"=$1, "key_name2"=$2`,
        values: ['val1','val2'],
        
      });
    });    
});