(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
    typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError'; 
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError'; 
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError'; 
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError'; 
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError'; 
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError'; 
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v.replace(/\+/g, " ")) }), {});

        let body;
        // If req stream has ended body has been parsed
        if (req.readableEnded) {
            body = req.body;
        } else {
            body = await parseBody(req);
        }

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }
    		
    		if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k,v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
         function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
    	users: {
    		"35c62d76-8152-4626-8712-eeb96381bea8": {
    			email: "peter@abv.bg",
    			username: "Peter",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"847ec027-f659-4086-8032-5173e2f9c93a": {
    			email: "george@abv.bg",
    			username: "George",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
    			email: "admin@abv.bg",
    			username: "Admin",
    			hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302"
    		}
    	},
    	sessions: {
    	}
    };
    var seedData = {
    	recipes: {
    		"3987279d-0ad4-4afb-8ca9-5b256ae3b298": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Easy Lasagna",
    			img: "assets/lasagna.jpg",
    			ingredients: [
    				"1 tbsp Ingredient 1",
    				"2 cups Ingredient 2",
    				"500 g  Ingredient 3",
    				"25 g Ingredient 4"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551279012
    		},
    		"8f414b4f-ab39-4d36-bedb-2ad69da9c830": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Grilled Duck Fillet",
    			img: "assets/roast.jpg",
    			ingredients: [
    				"500 g  Ingredient 1",
    				"3 tbsp Ingredient 2",
    				"2 cups Ingredient 3"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551344360
    		},
    		"985d9eab-ad2e-4622-a5c8-116261fb1fd2": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Roast Trout",
    			img: "assets/fish.jpg",
    			ingredients: [
    				"4 cups Ingredient 1",
    				"1 tbsp Ingredient 2",
    				"1 tbsp Ingredient 3",
    				"750 g  Ingredient 4",
    				"25 g Ingredient 5"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551388703
    		}
    	},
    	comments: {
    		"0a272c58-b7ea-4e09-a000-7ec988248f66": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			content: "Great recipe!",
    			recipeId: "8f414b4f-ab39-4d36-bedb-2ad69da9c830",
    			_createdOn: 1614260681375,
    			_id: "0a272c58-b7ea-4e09-a000-7ec988248f66"
    		}
    	},
    	records: {
    		i01: {
    			name: "John1",
    			val: 1,
    			_createdOn: 1613551388703
    		},
    		i02: {
    			name: "John2",
    			val: 1,
    			_createdOn: 1613551388713
    		},
    		i03: {
    			name: "John3",
    			val: 2,
    			_createdOn: 1613551388723
    		},
    		i04: {
    			name: "John4",
    			val: 2,
    			_createdOn: 1613551388733
    		},
    		i05: {
    			name: "John5",
    			val: 2,
    			_createdOn: 1613551388743
    		},
    		i06: {
    			name: "John6",
    			val: 3,
    			_createdOn: 1613551388753
    		},
    		i07: {
    			name: "John7",
    			val: 3,
    			_createdOn: 1613551388763
    		},
    		i08: {
    			name: "John8",
    			val: 2,
    			_createdOn: 1613551388773
    		},
    		i09: {
    			name: "John9",
    			val: 3,
    			_createdOn: 1613551388783
    		},
    		i10: {
    			name: "John10",
    			val: 1,
    			_createdOn: 1613551388793
    		}
    	},
    	catches: {
    		"07f260f4-466c-4607-9a33-f7273b24f1b4": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			angler: "Paulo Admorim",
    			weight: 636,
    			species: "Atlantic Blue Marlin",
    			location: "Vitoria, Brazil",
    			bait: "trolled pink",
    			captureTime: 80,
    			_createdOn: 1614760714812,
    			_id: "07f260f4-466c-4607-9a33-f7273b24f1b4"
    		},
    		"bdabf5e9-23be-40a1-9f14-9117b6702a9d": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			angler: "John Does",
    			weight: 554,
    			species: "Atlantic Blue Marlin",
    			location: "Buenos Aires, Argentina",
    			bait: "trolled pink",
    			captureTime: 120,
    			_createdOn: 1614760782277,
    			_id: "bdabf5e9-23be-40a1-9f14-9117b6702a9d"
    		}
    	},
    	furniture: {
    	},
    	orders: {
    	},
    	movies: {
    		"1240549d-f0e0-497e-ab99-eb8f703713d7": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Black Widow",
    			description: "Natasha Romanoff aka Black Widow confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises. Comes on the screens 2020.",
    			img: "https://miro.medium.com/max/735/1*akkAa2CcbKqHsvqVusF3-w.jpeg",
    			_createdOn: 1614935055353,
    			_id: "1240549d-f0e0-497e-ab99-eb8f703713d7"
    		},
    		"143e5265-333e-4150-80e4-16b61de31aa0": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Wonder Woman 1984",
    			description: "Diana must contend with a work colleague and businessman, whose desire for extreme wealth sends the world down a path of destruction, after an ancient artifact that grants wishes goes missing.",
    			img: "https://pbs.twimg.com/media/ETINgKwWAAAyA4r.jpg",
    			_createdOn: 1614935181470,
    			_id: "143e5265-333e-4150-80e4-16b61de31aa0"
    		},
    		"a9bae6d8-793e-46c4-a9db-deb9e3484909": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			title: "Top Gun 2",
    			description: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
    			img: "https://i.pinimg.com/originals/f2/a4/58/f2a458048757bc6914d559c9e4dc962a.jpg",
    			_createdOn: 1614935268135,
    			_id: "a9bae6d8-793e-46c4-a9db-deb9e3484909"
    		}
    	},
    	likes: {
    	},
    	ideas: {
    		"833e0e57-71dc-42c0-b387-0ce0caf5225e": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Best Pilates Workout To Do At Home",
    			description: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Minima possimus eveniet ullam aspernatur corporis tempore quia nesciunt nostrum mollitia consequatur. At ducimus amet aliquid magnam nulla sed totam blanditiis ullam atque facilis corrupti quidem nisi iusto saepe, consectetur culpa possimus quos? Repellendus, dicta pariatur! Delectus, placeat debitis error dignissimos nesciunt magni possimus quo nulla, fuga corporis maxime minus nihil doloremque aliquam quia recusandae harum. Molestias dolorum recusandae commodi velit cum sapiente placeat alias rerum illum repudiandae? Suscipit tempore dolore autem, neque debitis quisquam molestias officia hic nesciunt? Obcaecati optio fugit blanditiis, explicabo odio at dicta asperiores distinctio expedita dolor est aperiam earum! Molestias sequi aliquid molestiae, voluptatum doloremque saepe dignissimos quidem quas harum quo. Eum nemo voluptatem hic corrupti officiis eaque et temporibus error totam numquam sequi nostrum assumenda eius voluptatibus quia sed vel, rerum, excepturi maxime? Pariatur, provident hic? Soluta corrupti aspernatur exercitationem vitae accusantium ut ullam dolor quod!",
    			img: "./images/best-pilates-youtube-workouts-2__medium_4x3.jpg",
    			_createdOn: 1615033373504,
    			_id: "833e0e57-71dc-42c0-b387-0ce0caf5225e"
    		},
    		"247efaa7-8a3e-48a7-813f-b5bfdad0f46c": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "4 Eady DIY Idea To Try!",
    			description: "Similique rem culpa nemo hic recusandae perspiciatis quidem, quia expedita, sapiente est itaque optio enim placeat voluptates sit, fugit dignissimos tenetur temporibus exercitationem in quis magni sunt vel. Corporis officiis ut sapiente exercitationem consectetur debitis suscipit laborum quo enim iusto, labore, quod quam libero aliquid accusantium! Voluptatum quos porro fugit soluta tempore praesentium ratione dolorum impedit sunt dolores quod labore laudantium beatae architecto perspiciatis natus cupiditate, iure quia aliquid, iusto modi esse!",
    			img: "./images/brightideacropped.jpg",
    			_createdOn: 1615033452480,
    			_id: "247efaa7-8a3e-48a7-813f-b5bfdad0f46c"
    		},
    		"b8608c22-dd57-4b24-948e-b358f536b958": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			title: "Dinner Recipe",
    			description: "Consectetur labore et corporis nihil, officiis tempora, hic ex commodi sit aspernatur ad minima? Voluptas nesciunt, blanditiis ex nulla incidunt facere tempora laborum ut aliquid beatae obcaecati quidem reprehenderit consequatur quis iure natus quia totam vel. Amet explicabo quidem repellat unde tempore et totam minima mollitia, adipisci vel autem, enim voluptatem quasi exercitationem dolor cum repudiandae dolores nostrum sit ullam atque dicta, tempora iusto eaque! Rerum debitis voluptate impedit corrupti quibusdam consequatur minima, earum asperiores soluta. A provident reiciendis voluptates et numquam totam eveniet! Dolorum corporis libero dicta laborum illum accusamus ullam?",
    			img: "./images/dinner.jpg",
    			_createdOn: 1615033491967,
    			_id: "b8608c22-dd57-4b24-948e-b358f536b958"
    		}
    	},
    	catalog: {
    		"53d4dbf5-7f41-47ba-b485-43eccb91cb95": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			make: "Table",
    			model: "Swedish",
    			year: 2015,
    			description: "Medium table",
    			price: 235,
    			img: "./images/table.png",
    			material: "Hardwood",
    			_createdOn: 1615545143015,
    			_id: "53d4dbf5-7f41-47ba-b485-43eccb91cb95"
    		},
    		"f5929b5c-bca4-4026-8e6e-c09e73908f77": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			make: "Sofa",
    			model: "ES-549-M",
    			year: 2018,
    			description: "Three-person sofa, blue",
    			price: 1200,
    			img: "./images/sofa.jpg",
    			material: "Frame - steel, plastic; Upholstery - fabric",
    			_createdOn: 1615545572296,
    			_id: "f5929b5c-bca4-4026-8e6e-c09e73908f77"
    		},
    		"c7f51805-242b-45ed-ae3e-80b68605141b": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			make: "Chair",
    			model: "Bright Dining Collection",
    			year: 2017,
    			description: "Dining chair",
    			price: 180,
    			img: "./images/chair.jpg",
    			material: "Wood laminate; leather",
    			_createdOn: 1615546332126,
    			_id: "c7f51805-242b-45ed-ae3e-80b68605141b"
    		}
    	},
    	teams: {
    		"34a1cab1-81f1-47e5-aec3-ab6c9810efe1": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Storm Troopers",
    			logoUrl: "/assets/atat.png",
    			description: "These ARE the droids we're looking for",
    			_createdOn: 1615737591748,
    			_id: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1"
    		},
    		"dc888b1a-400f-47f3-9619-07607966feb8": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Team Rocket",
    			logoUrl: "/assets/rocket.png",
    			description: "Gotta catch 'em all!",
    			_createdOn: 1615737655083,
    			_id: "dc888b1a-400f-47f3-9619-07607966feb8"
    		},
    		"733fa9a1-26b6-490d-b299-21f120b2f53a": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Minions",
    			logoUrl: "/assets/hydrant.png",
    			description: "Friendly neighbourhood jelly beans, helping evil-doers succeed.",
    			_createdOn: 1615737688036,
    			_id: "733fa9a1-26b6-490d-b299-21f120b2f53a"
    		}
    	},
    	members: {
    		"cc9b0a0f-655d-45d7-9857-0a61c6bb2c4d": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
    			status: "member",
    			_createdOn: 1616236790262,
    			_updatedOn: 1616236792930
    		},
    		"61a19986-3b86-4347-8ca4-8c074ed87591": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237188183,
    			_updatedOn: 1616237189016
    		},
    		"8a03aa56-7a82-4a6b-9821-91349fbc552f": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			teamId: "733fa9a1-26b6-490d-b299-21f120b2f53a",
    			status: "member",
    			_createdOn: 1616237193355,
    			_updatedOn: 1616237195145
    		},
    		"9be3ac7d-2c6e-4d74-b187-04105ab7e3d6": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237231299,
    			_updatedOn: 1616237235713
    		},
    		"280b4a1a-d0f3-4639-aa54-6d9158365152": {
    			_ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237257265,
    			_updatedOn: 1616237278248
    		},
    		"e797fa57-bf0a-4749-8028-72dba715e5f8": {
    			_ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
    			teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
    			status: "member",
    			_createdOn: 1616237272948,
    			_updatedOn: 1616237293676
    		}
    	},
        games: {
            "2404d4f3-b38a-44cb-ac31-2b0d12d59ff8": {
                _ownerId: "aba9c004-9543-4cf3-aceb-c77dc9877d13",
                title: "MK3 Ultimate",
                category: "Fighting",
                maxLevel: "10",
                imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Ultimate_MK3.png/220px-Ultimate_MK3.png",
                summary: "Ultimate Mortal Kombat 3 was released to arcades in 1995. It is an update of Mortal Kombat 3, featuring altered gameplay, additional characters, and new arenas. Various home versions of the game were released soon afterward, although none of these were completely identical to the arcade version.",
                _createdOn: 1742980661835,
                _id: "2404d4f3-b38a-44cb-ac31-2b0d12d59ff8"
            },
            "090de244-8313-47f2-bb49-48557f0d08e2":{
                _ownerId: "ccc898a4-e721-4974-8e2b-1471a771c0ba",
                title: "Counter Strike 1.6",
                category: "FPS",
                maxLevel: "98",
                imageUrl: "https://upload.wikimedia.org/wikipedia/en/6/67/Counter-Strike_Box.jpg",
                summary: "Play the world's number 1 online action game. Engage in an incredibly realistic brand of terrorist warfare in this wildly popular team-based game.",
                _createdOn: 1742986026543,
                _id: "090de244-8313-47f2-bb49-48557f0d08e2"
            },
            "495c382b-ed43-47f2-9bcd-78ceac36c937" : {
                _ownerId: "ccc898a4-e721-4974-8e2b-1471a771c0ba",
                title: "Pong",
                category: "arcarde",
                maxLevel: "15",
                imageUrl: "https://cdn.mos.cms.futurecdn.net/9osRHSHiPVZnhZBtN4xWvJ.jpg",
                summary: "Pong is one of the first computer games that ever created, this simple 'tennis like' game",
                _createdOn: 1742986065478,
                _id: "495c382b-ed43-47f2-9bcd-78ceac36c937"
            },
            "ebdbe6a1-51fa-413a-a418-59763ce5f17d" : {
                _ownerId: "ccc898a4-e721-4974-8e2b-1471a771c0ba",
                title: "Deep Rock Galactic",
                category: "Co-op FPS PVE",
                maxLevel: "30",
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202010/1407/2JSde8PFCF6B4nO2EECrcR1m.png",
                summary: "I'm wondering if fighting bugs and moving dirt is the best way to make a living. For Rock and Stone.",
                _createdOn: 1742986115680,
                _id: "ebdbe6a1-51fa-413a-a418-59763ce5f17d"
            },
            "d2160b72-4cba-4990-b89b-2f7cfac22fa6" : {
                _ownerId: "ccc898a4-e721-4974-8e2b-1471a771c0ba",
                title: "Delta Force 1",
                category: "Shooter",
                maxLevel: "30",
                imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a5/DF1-game.JPG",
                summary: "Delta Force 1 is a tactical shooter game where players assume the role of a member of the elite counter-terrorism unit, Delta Force.",
                _createdOn: 1742986245056,
                _id: "d2160b72-4cba-4990-b89b-2f7cfac22fa6"
            }
        },
        projects : {
            "071ed544-015e-47a4-be4f-84fb2482be47" : {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                title: " Euler Hermes/ [Convergence, Group Ticketing]",
                category: "Claims Insurance Software",
                complexityLevel: "15",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Allianz_Trade.png?20230203094644",
                summary: " A member of Allianz, Euler Hermes is the world’s leading credit insurer The line of business dealing with credit insurance \nincludes claims management (Clients indemnification). \nConvergence (CVG) is the group application dedicated to claims management.\n It supports all steps of the claims process: \n● Create / update a file\n ● Assessment \n● Recoveries \n● Settlement \n● Salvages \nConvergence is linked to several other EH Group applications like IMx (Collection management), IRP (Information, Risk \nand Policies), Eolis (the insured portal), FIT+1 (Finance), IDS (Letters), EDM (Archive), EHAAA (Authorization), and \ncommercial applications (Group Galileo, German legacy)",
                environment: "CVG: Java 1.7, Eclipse, WebSphere, Maven, Hibernate, Spring, JSF, DB2",
                _createdOn: 1743244858187,
                _id: "071ed544-015e-47a4-be4f-84fb2482be47"
            },
            "3c1904c9-d526-4292-ba72-a62dea814f8c" : {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                title: "Euro 2020",
                category: "Sport",
                complexityLevel: "6",
                imageUrl: "data:image/jpeg;base64,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",
                summary: " Concerning the Euro 2020 Football Championship, DXC created EURO 2020 as native mobile and web app. \nFlutter is used to develop cross platform applications for Android and iOS. The web version is realized with \nReact.. The back-end part of the app is realized with Spring boot. The project is deployed on the cloud \nenvironment - AWS   Elastic Container (ECS). The notifications services is realized with Firebase cloud \nmessaging.",
                environment: "Spring Boot, AWS (ECS), React, Flutter, MySQL",
                _createdOn: 1743245087565,
                _id: "3c1904c9-d526-4292-ba72-a62dea814f8c"
            },
            "1c70ac5f-eced-4ae7-992d-b2ae2795ad3d" :{
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                title: "MFM Reconciliation, Raiffeisen Bank Romania",
                category: "Bank Software",
                complexityLevel: "9",
                imageUrl: "data:image/png;base64,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",
                summary: " MFM Reconciliation is a web application developed for Raiffeisen Bank Romania. It is to help with \nreconciliation process of Multi-Functional Machines data. It processes input data from files with transactions \ndata and data for machine replenishment. It performs automatic processing where it is possible and allows for\n manual corrections for the rest of cases. At the output, it produces accounting postings for core banking \nsystem and email notifications to feed other business processes. It generates live reports to users for their \nbusiness analysis. Application is deployed as portlet components on IBM WebSphere Portal server and \nintegrates with its user management functionality.",
                environment: " Java EE 6 (Servlet, JSP, Portlet, JPA, Mail); Spring 3.2; Hibernate 4.2; Apache Tiles 2.2; \njQuery 1.8; Junit 4с.12, Oracle Database Server 11g; Gradle 2.x; IBM WebSphere Portal 8.5; IBM WebSphere \nLiberty; Eclipse Mars/Neon 4.5/4.6; SVN / TortoiseSVN; SonarQube 5.6; Oracle SQL Developer 4.x, Remote \nAccess to client’s environments;",
                _createdOn: 1743245931932,
                _id: "1c70ac5f-eced-4ae7-992d-b2ae2795ad3d"
            },
            "86f30371-7b4e-4101-9cb7-79a1b43e1a10" : {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                title: "MyMoneyWorks, Scottish Widows",
                category: "Insurance Software",
                complexityLevel: "12",
                imageUrl: "data:image/png;base64,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",
                summary: " MyMoneyWorks is a corporate wealth management portal to help employees better manage and understand \nwork benefits and pension products. It integrates with external systems to exchange data and implements a \nsingle-sign-on functionality to easy users switch between applications. It is developed and hosted by CSC, \ndesigned with fail-over and disaster recovery functionality. Project is to provide application support services \nand has a subproject to implement further developments of the application. Team is distributed across 3 main \nlocations and uses services of other remote teams. A project was carried out by the team to migrate hosting \nfrom a data centre to cloud IaaS in collaboration with other teams. \nProcess production issues, requests and perform other tasks related to CWMP Support Service operation, \nrespecting SLAs and corresponding policies, procedures and standards.",
                environment: "Java EE, Magnolia CMS 4.1.1 (FTL, STK), jQuery, Seam 2.1.1, XML, Apache Ant, \nEclipse Europa, Bugzilla, SVN, MySQL 5.0, jBoss AS 4.2.2, Apache Web Server, Entrust GetAccess, Entrust \nIdentityGuard, Sun DSEE 6.3, Web browsers (MS IE, Firefox, Chrome), OS (MS Windows, RedHat Enterprise \nLinux 5.0), VMware, CSC Cloud, BMC Remedy IT Service Management, Subversion 1.8.1",
                _createdOn: 1743246447739,
                _id: "86f30371-7b4e-4101-9cb7-79a1b43e1a10"
            },
            "a2fca72a-f9fd-458d-a42d-940e7b6f46d6" : {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                title: " e-GX",
                category: " e-commerce software",
                complexityLevel: "10",
                imageUrl: "data:image/jpeg;base64,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",
                summary: "eGX is the integrated ebusiness solution of GENERIX It covers web front office functionalities, which can be \nused as a complement to the management functions already available in GENERIX (known as the back office\n system). eGX includes e-commerce, e-catalogues, eprocurement (invitations to tender, marketplaces) and e\nservices functions as well as a software suite designed for Intranet use. The eGX solution is a full package \nboth functional and technical – that can build a site (be it Intranet, Extranet or Internet). They presume the \nimplementation of management modules used for the back-office system base data and processes – in \naccordance with the required coverage. ",
                environment: " Java, SQL, XML, XSLT, Javascript, J2SDK 1.3, J2SDK 1.4.2_3, Apache Ant 1.5.2, \nOC4J 9.0.4, JDevelopper 10.1.3.2.0, Subversion 1.6.2, Oracle SQL Developer 1.5.1, Eclipse 3.4.1, Mantis Bug \ntracking system",
                _createdOn: 1743246849612,
                _id: "a2fca72a-f9fd-458d-a42d-940e7b6f46d6"
            },   
        },
    };
    var rules$1 = {
    	users: {
    		".create": false,
    		".read": [
    			"Owner"
    		],
    		".update": false,
    		".delete": false
    	},
    	members: {
    		".update": "isOwner(user, get('teams', data.teamId))",
    		".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
    		"*": {
    			teamId: {
    				".update": "newData.teamId = data.teamId"
    			},
    			status: {
    				".create": "newData.status = 'pending'"
    			}
    		}
    	}
    };
    var settings = {
    	identity: identity,
    	protectedData: protectedData,
    	seedData: seedData,
    	rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = process.env.PORT || 3030;

    server.listen(port);

    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = server;

    return softuniPracticeServer;

})));
