# Contributing to the project
[⬅️ Go back to wiki home](./#readme)

&nbsp;

You would like to contribute to the project itself?  
Great! No matter if it's fixing a few typos or adding a whole feature - every contribution is welcome.  

You can see a list of all features that still need to be worked on, are in progress or are finished in the repo's [projects](https://github.com/3urobeat/steam-comment-service-bot/projects) section.  

Please read this page *before* diving in, it contains a few **very** important points! (I'm serious)

&nbsp;

## Table Of Contents
- [Reporting an issue](#reporting-an-issue)
- [How to fork and open pull requests](#how-to-fork-and-open-pull-requests)
- [Translating](#translating)
- [Styling Guidelines](#styling-guidelines)
- [Starting the bot](#starting-the-bot)

&nbsp;

## Reporting an Issue
Found a bug?  
Please report it by creating an [issue](https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose) so that I am able to fix it!  
If you've got a feature request instead, you can choose the "Feature request" template instead.
  
If you have any questions, please open a [Q&A discussion](https://github.com/3urobeat/steam-comment-service-bot/discussions/new?category=q-a) instead!

&nbsp;

## How to fork and open pull requests
To contribute code to the project, you first need to fork this repository. Go to the main page of this repository and click on the "Fork" button in the top right.  
Before clicking the "Create fork" button in the next menu, make sure the checkmark at "Copy the `master` branch only" is **unchecked**!  
After waiting a few seconds you should now have a *copy* of the repository on your account.

Go into a folder on your computer where the project should be stored, open a terminal and run the command  
`git clone https://github.com/your-username/steam-comment-service-bot` or use any other Git Client of your choice.  

Once the repository has been cloned, switch to the `beta-testing` branch using the command `git checkout beta-testing`.  
This branch contains the latest changes and must be the one you base your changes off of. The `master` branch contains the latest release.

You can now create your own branch using `git checkout -b "branchname"`, make changes and commit them to it.  
It makes sense to give the branch a sensible name based on what your changes will be, but no pressure.  

The setup of your dev bot is very similar to the [normal setup](./setup_guide.md), however make sure to run `npm install` manually. This will install all dev dependencies, which are omitted in the normal installation.  
It is probably also a good idea to enable `printDebug` in `advancedconfig.json` to see a more detailed log output.

Once you have made your changes and verified they are working as expected, you need to open a Pull Request to merge them into this repository.  
[Click here](https://github.com/3urobeat/steam-comment-service-bot/compare/), click on "Compare across forks" at the top and select `base: beta-testing` on the left side.  
Then, choose your fork on the right at `head repository:`, your branch at `compare:` and click on "Create Pull Request".

Give your pull request a fitting title which describes your changes in a few words and put a more in depth explanation below in the description.  
Once you are satisfied, hit the "Create pull request" button below to submit.  
I'll take a look at it and perhaps suggest or make some minor changes in the following few days.  

&nbsp;

## Translating
You know an unsupported language and would like to contribute a translation? Cool!  

Create a new `.json` file in the `src/data/lang/` directory with the name of the language in English (e.g. "german" instead of "deutsch").  
Please also make sure the filename is lowercase, like the other ones.  

Open the file, copy the content of `english.json` into your file and start translating the value of every key (except the key `langname`, it must be the same as the filename).  

Some language strings contain variables which are replaced by the bot with corresponding values at runtime.  
These are marked with `${variablename}` and must occur like that in your translated string as well.  

Some strings also contain command syntax information which must not be translated, like for example in the key `updaterautoupdatedisabled` at the very end: "update true"  
These are sadly not 100% obvious but you should be able to recognize them fairly easily.

When you are done, open a PR like explained above in [How to fork and open pull requests](#how-to-fork-and-open-pull-requests).  

Should you want to test your translation, please make sure to read [Starting the bot](#starting-the-bot) below. Your changes may otherwise get lost!  
Should you get an error while starting, make sure your syntax is correct. Common mistakes are for example missing quotation marks `"` or missing commas `,` at line ends.

&nbsp;

## Styling Guidelines
Please make sure your code is somewhat good looking, is easy to read and is properly documented.  
Take a look at any of the other source code files in the project to see how I style my code.

The project includes an [eslint config](/.eslintrc.json) to enforce the project's styling rules, so please make sure your eslint installation works.  
It should be included as a dev dependency when setting up the project on your machine.  
While working on your code, eslint should automatically display warnings or errors for parts of your code if you are using an IDE.  
To run the linter manually, you can execute the command `npx eslint .` in the project folder.  
Please make sure to fix all eslint errors and warnings before submitting a pull request.

In short, the main styling rules are:
- Spaces for indentation with a size of `4`
- camelCase for variables and functions
- Opening braces on the same line as the if/for/while statement
- Do not omit semicolons at line ends
- Do not use `var` but `let` & `const` instead
- Provide JsDocs for your functions, these are also used to generate typescript bindings later on

&nbsp;

## Starting the bot
When starting the bot during development, it is crucial to execute the [generateFileStructure](/scripts/generateFileStructure.js) script before starting the bot, on every change.  
You can do this easily by using a simple chained command:  
`node scripts/generateFileStructure.js && node start.js`

This ensures that [fileStructure.json](/src/data/fileStructure.json), which contains checksums for every file, gets updated.  
The application will otherwise recognize your changed file as broken and will restore it with the default one.

&nbsp;

Thanks for taking your time!