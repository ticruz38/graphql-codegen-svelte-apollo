"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var graphql_1 = require("graphql");
var pascal_case_1 = require("pascal-case");
var visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
module.exports = {
    plugin: function (schema, documents, _a, info) {
        var _b = _a.asyncQuery, asyncQuery = _b === void 0 ? false : _b, clientPath = _a.clientPath, _c = _a.queryOperationPrefix, queryOperationPrefix = _c === void 0 ? '' : _c, _d = _a.queryOperationSuffix, queryOperationSuffix = _d === void 0 ? '' : _d, _e = _a.mutationOperationPrefix, mutationOperationPrefix = _e === void 0 ? '' : _e, _f = _a.mutationOperationSuffix, mutationOperationSuffix = _f === void 0 ? '' : _f, _g = _a.subscriptionOperationPrefix, subscriptionOperationPrefix = _g === void 0 ? '' : _g, _h = _a.subscriptionOperationSuffix, subscriptionOperationSuffix = _h === void 0 ? '' : _h, _j = _a.documentVariableSuffix, documentVariableSuffix = _j === void 0 ? "Doc" : _j, _k = _a.asyncPrefix, asyncPrefix = _k === void 0 ? "Async" : _k, _l = _a.asyncSuffix, asyncSuffix = _l === void 0 ? '' : _l, _m = _a.queryOptionsInterfaceName, queryOptionsInterfaceName = _m === void 0 ? 'SvelteQueryOptions' : _m, _o = _a.subscriptionOptionsInterfaceName, subscriptionOptionsInterfaceName = _o === void 0 ? 'SvelteSubscriptionOptions' : _o, _p = _a.mutationOptionsInterfaceName, mutationOptionsInterfaceName = _p === void 0 ? 'SvelteMutationOptions' : _p, _q = _a.queryResultInterfaceName, queryResultInterfaceName = _q === void 0 ? 'SvelteQueryResult' : _q, config = __rest(_a, ["asyncQuery", "clientPath", "queryOperationPrefix", "queryOperationSuffix", "mutationOperationPrefix", "mutationOperationSuffix", "subscriptionOperationPrefix", "subscriptionOperationSuffix", "documentVariableSuffix", "asyncPrefix", "asyncSuffix", "queryOptionsInterfaceName", "subscriptionOptionsInterfaceName", "mutationOptionsInterfaceName", "queryResultInterfaceName"]);
        var operationTypeFormats = {
            query: {
                prefix: queryOperationPrefix,
                suffix: queryOperationSuffix
            },
            mutation: {
                prefix: mutationOperationPrefix,
                suffix: mutationOperationSuffix
            },
            subscription: {
                prefix: subscriptionOperationPrefix,
                suffix: subscriptionOperationSuffix
            }
        };
        var getDocumentVariableName = function (name) { var _a; return "" + ((_a = config.documentVariablePrefix) !== null && _a !== void 0 ? _a : '') + (0, pascal_case_1.pascalCase)(name) + documentVariableSuffix; };
        var getOperationFunctionName = function (name, operation) {
            var _a = operationTypeFormats[operation], prefix = _a.prefix, suffix = _a.suffix;
            return "" + prefix + (0, pascal_case_1.pascalCase)(name) + suffix;
        };
        var getAsyncOperationFunctionName = function (name) {
            return "" + asyncPrefix + name + asyncSuffix;
        };
        var getOperationVariableName = function (operationName) {
            return operationName + "Variables";
        };
        var allAst = (0, graphql_1.concatAST)(documents.map(function (d) { return d.document; }));
        var allFragments = __spreadArray(__spreadArray([], allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.FRAGMENT_DEFINITION; }).map(function (fragmentDef) { return ({
            node: fragmentDef,
            name: fragmentDef.name.value,
            onType: fragmentDef.typeCondition.name.value,
            isExternal: false
        }); }), true), (config.externalFragments || []), true);
        var visitor = new visitorPluginCommon.ClientSideBaseVisitor(schema, allFragments, {}, __assign(__assign({}, config), { documentVariableSuffix: documentVariableSuffix }), documents);
        var visitorResult = (0, graphql_1.visit)(allAst, { leave: visitor });
        var operations = allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; });
        var hasQuery = operations.some(function (op) { return op.operation == "query"; });
        var hasMutation = operations.some(function (op) { return op.operation == "mutation"; });
        var hasSubscription = operations.some(function (op) { return op.operation == "subscription"; });
        var operationImport = ("" + (hasQuery ? "ApolloQueryResult,ObservableSubscription, ObservableQuery as ApolloObservableQuery, WatchQueryOptions as ApolloWatchQueryOptions, " + (asyncQuery ? "QueryOptions as ApolloQueryOptions, " : "")
            : "") + (hasMutation ? "MutationOptions as ApolloMutationOptions, "
            : "") + (hasSubscription ? "SubscriptionOptions as ApolloSubScriptionOptions, " : "")).slice(0, -2);
        var imports = [
            "import client from \"" + clientPath + "\";",
            "import { gql, " + operationImport + " } from \"@apollo/client/core\";",
            "import { readable, Readable, get } from \"svelte/store\";",
        ];
        var interfaces = [];
        if (hasQuery) {
            interfaces.push("\nexport interface " + queryOptionsInterfaceName + "<TVariables,TData> extends Omit<ApolloWatchQueryOptions<TVariables,TData>,\"query\">{\n  skip?: Readable<boolean>;\n}");
            interfaces.push("\nexport interface " + queryResultInterfaceName + "<TVariables,TData> extends ApolloQueryResult<TData>{\n  query: ApolloObservableQuery<\n    TData,\n    TVariables\n  >;\n  skipped: boolean;\n}");
        }
        if (hasMutation) {
            interfaces.push("\nexport interface " + mutationOptionsInterfaceName + "<TData,TVariables> extends Omit<ApolloMutationOptions<TData,TVariables>,\"mutation\">{ }");
        }
        if (hasSubscription) {
            interfaces.push("\nexport interface " + subscriptionOptionsInterfaceName + "<TVariables,TData> extends Omit<ApolloSubScriptionOptions<TVariables,TData>,\"query\">{ }");
        }
        var extra = [];
        if (hasQuery) {
            extra.push("\nconst alwaysRun = readable(false,() => {});\n      ");
        }
        var ops = operations
            .map(function (o) {
            var op = "" + (0, pascal_case_1.pascalCase)(o.name.value) + (0, pascal_case_1.pascalCase)(visitor.getOperationSuffix(o, o.operation));
            var opv = getOperationVariableName(op);
            var documentVariableName = getDocumentVariableName(o.name.value);
            var functionName = getOperationFunctionName(o.name.value, o.operation);
            var operation;
            if (o.operation == "query") {
                operation = "export const " + functionName + " = ({skip,...options}: " + queryOptionsInterfaceName + "<" + opv + "," + op + ">): Readable<\n            " + queryResultInterfaceName + "<" + opv + "," + op + ">\n          > => {\n            skip ??= alwaysRun;\n            const q = client.watchQuery<" + op + "," + opv + ">({\n              query: " + documentVariableName + ",\n              ...options,\n            });\n            const initialState = { data: {} as " + op + ", loading: true, error: undefined, networkStatus: 1, query: q, skipped: skip? get(skip): false };\n            const result = readable<" + queryResultInterfaceName + "<" + opv + "," + op + ">>(\n              initialState,\n              (set) => {\n                let subscription: ObservableSubscription; \n                const unSubscribeSkip = skip.subscribe(skip => {\n                  if(skip){\n                      if(subscription) subscription.unsubscribe();\n                      set({\n                        ...initialState,\n                        skipped: true\n                      });\n                      return;\n                  }\n                  subscription = q.subscribe({\n                    error: error => ({\n                      data: {} as " + op + ",\n                      loading: false,\n                      error,\n                      networkStatus: 8,\n                      query: q\n                    }),\n                    next: (v) => {\n                      set({ ...v, query: q });\n                    }\n                  });\n                });\n                return () => {\n                  if(subscription) subscription.unsubscribe();\n                  unSubscribeSkip();\n                }\n              }\n            );\n            return result;\n          }\n        ";
                if (asyncQuery) {
                    var asyncOperationFunctionName = getAsyncOperationFunctionName(functionName);
                    operation =
                        operation +
                            ("\n              export const " + asyncOperationFunctionName + " = (options: ApolloQueryOptions<" + opv + ">) => {\n                return client.query<" + op + ">({query: " + documentVariableName + ", ...options})\n              }\n            ");
                }
            }
            if (o.operation == "mutation") {
                operation = "export const " + functionName + " = (\n            options: " + mutationOptionsInterfaceName + "<" + op + "," + opv + ">\n          ) => {\n            const m = client.mutate<" + op + ", " + opv + ">({\n              mutation: " + documentVariableName + ",\n              ...options,\n            });\n            return m;\n          }";
            }
            if (o.operation == "subscription") {
                operation = "export const " + functionName + " = (\n            options: " + subscriptionOptionsInterfaceName + "<" + opv + "," + op + ">\n          ) => {\n            const q = client.subscribe<" + op + ", " + opv + ">(\n              {\n                query: " + documentVariableName + ",\n                ...options,\n              }\n            )\n            return q;\n          }";
            }
            return operation;
        })
            .join("\n");
        return {
            prepend: __spreadArray(__spreadArray(__spreadArray([], imports, true), interfaces, true), extra, true),
            content: __spreadArray(__spreadArray([
                visitor.fragments
            ], visitorResult.definitions.filter(function (t) { return typeof t == "string"; }), true), [
                ops,
            ], false).join("\n")
        };
    },
    validate: function (schema, documents, config, outputFile, allPlugins) {
        if (!config.clientPath) {
            console.warn("Client path is not present in config");
        }
    }
};
