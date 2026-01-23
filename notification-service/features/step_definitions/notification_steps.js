const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const request = require('supertest');
const app = require('../../src/app'); // Your Express app

let payload;
let response;

Given('A notification request exists with:', function (dataTable) {
    payload = dataTable.hashes()[0];
    if (payload.to === '<missing>') delete payload.to;
});

When('The Notification Service submits the SMS to the provider', async function () {
    // We hit the actual endpoint
    response = await request(app)
        .post('/v1/notifications')
        .send(payload);
});

When('The Notification Service validates the request', async function () {
    response = await request(app)
        .post('/v1/notifications')
        .send(payload);
});

Then('The SMS provider responds with {string}', function (status) {
    // In our mock/dev setup, we expect 202 Accepted
    assert.strictEqual(response.status, 202);
});

Then('The Notification Service rejects the request with error {string}', function (errorCode) {
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.error, errorCode);
});

Then('The Notification Service returns a notificationId', function () {
    assert.ok(response.body.notificationId);
});