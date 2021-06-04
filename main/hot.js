let url = await arg("Browse community scripts", async () => {
    try {
        let response = await get("https://scriptkit.com/data/showandtell.json");
        return response.data;
    }
    catch (error) {
        return [error.message];
    }
});
exec(`open ${url}`);
export {};
