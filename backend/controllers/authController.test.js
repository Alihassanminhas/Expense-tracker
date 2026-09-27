const assert = require("node:assert/strict");
const test = require("node:test");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { loginUser } = require("./authController");

const originalFindByEmail = User.findByEmail;
const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "login-controller-test-secret";

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test.after(() => {
  User.findByEmail = originalFindByEmail;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test("login rejects a null request body with a validation response", async () => {
  const response = createResponse();

  await loginUser({ body: null }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.success, false);
  assert.match(response.payload.message, /email and password/i);
});

test("login rejects missing credentials", async () => {
  const response = createResponse();
  User.findByEmail = async () => assert.fail("database lookup should not run");

  await loginUser({ body: { email: "" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.success, false);
});

test("login uses the same unauthorized response for unknown emails and wrong passwords", async () => {
  const responses = [];
  User.findByEmail = async (email) => email === "known@example.com"
    ? { id: "user-1", name: "Known", email, password: await bcrypt.hash("correct-password", 4) }
    : undefined;

  for (const body of [
    { email: "missing@example.com", password: "wrong-password" },
    { email: "known@example.com", password: "wrong-password" },
  ]) {
    const response = createResponse();
    await loginUser({ body }, response);
    responses.push(response);
  }

  assert.deepEqual(responses.map(({ statusCode }) => statusCode), [401, 401]);
  assert.equal(responses[0].payload.message, responses[1].payload.message);
});

test("login returns a user and signed token for valid credentials", async () => {
  const password = "correct-password";
  User.findByEmail = async (email) => ({
    id: "user-1",
    name: "Known",
    email,
    password: await bcrypt.hash(password, 4),
  });
  const response = createResponse();

  await loginUser({ body: { email: " Known@Example.com ", password } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.success, true);
  assert.deepEqual(
    { id: response.payload.user.id, name: response.payload.user.name, email: response.payload.user.email },
    { id: "user-1", name: "Known", email: "known@example.com" },
  );
  assert.equal(typeof response.payload.user.token, "string");
});

test("login converts database failures to a controlled server error", async () => {
  User.findByEmail = async () => { throw new Error("database unavailable"); };
  const response = createResponse();
  const originalError = console.error;
  console.error = () => {};

  try {
    await loginUser({ body: { email: "known@example.com", password: "correct-password" } }, response);
  } finally {
    console.error = originalError;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.payload, { success: false, message: "Failed to log in." });
});
