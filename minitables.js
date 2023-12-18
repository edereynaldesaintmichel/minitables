
let minitable_instances = [];

let json_minitables = {};

class ObjectToURLString {
    static urlString = (data) => {
        if (data == null) { return ""; }

        const urlParams = new URLSearchParams();
        const rbracket = /\[\]$/;

        const add = (name, valueOrFunction) => {
            const value = typeof valueOrFunction === "function" ? valueOrFunction() : valueOrFunction;
            urlParams.append(name, value == null ? "" : value);
        };

        const buildParams = (prefix, obj) => {
            if (Array.isArray(obj)) {
                obj.forEach((value, index) => {
                    if (rbracket.test(prefix)) {
                        add(prefix, value);
                    } else {
                        const i = typeof value === "object" && value != null ? index : "";
                        buildParams(`${prefix}[${i}]`, value);
                    }
                });
            } else if (typeof obj === "object" && obj != null) {
                for (const [name, value] of Object.entries(obj)) {
                    buildParams(`${prefix}[${name}]`, value);
                }
            } else {
                add(prefix, obj);
            }
        };

        if (Array.isArray(data) || data instanceof NodeList) {
            data.forEach(el => add(el.name, el.value));
        } else {
            for (const [name, value] of Object.entries(data)) {
                buildParams(name, value);
            }
        }

        return urlParams.toString();
    };
}

function sortClientSide() {
    let order_column = this.order.column;
    if (order_column) {
        this.data.sort((a, b) => {
            if (parseFloat(a[order_column]) == a[order_column] && parseFloat(b[order_column]) == b[order_column]) {
                compare = a[order_column] < b[order_column] ? 1 : -1;
            } else {
                compare = String(a[order_column]).localeCompare(b[order_column]);
            }
            if (this.order.dir == 'asc') {
                return -compare;
            } else {
                return compare;
            }
        });
    }
    this.start = 0;
    this.table.dispatchEvent(new CustomEvent('sortComplete'));

    return this;
}

function initDom() {
    let parent_div = this.table.parentNode;
    this.initial_html ??= parent_div.innerHTML;

    let tfoot = document.createElement('tfoot');

    for (let column_header of this.thead_ths) {
        if (column_header.getAttribute('data-sortable') !== false) {
            column_header.classList.add('sortable');
        }
        let th = document.createElement('th');
        th.classList.add('p-0');
        th.innerHTML = `<input data-exact_search="${column_header.getAttribute('data-exact_search')}" data-column="${column_header.getAttribute('data-column')}" class="search_column form-control" placeholder="${column_header.innerHTML.trim()}" style="width: 100%"/>`;
        tfoot.appendChild(th);
    }
    this.table.appendChild(tfoot);
    let wrapper = document.createElement('div');
    wrapper.classList.add('table_wrapper');
    wrapper.id = this.table.id + '_wrapper';
    let wrapper_header = document.createElement('div');
    wrapper_header.id = wrapper.id + '_header';
    wrapper_header.className = 'd-flex mb-3';
    wrapper_header.style.height = '50px';
    wrapper_header.innerHTML = `
    <div class="col-3 d-flex align-items-center p-0">
        <button class="btn btn-secondary reset_filters">RAZ filtres</button>
        <button class="btn btn-success export_csv ms-3">Exporter (csv)</button>
    </div>
    <div class="col-9 justify-content-end align-items-center d-flex p-0">
        <label id="global_search_label" class="mb-0"> 
            <input class="global_search form-control" placeholder="Rechercher sur toutes les colonnes"/>
        </label>
    </div>
    `;

    if (this.serverside) {
        wrapper_header.querySelector('#global_search_label').remove();
    }

    /* Footer */
    let wrapper_footer = document.createElement('div');
    wrapper_footer.className = "row mt-3";
    wrapper_footer.id = wrapper.id + '_footer';
    let pagination_container = document.createElement('div');
    pagination_container.classList.add('col-lg-4');
    let info_container = pagination_container.cloneNode();
    let spacer = pagination_container.cloneNode();
    pagination_container.className = 'col-lg-4 d-flex justify-content-end';
    let nav = document.createElement('nav');
    let ul = document.createElement('ul');
    ul.classList.add('pagination');
    nav.appendChild(ul);
    pagination_container.appendChild(nav);
    wrapper_footer.appendChild(info_container);
    wrapper_footer.appendChild(spacer);
    wrapper_footer.appendChild(pagination_container);

    wrapper.appendChild(wrapper_header);
    wrapper.appendChild(this.table);
    wrapper.appendChild(wrapper_footer);
    parent_div.appendChild(wrapper);
    this.wrapper = wrapper;
    this.info_container = info_container;
    this.pagination = ul;

    let search_columns = this.search.columns;
    for (let column_name in search_columns) {
        let input = this.table.querySelector(`tfoot input[data-column="${column_name}"]`);
        if (input.value != search_columns[column_name].value) {
            input.value = search_columns[column_name].value.replaceAll('\\', '');
        }
    }

    this.table.dispatchEvent(new CustomEvent('initDomComplete'));

    return this;
}


