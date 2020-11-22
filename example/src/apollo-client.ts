import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";

const cache = new InMemoryCache({
  addTypename: true,
});

const link = new BatchHttpLink({
  uri: "https://api.spacex.land/graphql/",
  batchInterval: 20,
});

export default new ApolloClient({
  cache,
  link,
  connectToDevTools: true,
});
