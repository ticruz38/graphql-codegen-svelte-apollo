# Graphql generator for svelte-apollo

GraphQL Code Generator plugin to generate ts-ready svelte-apollo queries from graphql.

## Motivation

Apollo and graphql-code-generator are a powerfull combination for data management in the front-end.
Svelte-apollo is a fantastic wrapper around the apollo-client, but unlike other big frameworks, svelte was still missing a graphql-code-generator plugin for client queries.

## Install

`npm i -S graphql-codegen-svelte-apollo`

## Configuration

- `clientPath` (default: null): Path to the apollo client for this project (should point to a file with an apollo-client as default export)

Note: typescript and typescript-operations plugins are required.

## Example config

Look at the example folder for a full example.

```
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
hooks:
    afterAllFileWrite:
        - prettier --write

```

## Usage example

Take for example this query that will request all transactions for one ethereum address

```
const TRANSACTION_FRAGMENT = gql`
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
`;

const TRANSACTIONS = gql`
    ${TRANSACTION_FRAGMENT}
    query Transactions($address: String) {
        transactions(address: $address) {
            ...TransactionFragment
        }
    }
`;
```

graphql-code-generator will generate:

```
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

export const Transactions = (variables: TransactionsQueryVariables) =>
    query<TransactionsQuery, any, TransactionsTransactionsQueryVariables>(
        client,
        {
            Transactions: TransactionsDoc,
            variables,
        }
    );
```

And use it as follow in your svelte file:

```
<script lang="ts">
  var address = "0x0000000000000000000000000000"
  $: t = Transactions({ address });
</script>

{#await $t then res}
  {#each res.data.transactions as transaction}
    <li>Sent transaction from {transaction.from} to {transaction.to}</li>
  {/each}
{/await}
```

## Stateless queries

If the query is stateless (has no variables), the plugin will generate both the queries and the query result as observable.

Example, take a query "CurrentUser" that return the current logged in user:

```
query CurrentUser {
  me {
    username
  }
}
```

graphql-code-generator will generate:

```
export const CurrentUserDoc = gql`
    query CurrentUser {
        me {
          username
        }
    }
`;

export const CurrentUser = (variables: CurrentUserQueryVariables) =>
    query<CurrentUserQuery, any, CurrentUserCurrentUserQueryVariables>(client, {
        CurrentUser: CurrentUserDoc,
        variables,
    });

export const currentUser = writable<CurrentUserQuery>({}, (set) => {
    const p = CurrentUser({});
    p.subscribe((v) => {
        v.then((res) => {
            set(res.data || {});
        });
    });
});
```

We have the svelte-apollo query CurrentUser, and the observable result currentUser.

Now in your svelte file, you can simply do this:

```
<script lang="ts">
  import { currentUser } from "codegen"
</script>

<div>Hello {$currentUser.username} !!</div>
```
