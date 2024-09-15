const fs = require("fs");
const path = require("path");

const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

const _DUMP = path.join(__dirname, "../dump");

const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Items',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

const readJsonFile = (filePath) => {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
}

const getItemFiles = () => {
    return fs.readdirSync(_DUMP).filter(file => file.startsWith("Id_Item_"));
}

const getItemPropertiesFiles = () => {
    return fs.readdirSync(_DUMP).filter(file => file.startsWith("Id_ItemProperty_"));
}



const listNested = (item) => {
    const tags = [];
    Object.values(item).forEach((val) => {
        if(typeof val === "object") {
            const sub = listNested(val);
            sub.forEach((b) => tags.push(b));
        } else {
            tags.push(val);
        }
    })

    return tags;
}

const extractTags = (searchKey) => {
    console.log(`Reading Files from ${_DUMP}`);
    const itemFiles = getItemFiles();
    const propertyFiles = getItemPropertiesFiles();

    console.log(`Processing ${itemFiles.length} Items. This can take a moment.`);
    const tags = [];

    progressBar.start(itemFiles.length, 0);
    itemFiles.forEach((file) => {
        progressBar.increment();

        const itemData = readJsonFile(path.join(_DUMP, file))[0];
        const values = listNested(itemData);

        values.forEach((val) => {
            if(typeof val === "string" && val.startsWith(searchKey)) {
                if(!tags.includes(val)) {
                    tags.push(val);
                }
            }
        });
    });
    progressBar.stop();
    console.log(tags.sort((a,b) => a.localeCompare(b)).join("\n"));


    console.log(`Processing ${propertyFiles.length} Item Properties. This can take a moment.`);
    const primaryTags = [];
    const secondaryTags = [];

    progressBar.start(propertyFiles.length, 0);
    propertyFiles.forEach((file) => {
        progressBar.increment();

        const itemData = readJsonFile(path.join(_DUMP, file))[0];
        const values = listNested(itemData);

        values.forEach((val) => {
            if(typeof val === "string" && val.startsWith(searchKey)) {
                if(file.startsWith("Id_ItemProperty_Primary")) {
                    if(!primaryTags.includes(val.split(".")[1])) {
                        primaryTags.push(val.split(".")[1]);
                    }
                } else {
                    if(!secondaryTags.includes(val.split(".")[1])) {
                        secondaryTags.push(val.split(".")[1]);
                    }
                }
            }
        });
    });
    progressBar.stop();
    console.log("Primary Tags");
    console.log(primaryTags.sort((a,b) => a.localeCompare(b)).join("\n"));

    console.log("Secondary Tags");
    console.log(secondaryTags.sort((a,b) => a.localeCompare(b)).join("\n"));
}
const searchKey = process.argv[2] ?? "Type.";
console.log("Searching for " + searchKey);
extractTags(searchKey);