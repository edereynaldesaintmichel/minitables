# minitables
DataTables equivalent, dependent on Bootstrap 5, but not on jquery.

## Usage:
- ### JsonMinitable
  Any well formatted object can be displayed with minitables.
  HTML:
  ```html
  <div id="json_table_container">
      <h3 class="mt-5">JSON Minitable</h3>
      <!-- Table #minitable_json -->
      <table id="minitable_json" class="table table-striped table-hover">
          <!-- Empty Table Head -->
          <thead>
          </thead>
          <!-- Table Body -->
          <tbody>
              <!-- Dynamic rows will be inserted here -->
          </tbody>
      </table>
  </div>
  ```

  JS: 
  ```javascript
        const values = [
            { first_column: "first_value", second_column: "second_value", numeric_column: 23 },
            { first_column: "alpha", second_column: "beta", numeric_column: 1 },
            { first_column: "charlie", second_column: "delta", numeric_column: 2 },
            { first_column: "echo", second_column: "foxtrot", numeric_column: 3 },
            { first_column: "golf", second_column: "hotel", numeric_column: 4 },
            { first_column: "india", second_column: "juliet", numeric_column: 5 },
            { first_column: "kilo", second_column: "lima", numeric_column: 6 },
            { first_column: "mike", second_column: "november", numeric_column: 7 },
            { first_column: "oscar", second_column: "papa", numeric_column: 8 },
            { first_column: "quebec", second_column: "romeo", numeric_column: 9 },
            { first_column: "sierra", second_column: "tango", numeric_column: 10 },
            { first_column: "uniform", second_column: "victor", numeric_column: 11 },
            { first_column: "whiskey", second_column: "xray", numeric_column: 12 },
            { first_column: "yankee", second_column: "zulu", numeric_column: 13 },
            { first_column: "apple", second_column: "berry", numeric_column: 14 },
            { first_column: "cherry", second_column: "date", numeric_column: 15 },
            { first_column: "elderberry", second_column: "fig", numeric_column: 16 },
        ];
        const json_minitable_elem = document.getElementById('minitable_json');
        const json_minitable = new JsonMiniTable(json_minitable_elem, values);
  ```
