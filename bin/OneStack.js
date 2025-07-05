#!/usr/bin/env node

import { execSync } from "child_process";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import chalk from "chalk";

// 🌟 Welcome message
console.log(
  chalk.green.bold("\n💡 Every great project starts with a simple command.")
);
console.log(
  chalk.cyan("Welcome to DevLove – your fullstack project generator ❤️\n")
);

// 🧠 Step 1: Ask for project name
const { projectName } = await inquirer.prompt([
  {
    name: "projectName",
    message: "Enter your project name:",
    validate: (input) => (input ? true : "Project name is required."),
  },
]);

// ⛏️ Collect folder names
const folders = [];

async function askForFolder() {
  const { folderRole, folderName } = await inquirer.prompt([
    {
      name: "folderRole",
      type: "list",
      message: "What kind of folder do you want to create?",
      choices: ["frontend", "backend", "admin", "other"],
    },
    {
      name: "folderName",
      message: "Enter the folder name:",
      validate: (input) => (input ? true : "Folder name is required."),
    },
  ]);

  folders.push({ role: folderRole, name: folderName });

  const { more } = await inquirer.prompt([
    {
      name: "more",
      type: "confirm",
      message: "Do you want to create another folder?",
      default: false,
    },
  ]);

  if (more) {
    await askForFolder();
  }
}

await askForFolder();

// 📁 Create project root
const projectPath = path.join(process.cwd(), projectName);
if (fs.existsSync(projectPath)) {
  console.log(
    chalk.red("\n❌ Project folder already exists. Choose a different name.")
  );
  process.exit(1);
}
fs.mkdirSync(projectPath);
process.chdir(projectPath);

// 📂 Create folders
console.log(chalk.yellow("\n📦 Creating folders...\n"));
folders.forEach((folder) => {
  const folderPath = path.join(projectPath, folder.name);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(chalk.green(`  ✔ ${folder.name} (${folder.role})`));
  }
});

console.log(chalk.blueBright("\n✅ Step 1: Folder creation complete!"));
console.log(chalk.magentaBright("➡️  Starting setup for each folder...\n"));

