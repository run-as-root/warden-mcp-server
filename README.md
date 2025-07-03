# Warden Magento MCP Server

A comprehensive Model Context Protocol (MCP) server that provides seamless integration between AI assistants and Warden + Magento 2 development environments. This server enables AI assistants to interact directly with your Warden-managed Magento projects, automating common development tasks and providing intelligent assistance for complex workflows.

## Features

This MCP server transforms your AI assistant into a powerful development companion for Warden + Magento 2 projects by providing:

- **🚀 Project Initialization**: Create new Warden projects with customizable Magento 2 environments
- **🔧 Environment Management**: Start/stop projects and services with intelligent state management
- **🗄️ Database Operations**: Execute SQL queries directly in containerized databases
- **🐘 PHP Development Tools**: Run PHP scripts in properly configured containerized environments
- **🛠️ Magento CLI Integration**: Execute Magento commands seamlessly within containers
- **🧪 Unit Testing Support**: Run PHPUnit tests with automatic configuration detection
- **📦 Composer Integration**: Manage dependencies within containers with full command support
- **📊 Environment Monitoring**: List and monitor running Warden environments

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Configure your MCP client (see Configuration section below)

## Configuration

### MCP Client Configuration

Add the following configuration to your MCP client settings:

```json
{
  "mcpServers": {
    "warden-magento": {
      "command": "node",
      "args": ["/absolute/path/to/warden-mcp-server/server.js"],
      "env": {}
    }
  }
}
```

