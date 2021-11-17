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
        var _b = _a.asyncQuery, asyncQuery = _b === void 0 ? false : _b, clientPath = _a.clientPath, _c = _a.includeRxStoreUtils, includeRxStoreUtils = _c === void 0 ? false : _c, _d = _a.queryOperationPrefix, queryOperationPrefix = _d === void 0 ? '' : _d, _e = _a.queryOperationSuffix, queryOperationSuffix = _e === void 0 ? '' : _e, _f = _a.mutationOperationPrefix, mutationOperationPrefix = _f === void 0 ? '' : _f, _g = _a.mutationOperationSuffix, mutationOperationSuffix = _g === void 0 ? '' : _g, _h = _a.subscriptionOperationPrefix, subscriptionOperationPrefix = _h === void 0 ? '' : _h, _j = _a.subscriptionOperationSuffix, subscriptionOperationSuffix = _j === void 0 ? '' : _j, _k = _a.documentVariableSuffix, documentVariableSuffix = _k === void 0 ? "Doc" : _k, _l = _a.asyncPrefix, asyncPrefix = _l === void 0 ? "Async" : _l, _m = _a.asyncSuffix, asyncSuffix = _m === void 0 ? '' : _m, _o = _a.queryOptionsInterfaceName, queryOptionsInterfaceName = _o === void 0 ? 'SvelteQueryOptions' : _o, _p = _a.queryResultInterfaceName, queryResultInterfaceName = _p === void 0 ? 'SvelteQueryResult' : _p, _q = _a.subscriptionOptionsInterfaceName, subscriptionOptionsInterfaceName = _q === void 0 ? 'SvelteSubscriptionOptions' : _q, _r = _a.subscriptionResultInterfaceName, subscriptionResultInterfaceName = _r === void 0 ? 'SvelteSubscriptionResult' : _r, _s = _a.mutationOptionsInterfaceName, mutationOptionsInterfaceName = _s === void 0 ? 'SvelteMutationOptions' : _s, _t = _a.mutationResultInterfaceName, mutationResultInterfaceName = _t === void 0 ? 'SvelteMutationResult' : _t, config = __rest(_a, ["asyncQuery", "clientPath", "includeRxStoreUtils", "queryOperationPrefix", "queryOperationSuffix", "mutationOperationPrefix", "mutationOperationSuffix", "subscriptionOperationPrefix", "subscriptionOperationSuffix", "documentVariableSuffix", "asyncPrefix", "asyncSuffix", "queryOptionsInterfaceName", "queryResultInterfaceName", "subscriptionOptionsInterfaceName", "subscriptionResultInterfaceName", "mutationOptionsInterfaceName", "mutationResultInterfaceName"]);
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
        var operationImport = ("" + (hasQuery ? "ApolloQueryResult, ObservableSubscription, Observable, WatchQueryOptions as ApolloWatchQueryOptions, " + (asyncQuery ? "QueryOptions as ApolloQueryOptions, " : "")
            : "") + (hasMutation ? "MutationOptions as ApolloMutationOptions, "
            : "") + (hasSubscription ? "SubscriptionOptions as ApolloSubScriptionOptions, " : "")).slice(0, -2);
        var importFetchResult = hasMutation || hasSubscription ? ', FetchResult' : '';
        var imports = [
            "import client from \"" + clientPath + "\";",
            "import { gql } from \"@apollo/client/core\";",
            "import type { " + operationImport + importFetchResult + " } from \"@apollo/client/core\";",
            "import { readable } from \"svelte/store\";",
            "import type { Readable } from \"svelte/store\";",
        ];
        var interfaces = [];
        if (hasQuery) {
            interfaces.push("\nexport interface " + queryOptionsInterfaceName + "<TVariables,TData> extends Omit<ApolloWatchQueryOptions<TVariables,TData>,\"query\">{\n  skip?: boolean;\n}\nexport interface " + queryResultInterfaceName + "<TVariables,TData> extends ApolloQueryResult<TData>{\n  options?: ApolloWatchQueryOptions<TVariables,TData>;\n  skipped?: true;\n}\n");
        }
        if (hasMutation) {
            interfaces.push("\nexport type " + mutationOptionsInterfaceName + "<TData,TVariables> = Omit<ApolloMutationOptions<TData,TVariables>,\"mutation\">;\nexport interface " + mutationResultInterfaceName + "<TData,TVariables> extends FetchResult<TData>{\n  error?: Error;\n  options?: ApolloMutationOptions<TData,TVariables>;\n};\n");
        }
        if (hasSubscription) {
            interfaces.push(("\nexport type " + subscriptionOptionsInterfaceName + "<TVariables,TData> = Omit<ApolloSubScriptionOptions<TVariables,TData>,\"query\">;\nexport interface " + subscriptionResultInterfaceName + "<TVariables,TData> extends FetchResult<TData>{\n  error?: Error;\n  options?: ApolloSubScriptionOptions<TVariables,TData>;\n};\n").trim());
        }
        var extra = [];
        if (includeRxStoreUtils) {
            imports.push("\nimport { BehaviorSubject } from \"rxjs\";      \n      ".trim());
            extra.push("\nexport const toReadable = <T>(initialValue?: T) => (observable: Pick<Observable<T>,\"subscribe\">) => \n    readable<T>(initialValue,set => {\n      const subscription = observable.subscribe(set);\n      return () => subscription.unsubscribe();\n    });\n\nexport class RxWriteable<T> extends BehaviorSubject<T>{\n    set(value:T):void {\n        super.next(value)\n    }\n    update(fn: (value: T)=> T){\n        this.set(fn(this.getValue()));\n    }\n};\nexport const createRxWriteable = <T>(initialValue:T) => {\n  return new RxWriteable<T>(initialValue);\n}\n      ".trim());
        }
        var ops = operations
            .map(function (o) {
            var op = "" + (0, pascal_case_1.pascalCase)(o.name.value) + (0, pascal_case_1.pascalCase)(visitor.getOperationSuffix(o, o.operation));
            var opv = getOperationVariableName(op);
            var documentVariableName = getDocumentVariableName(o.name.value);
            var functionName = getOperationFunctionName(o.name.value, o.operation);
            var operation;
            if (o.operation == "query") {
                operation = "\nexport const " + functionName + " = (rxOptions: Readable<" + queryOptionsInterfaceName + "<" + opv + "," + op + ">>,initialValue?:" + queryResultInterfaceName + "<" + opv + "," + op + ">): Readable<" + queryResultInterfaceName + "<" + opv + "," + op + ">> => {\n  initialValue ??= { data: {} as " + op + ", loading: true, error: undefined, networkStatus: 1 };\n  return readable<" + queryResultInterfaceName + "<" + opv + "," + op + ">>(\n    initialValue,\n    (set) => {\n      let subscription: ObservableSubscription;\n      const unsubscribe = rxOptions.subscribe(({skip,...options}) => {\n        const queryOptions = {\n          ...options,\n          query: " + documentVariableName + ",\n        }\n        if(skip){\n          if(subscription) {\n            subscription.unsubscribe();\n            subscription = undefined;\n          }; \n          return set({\n            ...initialValue,\n            skipped: true,\n            options: queryOptions\n          });\n        }\n\n        subscription = client.watchQuery<" + op + "," + opv + ">(queryOptions).subscribe({\n          error: error => ({\n            data: {} as " + op + ",\n            loading: false,\n            error,\n            networkStatus: 8,\n            options: queryOptions\n          }),\n          next: (response) => set({ ...response, options: queryOptions })\n        });\n      });\n      return () => {\n        if(subscription) subscription.unsubscribe();\n        unsubscribe();\n      }\n    }\n  );\n}";
                if (asyncQuery) {
                    var asyncOperationFunctionName = getAsyncOperationFunctionName(functionName);
                    operation =
                        operation +
                            ("\n              export const " + asyncOperationFunctionName + " = (options: ApolloQueryOptions<" + opv + ">) => {\n                return client.query<" + op + ">({query: " + documentVariableName + ", ...options})\n              }\n            ");
                }
            }
            if (o.operation == "mutation") {
                operation = "\nexport const " + functionName + " = (rxOptions: Readable<" + mutationOptionsInterfaceName + "<" + op + "," + opv + ">>,initialValue?:" + mutationResultInterfaceName + "<" + op + "," + opv + ">): Readable<" + mutationResultInterfaceName + "<" + op + "," + opv + ">> =>\n  readable<" + mutationResultInterfaceName + "<" + op + "," + opv + ">>(initialValue,set => {\n    let stopped = false;\n    const unsubscribe = rxOptions.subscribe(options => {\n      const mutateOptions = {\n        mutation: " + documentVariableName + ",\n        ...options,\n      };\n      client.mutate<" + op + ", " + opv + ">(mutateOptions).then(x =>{\n        if(stopped) return;\n        set({\n          ...x,\n          options: mutateOptions\n        });\n      }).catch(error => {\n        set({\n          error,\n          options: mutateOptions\n        })\n      });\n    });\n    return function stop(){\n      stopped = true;  \n      unsubscribe();\n    }\n})";
            }
            if (o.operation == "subscription") {
                operation = "\nexport const " + functionName + " = (rxOptions: Readable<" + subscriptionOptionsInterfaceName + "<" + opv + "," + op + ">>,initialValue?:" + subscriptionResultInterfaceName + "<" + opv + "," + op + ">): Readable<" + subscriptionResultInterfaceName + "<" + opv + "," + op + ">> => \n  readable<" + subscriptionResultInterfaceName + "<" + opv + "," + op + ">>(initialValue,set => {\n    let subscription: ObservableSubscription;\n    const unsubscribe = rxOptions.subscribe(options => {\n        const subscriptionOptions = {\n          ...options,\n          query: " + documentVariableName + ",\n        };\n        if(subscription){\n          subscription.unsubscribe();\n          subscription = undefined;\n        }\n        subscription = client.subscribe<" + op + ", " + opv + ">(subscriptionOptions).subscribe({\n          error: error => set({\n            error,\n            options: subscriptionOptions\n          }),\n          next: r => set({\n            ...r,\n            options: subscriptionOptions\n          })\n        });\n      });\n      return function stop(){\n        if(subscription) subscription.unsubscribe();\n        unsubscribe();\n      }\n  })\n";
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
