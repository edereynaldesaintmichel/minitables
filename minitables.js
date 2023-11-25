const con = require('./mysql').con;

let functions = {};
functions.generateSQL = (initial_select, columns, from, group_by, query_data, initial_where = null) => {
    let where = initial_where || ' WHERE 1';
    let having = '';
    let select = initial_select;
    let select_count = "SELECT ";

    for (let column_name in columns) {
        select += `${columns[column_name].column} AS ${column_name}, `;
    }
    select = select.slice(0, -2);

    for (let column_name in query_data.search.columns) {
        let search = query_data.search.columns[column_name];
        let compare;
        if ("true" == search.exact) {
            compare = exactCompare;
        } else {
            compare = regexCompare;
        }
        if (true === columns[column_name].having) {
            having = having ? having : ' HAVING 1';
            select_count += `${columns[column_name].column} AS ${column_name}, `;
            having += ' AND ' + compare(column_name, search.value) + ' ';
        } else {
            where += ' AND ' + compare(columns[column_name].column, search.value) + ' ';
        }
    }
    const order_by = ` ORDER BY ${query_data.order.column} ${query_data.order.dir}`;
    const limit = ` LIMIT ${query_data.start}, ${query_data.length}`;
    
    let sql_count_filtered;
    if (! group_by) {
        sql_count_filtered = 'SELECT COUNT(1) AS nb ' + from + where;
    } else {
        sql_count_filtered = `SELECT SUM(count) AS nb FROM (${select_count} 1 AS count` + from + where + group_by + having + ') truc';
    }

    return {
        sql_data: select + from + where + group_by + having + order_by + limit,
        sql_count_filtered: sql_count_filtered,
    }
}

functions.getData = async (select, columns, from, group_by, query_data, initial_where = null) => {
    const generated_sql = functions.generateSQL(select, columns, from, group_by, query_data, initial_where);
    const data = await con.query(generated_sql.sql_data).catch((error) => {
        console.log(error);
    });

    let count_filtered = 0;

    if (query_data.recordsFiltered && query_data.recordsFiltered != "0") {
        count_filtered = query_data.recordsFiltered;
    } else {
        const result_count_filtered = await con.query(generated_sql.sql_count_filtered).catch((error) => {
            console.log(error);
            return [{nb: 0}];
        });
        count_filtered = result_count_filtered[0].nb;
    }

    return {
        data: data,
        recordsFiltered: count_filtered,
    }

}

function exactCompare(column, search) {
    return `${column} = ${search}`;
}

function regexCompare(column, search) {
    return `UPPER(${column}) REGEXP UPPER('${search}')`;
}


module.exports = functions;