// ⚛️ Setup Frontend Function
async function setupFrontend(folderName, projectName) {
  const { framework, uiLib, language } = await inquirer.prompt([
    {
      name: "framework",
      type: "list",
      message: `Select frontend framework for ${folderName}:`,
      choices: ["React", "Next.js (coming soon)", "Vue (coming soon)"],
      default: "React",
    },
    {
      name: "uiLib",
      type: "list",
      message: "Choose a UI library:",
      choices: ["Tailwind CSS", "Chakra UI", "Material UI", "None"],
      default: "Tailwind CSS",
    },
    {
      name: "language",
      type: "list",
      message: "Choose language:",
      choices: ["JavaScript", "TypeScript"],
      default: "JavaScript",
    },
  ]);

  if (framework !== "React") {
    console.log(
      chalk.red(
        `\n❌ Sorry, ${framework} is not yet supported. Only React is available now.\n`
      )
    );
    return;
  }

  const useTS = language === "TypeScript";
  const viteTemplate = useTS ? "react-ts" : "react";

  console.log(
    chalk.green(
      `\n📦 Creating Vite + React (${language}) in ${folderName}...\n`
    )
  );

  process.chdir(projectPath);
  execSync(
    `npm create vite@latest ${folderName} -- --template ${viteTemplate}`,
    { stdio: "inherit" }
  );

  const folderPath = path.join(projectPath, folderName);
  process.chdir(folderPath);
  execSync("npm install", { stdio: "inherit" });

  if (uiLib === "Tailwind CSS") {
    console.log(
      chalk.yellow(
        "\n🎨 Installing Tailwind CSS with @tailwindcss/vite plugin..."
      )
    );
    execSync("npm install tailwindcss @tailwindcss/vite", {
      stdio: "inherit",
    });
    fs.writeFileSync(
      path.join("src", "index.css"),
      `@import \"tailwindcss\";\n`
    );
    fs.writeFileSync(path.join("src", "App.css"), "");
    fs.writeFileSync(
      `vite.config.${useTS ? "ts" : "js"}`,
      `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})`
    );
    const tailwindConfigPath = path.join(folderPath, "tailwind.config.js");
    if (fs.existsSync(tailwindConfigPath)) fs.unlinkSync(tailwindConfigPath);
    console.log(
      chalk.green("✅ Tailwind CSS set up with @import and plugin only.\n")
    );
  }

  if (uiLib === "Chakra UI") {
    execSync(
      "npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion",
      { stdio: "inherit" }
    );
  } else if (uiLib === "Material UI") {
    execSync("npm install @mui/material @emotion/react @emotion/styled", {
      stdio: "inherit",
    });
  }

  const { makeStructure } = await inquirer.prompt([
    {
      name: "makeStructure",
      type: "confirm",
      message:
        "Create folder structure inside src (components, utils, routes, hooks)?",
      default: true,
    },
  ]);
  if (makeStructure) {
    ["components", "utils", "routes", "hooks"].forEach((folder) => {
      const dir = path.join("src", folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      console.log(chalk.green(`  ✔ Created src/${folder}`));
    });
  }

  fs.writeFileSync(
    path.join("src", `App.${useTS ? "tsx" : "jsx"}`),
    `function App() {
  return (
    <div className=\"flex justify-center items-center h-screen bg-white text-3xl font-bold text-purple-600\">
      Welcome to ${projectName} ❤️
    </div>
  );
}
export default App;`
  );

  const { installRouter } = await inquirer.prompt([
    {
      name: "installRouter",
      type: "confirm",
      message: "Install react-router-dom?",
      default: true,
    },
  ]);
  if (installRouter)
    execSync("npm install react-router-dom", { stdio: "inherit" });

  const { installIcons } = await inquirer.prompt([
    {
      name: "installIcons",
      type: "confirm",
      message: "Install react-icons?",
      default: true,
    },
  ]);
  if (installIcons) execSync("npm install react-icons", { stdio: "inherit" });

  const { setupBackend } = await inquirer.prompt([
    {
      name: "setupBackend",
      type: "confirm",
      message: "Do you want to set up backend now?",
      default: true,
    },
  ]);

  if (setupBackend) {
    console.log(chalk.cyan("\n🛠️ Starting backend setup (coming next)..."));
  }

  console.log(chalk.greenBright(`\n✅ ${folderName} frontend is all set!\n`));
}

//🔥Setup server function
async function setupBackend(folderName) {
  const folderPath = path.join(projectPath, folderName);
  process.chdir(folderPath);

  console.log(chalk.greenBright(`\n🚀 Setting up backend in ${folderName}...`));

  // Step 1: npm init
  execSync("npm init -y", { stdio: "inherit" });

  // Step 2: Ask to install dependencies
  const { installDeps } = await inquirer.prompt([
    {
      name: "installDeps",
      type: "checkbox",
      message: "Install basic backend dependencies?",
      choices: [
        { name: "express", value: "express" },
        { name: "nodemon", value: "nodemon" },
      ],
    },
  ]);

  if (installDeps.length > 0) {
    execSync(`npm install ${installDeps.join(" ")}`, { stdio: "inherit" });
    console.log(chalk.green(`✅ Installed: ${installDeps.join(", ")}`));
  }

  // Step 3: Create folders
  const backendFolders = [
    "model",
    "controller",
    "routes",
    "middleware",
    "utils",
    "config",
  ];
  backendFolders.forEach((f) => {
    const fullPath = path.join(folderPath, f);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
      console.log(chalk.green(`  ✔ Created ${f}/`));
    }
  });

  // Step 4: Create .env file
  fs.writeFileSync(".env", "PORT=5000\n");

  // Step 5: Create index.js
  const indexContent = `import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  fs.writeFileSync("index.js", indexContent);
  console.log(chalk.green("✅ index.js and .env created"));

  console.log(
    chalk.greenBright(`\n✅ Backend setup complete for ${folderName}!\n`)
  );
}

// 🔄 Step 2: Setup per folder
for (const folder of folders) {
  const { setupNow } = await inquirer.prompt([
    {
      name: "setupNow",
      type: "confirm",
      message: `Do you want to set up the ${folder.role} (${folder.name}) folder now?`,
      default: folder.role === "frontend",
    },
  ]);

  const role = folder.role.toLowerCase().trim();

  if (setupNow) {
    if (role === "frontend") {
      console.log(
        chalk.cyan(`\n🧪 Setup options for frontend: ${folder.name}`)
      );
      await setupFrontend(folder.name, projectName);
    } else if (role === "backend") {
      console.log(
        chalk.cyan(`\n🛠️ Starting backend setup for: ${folder.name}`)
      );
      await setupBackend(folder.name);
    } else {
      console.log(
        chalk.gray(
          `\n📦 No specific setup defined for '${folder.role}' folder    💖yet.`
        )
      );
      console.log("DEBUG folder role:", role);
    }
  }}