function filterClientSide() {
    let search_columns = this.search.columns;
    let nb_columns_to_search = Object.keys(search_columns).length;

    this.data = this.last_response.data.filter((row) => {
        let counter = 0;
        for (let column_name in search_columns) {
            let column = search_columns[column_name];

            if (column.exact == true) {
                if (column.value != row[column_name]) {
                    return false;
                }
                counter++;
                continue;
            }
            if (!(new RegExp(column.value, 'i')).test(row[column_name])) {
                return false;
            }
            counter++;
        }
        if (nb_columns_to_search == counter) {
            return true;
        }
    });

    let table_columns = this.columns;
    const search_global = this.search.global;
    if (search_global) {
        this.data = this.data.filter((row) => {
            let counter = 0;
            for (let column_name in table_columns) {
                if ((new RegExp(search_global, 'i')).test(row[column_name])) {
                    counter++;
                }
            }
            if (1 <= counter) {
                return true;
            }
        });
    }

    this.start = 0;
    this.records_filtered = this.data.length;

    this.table.dispatchEvent(new CustomEvent('filterComplete'));
    return this;
}


function loadPropertiesFromUrl() {
    let url = new URL(location.href);
    this.start = parseInt(url.searchParams.get('start')) ?? 0;
    this.start = isNaN(this.start) ? 0 : this.start;
    this.on_load_start = this.start;
    try {
        let order = JSON.parse(url.searchParams.get('order'))
        this.order = order ?? this.order;
    } catch (e) {
        console.log(e);
    }
    try {
        let search = JSON.parse(url.searchParams.get('search'))
        this.search = search ?? this.search;
    } catch (e) {
        console.log(e);
    }

    return this;
}



function pushPropertiesToUrl() {
    let url = new URL(location.href);
    let search_params = url.searchParams;
    search_params.set('start', this.start);
    search_params.set('order', JSON.stringify(this.order));
    search_params.set('search', JSON.stringify(this.search));

    window.history.replaceState(null, null, url);

    return this;
}

async function retrieveData() {
    if (this.url == null) {
        return this;
    }
    this.table.dispatchEvent(new CustomEvent('beforeFetchSent'));
    let params = {
        search: this.search,
        order: this.order,
        recordsFiltered: this.records_filtered,
        start: this.start,
        length: this.page_length,
    }
    const url = this.serverside ? this.url + '?' + ObjectToURLString.urlString(params) : this.url;
    let resp = await fetch(url);

    let response = await resp.json();

    this.last_response = response;
    this.data = [...response.data];
    this.records_filtered = response.recordsFiltered ?? this.data.length;
    this.records_total = response.recordsTotal ?? this.data.length;

    this.table.dispatchEvent(new CustomEvent('retrieveDataComplete'));

    return this;
}

