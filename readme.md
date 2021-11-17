# Typescript Svelte Apollo
[GraphQL Code Generator](https://www.graphql-code-generator.com) plugin to use Apollo in Svelte with full Typescript support.
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



<img alt="graphql-codegen-svelte-apollo plugin version" src="https://img.shields.io/npm/v/graphql-codegen-svelte-apollo?color=%23e15799&label=plugin&nbsp;version&style=for-the-badge"/>

Ensure that your project contains all needed dependencies for this plugin

```shell
npm i -S graphql

npm i -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations graphql-codegen-svelte-apollo
```

## API Reference

### `clientPath`

type: `string`
default: `null`
required: true

Path to the apollo client for this project (should point to a file with an apollo-client as default export)

#### Usage Examples

```yml
generates:
path/to/file.ts:
 plugins:
   - typescript
   - typescript-operations
   - graphql-codegen-svelte-apollo
 config:
   clientPath: PATH_TO_APOLLO_CLIENT
```

### `asyncQuery`
type: `boolean`
default: `false`

By default, the plugin only generate observable queries, sometimes it may be useful to generate promise-based queries

#### Usage Examples

```yml
generates:
path/to/file.ts:
 plugins:
   - typescript
   - typescript-operations
   - graphql-codegen-svelte-apollo
 config:
   clientPath: PATH_TO_APOLLO_CLIENT
   asyncQuery: true
```

## Usage Example

### With Observable queries

For the given input:

```graphql
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

And the following configuration:

```yaml
schema: YOUR_SCHEMA_HERE
documents: "./src/**/*.graphql"
generates:
path/to/file.ts:
 plugins:
   - typescript
   - typescript-operations
   - graphql-codegen-svelte-apollo
 config:
   clientPath: PATH_TO_APOLLO_CLIENT
```

Codegen will pre-compile the GraphQL operation into a `DocumentNode` object, and generate a ready-to-use Apollo query for each operation you have.

In you application code, you can import it from the generated file, and use the query in your component code: 

```html
<script lang="ts">
  import { Transactions } from "codegen";

  var address = "0x0000000000000000000000000000"
  $: t = Transactions({ address });
</script>

<ul>
    {#each $t?.data?.transactions || [] as transaction}
        <li>Sent transaction from {transaction.from} to {transaction.to}</li>
    {/each}
</ul>
```

Each time you change the address, the query will re-fetch and show the new results in the template.

### With Async Queries

Sometimes, you may need/prefer to have an async query (only available with asyncQuery option set to true)

For the given input:

```graphql
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

And the following configuration:

```yaml
schema: YOUR_SCHEMA_HERE
documents: "./src/**/*.graphql"
generates:
path/to/file.ts:
 plugins:
   - typescript
   - typescript-operations
   - graphql-codegen-svelte-apollo
 config:
   clientPath: PATH_TO_APOLLO_CLIENT
   asyncQuery: true
```

Codegen will pre-compile the GraphQL operation into a `DocumentNode` object, and generate a ready-to-use Apollo query for each operation you have.

In you application code, you can import it from the generated file, and use the query in your component code: 

```html
<script lang="ts">
  import { AsyncTransactions } from "codegen";

  var address = "0x0000000000000000000000000000"
</script>

<ul>
  {#await AsyncTransactions({ address })}
    Loading...
  {:then transactions}
    {#each transactions || [] as transaction}
        <li>Sent transaction from {transaction.from} to {transaction.to}</li>
    {/each}
  {/await}
</ul>
```

### Advanced code generation options

This plugin allows configuration of the generated names using the config `codegen` config section

```yaml
queryOperationPrefix: 'use' # Defaults to ''
queryOperationSuffix: 'Query' # Defaults to ''
fragmentVariableSuffix: 'Fragment' # Defaults to ''
documentVariableSuffix: 'Document' # Defaults to 'Doc' 
mutationOperationPrefix: 'use'  # Defaults to ''
mutationOperationSuffix:  'Mutation' # Defaults to ''
subscriptionOperationPrefix: 'use' # Defaults to ''
subscriptionOperationSuffix: 'Subscription' # Defaults to ''
asyncPrefix: 'use'  # Defaults to 'Async'
asyncSuffix: 'Async' # Defaults to ''
queryOptionsInterfaceName: 'SvelteQueryOptions' # Defaults to 'SvelteQueryOptions'
queryResultInterfaceName: '' # Defaults to 'SvelteQueryResult'
subscriptionOptionsInterfaceName: 'SvelteSubscriptionOptions' # Defaults to 'SvelteSubscriptionOptions'
subscriptionResultInterfaceName: 'SvelteSubscriptionResult' # Defaults to 'SvelteSubscriptionResult'
mutationOptionsInterfaceName: 'SvelteMutationOptions' # Defaults to 'SvelteMutationOptions'
mutationResultInterfaceName: 'SvelteMutationResult' # Defaults to 'SvelteMutationResult'
includeRxStoreUtils: true # Defaults to false
```
All options in [RawClientSideBasePluginConfig](https://github.com/dotansimha/graphql-code-generator/blob/9fce7976d1af894aabcfd9b779551ae3bcd10093/packages/plugins/other/visitor-plugin-common/src/client-side-base-visitor.ts#L33) are supported as well. 


### RxStoreUtils 

The generator can add two helper functions to convert `Observables` to `Readable` or to create an `Observable` compatible `Writeable`.
These functions depend on `rxjs`, so make sure it is installed: 

```sh
npm add rxjs
``` 

#### toReadable

This will convert an rxjs observable to a readable. 
```svelte
<script>
import {from,timer} from "rxjs"
import {toReadable} from "$lib/generated" // Reference to your generated file
const readable = timer(1000)
  .pipe(toReadable());

</script>
{$readable}
```

#### createRxWriteable 

Allows you to generated a binable observable
```svelte
<script>
import {debounceTime,map,startsWith,filter} from "rxjs"
import {createRxWriteable,useCheckUserNameQuery} from "$lib/generated" // Reference to your generated file
import {derived} from "svelte/store"
const username = createRxWriteable('');

const checkUsername = username.pipe(
  debounceTime(1500),
  filter(x => !!x),
  startsWith('')
);

const shouldSkip = checkUsername.pipe(
  map(x => !x)
);

const response = useCheckUserNameQuery(derived(
  checkUsername,
  shouldSkip,
  (username,skip) => ({
    variables: {
      username
    },
    skip
  })
));
$: console.log({
  response: $response
})

</script>
<input bind:value={$username}>

```
