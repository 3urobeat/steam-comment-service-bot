The helpers folder contains functions which are regularly used, often by multiple files, also from other modules.  
Each module has their own helpers folder, containing helper functions which fit the best to that specific module, to keep the project structure organized.  

All prototype functions which are directly accessible from the active Controller object at runtime are already listed in the [Controller](./controller.md) docs page.  
This page only includes functions which are directly exported, meaning to use them you need to import that specific helper file in your code.

### Table of Helpers
- [misc.js](#helpers-miscjs)
- [npminteraction.js](#helpers-npmnteractionjs)

&nbsp;

<a id="helpers-miscjs"></a>

### misc.js <a href="/src/controller/helpers/misc.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Special Case: The functions in this helper are directly accessible from the Controller object to make using them easier. You can access them through the Controller `misc` object.

&nbsp;

<a id="helpers-npmnteractionjs"></a>

### npminteraction.js <a href="/src/controller/helpers/npminteraction.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