function updatePagination() {
    this.pagination.innerHTML = "";
    this.info_container.innerHTML = "";

    let current_page_number = Math.ceil((this.start + 1) / this.page_length);
    let max_page_number = Math.ceil(this.records_filtered / this.page_length);
    let page_numbers = [];

    for (let i = 1; i <= max_page_number; i++) {
        if (i == 1 || i == max_page_number || Math.abs(i - current_page_number) < 2) {
            page_numbers.push(i);
        }
    }

    for (let i = 0; i < page_numbers.length; i++) {
        let page_number = page_numbers[i];

        if (page_numbers[i - 1] && Math.abs(page_number - page_numbers[i - 1]) > 1) {
            let li_dot = document.createElement('li');
            li_dot.className = 'page-item disabled';
            li_dot.innerHTML = `<a href="#!" class="page-link" disabled>...</a>`;
            this.pagination.appendChild(li_dot);
        }

        let li = document.createElement('li');
        li.classList.add('page-item');
        if (page_number == current_page_number) {
            li.classList.add('active');
        }
        li.innerHTML = `<a href="#!" class="page-link" data-start="${(page_number - 1) * this.page_length}">${page_number}</a>`;
        this.pagination.appendChild(li);
    }

    this.info_container.innerHTML = `Résultats ${this.start} à ${Math.min(this.start + this.page_length, this.records_filtered)} sur ${this.records_filtered}`;

    this.table.dispatchEvent(new CustomEvent('updatePaginationComplete'));

    return this;
}

function render() {
    this.table.style.tableLayout = "auto";
    for (let column in this.columns) {
        this.columns[column].th.classList.remove('sort_asc', 'sort_desc');
        this.columns[column].th.classList.add('sortable');
    }

    if (this.order.column) {
        let th = this.columns[this.order.column].th;
        th.classList.remove('sortable');
        th.classList.add(`sort_${this.order.dir}`);
    }

    this.updatePagination();

    this.tbody.innerHTML = "";
    let start = this.serverside ? 0 : this.start;
    let max = this.serverside ? Math.min(this.page_length, this.data.length) : Math.min(this.data.length, this.start + this.page_length);
    for (let i = start; i < max; i++) {
        let row_data = this.data[i];
        let tr = document.createElement('tr');
        tr.setAttribute('data-id', row_data.id);
        tr.setAttribute('data-row', JSON.stringify(row_data));
        tr.classList.add(this.created_row_class);
        for (let column in this.columns) {
            if (typeof row_data[column] == 'undefined') {
                continue;
            }
            let td = document.createElement('td');
            let span = document.createElement('span');
            span.innerText = row_data[column];
            td.appendChild(span);
            tr.appendChild(td);
        }
        this.rows.push(tr);
        this.tbody.appendChild(tr);
        this.table.dispatchEvent(new CustomEvent('rowCreated', { detail: { row: tr, data: row_data } }));
    }
    if (this.pushPropertiesToUrl) {
        this.pushPropertiesToUrl();
    }

    this.table.dispatchEvent(new CustomEvent('renderComplete', { bubbles: true }));
    if (this.serverside) {
        return this;
    }

    return this;
}



function sort() {
    if (this.serverside) {
        return this.sortServerSide();
    }
    return this.sortClientSide();
}

function filter() {
    for (let column_name in this.search.columns) {
        let column = this.search.columns[column_name];
        column.value = column.value.replaceAll('\\', "").replaceAll('.', "\\.");
        if (!column.value && column.value != "0") {
            delete this.search.columns[column_name];
        }
    }
    this.search.global = this.search.global.replaceAll('\\', "").replaceAll('.', "\\.");
    if (this.serverside) {
        return this.filterServerSide();
    }
    return this.filterClientSide();
}

async function reload() {
    let start = this.start;
    if (this.serverside) {
        (await this.retrieveData()).render();
        return this;
    }
    (await this.retrieveData()).filter().sort();
    this.start = start;
    this.render();
}


async function sortServerSide() {
    this.start = 0;
    let response = await this.retrieveData();
    this.table.dispatchEvent(new CustomEvent('sortComplete'));

    return response;
}

