const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const request = require('supertest'); // To test actual API endpoints
const app = require('../../src/app'); 

let receiverData;
let response;

Given('The customer provides valid receiver details:', function (dataTable) {
    receiverData = dataTable.hashes()[0];
});

When('The customer submits the receiver details', async function () {
    response = await request(app)
        .post('/v1/receivers')
        .set('Authorization', 'Bearer mock-token')
        .send(receiverData);
});

Then('The system saves the receiver details', function () {
    assert.strictEqual(response.status, 201);
});

Then('Receiver status is marked as {string}', function (expectedStatus) {
    assert.strictEqual(response.body.status, expectedStatus);
});