**Important**: Replace `/absolute/path/to/warden-mcp-server/server.js` with the actual absolute path to the server.js file on your system.

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "warden-magento": {
      "command": "node",
      "args": ["/Users/your-username/path/to/warden-mcp-server/server.js"]
    }
  }
}
```

### For Zed Editor

Add to your Zed settings:

```json
{
  "assistant": {
    "version": "2",
    "provider": {
      "name": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  },
  "context_servers": {
    "warden-magento": {
      "command": "node",
      "args": ["/Users/your-username/path/to/warden-mcp-server/server.js"]
    }
  }
}
```

## Usage

Once configured, your AI assistant can automatically use these tools to help with Warden + Magento development tasks. Simply describe what you want to accomplish, and the AI will use the appropriate tools.

## Available Tools

### Environment Management

#### `warden_list_environments`
Lists all running Warden environments with their directories and status information.

**Parameters:** None

**Use Cases:**
- Check which environments are currently running
- Get project paths for other operations
- Monitor environment status

---

#### `warden_start_project`
Starts a Warden project environment, bringing up all configured containers.

**Parameters:**
- `project_path` (required): Path to the project directory

**Use Cases:**
- Start development environment
- Resume work on a project
- Bring up services after system restart

---

#### `warden_stop_project`
Stops a Warden project environment, shutting down all project containers.

**Parameters:**
- `project_path` (required): Path to the project directory

**Use Cases:**
- Clean shutdown of development environment
- Free up system resources
- Prepare for system maintenance

---

#### `warden_start_svc`
Starts Warden system services (shared infrastructure like DNS, proxy, etc.).

**Parameters:**
- `project_path` (required): Path to the project directory

**Use Cases:**
- Initialize Warden infrastructure
- Start shared services after system reboot
- Prepare environment for project startup

---

#### `warden_stop_svc`
Stops Warden system services.

**Parameters:**
- `project_path` (required): Path to the project directory

**Use Cases:**
- Clean shutdown of Warden infrastructure
- Troubleshoot service conflicts
- System maintenance

---

### Project Initialization

#### `warden_init_project`
Initializes a new Warden project with a fully configured Magento 2 environment.

**Parameters:**
- `project_path` (required): Path where the project should be initialized
- `project_name` (required): Name for the Warden environment
- `environment_type` (optional): Environment type (default: "magento2")
- `php_version` (optional): PHP version (default: "8.3")
- `mysql_distribution` (optional): MySQL distribution (default: "mariadb")
- `mysql_version` (optional): MySQL version (default: "10.6")
- `node_version` (optional): Node.js version (default: "20")
- `composer_version` (optional): Composer version (default: "2")
- `opensearch_version` (optional): OpenSearch version (default: "2.12")
- `redis_version` (optional): Redis version (default: "7.2")
- `enable_redis` (optional): Enable Redis (default: true)
- `enable_opensearch` (optional): Enable OpenSearch (default: true)
- `enable_varnish` (optional): Enable Varnish (default: true)
- `enable_rabbitmq` (optional): Enable RabbitMQ (default: true)
- `enable_xdebug` (optional): Enable Xdebug (default: true)

**Use Cases:**
- Set up new Magento 2 development environment
- Create project with specific PHP/MySQL versions
- Configure environment for specific requirements
- Initialize project with custom service stack

---

### Database Operations

#### `warden_db_query`
Executes SQL queries directly in the Warden database container.

**Parameters:**
- `project_path` (required): Path to the project directory
- `query` (required): SQL query to execute
- `database` (optional): Database name (default: "magento")

**Use Cases:**
- Execute database queries for debugging
- Retrieve data for analysis
- Perform database maintenance tasks
- Check database schema or data

---

### PHP Development

#### `warden_php_script`
Runs PHP scripts inside the php-fpm container with proper environment setup.

**Parameters:**
- `project_path` (required): Path to the project directory
- `script_path` (required): Path to the PHP script relative to project root
- `args` (optional): Additional arguments to pass to the script

**Use Cases:**
- Execute custom PHP scripts
- Run data migration scripts
- Test PHP functionality
- Execute maintenance scripts

---

### Magento CLI

#### `warden_magento_cli`
Executes Magento CLI commands inside the php-fpm container.

**Parameters:**
- `project_path` (required): Path to the project directory
- `command` (required): Magento CLI command (without 'bin/magento' prefix)
- `args` (optional): Additional arguments for the command

**Use Cases:**
- Run cache operations (cache:clean, cache:flush)
- Execute setup commands (setup:upgrade, setup:di:compile)
- Manage configuration (config:set, config:show)
- Run indexing operations (indexer:reindex)
- Module management (module:enable, module:disable)

---

### Testing

#### `warden_run_unit_tests`
Runs PHPUnit tests inside the php-fpm container with automatic configuration detection.

**Parameters:**
- `project_path` (required): Path to the project directory
- `config_file` (optional): PHPUnit configuration file (auto-detects phpunit.xml.dist or phpunit.xml)
- `test_path` (optional): Path to specific test file or directory
- `extra_args` (optional): Additional PHPUnit arguments

**Use Cases:**
- Run unit tests for modules
- Execute specific test suites
- Run tests with custom configuration
- Validate code changes with automated testing

---

### Dependency Management

#### `warden_composer`
Executes Composer commands inside the php-fpm container.

**Parameters:**
- `project_path` (required): Path to the project directory
- `command` (required): Composer command to execute

**Common Commands:**
- `install` - Install dependencies
- `update` - Update dependencies
- `require package/name` - Add new dependency
- `remove package/name` - Remove dependency
- `require-commerce` - Install Adobe Commerce (if applicable)
- `dump-autoload` - Regenerate autoloader

**Use Cases:**
- Install project dependencies
- Add new packages to project
- Update existing dependencies
- Manage autoloading
- Install Adobe Commerce components

---

## Prerequisites

- **Warden**: Must be installed and configured on your system
- **Docker**: Required for Warden to function
- **Node.js**: Version 18.0.0 or higher
- **MCP Client**: Compatible MCP client (Claude Desktop, Zed, etc.)

## Troubleshooting

For issues specific to this MCP server, check:
- Server logs when running `npm start`
- MCP client logs for connection issues
- Docker container logs: `warden env logs`
- MCP Server inspector: https://github.com/modelcontextprotocol/inspector

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Related Projects

- [Warden](https://github.com/wardenenv/warden) - The Docker-based development environment
- [Model Context Protocol](https://github.com/modelcontextprotocol) - The protocol specification
- [Magento 2](https://github.com/magento/magento2) - The e-commerce platform
