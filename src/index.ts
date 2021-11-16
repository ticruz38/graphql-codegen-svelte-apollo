import { CodegenPlugin } from "@graphql-codegen/plugin-helpers";
import { LoadedFragment,RawClientSideBasePluginConfig,ClientSideBaseVisitor  } from "@graphql-codegen/visitor-plugin-common";
import {
  concatAST,
  FragmentDefinitionNode,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  visit,
} from "graphql";
import { pascalCase } from "pascal-case";

const visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");

export interface Config extends RawClientSideBasePluginConfig {
  clientPath: string;
  asyncQuery?: boolean;
  queryOperationPrefix?: string;
  queryOperationSuffix?: string;
  mutationOperationPrefix?: string;
  mutationOperationSuffix?: string;
  mutationOptionsInterfaceName?: string;
  subscriptionOperationPrefix?: string;
  subscriptionOperationSuffix?: string;
  subscriptionOptionsInterfaceName?: string;
  asyncPrefix?: string;
  asyncSuffix?: string;
  queryOptionsInterfaceName?: string;
  queryResultInterfaceName?: string;
}

module.exports = {
  plugin: (schema, documents, {
    asyncQuery =false,
    clientPath,
    queryOperationPrefix= '',
    queryOperationSuffix = '',
    mutationOperationPrefix = '',
    mutationOperationSuffix = '',
    subscriptionOperationPrefix = '',
    subscriptionOperationSuffix = '',
    documentVariableSuffix = "Doc",
    asyncPrefix = "Async",
    asyncSuffix = '',
    queryOptionsInterfaceName = 'SvelteQueryOptions',
    subscriptionOptionsInterfaceName = 'SvelteSubscriptionOptions',
    mutationOptionsInterfaceName = 'SvelteMutationOptions',
    queryResultInterfaceName = 'SvelteQueryResult',
    ...config
  }: Config  , info) => {
    const operationTypeFormats = {
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
    }

    const getDocumentVariableName = (name:string) => `${config.documentVariablePrefix??''}${pascalCase(name)}${documentVariableSuffix}`

    const getOperationFunctionName = (name:string,operation:OperationTypeNode) => {
      const {prefix,suffix} = operationTypeFormats[operation];
      return `${prefix}${pascalCase(name)}${suffix}`;
    }
    const getAsyncOperationFunctionName = (name:string) => {
      return `${asyncPrefix}${name}${asyncSuffix}`
    }
    const getOperationVariableName = (operationName: string) => {
      return operationName + "Variables";
    }

    const allAst = concatAST(documents.map((d) => d.document));

    const allFragments: LoadedFragment[] = [
      ...(
        allAst.definitions.filter(
          (d) => d.kind === Kind.FRAGMENT_DEFINITION
        ) as FragmentDefinitionNode[]
      ).map((fragmentDef) => ({
        node: fragmentDef,
        name: fragmentDef.name.value,
        onType: fragmentDef.typeCondition.name.value,
        isExternal: false,
      })),
      ...(config.externalFragments || []),
    ];

    const visitor = new visitorPluginCommon.ClientSideBaseVisitor(
      schema,
      allFragments,
      {},
      {
        ...config,
        documentVariableSuffix
      },
      documents
    ) as ClientSideBaseVisitor;
    

    const visitorResult = visit(allAst, { leave: visitor });

    const operations = allAst.definitions.filter(
      (d) => d.kind === Kind.OPERATION_DEFINITION
    ) as OperationDefinitionNode[];

      const hasQuery = operations.some((op) => op.operation == "query");
      const hasMutation = operations.some((op) => op.operation == "mutation");
      const hasSubscription = operations.some((op) => op.operation == "subscription");

    const operationImport = `${
      hasQuery? `ApolloQueryResult, ObservableSubscription, Observable, ObservableQuery as ApolloObservableQuery, WatchQueryOptions as ApolloWatchQueryOptions, ${
            asyncQuery ? "QueryOptions as ApolloQueryOptions, " : ""
          }`
        : ""
    }${
      hasMutation? "MutationOptions as ApolloMutationOptions, "
        : ""
    }${
      hasSubscription? "SubscriptionOptions as ApolloSubScriptionOptions, ": ""
    }`.slice(0, -2);

    const imports = [
      `import client from "${clientPath}";`,
      `import { gql, ${operationImport} } from "@apollo/client/core";`,
      `import { readable, Readable } from "svelte/store";`,
    ];


    const interfaces = [];
    if(hasQuery){
      interfaces.push(`
export interface ${queryOptionsInterfaceName}<TVariables,TData> extends Omit<ApolloWatchQueryOptions<TVariables,TData>,"query">{
  skip?: Readable<boolean> | Pick<Observable<boolean>,"subscribe">;
}`);
interfaces.push(`
export interface ${queryResultInterfaceName}<TVariables,TData> extends ApolloQueryResult<TData>{
  query: ApolloObservableQuery<
    TData,
    TVariables
  >;
  skipped: boolean;
}`);
    }
    if(hasMutation){
      interfaces.push(`
export type ${mutationOptionsInterfaceName}<TData,TVariables> = Omit<ApolloMutationOptions<TData,TVariables>,"mutation">;`);
    }
    if(hasSubscription){
      interfaces.push(`
export type ${subscriptionOptionsInterfaceName}<TVariables,TData> = Omit<ApolloSubScriptionOptions<TVariables,TData>,"query">;`);
    }

    const extra = [];
    if(hasQuery){
      extra.push(`
const alwaysRun = readable(false,() => {/* Noop */});
export const getCurrent = <T>(value: Readable<T>|Pick<Observable<T>,"subscribe">) => {
  let current:T = undefined;
  const unsubscribe = value.subscribe(x => current=x);
  if(typeof unsubscribe === "function"){
    unsubscribe();
  }
  else{
    unsubscribe.unsubscribe();
  }
  return current;
}
      `)
    }


    const ops = operations
      .map((o) => {
        const op = `${pascalCase(o.name.value)}${pascalCase(visitor.getOperationSuffix(o,o.operation))}`;
        const opv = getOperationVariableName(op);
        const documentVariableName = getDocumentVariableName(o.name.value);
        const functionName = getOperationFunctionName(o.name.value,o.operation);

        let operation;
        if (o.operation == "query") {

          operation = `export const ${functionName} = ({skip,...options}: ${queryOptionsInterfaceName}<${opv},${op}>): Readable<
            ${queryResultInterfaceName}<${opv},${op}>
          > => {
            skip ??= alwaysRun;
            const q = client.watchQuery<${op},${opv}>({
              query: ${documentVariableName},
              ...options,
            });
            const initialState = { data: {} as ${op}, loading: true, error: undefined, networkStatus: 1, query: q, skipped: skip? getCurrent(skip): false };
            const result = readable<${queryResultInterfaceName}<${opv},${op}>>(
              initialState,
              (set) => {
                let subscription: ObservableSubscription; 
                const unSubscribeSkip = skip.subscribe(skip => {
                  if(skip){
                      if(subscription) subscription.unsubscribe();
                      set({
                        ...initialState,
                        skipped: true
                      });
                      return;
                  }
                  subscription = q.subscribe({
                    error: error => ({
                      data: {} as ${op},
                      loading: false,
                      error,
                      networkStatus: 8,
                      query: q,
                      skipped: false
                    }),
                    next: (v) => {
                      set({ ...v, query: q, skipped: false });
                    }
                  });
                });
                return () => {
                  if(subscription) subscription.unsubscribe();
                  if(typeof unSubscribeSkip === "function"){
                    return unSubscribeSkip();
                  }
                  unSubscribeSkip.unsubscribe();
                }
              }
            );
            return result;
          }
        `;
          if (asyncQuery) {
            const asyncOperationFunctionName = getAsyncOperationFunctionName(functionName);
            operation =
              operation +
              `
              export const ${asyncOperationFunctionName} = (options: ApolloQueryOptions<${opv}>) => {
                return client.query<${op}>({query: ${documentVariableName}, ...options})
              }
            `;
          }
        }
        if (o.operation == "mutation") {
          operation = `export const ${functionName} = (
            options: ${mutationOptionsInterfaceName}<${op},${opv}>
          ) => {
            const m = client.mutate<${op}, ${opv}>({
              mutation: ${documentVariableName},
              ...options,
            });
            return m;
          }`;
        }
        if (o.operation == "subscription") {
          operation = `export const ${functionName} = (
            options: ${subscriptionOptionsInterfaceName}<${opv},${op}>
          ) => {
            const q = client.subscribe<${op}, ${opv}>(
              {
                query: ${documentVariableName},
                ...options,
              }
            )
            return q;
          }`;
        }
        return operation;
      })
      .join("\n");
    return {
      prepend: [
        ...imports,
        ...interfaces,
        ...extra
      ],
      content: [
        visitor.fragments,
        ...visitorResult.definitions.filter((t) => typeof t == "string"),
        ops,
      ].join("\n"),
    };
  },
  validate: (schema, documents, config, outputFile, allPlugins) => {
    if (!config.clientPath) {
      console.warn("Client path is not present in config");
    }
  },
} as CodegenPlugin;
