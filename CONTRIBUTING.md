# How to contribute

The neuland.app is developed completely in JavaScript. We are using Next.js, which is a full-stack framework for developing web applications. This guide is supposed to give you a quick introduction into contributing your own changes.

## Required knowledge

You should know how to program in object oriented languages. Prior experience with JavaScript, React, HTML and CSS is helpful.

## Preparing your computer

You need to install the necessary tools.

* [Git](https://git-scm.com/downloads)
* [Node.js 14 LTS](https://nodejs.org/en/)
* [Visual Studio Code](https://code.visualstudio.com/)
* [ESLint for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Setting up the environment

Make a personal copy of the source code using the *Fork* button on the top right of this page.

Open a terminal (e.g. PowerShell if you're on Windows) and download the source code to your PC using Git:
```bash
git clone https://github.com/your-github-username/THI-App.git
cd THI-App/rogue-thi-app
```

Download everything else that is required to run the app:
```bash
npm install
```

Now open the `rogue-thi-app` folder in Visual Studio Code.

## Developing

Start the application locally:
```bash
npm run dev
```

Go to https://localhost:3000 in your browser and voilà, you're ready to go. You can change things in your code and your browser will automatically load the new version.

### Structure of the code

A quick overview over the structure of the source code:
* `/pages`  
The pages of the application that you see in your browser. This is where to look if you want to change the structure of the UI.
* `/components`  
Various reusable UI components such as the navigation and tab bar. Look here if a page references a custom component.
* `/styles`  
CSS files describing the look of the application. Look here if you want to change the design of the UI.
* `/lib`  
Various reusable utilities such as a client for the THI API and a timestamp formatter.

## Getting help

If you need help with the code, don't hesitate to contact us at info@neuland-ingolstadt.de.
