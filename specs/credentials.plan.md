# Credentials Management Test Plan

## Application Overview

Testing the credentials management system including creating, editing, viewing, and deleting API credentials for different providers (OpenAI, Anthropic, Gemini). The system allows users to securely store API keys and manage them through a web interface.

## Test Scenarios

### 1. Authentication and Navigation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Navigate to credentials page after login

**File:** `tests/credentials/navigate-to-credentials.spec.ts`

**Steps:**
  1. Navigate to /credentials
    - expect: Page loads successfully
    - expect: Shows 'Credentials' header with description
    - expect: Shows 'New credential' button
    - expect: Shows empty state if no credentials exist
  2. Click 'New credential' button
    - expect: Redirects to /credentials/new
    - expect: Shows 'Create Credential' form

### 2. Credential Form Validation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Empty form validation

**File:** `tests/credentials/form-validation-empty.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Create Credential form is visible
  2. Clear the name field and submit the form
    - expect: Shows error message 'Name is required'
  3. Fill name field but leave API key empty and submit
    - expect: Shows error message 'API key is required'

#### 2.2. Field requirements validation

**File:** `tests/credentials/form-validation-requirements.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form loads with default OpenAI type selected
  2. Enter single character in name field
    - expect: Name field accepts the input
  3. Enter single character in API key field
    - expect: API key field accepts the input (masked)
  4. Submit form with minimal valid data
    - expect: Form submits successfully

### 3. Credential Creation

**Seed:** `tests/seed.spec.ts`

#### 3.1. Create OpenAI credential

**File:** `tests/credentials/create-openai-credential.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form loads with OpenAI selected by default
  2. Enter 'Test OpenAI Key' in name field
    - expect: Name field shows entered value
  3. Verify type is OpenAI with placeholder 'sk-...'
    - expect: OpenAI is selected
    - expect: API key placeholder shows 'sk-...'
  4. Enter 'sk-test-key-12345' in API key field
    - expect: API key field shows masked characters
  5. Click 'Create Credential' button
    - expect: Form submits successfully
    - expect: Redirects to credential detail page
    - expect: Shows 'Edit Credential' indicating successful creation

#### 3.2. Create Anthropic credential

**File:** `tests/credentials/create-anthropic-credential.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form loads successfully
  2. Click on the type select dropdown
    - expect: Dropdown opens showing available options
  3. Select 'Anthropic' from dropdown
    - expect: Anthropic is selected
    - expect: API key placeholder changes to 'sk-ant-...'
    - expect: Shows Anthropic logo in dropdown
  4. Fill name as 'Test Anthropic Key'
    - expect: Name field updated
  5. Fill API key as 'sk-ant-test-key-12345'
    - expect: API key field shows masked input
  6. Submit the form
    - expect: Credential created and redirected to detail page

#### 3.3. Create Gemini credential

**File:** `tests/credentials/create-gemini-credential.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form loads successfully
  2. Select 'Gemini' from type dropdown
    - expect: Gemini selected
    - expect: Placeholder shows 'AIza...'
    - expect: Shows Gemini logo
  3. Fill form with Gemini credentials
    - expect: Form accepts Gemini-format API key
  4. Submit form
    - expect: Credential created successfully

### 4. Credential Management

**Seed:** `tests/seed.spec.ts`

#### 4.1. Cancel credential creation

**File:** `tests/credentials/cancel-creation.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Create form is visible
  2. Fill some form fields
    - expect: Fields contain entered data
  3. Click 'Cancel' button
    - expect: Returns to /credentials page
    - expect: No credential was created
    - expect: Shows credentials list

#### 4.2. View credentials list

**File:** `tests/credentials/view-credentials-list.spec.ts`

**Steps:**
  1. Navigate to /credentials after creating a credential
    - expect: Shows list of created credentials
    - expect: Each credential shows name, type, and creation date
    - expect: Shows provider logos for each credential type
  2. Click on a credential in the list
    - expect: Navigates to credential detail page
    - expect: Shows edit form with populated data

### 5. Error Handling and Edge Cases

**Seed:** `tests/seed.spec.ts`

#### 5.1. Network error during creation

**File:** `tests/credentials/network-error-handling.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form loads successfully
  2. Fill valid form data
    - expect: Form fields populated
  3. Simulate network error during form submission
    - expect: Form shows appropriate error message
    - expect: Submit button returns to enabled state
    - expect: Form data is preserved

#### 5.2. Very long credential names

**File:** `tests/credentials/long-names.spec.ts`

**Steps:**
  1. Navigate to /credentials/new
    - expect: Form is ready
  2. Enter a very long credential name (200+ characters)
    - expect: Name field accepts long input
    - expect: UI handles long names gracefully
  3. Submit form with long name
    - expect: Credential saves successfully or shows appropriate validation

#### 5.3. Special characters in credential data

**File:** `tests/credentials/special-characters.spec.ts`

**Steps:**
  1. Enter name with special characters: 'My Key & Co. #1'
    - expect: Special characters are accepted
  2. Enter API key with various symbols
    - expect: API key field handles special characters
  3. Submit and verify credential creation
    - expect: Credential created with special characters intact