async function filterServerSide() {
    this.records_filtered = 0;
    this.start = 0;
    let response = await this.retrieveData();
    this.table.dispatchEvent(new CustomEvent('filterComplete'));

    return response;
}
function styleThemeAll() {
    let thead_ths = [...this.thead_ths];
    let wrapper_width = this.wrapper.offsetWidth;
    let total_width = thead_ths.reduce((a, b) => {
        return a + b.offsetWidth;
    }, 0);
    let overflow = total_width - wrapper_width;
    if (overflow <= 0) {
        return;
    }
    let index_of_oversized_columns = [];
    let legit_width = 0;
    let i = 0;
    for (let th of thead_ths) {
        if (th.offsetWidth > (wrapper_width / thead_ths.length) * 1.3) {
            index_of_oversized_columns.push(i);
        } else {
            legit_width += th.offsetWidth;
        }
        i++;
    }
    available_width_minus_oversized_columns = wrapper_width - legit_width;

    for (let i = 0; i < thead_ths.length; i++) {
        if (index_of_oversized_columns.indexOf(i) == -1) {
            this.thead_ths[i].style.width = this.thead_ths[i].offsetWidth + 'px';
            continue;
        }
        let new_width = Math.floor(available_width_minus_oversized_columns / index_of_oversized_columns.length);
        if (this.thead_ths[i].offsetWidth > new_width) {
            this.thead_ths[i].style.width = new_width + 'px';
        }
    }
    this.table.style.tableLayout = 'fixed';
}


