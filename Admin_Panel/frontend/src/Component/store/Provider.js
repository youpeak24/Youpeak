import { createStore, compose, applyMiddleware } from "redux";
import { thunk } from "redux-thunk"; // Correctly import thunk as a named import
import rootReducer from "./index";

const composeEnhancer =
  typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;

const store = createStore(
  rootReducer,
  composeEnhancer(applyMiddleware(thunk)) // Use the named import here
);

export default store;
