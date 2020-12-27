# Svelte GraphQL Code Gen example

## Get started as a codegen-svelte-apollo developer

Install dependencies...

```bash
npm i
```

Go to `example/codegen.yml` and check that it's like this:

```yml
- ../src/index.js # in codegen-svelte-apollo lib developement
# - svelte-apollo # in real usage of the lib
```

... Go to the chapter **## Get started common...**

## Get started as a user of codegen-svelte-apollo

Ensure that you have graphql & graphql-codegen-svelte-apollo in `example/package.json` with:

```bash
cd example
npm add graphql graphql-codegen-svelte-apollo
```

Go to `example/codegen.yml` and check that it's like this:

```yml
# - ../src/index.js # in codegen-svelte-apollo lib developement
- svelte-apollo # in real usage of the lib
```

... Go to the chapter **## Get started common...**

## Get started common...

Go to `example` folder and Install the dependencies

```bash
cd example
npm i
```

...then generate Types (in `example/src/codegen.ts`):

```bash
npm run types
```

...then start:

```bash
npm run dev
```

🚀 Go to `http://localhost:5000/` and enjoy the demo. 🚀