function exportCSV() {

    const headers_translation = [...this.thead_ths].reduce((a, b) => {
        a[b.getAttribute('data-column')] = b.innerHTML;
        return a;
    }, {});
    const header_array = Object.keys(this.data[0]).reduce((a, b) => {
        a.push(headers_translation[b] ?? b);
        return a;
    }, []);
    const headers = '"' + header_array.join('","') + '"\n';

    let content = this.data.reduce((a, b) => {
        return a + '"' + Object.values(b).join('","') + '"\n';
    }, '');

    let file = window.URL.createObjectURL(new Blob([headers + content]));
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = file;
    a.download = `Export ${document.title} ${(new Date()).toLocaleString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(file);
}

function resetSearchFields() {
    this.wrapper.querySelectorAll('input.search_column').forEach((input) => {
        input.value = '';
    });
    this.wrapper.querySelector('input.global_search').value = "";
}

function initDomCallbackServerSide() {
    for (let column in this.columns) {
        let th = this.columns[column].th;
        th.addEventListener('click', async (e) => {
            if (this.order.column == column) {
                this.order.dir = this.order.dir == 'asc' ? 'desc' : 'asc';
            } else {
                this.order = {
                    column: column,
                    dir: 'asc',
                };
            }

            let response = await this.sort();
            if (response) {
                this.render();
            }
        });
    }

    this.table.querySelectorAll('tfoot input.search_column').forEach((input, index) => {
        for (let event of ['input', 'change', 'clear']) {
            input.addEventListener(event, async (e) => {
                let column = input.getAttribute('data-column');
                let previous_search = this.search.columns[column] ?? { [column]: false };
                if (previous_search.value && previous_search.value == input.value) {
                    return;
                }
                this.search.columns[input.getAttribute('data-column')] = {
                    value: input.value,
                    exact: input.getAttribute('data-exact_search') === 'true',
                };
                let response = await this.filter();
                if (response) {
                    this.render();
                }
            });
        }
    });

    this.table.addEventListener('wheel', async (e) => {
        if (!e.shiftKey) {
            return;
        }
        e.preventDefault();
        if (e.deltaY > 50 && this.start < this.records_filtered - this.page_length) {
            this.start += parseInt(this.page_length);
        } else if (e.deltaY < -50 && this.start > 0) {
            this.start -= parseInt(this.page_length);
        } else {
            return;
        }

        (await this.retrieveData()).render();
    });

    this.wrapper.querySelector('button.reset_filters').addEventListener('click', async (e) => {
        this.start = 0;
        this.search.global = '';
        this.search.columns = {};
        this.order = {
            dir: 'asc',
            column: this.thead_ths[0].getAttribute('data-column'),
        };
        this.resetSearchFields();
        (await this.retrieveData()).render();
    });
}

function initDomCallbackClientSide() {
    for (let column in this.columns) {
        let th = this.columns[column].th;
        th.addEventListener('click', (e) => {
            if (this.order.column == column) {
                this.order.dir = this.order.dir == 'asc' ? 'desc' : 'asc';
            } else {
                this.order = {
                    column: column,
                    dir: 'asc',
                };
            }

            this.sort().render();
        });
    }

    this.table.addEventListener('wheel', (e) => {
        if (!e.shiftKey) {
            return;
        }
        e.preventDefault();
        if (e.deltaY > 50 && this.start < this.records_filtered - this.page_length) {
            this.start += this.page_length;
        } else if (e.deltaY < -50 && this.start > 0) {
            this.start -= this.page_length;
        } else {
            return;
        }

        this.render();
    });

    this.table.querySelectorAll('tfoot input.search_column').forEach((input, index) => {
        for (let event of ['keyup', 'change', 'clear']) {
            input.addEventListener(event, (e) => {
                if ('Shift' == e.key) {
                    return;
                }
                this.search.columns[input.getAttribute('data-column')] = {
                    value: input.value,
                    exact: input.getAttribute('data-exact_search') === 'true',
                };
                this.filter().sort().render();
            });
        }

    });

    this.wrapper.querySelector('button.reset_filters').addEventListener('click', (e) => {
        this.start = 0;
        this.search.global = '';
        this.search.columns = {};
        this.order = {};
        this.data = this.last_response.data;
        this.resetSearchFields();
        this.filter().sort().render();
    });

    this.wrapper.querySelector('input.global_search').addEventListener('keyup', (e) => {
        this.search.global = e.target.value;
        this.filter().sort().render();
    });
}


function addEventHandlers() {
    this.table.addEventListener('initDomComplete', (e) => {
        this.wrapper.querySelector('button.export_csv').addEventListener('click', async (e) => {
            this.exportCSV();
        });

        if (this.serverside) {
            this.initDomCallbackServerSide();
            return;
        }
        this.wrapper.querySelector('input.global_search').value = this.search.global.replaceAll('\\', '');
        this.initDomCallbackClientSide();
    });

    this.table.addEventListener('updatePaginationComplete', (e) => {
        for (let page_link of this.wrapper.querySelectorAll('.page-link:not(:disabled)')) {
            page_link.addEventListener('click', async (e) => {
                this.start = parseInt(page_link.getAttribute('data-start'));
                if (this.serverside) {
                    await this.retrieveData();
                }
                this.render();
            });
        }
    });

    this.table.addEventListener('renderComplete', (e) => {
        this.styleThemeAll();
    });
}


function initServerSide() {
    (this.loadPropertiesFromUrl().initDom().retrieveData()).then((result) => {
        this.start = this.on_load_start;
        this.render();
    });
    return this;
}

function initClientSide() {
    (this.loadPropertiesFromUrl().initDom().retrieveData()).then((result) => {
        this.filter().sort();
        this.start = this.on_load_start;
        this.render();
    });
}

function destroy() {
    this.table.parentNode.innerHTML = this.initial_html;
    delete json_minitables[this.identifier];
    return null;
}


function refeshJsonTable(data) {
    this.data = data;
    this.render();
}


function MiniTable(table) {
    this.thead_ths = table.querySelectorAll('thead th');
    this.tbody = table.querySelector('tbody');
    this.serverside = table.classList.contains('serverside');
    this.page_length = table.getAttribute('data-page_length') ?? 10;
    this.url = table.getAttribute('data-url');
    this.start = 0;
    this.records_total = 0;
    this.records_filtered = 0;
    this.order = {
        dir: 'desc',
        column: this.thead_ths[0].getAttribute('data-column'),
    };
    this.search = {
        global: '',
        columns: {}
    };
    this.table = table;
    this.created_row_class = this.table.getAttribute('data-created_row_class');

    this.columns = [...this.thead_ths].reduce((a, b, index) => {
        a[b.getAttribute('data-column')] = {
            th: b,
            index: index,
            exact_search: b.getAttribute('data-exact_search')
        };
        return a;
    }, {});
    this.rows = [];

    this.initDom = initDom;
    this.sortClientSide = sortClientSide;
    this.filterClientSide = filterClientSide;
    this.loadPropertiesFromUrl = loadPropertiesFromUrl;
    this.pushPropertiesToUrl = pushPropertiesToUrl;
    this.retrieveData = retrieveData;
    this.updatePagination = updatePagination;
    this.render = render;
    this.sort = sort;
    this.filter = filter;
    this.sortServerSide = sortServerSide;
    this.filterServerSide = filterServerSide;
    this.styleThemeAll = styleThemeAll;
    this.exportCSV = exportCSV;
    this.resetSearchFields = resetSearchFields;
    this.initDomCallbackServerSide = initDomCallbackServerSide;
    this.initDomCallbackClientSide = initDomCallbackClientSide;
    this.addEventHandlers = addEventHandlers;
    this.initServerSide = initServerSide;
    this.initClientSide = initClientSide;
    this.addEventHandlers = addEventHandlers;
    this.reload = reload;
    this.destroy = destroy;

    this.addEventHandlers();

    if (this.serverside) {
        this.initServerSide();
        return;
    }

    this.initClientSide();
}


function JsonMiniTable(table, values) {
    const unique_id = table.getAttribute('data-json_minitable_id');
    this.last_response = { data: values };
    this.data = values;
    this.records_filtered = values.length;
    this.records_total = this.records_filtered
    if (unique_id) {
        console.log(unique_id);
        let table = json_minitables[unique_id];
        table.last_response.data = values;
        table.data = values;
        table.records_filtered = values.length;
        table.records_total = this.records_filtered;
        table.render();
        return table;
    }
    this.initial_html = table.parentNode.innerHTML;
    this.identifier = Math.random().toString(36).slice(-10);
    json_minitables[this.identifier] = this;
    table.setAttribute('data-json_minitable_id', this.identifier);
    table.classList.add('minitable');
    const thead = table.tHead;
    let thead_ths = [];
    for (const column in values[0]) {
        let th = document.createElement('th');
        th.setAttribute('data-column', column);
        th.classList.add('p-2')
        th.innerHTML = column;
        thead.appendChild(th);
        thead_ths.push(th);
    }

    this.thead_ths = thead_ths;
    this.tbody = table.querySelector('tbody');
    this.serverside = false;
    this.page_length = table.getAttribute('data-page_length') ?? 10;
    this.url = table.getAttribute('data-url');
    this.start = 0;
    this.order = {
        dir: 'desc',
        column: this.thead_ths[0].getAttribute('data-column'),
    };
    this.search = {
        global: '',
        columns: {}
    };
    this.table = table;
    this.created_row_class = this.table.getAttribute('data-created_row_class');

    this.columns = [...this.thead_ths].reduce((a, b, index) => {
        a[b.getAttribute('data-column')] = {
            th: b,
            index: index,
            exact_search: b.getAttribute('data-exact_search')
        };
        return a;
    }, {});
    this.rows = [];

    this.initDom = initDom;
    this.updatePagination = updatePagination;
    this.render = render;
    this.sort = sortClientSide;
    this.filter = filterClientSide;
    this.styleThemeAll = styleThemeAll;
    this.exportCSV = exportCSV;
    this.resetSearchFields = resetSearchFields;
    this.initDomCallbackClientSide = initDomCallbackClientSide;
    this.addEventHandlers = addEventHandlers;
    this.initClientSide = initClientSide;
    this.addEventHandlers = addEventHandlers;
    this.destroy = destroy;
    this.refresh = refeshJsonTable;
    this.addEventHandlers();

    this.initDom().render();
}
