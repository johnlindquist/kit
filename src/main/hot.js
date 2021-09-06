"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let url = await arg("Open discussion in browser", async () => {
    try {
        let response = await get("https://scriptkit.com/data/showandtell.json");
        return response.data;
    }
    catch (error) {
        return [error.message];
    }
});
exec(`open ${url}`);
