# Keyra

Keyra is a stateless password generator that uses your master password and service name to create strong, unique, and repeatable passwords for every website.

## Features

- **Stateless Design**: No passwords are stored, just remember one master password
- **Deterministic Generation**: Same inputs always produce the same password
- **Highly Configurable**: Customize password rules and version control
- **Secure Algorithm**: Uses scrypt encryption algorithm to ensure password security
- **Version Control**: Allows updating passwords for specific services without changing the master password

## Try Keyra Online

Try Keyra without installation on our web application:
[https://9b9387.github.io/keyra](https://9b9387.github.io/keyra)

The online application offers the same functionality as the installed version but runs directly in your browser.

## Usage

### As a CLI Tool

```bash
# Global installation
npm install -g keyra
```

#### Available Commands

Password commands:

- `gen <service>`: Generate a password for the given service.
  - `-r, --rule <rule>`: Specify a password rule name (must already exist).
  - `-p, --password <masterPassword>`: Provide master password (otherwise will prompt interactively / or use environment variable `KEYRA_MASTER_PASSWORD`).
  - `-s, --save`: Save the generated service (version=1) locally.
- `get <service>`: Retrieve current password for a service.
  - `-d, --detail`: Show detailed metadata (rule, created time, note, etc.).
  - `-v, --versions`: Show all historical versions (password history). Can be combined with `--detail`.
  - `-p, --password <masterPassword>`: Provide master password (else prompt / env).
- `rotate <service>`: Increment version for a service (does NOT output password directly; use `get` afterwards to see the new password).
- `list`: List all saved service entries.
- `delete <service>`: Remove stored password data for the given service.

Rule commands:

- `rule:list`: Show all password rules.
- `rule:add`: Interactive creation of a new password rule.
- `rule:delete <rule>`: Delete an existing password rule (cannot delete `default`).

Global master password environment variable:

```bash
export KEYRA_MASTER_PASSWORD="yourMasterPassword"
```

Then you can omit `-p/--password`.

#### Examples

Generate (not saving):

```bash
keyra gen github
```

Generate with rule and save:

```bash
keyra rule:add   # Interactively create a custom rule, assume it is named myrule
keyra gen github -r myrule -s -p "My$ecret"  # Generate immediately and save
```

List saved services:

```bash
keyra list
```

Get current password (using env variable for master password):

```bash
export KEYRA_MASTER_PASSWORD="My$ecret"
keyra get github
```

Show password with details:

```bash
keyra get github -d
```

Show password history (all versions) with details:

```bash
keyra get github -v -d
```

Rotate (bump version):

```bash
keyra rotate github
keyra get github   # See the new version password
```

Delete a service:

```bash
keyra delete github
```

Manage rules:

```bash
keyra rule:list
keyra rule:add
keyra rule:delete myrule
```

### As a Library

```bash
npm install keyra
```

```typescript
import { KeyraData, KeyraRule, Generator } from 'keyra';

// Create custom password rule
const rule = new KeyraRule(
  'my-rule', // Rule name
  16, // Password length
  true, // Require uppercase letters
  true, // Require lowercase letters
  true, // Require numbers
  true, // Require symbols
  '!@#$%^&*', // Allowed symbols
);

// Create service data
const data = new KeyraData(
  'github.com', // Service name
  1, // Password version
  rule, // Password rule
  'My GitHub account', // Note
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
