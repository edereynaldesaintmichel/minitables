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

- ### Normal Minitable
  When using a "normal" minitable, you have to specify the column headers of the table. Also, you need to specify the url to call to get the json data of the table, in the data-url attribute of the table element.

  HTML
  ```html
   <div id="table_container">
      <!-- Table #minitable -->
      <h3 class="mt-5">Normal Minitable</h3>
      <table id="minitable" class="minitable table table-striped table-hover"
          data-url="https://example-url.com">
          <!-- Table Head -->
          <thead>
              <th data-column="login">Login</th>
              <th data-column="id">ID</th>
              <th data-column="node_id">Node ID</th>
              <th data-column="url">URL</th>
              <th data-column="repos_url">Repos URL</th>
              <th data-column="events_url">Events URL</th>
              <th data-column="hooks_url">Hooks URL</th>
              <th data-column="issues_url">Issues URL</th>
              <th data-column="members_url">Members URL</th>
              <th data-column="public_members_url">Public Members URL</th>
              <th data-column="avatar_url">Avatar URL</th>
              <th data-column="description">Description</th>
          </thead>
          <!-- Table Body -->
          <tbody>
              <!-- Dynamic rows will be inserted here -->
          </tbody>
      </table>
  </div>
  ```
  JS
  ```
    const minitable_elem = document.getElementById('minitable');
    const minitable = new MiniTable(minitable_elem);
  ```

  Please note that, in this case, the data retrieved at the given url must have a structure like:

  ```JSON
  {
    "data": [
      {
        "login": "ggobi",
        "id": 423638,
        "node_id": "MDEyOk9yZ2FuaXphdGlvbjQyMzYzOA==",
        "url": "https://api.github.com/orgs/ggobi",
        "repos_url": "https://api.github.com/orgs/ggobi/repos",
        "events_url": "https://api.github.com/orgs/ggobi/events",
        "hooks_url": "https://api.github.com/orgs/ggobi/hooks",
        "issues_url": "https://api.github.com/orgs/ggobi/issues",
        "members_url": "https://api.github.com/orgs/ggobi/members{/member}",
        "public_members_url": "https://api.github.com/orgs/ggobi/public_members{/member}",
        "avatar_url": "https://avatars.githubusercontent.com/u/423638?v=4",
        "description": ""
      },
      {
        "login": "rstudio",
        "id": 513560,
        "node_id": "MDEyOk9yZ2FuaXphdGlvbjUxMzU2MA==",
        "url": "https://api.github.com/orgs/rstudio",
        "repos_url": "https://api.github.com/orgs/rstudio/repos",
        "events_url": "https://api.github.com/orgs/rstudio/events",
        "hooks_url": "https://api.github.com/orgs/rstudio/hooks",
        "issues_url": "https://api.github.com/orgs/rstudio/issues",
        "members_url": "https://api.github.com/orgs/rstudio/members{/member}",
        "public_members_url": "https://api.github.com/orgs/rstudio/public_members{/member}",
        "avatar_url": "https://avatars.githubusercontent.com/u/513560?v=4",
        "description": ""
      }
    ],
    "recordsTotal": 2,
    "recordsFiltered": 2,
  }
  ```
