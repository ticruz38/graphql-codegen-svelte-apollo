"use strict";
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
var visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
var graphql_1 = require("graphql");
var pascal_case_1 = require("pascal-case");
// const visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
var operationMap = {
    query: "query",
    subscription: "subscribe",
    mutation: "mutate"
};
module.exports = {
    plugin: function (schema, documents, config, info) {
        var allAst = (0, graphql_1.concatAST)(documents.map(function (d) { return d.document; }));
        var allFragments = __spreadArray(__spreadArray([], allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.FRAGMENT_DEFINITION; }).map(function (fragmentDef) { return ({
            node: fragmentDef,
            name: fragmentDef.name.value,
            onType: fragmentDef.typeCondition.name.value,
            isExternal: false
        }); }), true), (config.externalFragments || []), true);
        var visitor = new visitor_plugin_common_1.ClientSideBaseVisitor(schema, allFragments, {}, { documentVariableSuffix: "Doc" }, documents);
        var visitorResult = (0, graphql_1.visit)(allAst, visitor);
        var operations = allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; });
        var operationImport = "".concat(operations.some(function (op) { return op.operation == "query"; })
            ? "ApolloQueryResult, ObservableQuery, WatchQueryOptions, ".concat(config.asyncQuery ? "QueryOptions, " : "")
            : "").concat(operations.some(function (op) { return op.operation == "mutation"; })
            ? "MutationOptions, "
            : "").concat(operations.some(function (op) { return op.operation == "subscription"; })
            ? "SubscriptionOptions, "
            : "").slice(0, -2);
        var imports = [
            "import client from \"".concat(config.clientPath, "\";"),
            "import type {\n        ".concat(operationImport, "\n      } from \"@apollo/client\";"),
            "import { readable } from \"svelte/store\";",
            "import type { Readable } from \"svelte/store\";",
            "import gql from \"graphql-tag\"",
        ];
        var ops = operations
            .map(function (o) {
            var dsl = "export const ".concat(o.name.value, "Doc = gql`").concat(documents.find(function (d) {
                return d.rawSDL.includes("".concat(o.operation, " ").concat(o.name.value));
            }).rawSDL, "`");
            var op = "".concat((0, pascal_case_1.pascalCase)(o.name.value)).concat((0, pascal_case_1.pascalCase)(o.operation));
            var opv = "".concat(op, "Variables");
            var operation;
            if (o.operation == "query") {
                operation = "export const ".concat(o.name.value, " = (\n            options: Omit<\n              WatchQueryOptions<").concat(opv, ">, \n              \"query\"\n            >\n          ): Readable<\n            ApolloQueryResult<").concat(op, "> & {\n              query: ObservableQuery<\n                ").concat(op, ",\n                ").concat(opv, "\n              >;\n            }\n          > => {\n            const q = client.watchQuery({\n              query: ").concat((0, pascal_case_1.pascalCase)(o.name.value), "Doc,\n              ...options,\n            });\n            var result = readable<\n              ApolloQueryResult<").concat(op, "> & {\n                query: ObservableQuery<\n                  ").concat(op, ",\n                  ").concat(opv, "\n                >;\n              }\n            >(\n              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },\n              (set) => {\n                q.subscribe((v: any) => {\n                  set({ ...v, query: q });\n                });\n              }\n            );\n            return result;\n          }\n        ");
                if (config.asyncQuery) {
                    operation =
                        operation +
                            "\n              export const Async".concat(o.name.value, " = (\n                options: Omit<\n                  QueryOptions<").concat(opv, ">,\n                  \"query\"\n                >\n              ) => {\n                return client.query<").concat(op, ">({query: ").concat((0, pascal_case_1.pascalCase)(o.name.value), "Doc, ...options})\n              }\n            ");
                }
            }
            if (o.operation == "mutation") {
                operation = "export const ".concat(o.name.value, " = (\n            options: Omit<\n              MutationOptions<any, ").concat(opv, ">, \n              \"mutation\"\n            >\n          ) => {\n            const m = client.mutate<").concat(op, ", ").concat(opv, ">({\n              mutation: ").concat((0, pascal_case_1.pascalCase)(o.name.value), "Doc,\n              ...options,\n            });\n            return m;\n          }");
            }
            if (o.operation == "subscription") {
                operation = "export const ".concat(o.name.value, " = (\n            options: Omit<SubscriptionOptions<").concat(opv, ">, \"query\">\n          ) => {\n            const q = client.subscribe<").concat(op, ", ").concat(opv, ">(\n              {\n                query: ").concat((0, pascal_case_1.pascalCase)(o.name.value), "Doc,\n                ...options,\n              }\n            )\n            return q;\n          }");
            }
            return operation;
        })
            .join("\n");
        return {
            prepend: imports,
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
