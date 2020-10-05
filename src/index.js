"use strict";
exports.__esModule = true;
var graphql_1 = require("graphql");
var pascal_case_1 = require("pascal-case");
var camel_case_1 = require("camel-case");
module.exports = {
    plugin: function (schema, documents, config, info) {
        var allAst = graphql_1.concatAST(documents.map(function (d) { return d.document; }));
        var operations = allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; });
        var operationImport = ("" + (operations.some(function (op) { return op.operation == "query"; }) ? "query, " : "") + (operations.some(function (op) { return op.operation == "mutation"; }) ? "mutation, " : "") + (operations.some(function (op) { return op.operation == "subscription"; })
            ? "subscription, "
            : "")).slice(0, -2);
        var imports = [
            config.clientPath
                ? "import client from \"" + config.clientPath + "\";"
                : "import { ApolloClient } from \"apollo-client\";",
            "import { " + operationImport + " } from \"svelte-apollo\";",
            "import { writable } from \"svelte/store\";",
            "import gql from \"graphql-tag\"",
        ];
        // const docs = documents.filter(d => d.document.definitions.)
        var ops = operations
            .map(function (o) {
            var dsl = "export const " + o.name.value + "Doc = gql`" + documents.find(function (d) {
                return d.rawSDL.includes(o.operation + " " + o.name.value);
            }).rawSDL + "`";
            var op = "" + o.name.value + pascal_case_1.pascalCase(o.operation);
            var opv = op + "Variables";
            // const doc = `const ${o.name.value}Doc = ${o}`
            var operation = "export const " + o.name.value + " = (" + (config.clientPath ? "" : "client: ApolloClient, ") + "variables: " + opv + ") =>\n  " + o.operation + "<" + op + ", any, " + opv + ">(client, {\n    " + o.operation + ": " + o.name.value + "Doc,\n    variables\n  })";
            var statelessOperation = "";
            if (config.clientPath &&
                !o.variableDefinitions.length &&
                o.operation != "mutation") {
                statelessOperation = "export const " + camel_case_1.camelCase(o.name.value) + " = writable<" + op + ">({}, (set) => {\n                      const p = " + o.name.value + "({})\n                      p.subscribe((v) => {\n                        v[\"then\"](res => {\n                          set(res.data || {})\n                        })\n                      })\n                    })";
            }
            return dsl + "\n" + operation + "\n" + statelessOperation;
        })
            .join("\n");
        return {
            prepend: imports,
            content: ops
        };
    },
    validate: function (schema, documents, config, outputFile, allPlugins) {
        if (!config.clientPath) {
            console.warn("Client path is not present in config");
        }
    }
};
