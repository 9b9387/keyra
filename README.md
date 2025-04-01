# Keyra

Keyra is a stateless password generator that uses your master password and service name to create strong, unique, and repeatable passwords for every website.

## Features

- **Stateless Design**: No passwords are stored, just remember one master password
- **Deterministic Generation**: Same inputs always produce the same password
- **Highly Configurable**: Customize password rules and version control
- **Secure Algorithm**: Uses scrypt encryption algorithm to ensure password security
- **Version Control**: Allows updating passwords for specific services without changing the master password

## Installation

```bash
npm install keyra
```

## Usage

### As a CLI Tool

```bash
# Global installation
npm install -g keyra
```

#### Available Commands

- `gen <service-name>`: Generate a new password for the specified service.
- `get <service-name>`: Retrieve the password for a service.
  - Options:
    - `-d, --detail`: Show detailed information.
    - `-h, --history`: Show password history.
    - `-p, --password <password>`: Set master password.
- `list`: List all saved service entries.
- `delete <service-name>`: Remove a saved service entry.
  - Options:
    - `-f, --force`: Force delete without confirmation.
- `rotate <service-name>`: Rotate a service password and increment the version number.
  - Options:
    - `-f, --force`: Force execution without confirmation prompt.
- `rule:list`: Display all password rules.
- `rule:add`: Add a new password rule.
- `rule:delete <ruleName>`: Delete an existing password rule.
  - Options:
    - `-f, --force`: Force delete without confirmation.

### As a Library

```typescript
import { KeyraData, KeyraRule, Generator } from 'keyra';

// Create custom password rule
const rule = new KeyraRule(
  'my-rule',  // Rule name
  16,         // Password length
  true,       // Require uppercase letters
  true,       // Require lowercase letters
  true,       // Require numbers
  true,       // Require symbols
  '!@#$%^&*' // Allowed symbols
);

// Create service data
const data = new KeyraData(
  'github.com', // Service name
  1,            // Password version
  rule,         // Password rule
  'My GitHub account' // Note
);

// Generate password
const generator = new Generator();
(async () => {
  const password = await generator.generate('masterPassword', data);
  console.log(password); // Output the generated password
})();
```

## Password Rules

You can customize password generation rules with the `KeyraRule` class:

- `name`: Rule name
- `length`: Password length (minimum 4 characters)
- `requireUppercase`: Whether uppercase letters are required
- `requireLowercase`: Whether lowercase letters are required
- `requireNumbers`: Whether numbers are required
- `requireSymbols`: Whether symbols are required
- `allowedSymbols`: Which symbols are allowed

## Version Control

When you need to update a password for a service, you can increase the `version` value to generate a new password without changing your master password.

```typescript
const data = new KeyraData('github.com', 2); // Version 2 will generate a different password
```

## Security Notes

- Your master password is never stored or transmitted
- Password generation uses the scrypt algorithm, which has high computational cost to prevent brute force attacks
- All password generation is done locally with no network communication

## Contributing

Pull requests and issues are welcome to improve this project.

## License

MIT
