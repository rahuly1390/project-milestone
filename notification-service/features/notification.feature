Feature: Notification Service
  As a banking platform
  I want to send notifications via SMS and Email
  So that customers receive confirmations for sensitive actions

  Scenario: Send SMS notification successfully
    Given A notification request exists with:
      | channel | to            | message                         | category       |
      | SMS     | +91XXXXXXXXXX | Receiver activated successfully | RECEIVER_EVENT |
    When The Notification Service submits the SMS to the provider
    Then The SMS provider responds with "ACCEPTED"
    And The Notification Service stores the record with status "SENT"
    And The Notification Service returns a notificationId

  Scenario: Validate mandatory fields for Email
    Given A notification request exists with:
      | channel | to        | message                             |
      | Email   | <missing> | OTP locked due to multiple failures |
    When The Notification Service validates the request
    Then The Notification Service rejects the request with error "INVALID_INPUT"