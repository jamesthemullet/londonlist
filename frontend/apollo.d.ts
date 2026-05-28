import "@apollo/client";

declare module "@apollo/client" {
  export namespace ApolloClient {
    export namespace DeclareDefaultOptions {
      interface Query {
        errorPolicy?: "all";
      }
      interface Mutate {
        errorPolicy?: "all";
      }
    }
  }
}
