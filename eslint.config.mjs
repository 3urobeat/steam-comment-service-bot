/*
 * File: eslint.config.mjs
 * Project: steam-comment-service-bot
 * Created Date: 2024-05-03 12:17:16
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-04 22:00:04
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    3urobeat's EsLint Config. Requires eslint, @eslint/js & eslint-plugin-jsdoc to be installed as devDependencies.
    https://github.com/3urobeat
*/

import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import js from "@eslint/js";


export default [
    {
        ignores: ["src/libraryPatches/*"],
    },
    js.configs.recommended, // Import recommended eslint rules
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.commonjs,
                ...globals.es6,
                ...globals.node,

                started: true,
                srcdir: true,
                botisloggedin: true,
                logger: true,
                extdata: true
            }
        },
        plugins: {
            jsdoc: jsdoc
        },
        rules: {
            "no-var": "error",
            "no-redeclare": "off",
            "no-unreachable": "error",
            "no-unexpected-multiline": "error",

            // Styling
            "camelcase": "warn",
            "capitalized-comments": ["warn", "always", { "ignoreConsecutiveComments": true }],
            "comma-spacing": ["warn", { "before": false, "after": true }],
            "func-call-spacing": ["error", "never"],
            "indent": ["error", 4, { "ignoredNodes": ["IfStatement"], "SwitchCase": 1 }], // TODO: This also ignores if statements with wrong indentation but I couldn't get it to only ignore else in if-else one-liner
            "no-tabs": "error",
            "no-trailing-spaces": "error",
            "no-extra-semi": "error",
            "no-use-before-define": "error",
            "prefer-const": "error",
            "semi": ["error", "always"],
            "semi-spacing": "error",
            "semi-style": ["error", "last"],
            "quotes": ["error", "double", { "avoidEscape": true }],
            "spaced-comment": "warn",

            // JsDoc - https://github.com/gajus/eslint-plugin-jsdoc
            "jsdoc/check-alignment": "warn",
            "jsdoc/check-indentation": "warn",
            "jsdoc/check-types": "warn",
            "jsdoc/informative-docs": "warn",
            "jsdoc/require-asterisk-prefix": "warn",
            "jsdoc/require-description": "warn",
            "jsdoc/require-jsdoc": "warn",
            "jsdoc/require-param": "warn",
            "jsdoc/require-param-name": "warn",
            "jsdoc/valid-types": "warn",
            // "jsdoc/require-returns": "warn", // Always requires @return, even when function does not return something
            "jsdoc/require-returns-type": "warn",
            // "jsdoc/require-returns-check": "warn", // Unnecessary when require-returns above is disabled
            "jsdoc/require-returns-description": "warn"
        }
    }
];
