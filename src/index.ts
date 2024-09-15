import itemDB from "./itemDB.json";
import { IItemDBEntry, ItemTypes } from "./types";


export default class ItemDB {
    #itemDB: IItemDBEntry[] = <IItemDBEntry[]>itemDB;

    getItems(): IItemDBEntry[] {
        return this.#itemDB;
    }

    getItemByIndex(id: number) {
        return this.#itemDB[id];
    }

    getItemByName(name: string): IItemDBEntry | undefined {
        return this.#itemDB.find(item => item.Name === name);
    }

    getItemById(idTag: string): IItemDBEntry | undefined {
        return this.#itemDB.find(item => item.Id === idTag);
    }

    getItemsBySlotType(slotType: ItemTypes<"Slot">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.SlotType === slotType);
    }

    getItemsByArmorType(armorType: ItemTypes<"Armor">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.ArmorType === armorType);
    }

    getItemsByHandType(handType: ItemTypes<"Hand">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.HandType === handType);
    }

    getItemsByRarityType(rarityType: ItemTypes<"Rarity">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.RarityType === rarityType);
    }

    getItemsByAccessoryType(accessoryType: ItemTypes<"Accessory">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.AccessoryType === accessoryType);
    }

    getItemsByUtilityType(utilityType: ItemTypes<"Utility">): IItemDBEntry[] | undefined {
        return this.#itemDB.filter(item => item.UtilityType === utilityType);
    }
}