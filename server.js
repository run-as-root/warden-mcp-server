#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, execSync } from "child_process";
import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

class WardenMagentoServer {
  constructor() {
    this.server = new Server(
      {
        name: "warden-magento-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "warden_list_environments",
            description:
              "List all running Warden environments with their directories (returns structured JSON)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "warden_start_project",
            description: "Start a Warden project environment",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
              },
              required: ["project_path"],
            },
          },
          {
            name: "warden_stop_project",
            description: "Stop a Warden project environment",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
              },
              required: ["project_path"],
            },
          },
          {
            name: "warden_start_svc",
            description: "Start Warden system services",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
              },
              required: ["project_path"],
            },
          },
          {
            name: "warden_stop_svc",
            description: "Stop Warden system services",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
              },
              required: ["project_path"],
            },
          },
          {
            name: "warden_db_query",
            description: "Run a SQL query in the Warden database",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
                query: {
                  type: "string",
                  description: "SQL query to execute",
                },
                database: {
                  type: "string",
                  description: "Database name (optional, defaults to magento)",
                  default: "magento",
                },
              },
              required: ["project_path", "query"],
            },
          },
          {
            name: "warden_php_script",
            description: "Run a PHP script inside the php-fpm container",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
                script_path: {
                  type: "string",
                  description:
                    "Path to the PHP script relative to project root",
                },
                args: {
                  type: "array",
                  description: "Additional arguments to pass to the script",
                  items: {
                    type: "string",
                  },
                  default: [],
                },
              },
              required: ["project_path", "script_path"],
            },
          },
          {
            name: "warden_magento_cli",
            description: "Run bin/magento command inside the php-fpm container",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
                command: {
                  type: "string",
                  description:
                    "Magento CLI command (without 'bin/magento' prefix)",
                },
                args: {
                  type: "array",
                  description: "Additional arguments for the command",
                  items: {
                    type: "string",
                  },
                  default: [],
                },
              },
              required: ["project_path", "command"],
            },
          },
          {
            name: "warden_run_unit_tests",
            description:
              "Run unit tests using PHPUnit in the php-fpm container",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
                config_file: {
                  type: "string",
                  description:
                    "PHPUnit configuration file (auto-detects phpunit.xml.dist or phpunit.xml)",
                  default: "",
                },
                test_path: {
                  type: "string",
                  description:
                    "Optional path to specific test file or directory",
                  default: "",
                },
                extra_args: {
                  type: "array",
                  description: "Additional PHPUnit arguments",
                  items: {
                    type: "string",
                  },
                  default: [],
                },
              },
              required: ["project_path"],
            },
          },
          {
            name: "warden_composer",
            description: "Run Composer commands inside the php-fpm container",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path to the project directory",
                },
                command: {
                  type: "string",
                  description:
                    "Composer command to execute (e.g., 'install', 'update', 'require symfony/console', 'require-commerce')",
                },
              },
              required: ["project_path", "command"],
            },
          },
          {
            name: "warden_init_project",
            description:
              "Initialize a new Warden project with Magento 2 environment",
            inputSchema: {
              type: "object",
              properties: {
                project_path: {
                  type: "string",
                  description: "Path where the project should be initialized",
                },
                project_name: {
                  type: "string",
                  description: "Name for the Warden environment",
                },
                environment_type: {
                  type: "string",
                  description: "Environment type (default: magento2)",
                  default: "magento2",
                },
                php_version: {
                  type: "string",
                  description: "PHP version (default: 8.3)",
                  default: "8.3",
                },
                mysql_distribution: {
                  type: "string",
                  description: "MySQL distribution (default: mariadb)",
                  default: "mariadb",
                },
                mysql_version: {
                  type: "string",
                  description: "MySQL version (default: 10.6)",
                  default: "10.6",
                },
                node_version: {
                  type: "string",
                  description: "Node.js version (default: 20)",
                  default: "20",
                },
                composer_version: {
                  type: "string",
                  description: "Composer version (default: 2)",
                  default: "2",
                },
                opensearch_version: {
                  type: "string",
                  description: "OpenSearch version (default: 2.12)",
                  default: "2.12",
                },
                redis_version: {
                  type: "string",
                  description: "Redis version (default: 7.2)",
                  default: "7.2",
                },
                enable_redis: {
                  type: "boolean",
                  description: "Enable Redis (default: true)",
                  default: true,
                },
                enable_opensearch: {
                  type: "boolean",
                  description: "Enable OpenSearch (default: true)",
                  default: true,
                },
                enable_varnish: {
                  type: "boolean",
                  description: "Enable Varnish (default: true)",
                  default: true,
                },
                enable_rabbitmq: {
                  type: "boolean",
                  description: "Enable RabbitMQ (default: true)",
                  default: true,
                },
                enable_xdebug: {
                  type: "boolean",
                  description: "Enable Xdebug (default: true)",
                  default: true,
                },
              },
              required: ["project_path", "project_name"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "warden_list_environments":
          return await this.listEnvironments();
        case "warden_start_project":
          return await this.startProject(request.params.arguments);
        case "warden_stop_project":
          return await this.stopProject(request.params.arguments);
        case "warden_start_svc":
          return await this.startSvc(request.params.arguments);
        case "warden_stop_svc":
          return await this.stopSvc(request.params.arguments);
        case "warden_db_query":
          return await this.runDbQuery(request.params.arguments);
        case "warden_php_script":
          return await this.runPhpScript(request.params.arguments);
        case "warden_magento_cli":
          return await this.runMagentoCli(request.params.arguments);
        case "warden_run_unit_tests":
          return await this.runUnitTests(request.params.arguments);
        case "warden_composer":
          return await this.runComposer(request.params.arguments);
        case "warden_init_project":
          return await this.initProject(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async listEnvironments() {
    try {
      const result = await this.executeCommand(
        "warden",
        ["status"],
        process.cwd(),
      );

      if (result.code === 0) {
        const environments = this.parseEnvironmentList(result.stdout);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  command: "warden status",
                  exit_code: result.code,
                  environments: environments.map((env) => ({
                    name: env.name,
                    path: env.path,
                  })),
                  raw_output: result.stdout,
                },
                null,
                2,
              ),
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  command: "warden status",
                  exit_code: result.code,
                  environments: [],
                  error: result.stderr || "Unknown error",
                  raw_output: result.stdout,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                command: "warden status",
                exit_code: -1,
                environments: [],
                error: error.message,
                raw_output: error.stdout || "",
                raw_errors: error.stderr || "",
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  }

  parseEnvironmentList(output) {
    const environments = [];
    const lines = output.split("\n");

    let currentProject = null;
    let currentPath = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and headers
      if (
        !trimmed ||
        trimmed.includes("No running environments found") ||
        trimmed.includes("Found the following")
      ) {
        continue;
      }

      // Remove ANSI color codes for parsing
      const cleanLine = trimmed.replace(/\x1b\[[0-9;]*m/g, "");

      // Look for project name pattern: "    projectname a magento2 project"
      const projectMatch = cleanLine.match(/^\s*(\w+)\s+a\s+\w+\s+project$/);
      if (projectMatch) {
        currentProject = projectMatch[1];
        continue;
      }

      // Look for project directory pattern: "       Project Directory: /path/to/project"
      const directoryMatch = cleanLine.match(/^\s*Project Directory:\s*(.+)$/);
      if (directoryMatch && currentProject) {
        currentPath = directoryMatch[1];

        // Add the environment when we have both name and path
        environments.push({
          name: currentProject,
          path: currentPath,
          raw: line,
        });

        // Reset for next project
        currentProject = null;
        currentPath = null;
        continue;
      }

      // Skip URL lines
      if (cleanLine.includes("Project URL:")) {
        continue;
      }
    }

    return environments;
  }

  /**
   * Helper function to get environment list for internal use by other tools
   * Returns a simplified array of {name, path} objects
   */
  async getEnvironmentList() {
    try {
      const result = await this.executeCommand(
        "warden",
        ["status"],
        process.cwd(),
      );

      if (result.code === 0) {
        const environments = this.parseEnvironmentList(result.stdout);
        return environments.map((env) => ({
          name: env.name,
          path: env.path,
        }));
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  async startProject(args) {
    const { project_path } = args;
    return await this.executeWardenCommand(
      project_path,
      ["env", "up"],
      "Starting Warden project environment",
    );
  }

  async stopProject(args) {
    const { project_path } = args;
    return await this.executeWardenCommand(
      project_path,
      ["env", "down"],
      "Stopping Warden project environment",
    );
  }

  async startSvc(args) {
    const { project_path } = args;
    return await this.executeWardenCommand(
      project_path,
      ["svc", "up"],
      "Starting Warden system services",
    );
  }

  async stopSvc(args) {
    const { project_path } = args;
    return await this.executeWardenCommand(
      project_path,
      ["svc", "down"],
      "Stopping Warden system services",
    );
  }

  async runDbQuery(args) {
    const { project_path, query, database = "magento" } = args;

    const wardenCommand = [
      "env",
      "exec",
      "-T",
      "db",
      "mysql",
      "-u",
      "root",
      "-pmagento",
      database,
      "-e",
      query,
    ];

    return await this.executeWardenCommand(
      project_path,
      wardenCommand,
      `Running database query in ${database}`,
    );
  }

  async runPhpScript(args) {
    const { project_path, script_path, args: scriptArgs = [] } = args;

    const wardenCommand = [
      "env",
      "exec",
      "-T",
      "php-fpm",
      "php",
      script_path,
      ...scriptArgs,
    ];

    return await this.executeWardenCommand(
      project_path,
      wardenCommand,
      `Running PHP script: ${script_path}`,
    );
  }

  async runMagentoCli(args) {
    const { project_path, command, args: commandArgs = [] } = args;

    const wardenCommand = [
      "env",
      "exec",
      "-T",
      "php-fpm",
      "php",
      "bin/magento",
      command,
      ...commandArgs,
    ];

    return await this.executeWardenCommand(
      project_path,
      wardenCommand,
      `Running Magento CLI: bin/magento ${command}`,
    );
  }

  async runUnitTests(args) {
    const {
      project_path,
      config_file = "",
      test_path = "",
      extra_args = [],
    } = args;

    // Determine which config file to use
    let actualConfigFile = config_file;
    if (!actualConfigFile) {
      const normalizedProjectPath = project_path.replace(/\/+$/, "");
      const absoluteProjectPath = resolve(normalizedProjectPath);

      // Check for phpunit.xml.dist first, then fallback to phpunit.xml
      const phpunitDistPath = join(absoluteProjectPath, "phpunit.xml.dist");
      const phpunitPath = join(absoluteProjectPath, "phpunit.xml");

      if (existsSync(phpunitDistPath)) {
        actualConfigFile = "phpunit.xml.dist";
      } else if (existsSync(phpunitPath)) {
        actualConfigFile = "phpunit.xml";
      } else {
        throw new Error(
          "No PHPUnit configuration file found (phpunit.xml.dist or phpunit.xml)",
        );
      }
    }

    const wardenCommand = [
      "env",
      "exec",
      "-T",
      "php-fpm",
      "php",
      "vendor/phpunit/phpunit/phpunit",
      "-c",
      actualConfigFile,
    ];

    if (test_path && test_path.trim() !== "") {
      wardenCommand.push(test_path);
    }

    wardenCommand.push(...extra_args);

    const commandStr = `warden ${wardenCommand.join(" ")}`;
    const normalizedProjectPath = project_path.replace(/\/+$/, "");
    const absoluteProjectPath = resolve(normalizedProjectPath);

    const debugInfo = `
Debug Information:
- Project Path: ${absoluteProjectPath}
- Config File Used: ${actualConfigFile}
- Test Path: ${test_path || "(all tests)"}
- Extra Args: ${extra_args.length > 0 ? extra_args.join(" ") : "(none)"}
- Full Command: ${commandStr}
`;

    try {
      const result = await this.executeCommand(
        "warden",
        wardenCommand,
        absoluteProjectPath,
      );

      const isSuccess = result.code === 0;

      return {
        content: [
          {
            type: "text",
            text: `Running PHPUnit tests with config: ${actualConfigFile} ${isSuccess ? "completed successfully" : "failed"}!\n${debugInfo}\nExit Code: ${result.code}\n\nOutput:\n${result.stdout || "(no output)"}\n\nErrors:\n${result.stderr || "(no errors)"}`,
          },
        ],
        isError: !isSuccess,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute PHPUnit tests:\n${debugInfo}\nError: ${error.message}\n\nOutput:\n${error.stdout || "(no output)"}\n\nErrors:\n${error.stderr || "(no errors)"}`,
          },
        ],
        isError: true,
      };
    }
  }

  async runComposer(args) {
    const { project_path, command } = args;

    if (!project_path) {
      throw new Error("project_path is required");
    }

    if (!command) {
      throw new Error("command is required");
    }

    const normalizedProjectPath = project_path.replace(/\/+$/, "");
    const absoluteProjectPath = resolve(normalizedProjectPath);

    if (!existsSync(absoluteProjectPath)) {
      throw new Error(
        `Project directory does not exist: ${absoluteProjectPath}`,
      );
    }

    try {
      // First, check if composer2 is available
      const composer2CheckResult = await this.executeCommand(
        "warden",
        ["env", "exec", "-T", "php-fpm", "which", "composer2"],
        absoluteProjectPath,
      );

      let composerCommand = "composer2";

      if (composer2CheckResult.code !== 0) {
        // composer2 not available, check for composer
        const composerCheckResult = await this.executeCommand(
          "warden",
          ["env", "exec", "-T", "php-fpm", "which", "composer"],
          absoluteProjectPath,
        );

        if (composerCheckResult.code !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Composer not found!\n\nNeither 'composer2' nor 'composer' commands are available in the php-fpm container.\n\nPlease install Composer version 2 in your container.`,
              },
            ],
            isError: true,
          };
        }

        // Check composer version
        const versionCheckResult = await this.executeCommand(
          "warden",
          ["env", "exec", "-T", "php-fpm", "composer", "--version"],
          absoluteProjectPath,
        );

        if (versionCheckResult.code !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to check Composer version!\n\nCommand: composer --version\nError: ${versionCheckResult.stderr}`,
              },
            ],
            isError: true,
          };
        }

        // Check if it's version 2
        const versionOutput = versionCheckResult.stdout.toLowerCase();
        if (!versionOutput.includes("composer version 2")) {
          return {
            content: [
              {
                type: "text",
                text: `Composer version 2 is required!\n\nFound: ${versionCheckResult.stdout.trim()}\n\nPlease install or upgrade to Composer version 2.`,
              },
            ],
            isError: true,
          };
        }

        composerCommand = "composer";
      }

      // Parse the command string to handle arguments properly
      const commandParts = command.trim().split(/\s+/);
      const wardenCommand = [
        "env",
        "exec",
        "-T",
        "php-fpm",
        composerCommand,
        ...commandParts,
      ];

      const result = await this.executeCommand(
        "warden",
        wardenCommand,
        absoluteProjectPath,
      );

      const commandStr = `${composerCommand} ${command}`;
      const isSuccess = result.code === 0;

      return {
        content: [
          {
            type: "text",
            text: `Composer command ${isSuccess ? "completed successfully" : "failed"}!\n\nCommand: ${commandStr}\nWorking directory: ${absoluteProjectPath}\nExit Code: ${result.code}\n\nOutput:\n${result.stdout || "(no output)"}\n\nErrors:\n${result.stderr || "(no errors)"}`,
          },
        ],
        isError: !isSuccess,
      };
    } catch (error) {
      const commandStr = `composer ${command}`;
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute Composer command:\n\nCommand: ${commandStr}\nWorking directory: ${absoluteProjectPath}\nError: ${error.message}\n\nOutput:\n${error.stdout || "(no output)"}\n\nErrors:\n${error.stderr || "(no errors)"}`,
          },
        ],
        isError: true,
      };
    }
  }

  async executeWardenCommand(project_path, wardenArgs, description) {
    if (!project_path) {
      throw new Error("project_path is required");
    }

    const normalizedProjectPath = project_path.replace(/\/+$/, "");
    const absoluteProjectPath = resolve(normalizedProjectPath);

    if (!existsSync(absoluteProjectPath)) {
      throw new Error(
        `Project directory does not exist: ${absoluteProjectPath}`,
      );
    }

    try {
      const result = await this.executeCommand(
        "warden",
        wardenArgs,
        absoluteProjectPath,
      );

      const commandStr = `warden ${wardenArgs.join(" ")}`;
      const isSuccess = result.code === 0;

      return {
        content: [
          {
            type: "text",
            text: `${description} ${isSuccess ? "completed successfully" : "failed"}!\n\nCommand: ${commandStr}\nWorking directory: ${absoluteProjectPath}\nExit Code: ${result.code}\n\nOutput:\n${result.stdout || "(no output)"}\n\nErrors:\n${result.stderr || "(no errors)"}`,
          },
        ],
        isError: !isSuccess,
      };
    } catch (error) {
      const commandStr = `warden ${wardenArgs.join(" ")}`;
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute command:\n\nCommand: ${commandStr}\nWorking directory: ${absoluteProjectPath}\nError: ${error.message}\n\nOutput:\n${error.stdout || "(no output)"}\n\nErrors:\n${error.stderr || "(no errors)"}`,
          },
        ],
        isError: true,
      };
    }
  }

  async initProject(args) {
    try {
      const {
        project_path,
        project_name,
        environment_type = "magento2",
        php_version = "8.3",
        mysql_distribution = "mariadb",
        mysql_version = "10.6",
        node_version = "20",
        composer_version = "2",
        opensearch_version = "2.12",
        redis_version = "7.2",
        enable_redis = true,
        enable_opensearch = true,
        enable_varnish = true,
        enable_rabbitmq = true,
        enable_xdebug = true,
      } = args;

      const absoluteProjectPath = resolve(project_path);

      // Create project directory if it doesn't exist
      execSync(`mkdir -p "${absoluteProjectPath}"`);

      // Change to project directory and initialize warden environment
      const result = await this.executeCommand(
        "warden",
        ["env", "init", project_name, environment_type],
        absoluteProjectPath,
      );

      if (result.code !== 0) {
        throw new Error(`Warden init failed: ${result.stderr}`);
      }

      // Read the generated .env file and update it with custom parameters
      const envFilePath = join(absoluteProjectPath, ".env");

      if (existsSync(envFilePath)) {
        let envContent = readFileSync(envFilePath, "utf8");

        // Update environment variables
        const updates = {
          PHP_VERSION: php_version,
          MYSQL_DISTRIBUTION: mysql_distribution,
          MYSQL_DISTRIBUTION_VERSION: mysql_version,
          NODE_VERSION: node_version,
          COMPOSER_VERSION: composer_version,
          OPENSEARCH_VERSION: opensearch_version,
          REDIS_VERSION: redis_version,
          WARDEN_REDIS: enable_redis ? "1" : "0",
          WARDEN_OPENSEARCH: enable_opensearch ? "1" : "0",
          WARDEN_VARNISH: enable_varnish ? "1" : "0",
          WARDEN_RABBITMQ: enable_rabbitmq ? "1" : "0",
          PHP_XDEBUG_3: enable_xdebug ? "1" : "0",
        };

        // Update each environment variable
        for (const [key, value] of Object.entries(updates)) {
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
          } else {
            envContent += `\n${key}=${value}`;
          }
        }

        writeFileSync(envFilePath, envContent);
      }

      return {
        content: [
          {
            type: "text",
            text: `Warden project initialized successfully!\n\nProject Path: ${absoluteProjectPath}\nProject Name: ${project_name}\nEnvironment Type: ${environment_type}\n\nConfiguration:\n- PHP Version: ${php_version}\n- MySQL: ${mysql_distribution} ${mysql_version}\n- Node.js: ${node_version}\n- Composer: ${composer_version}\n- OpenSearch: ${opensearch_version} (${enable_opensearch ? "enabled" : "disabled"})\n- Redis: ${redis_version} (${enable_redis ? "enabled" : "disabled"})\n- Varnish: ${enable_varnish ? "enabled" : "disabled"}\n- RabbitMQ: ${enable_rabbitmq ? "enabled" : "disabled"}\n- Xdebug: ${enable_xdebug ? "enabled" : "disabled"}\n\nNext steps:\n1. Navigate to: ${absoluteProjectPath}\n2. Run: warden env up\n3. Your environment will be available at: https://${project_name}.test\n\nOutput:\n${result.stdout}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to initialize Warden project:\n\nProject Path: ${args.project_path}\nProject Name: ${args.project_name}\nError: ${error.message}\n\nOutput:\n${error.stdout || "(no output)"}\n\nErrors:\n${error.stderr || "(no errors)"}`,
          },
        ],
        isError: true,
      };
    }
  }

  executeCommand(command, args = [], cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (code) => {
        resolve({ stdout, stderr, code });
      });

      childProcess.on("error", (error) => {
        const enhancedError = new Error(
          `Failed to spawn command: ${error.message}`,
        );
        enhancedError.stdout = stdout;
        enhancedError.stderr = stderr;
        reject(enhancedError);
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Warden Magento MCP server running on stdio");
  }
}

const server = new WardenMagentoServer();
server.run().catch(console.error);
