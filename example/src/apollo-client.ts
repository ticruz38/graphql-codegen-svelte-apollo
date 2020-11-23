import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getOperationAST } from "graphql";

const cache = new InMemoryCache({
  addTypename: true,
});

const wsLink = new WebSocketLink({
  uri: "wss://api.spacex.land/graphql/",
  options: {
    lazy: true,
    reconnect: true,
  },
});

const httpLink = new HttpLink({
  uri: "https://api.spacex.land/graphql/",
});

const link = ApolloLink.split(
  (op: any) => {
    // check if it is a subscription
    const operationAST = getOperationAST(op.query, op.operationName);
    return !!operationAST && operationAST.operation === "subscription";
  },
  wsLink,
  httpLink
);

export default new ApolloClient({
  cache,
  link,
  connectToDevTools: true,
});
