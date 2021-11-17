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
  includeRxStoreUtils?: boolean;
  queryOperationPrefix?: string;
  queryOperationSuffix?: string;
  mutationOperationPrefix?: string;
  mutationOperationSuffix?: string;
  mutationOptionsInterfaceName?: string;
  mutationResultInterfaceName?: string;

  subscriptionOperationPrefix?: string;
  subscriptionOperationSuffix?: string;
  
  subscriptionOptionsInterfaceName?: string;
  subscriptionResultInterfaceName?: string;
  
  asyncPrefix?: string;
  asyncSuffix?: string;
  
  queryOptionsInterfaceName?: string;
  queryResultInterfaceName?: string;
}

module.exports = {
  plugin: (schema, documents, {
    asyncQuery =false,
    clientPath,
    includeRxStoreUtils = false,
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
    queryResultInterfaceName = 'SvelteQueryResult',
    subscriptionOptionsInterfaceName = 'SvelteSubscriptionOptions',
    subscriptionResultInterfaceName = 'SvelteSubscriptionResult',
    mutationOptionsInterfaceName = 'SvelteMutationOptions',
    mutationResultInterfaceName = 'SvelteMutationResult',
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
      hasQuery? `ApolloQueryResult, ObservableSubscription, WatchQueryOptions as ApolloWatchQueryOptions, ${
            asyncQuery ? "QueryOptions as ApolloQueryOptions, " : ""
          }`
        : ""
    }${
      hasMutation? "MutationOptions as ApolloMutationOptions, "
        : ""
    }${
      hasSubscription? "SubscriptionOptions as ApolloSubScriptionOptions, ": ""
    }`.slice(0, -2);

    const importFetchResult = hasMutation || hasSubscription? ', FetchResult':'';
    const imports = [
      `import client from "${clientPath}";`,
      `import { gql } from "@apollo/client/core";`,
      `import type { ${operationImport}${importFetchResult} } from "@apollo/client/core";`,
      `import { readable } from "svelte/store";`,
      `import type { Readable } from "svelte/store";`,
    ];


    const interfaces = [];
    if(hasQuery){
      interfaces.push(`
export interface ${queryOptionsInterfaceName}<TVariables,TData> extends Omit<ApolloWatchQueryOptions<TVariables,TData>,"query">{
  skip?: boolean;
}
export interface ${queryResultInterfaceName}<TVariables,TData> extends ApolloQueryResult<TData>{
  options?: ApolloWatchQueryOptions<TVariables,TData>;
  skipped?: true;
}
`);
    }
    if(hasMutation){
      interfaces.push(`
export type ${mutationOptionsInterfaceName}<TData,TVariables> = Omit<ApolloMutationOptions<TData,TVariables>,"mutation">;
export interface ${mutationResultInterfaceName}<TData,TVariables> extends FetchResult<TData>{
  error?: Error;
  options?: ApolloMutationOptions<TData,TVariables>;
};
`);

    }
    if(hasSubscription){
      interfaces.push(`
export type ${subscriptionOptionsInterfaceName}<TVariables,TData> = Omit<ApolloSubScriptionOptions<TVariables,TData>,"query">;
export interface ${subscriptionResultInterfaceName}<TVariables,TData> extends FetchResult<TData>{
  error?: Error;
  options?: ApolloSubScriptionOptions<TVariables,TData>;
};
`.trim());
    }

    const extra = [];
    if(includeRxStoreUtils){
      imports.push(`
import { BehaviorSubject, Observable } from "rxjs";      
      `.trim());
      extra.push(`
export const toReadable = <T>(initialValue?: T) => (observable: Pick<Observable<T>,"subscribe">) => 
    readable<T>(initialValue,set => {
      const subscription = observable.subscribe(set);
      return () => subscription.unsubscribe();
    });

export class RxWriteable<T> extends BehaviorSubject<T>{
    set(value:T):void {
        super.next(value)
    }
    update(fn: (value: T)=> T){
        this.set(fn(this.getValue()));
    }
};
export const createRxWriteable = <T>(initialValue:T) => {
  return new RxWriteable<T>(initialValue);
}
      `.trim())
    }


    const ops = operations
      .map((o) => {
        const op = `${pascalCase(o.name.value)}${pascalCase(visitor.getOperationSuffix(o,o.operation))}`;
        const opv = getOperationVariableName(op);
        const documentVariableName = getDocumentVariableName(o.name.value);
        const functionName = getOperationFunctionName(o.name.value,o.operation);

        let operation;
        if (o.operation == "query") {
          operation = `
export const ${functionName} = (rxOptions: Readable<${queryOptionsInterfaceName}<${opv},${op}>>,initialValue?:${queryResultInterfaceName}<${opv},${op}>): Readable<${queryResultInterfaceName}<${opv},${op}>> => {
  initialValue ??= { data: {} as ${op}, loading: true, error: undefined, networkStatus: 1 };
  return readable<${queryResultInterfaceName}<${opv},${op}>>(
    initialValue,
    (set) => {
      let subscription: ObservableSubscription;
      const unsubscribe = rxOptions.subscribe(({skip,...options}) => {
        const queryOptions = {
          ...options,
          query: ${documentVariableName},
        }
        if(skip){
          if(subscription) {
            subscription.unsubscribe();
            subscription = undefined;
          }; 
          return set({
            ...initialValue,
            skipped: true,
            options: queryOptions
          });
        }

        subscription = client.watchQuery<${op},${opv}>(queryOptions).subscribe({
          error: error => ({
            data: {} as ${op},
            loading: false,
            error,
            networkStatus: 8,
            options: queryOptions
          }),
          next: (response) => set({ ...response, options: queryOptions })
        });
      });
      return () => {
        if(subscription) subscription.unsubscribe();
        unsubscribe();
      }
    }
  );
}`;
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
          operation = `
export const ${functionName} = (rxOptions: Readable<${mutationOptionsInterfaceName}<${op},${opv}>>,initialValue?:${mutationResultInterfaceName}<${op},${opv}>): Readable<${mutationResultInterfaceName}<${op},${opv}>> =>
  readable<${mutationResultInterfaceName}<${op},${opv}>>(initialValue,set => {
    let stopped = false;
    const unsubscribe = rxOptions.subscribe(options => {
      const mutateOptions = {
        mutation: ${documentVariableName},
        ...options,
      };
      client.mutate<${op}, ${opv}>(mutateOptions).then(x =>{
        if(stopped) return;
        set({
          ...x,
          options: mutateOptions
        });
      }).catch(error => {
        set({
          error,
          options: mutateOptions
        })
      });
    });
    return function stop(){
      stopped = true;  
      unsubscribe();
    }
})`;
        }
        if (o.operation == "subscription") {
          operation = `
export const ${functionName} = (rxOptions: Readable<${subscriptionOptionsInterfaceName}<${opv},${op}>>,initialValue?:${subscriptionResultInterfaceName}<${opv},${op}>): Readable<${subscriptionResultInterfaceName}<${opv},${op}>> => 
  readable<${subscriptionResultInterfaceName}<${opv},${op}>>(initialValue,set => {
    let subscription: ObservableSubscription;
    const unsubscribe = rxOptions.subscribe(options => {
        const subscriptionOptions = {
          ...options,
          query: ${documentVariableName},
        };
        if(subscription){
          subscription.unsubscribe();
          subscription = undefined;
        }
        subscription = client.subscribe<${op}, ${opv}>(subscriptionOptions).subscribe({
          error: error => set({
            error,
            options: subscriptionOptions
          }),
          next: r => set({
            ...r,
            options: subscriptionOptions
          })
        });
      });
      return function stop(){
        if(subscription) subscription.unsubscribe();
        unsubscribe();
      }
  })
`;
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
