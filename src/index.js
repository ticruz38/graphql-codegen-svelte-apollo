"use strict";
exports.__esModule = true;
var graphql_1 = require("graphql");
var pascal_case_1 = require("pascal-case");
var camel_case_1 = require("camel-case");
module.exports = {
    plugin: function (schema, documents, config, info) {
        // const typesMap = schema.getTypeMap();
        // return documents
        //     .map((d) => d.document.definitions.map((s) => s.kind))
        //     .join("\n");
        var imports = [
            config.clientPath
                ? "import client from \"" + config.clientPath + "\";"
                : "import { ApolloClient } from \"apollo-client\";",
            "import {query, mutation, subscription} from \"svelte-apollo\";",
        ];
        // keep operations DSL in codegen
        console.log(documents.map(function (d) { return d; }));
        // const docs = documents.filter(d => d.document.definitions.)
        var allAst = graphql_1.concatAST(documents.map(function (d) { return d.document; }));
        var operations = allAst.definitions.filter(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; })
            .map(function (o) {
            var dsl = "export const " + o.name.value + "Doc = gql`" + documents.find(function (d) {
                return d.rawSDL.includes(o.operation + " " + o.name.value);
            }).rawSDL + "`";
            var op = "" + o.name.value + pascal_case_1.pascalCase(o.operation);
            var opv = op + "Variables";
            // const doc = `const ${o.name.value}Doc = ${o}`
            var operation = "export const " + o.name.value + " = (" + (config.clientPath ? "" : "client: ApolloClient, ") + "variables: " + opv + ") =>\n  " + o.operation + "<" + op + ", any, " + o.name.value + opv + ">(client, {\n    " + o.name.value + ": " + o.name.value + "Doc,\n    variables\n  })";
            var statelessOperation = "";
            if (config.clientPath &&
                !o.variableDefinitions.length &&
                o.operation != "mutation") {
                statelessOperation = "export const " + camel_case_1.camelCase(o.name.value) + " = writable<" + op + ">({}, (set) => {\n                      const p = " + o.name.value + "({})\n                      p.subscribe((v) => {\n                        v.then(res => {\n                          set(res.data || {})\n                        })\n                      })\n                    })";
            }
            return dsl + "\n" + operation + "\n" + statelessOperation;
        })
            .join("\n");
        // return {
        //     prepend: imports,
        //     content: operations,
        // };
        return {
            prepend: imports,
            content: operations
        };
        // allAst.definitions.map((d) => console.log(d));
        // return Object.keys(typesMap).join("\n");
    },
    validate: function (schema, documents, config, outputFile, allPlugins) {
        console.log(allPlugins, config);
        // allPlugins.map(p => p)
    }
};
