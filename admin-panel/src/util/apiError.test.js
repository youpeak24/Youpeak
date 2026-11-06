import { describeApiError } from "./apiError";
import { baseURL } from "./config";

describe("describeApiError", () => {
  it("uses the server's message when the server answered", () => {
    expect(describeApiError({ response: { status: 200, data: { message: "Invalid email or password." } } })).toBe("Invalid email or password.");
    expect(describeApiError({ response: { status: 502, data: "" } })).toMatch(/HTTP 502/);
  });

  it("names the unreachable API instead of a bare 'Network Error'", () => {
    const message = describeApiError({ message: "Network Error", request: {} });
    expect(message).not.toBe("Network Error");
    expect(message).toContain(baseURL);
    // jsdom runs on localhost, so the local-stack hint is included.
    expect(message).toMatch(/local-dev\/start\.js/);
  });

  it("reports timeouts as such", () => {
    expect(describeApiError({ code: "ECONNABORTED", message: "timeout of 0ms exceeded", request: {} })).toMatch(/too long/);
  });

  it("falls back for empty errors", () => {
    expect(describeApiError(null, "Login failed")).toBe("Login failed");
  });
});
