
/**
 * Attempts to reinstall all modules
 * @param {function} [callback] Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.reinstallAll = (callback) => {
    var fs       = require("fs")
    var { exec } = require("child_process") //wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)

    if (!fs.existsSync(srcdir + "../node_modules")) {
        logger("info", "Creating node_modules folder to avoid error...")

        fs.mkdirSync(srcdir + "/../node_modules")
    }

    logger("info", "Deleting node_modules folder content...")

    fs.rm(srcdir + "/../node_modules", { recursive: true }, (err) => {
        if (err) return callback(err, null)

        logger("info", "Running 'npm install'...")

        exec("npm install", { cwd: srcdir + "/.." }, (err, stdout) => {
            if (err) return callback(err, null)

            logger("info", "Successfully ran 'npm install'")

            callback(null, stdout)
        })
    })
}


/**
 * Updates all installed packages to versions listed in package.json
 * @param {function} [callback] Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.update = (callback) => {
    var { exec } = require("child_process") //wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)

    logger("info", "Running 'npm install'...")

    exec("npm install", { cwd: srcdir + "/.." }, (err, stdout) => {
        if (err) return callback(err, null)

        logger("info", "Successfully ran 'npm install'")
        //logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)

        callback(null, stdout)
    })
}