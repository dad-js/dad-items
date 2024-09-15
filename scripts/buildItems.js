"use strict";

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

const extractPropertyType = (property) => {
    const propertyTypeFile = property.PropertyTypeId.AssetPathName.split(".").pop() + ".json";
    const propertyTypeData = readJsonFile(path.join(_DUMP, propertyTypeFile))[0];

    if(propertyTypeData && propertyTypeData.Properties) {
        return propertyTypeData.Properties.PropertyType.TagName;
    }

    return "";
}

const extractPrimaryProperties = (itemData) => {
    if(itemData.Properties.PrimaryProperty?.AssetPathName) {
        const listOfProperties = [];

        const propertyFileName = itemData.Properties.PrimaryProperty.AssetPathName.split(".").pop() + ".json";
        const propertiesData = readJsonFile(path.join(_DUMP, propertyFileName))[0];

        if(propertiesData && propertiesData.Properties) {
            for(let property of propertiesData.Properties.ItemPropertyItemArray) {
                const propertyType = extractPropertyType(property);

                listOfProperties.push({
                    name: property.PropertyTypeId.AssetPathName.split(".").pop().split("_").pop(),
                    tag: propertyType,
                    minVal: property.MinValue,
                    maxVal: property.MaxValue,
                    val: 0,
                    rate: 0,
                });
            }

            return listOfProperties;
        }
    }

    return [];
}

const extractSecondaryProperties = (itemData) => {
    if(itemData.Properties.SecondaryProperties?.length > 0) {
        const listOfProperties = new Map();

        itemData.Properties.SecondaryProperties.forEach((property) => {

            const propertyFileName = property.AssetPathName.split(".").pop() + ".json";
            const propertiesData = readJsonFile(path.join(_DUMP, propertyFileName))[0];

            if(propertiesData && propertiesData.Properties) {
                for(let property of propertiesData.Properties.ItemPropertyItemArray) {
                    const propertyType = extractPropertyType(property);

                    listOfProperties.set(propertyType, {
                        name: property.PropertyTypeId.AssetPathName.split(".").pop().split("_").pop(),
                        tag: propertyType,
                        minVal: property.MinValue,
                        maxVal: property.MaxValue,
                        val: 0,
                        rate: property.PropertyRate,
                    });
                }
            }
        });

        return Array.from(listOfProperties.values());
    }

    return [];
}

const processItemFile = (fileName) => {
    const itemData = readJsonFile(path.join(_DUMP, fileName))[0];
    const artData = readJsonFile(path.join(_DUMP, "art", `${itemData.Properties.ArtData.AssetPathName.split(".").pop()}.json`))[0];
	const iconPath = artData.Properties.ItemIconTexture?.ObjectPath;

    const primaryProperties = {};
    primaryProperties[itemData.Properties.RarityType?.TagName] = extractPrimaryProperties(itemData);

    const secondaryProperties = {};
    secondaryProperties[itemData.Properties.RarityType?.TagName] = extractSecondaryProperties(itemData);

    return {
        Id: itemData.Properties.IdTag.TagName,
        Name: itemData.Properties.Name.LocalizedString,
        Flavor: itemData.Properties.FlavorText?.LocalizedString,
        ItemType: itemData.Properties.ItemType?.TagName,
        SlotType: itemData.Properties.SlotType?.TagName,
        HandType: itemData.Properties.HandType?.TagName,
        AccessoryType: itemData.Properties.AccessoryType?.TagName,
        ArmorType: itemData.Properties.ArmorType?.TagName,
        WeaponTypes: itemData.Properties.WeaponTypes,
        RarityType: itemData.Properties.RarityType?.TagName,
        UtilityType: itemData.Properties.UtilityType?.TagName,
        MaxCount: itemData.Properties.MaxCount,
        iconPath: iconPath ? path.parse(iconPath).name : "",
        InventoryWidth: itemData.Properties.InventoryWidth,
        InventoryHeight: itemData.Properties.InventoryHeight,
        AdvPoint: itemData.Properties.AdvPoint,
        ExpPoint: itemData.Properties.ExpPoint,
        GearScore: itemData.Properties.GearScore,
        Requirements: null,
        PrimaryProperties: primaryProperties,
        SecondaryProperties: secondaryProperties,
        Abilities: null,
        SelfAbilities: null,
        SelfEffects: null,
    }
}



// Main function to process all item files
function main2() {
    console.log(`Reading Files from ${_DUMP}`);
    const itemFiles = getItemFiles();

    console.log(`Processing ${itemFiles.length} Items. This can take a moment.`);
    const items = new Map();

    progressBar.start(itemFiles.length, 0);
    itemFiles.forEach((file) => {
        progressBar.increment();

        const sampleItem = processItemFile(file);
        const existingItem = items.get(sampleItem.Id);

        if(!existingItem) {
            items.set(sampleItem.Id, sampleItem);
            return;
        }

        existingItem.SecondaryProperties[sampleItem.RarityType] = sampleItem.SecondaryProperties[sampleItem.RarityType];
        existingItem.PrimaryProperties[sampleItem.RarityType] = sampleItem.PrimaryProperties[sampleItem.RarityType];
        items.set(sampleItem.Id, existingItem);
    });
    progressBar.stop();

    console.log(`Writing ${items.size} Items to itemDB.json`);
    const itemDB = fs.createWriteStream(path.join(__dirname, "../itemDB.json"), {flags: "w+"});

    itemDB.write(JSON.stringify(Array.from(items.values()), null, 2));
    itemDB.end();
    console.log(`- All Done -`);
}


main2();