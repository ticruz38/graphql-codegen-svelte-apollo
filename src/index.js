"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var graphql_1 = require("graphql");
var pascal_case_1 = require("pascal-case");
var visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
var operationMap = {
    query: "query",
    subscription: "subscribe",
    mutation: "mutate"
};
module.exports = {
    plugin: function (schema, documents, config, info) {
        var allAst = graphql_1.concatAST(documents.map(function (d) { return d.document; }));
        var allFragments = __spreadArray(__spreadArray([], allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.FRAGMENT_DEFINITION; }).map(function (fragmentDef) { return ({
            node: fragmentDef,
            name: fragmentDef.name.value,
            onType: fragmentDef.typeCondition.name.value,
            isExternal: false
        }); })), (config.externalFragments || []));
        var visitor = new visitorPluginCommon.ClientSideBaseVisitor(schema, allFragments, {}, { documentVariableSuffix: "Doc" }, documents);
        var visitorResult = graphql_1.visit(allAst, { leave: visitor });
        var operations = allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; });
        var operationImport = ("" + (operations.some(function (op) { return op.operation == "query"; })
            ? "ApolloQueryResult, ObservableQuery, WatchQueryOptions, " + (config.asyncQuery ? "QueryOptions, " : "")
            : "") + (operations.some(function (op) { return op.operation == "mutation"; })
            ? "MutationOptions, "
            : "") + (operations.some(function (op) { return op.operation == "subscription"; })
            ? "SubscriptionOptions, "
            : "")).slice(0, -2);
        var imports = [
            "import client from \"" + config.clientPath + "\";",
            "import type {\n        " + operationImport + "\n      } from \"@apollo/client\";",
            "import { readable } from \"svelte/store\";",
            "import type { Readable } from \"svelte/store\";",
            "import gql from \"graphql-tag\"",
        ];
        var ops = operations
            .map(function (o) {
            var dsl = "export const " + o.name.value + "Doc = gql`" + documents.find(function (d) {
                return d.rawSDL.includes(o.operation + " " + o.name.value);
            }).rawSDL + "`";
            var op = "" + pascal_case_1.pascalCase(o.name.value) + pascal_case_1.pascalCase(o.operation);
            var opv = op + "Variables";
            var operation;
            if (o.operation == "query") {
                operation = "export const " + o.name.value + " = (\n            options: Omit<\n              WatchQueryOptions<" + opv + ">, \n              \"query\"\n            >\n          ): Readable<\n            ApolloQueryResult<" + op + "> & {\n              query: ObservableQuery<\n                " + op + ",\n                " + opv + "\n              >;\n            }\n          > => {\n            const q = client.watchQuery({\n              query: " + pascal_case_1.pascalCase(o.name.value) + "Doc,\n              ...options,\n            });\n            var result = readable<\n              ApolloQueryResult<" + op + "> & {\n                query: ObservableQuery<\n                  " + op + ",\n                  " + opv + "\n                >;\n              }\n            >(\n              { data: null, loading: true, error: null, networkStatus: 1, query: null },\n              (set) => {\n                q.subscribe((v) => {\n                  set({ ...v, query: q });\n                });\n              }\n            );\n            return result;\n          }\n        ";
                if (config.asyncQuery) {
                    operation =
                        operation +
                            ("\n              export const Async" + pascal_case_1.pascalCase(o.name.value) + " = (\n                options: Omit<\n                  QueryOptions<" + opv + ">,\n                  \"query\"\n                >\n              ) => {\n                return client.query<" + op + ">({query: " + pascal_case_1.pascalCase(o.name.value) + "Doc, ...options})\n              }\n            ");
                }
            }
            if (o.operation == "mutation") {
                operation = "export const " + o.name.value + " = (\n            options: Omit<\n              MutationOptions<any, " + opv + ">, \n              \"mutation\"\n            >\n          ) => {\n            const m = client.mutate<" + op + ", " + opv + ">({\n              mutation: " + pascal_case_1.pascalCase(o.name.value) + "Doc,\n              ...options,\n            });\n            return m;\n          }";
            }
            if (o.operation == "subscription") {
                operation = "export const " + o.name.value + " = (\n            options: Omit<SubscriptionOptions<" + opv + ">, \"query\">\n          ) => {\n            const q = client.subscribe<" + op + ", " + opv + ">(\n              {\n                query: " + pascal_case_1.pascalCase(o.name.value) + "Doc,\n                ...options,\n              }\n            )\n            return q;\n          }";
            }
            return operation;
        })
            .join("\n");
        return {
            prepend: imports,
            content: __spreadArray(__spreadArray([
                visitor.fragments
            ], visitorResult.definitions.filter(function (t) { return typeof t == "string"; })), [
                ops,
            ]).join("\n")
        };
    },
    validate: function (schema, documents, config, outputFile, allPlugins) {
        if (!config.clientPath) {
            console.warn("Client path is not present in config");
        }
    }
};
