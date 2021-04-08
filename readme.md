# Svelte GraphQL generator for Apollo
GraphQL Code Generator plugin to use Apollo in Svelte with full Typescript support.
Because Svelte and Apollo share the same reactive programming, Apollo queries are treated like Svelte store. 
Hence that generator is all you need if you want to use Apollo with Svelte.
See a live example [here](https://ticruz38.github.io/graphql-codegen-svelte-apollo/), the code for this is in the /example folder

## Motivation

[Apollo](https://www.apollographql.com) and [graphql-code-generator](https://graphql-code-generator.com) are a powerfull combination for data management in the front-end.
Unlike other big frameworks, Svelte was still missing a graphql-code-generator plugin for client queries.
It turns out that Svelte with its reactive programming, is particularly well designed to be used together with Apollo

## Note

graphql-codegen-svelte-apollo is a plugin for [graphql-code-generator](https://graphql-code-generator.com) ecosystem, please refer to their [website](https://graphql-code-generator.com) for documentation relative to the configuration in codegen.yml

## Installation

`npm i -S graphql`
`npm i -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations graphql-codegen-svelte-apollo`

## Configuration

- `clientPath` (default: null): Path to the apollo client for this project (should point to a file with an apollo-client as default export)
- `asyncQuery` (default: null): By default, the plugin only generate observable queries, sometimes it may be useful to generate promise-based queries

Note: typescript and typescript-operations plugins are required.

## Example config

```yml
overwrite: true
schema:
    - 'https://myschema/graphql'
documents:
    - 'src/**/*.{graphql,gql,ts}'
generates:
    output.ts:
        plugins:
            - 'typescript'
            - 'typescript-operations'
            - 'graphql-codegen-svelte-apollo'
        config:
          clientPath: "PATH_TO_APOLLO_CLIENT"
          asyncQuery: true
hooks:
    afterAllFileWrite:
        - prettier --write

```

## Usage example

Take for example this query that will request all transactions for one ethereum address

```graphql
# app.gql

fragment TransactionFragment on TransactionDescription {
    contractAddress
    from
    gasUsed
    gasPrice
    input
    isError
    to
    value
}

query Transactions($address: String) {
    transactions(address: $address) {
        ...TransactionFragment
    }
}
```

graphql-code-generator will generate:

```ts
export const TransactionsDoc = gql`
    fragment TransactionFragment on TransactionDescription {
        contractAddress
        from
        gasUsed
        gasPrice
        input
        isError
        to
        value
    }

    query Transactions($address: String) {
        transactions(address: $address) {
            ...TransactionFragment
        }
    }
`;

export const Transactions = (
  options: Omit<QueryOptions<TransactionsQueryVariables>, "query">
): Readable<
  ApolloQueryResult<TransactionsQuery> & {
    query: ObservableQuery<TransactionsQuery, TransactionsQueryVariables>;
  }
> => {
  const q = client.watchQuery({
    query: TransactionsDoc,
    ...options,
  });
  var result = readable<
    ApolloQueryResult<TransactionsQuery> & {
      query: ObservableQuery<TransactionsQuery, TransactionsQueryVariables>;
    }
  >(
    { data: null, loading: true, error: null, networkStatus: 1, query: null },
    (set) => {
      q.subscribe((v) => {
        set({ ...v, query: q });
      });
    }
  );
  return result;
};

```

And use it as follow in your svelte file:

```html
<script lang="ts">
  import { Transactions } from "codegen";

  var address = "0x0000000000000000000000000000"
  $: t = Transactions({ address });
</script>

<ul>
    {#each $t?.data?.transactions || [] as transaction}
        <li>Sent transaction from {transaction.from} to {transaction.to}</li>
    {/each}
</ul>
```

Sometimes, you may need/prefer to have an async query (only available with asyncQuery option set to true)

```html
<script lang="ts">
  import { AsyncTransactions } from "codegen";

  var address = "0x0000000000000000000000000000"
</script>

<ul>
  {#await AsyncTransactions({ address })}
    Loading...
  {:then transactions}
    {#each transactions || [] as transaction}
        <li>Sent transaction from {transaction.from} to {transaction.to}</li>
    {/each}
  {/await}
</ul>
```

For a complete example implementation refer to the [example](https://github.com/ticruz38/graphql-codegen-svelte-apollo/tree/main/example) folder

