Feature: Receiver Management
  As a customer, I want to add and verify receivers for fund transfers.

  Scenario: Save Receiver with Pending Status
    Given The customer provides valid receiver details:
      | name         | ifsc        | accountNumber |
      | Shivansh Y.  | HDFC0035740 | 123343423634  |
    When The customer submits the receiver details
    Then The system saves the receiver details
    And Receiver status is marked as "PENDING_OTP_VERIFICATION"

  Scenario: OTP Verification Success
    Given Customer enters the correct OTP
    When OTP is validated and not expired
    Then Change Receiver status as "VERIFIED"
    And Apply transaction limit of 50000 for "FIRST_24_HOURS"